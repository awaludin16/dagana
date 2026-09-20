<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterTenantRequest;
use App\Models\Membership;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Support\Rls;
use Database\Seeders\RolesSeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenants = $request->user()->memberships()
            ->with('tenant')
            ->where('status', 'ACTIVE')
            ->get()
            ->map(fn (Membership $m) => $m->tenant?->only('id', 'name', 'slug'))
            ->filter()
            ->values();

        return response()->json(['data' => $tenants]);
    }

    public function store(RegisterTenantRequest $request): JsonResponse
    {
        $user = $request->user();

        $tenant = DB::transaction(function () use ($request, $user) {
            $tenant = Tenant::create([
                'name' => $request->name,
                'slug' => $request->slug ?? str($request->name)->slug(),
                'status' => 'ACTIVE',
                'plan' => 'free',
            ]);

            Rls::setTenantContext($tenant->id);

            RolesSeeder::runForTenant($tenant);

            $member = Membership::create([
                'user_id' => $user->id,
                'tenant_id' => $tenant->id,
                'role_id' => $tenant->roles()->where('code', 'OWNER')->value('id'),
                'status' => 'ACTIVE',
            ]);

            return $tenant;
        });

        return response()->json(['data' => $tenant->load(['outlets'])], 201);
    }

    public function show(Request $request, Tenant $tenant): JsonResponse
    {
        $this->ensureMember($request, $tenant);

        return response()->json(['data' => $tenant->load('outlets')]);
    }

    public function outlets(Request $request, Tenant $tenant): JsonResponse
    {
        $this->ensureMember($request, $tenant);

        $outlets = DB::transaction(function () use ($tenant) {
            Rls::setTenantContext($tenant->id);

            return Outlet::where('tenant_id', $tenant->id)->get();
        });

        return response()->json(['data' => $outlets]);
    }

    protected function ensureMember(Request $request, Tenant $tenant): void
    {
        abort_if(
            ! $request->user()->memberships()
                ->where('tenant_id', $tenant->id)
                ->where('status', 'ACTIVE')
                ->exists(),
            403,
            'Anda bukan anggota tenant ini.',
        );
    }
}
