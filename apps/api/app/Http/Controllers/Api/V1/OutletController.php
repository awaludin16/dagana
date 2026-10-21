<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Organization\Models\Business;
use App\Domain\Outlet\Models\Outlet;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Outlet\StoreOutletRequest;
use App\Http\Requests\Api\V1\Outlet\UpdateOutletRequest;
use App\Http\Resources\Api\V1\OutletResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OutletController extends Controller
{
    public function index(Request $request, Business $business): AnonymousResourceCollection
    {
        $this->authorize('viewOutlets', $business);

        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'status' => ['sometimes', Rule::in(['active', 'disabled', 'all'])],
        ]);
        $membership = $request->user()->membershipFor($business);
        $outlets = $business->outlets();

        if (! $membership?->hasAllOutletAccess()) {
            $outlets->whereIn('id', $membership?->outlets()->select('outlets.id') ?? []);
        }

        if (($validated['status'] ?? 'active') !== 'all') {
            $outlets->where('status', $validated['status'] ?? Outlet::STATUS_ACTIVE);
        }

        return OutletResource::collection(
            $outlets->orderBy('name')->paginate($validated['per_page'] ?? 20)
        );
    }

    public function store(StoreOutletRequest $request, Business $business): JsonResponse
    {
        $this->authorize('createOutlet', $business);

        $membership = $request->user()->membershipFor($business);
        $outlet = DB::transaction(function () use ($request, $business, $membership): Outlet {
            $outlet = $business->outlets()->create([
                'name' => $request->string('name')->toString(),
                'address' => $request->input('address'),
                'timezone' => $business->timezone,
                'status' => Outlet::STATUS_ACTIVE,
            ]);

            if (! $membership?->hasAllOutletAccess()) {
                $membership?->outlets()->attach($outlet);
            }

            return $outlet;
        });

        return (new OutletResource($outlet))->response()->setStatusCode(201);
    }

    public function show(Outlet $outlet): OutletResource
    {
        $this->authorize('view', $outlet);

        return new OutletResource($outlet);
    }

    public function update(UpdateOutletRequest $request, Outlet $outlet): OutletResource
    {
        $this->authorize('update', $outlet);

        $outlet->update($request->validated());

        return new OutletResource($outlet);
    }

    public function disable(Outlet $outlet): OutletResource
    {
        $this->authorize('disable', $outlet);
        $outlet->update(['status' => Outlet::STATUS_DISABLED]);

        return new OutletResource($outlet);
    }

    public function enable(Outlet $outlet): OutletResource
    {
        $this->authorize('enable', $outlet);
        $outlet->update(['status' => Outlet::STATUS_ACTIVE]);

        return new OutletResource($outlet);
    }
}
