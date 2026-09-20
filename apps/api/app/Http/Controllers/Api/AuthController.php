<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\SwitchTenantRequest;
use App\Models\Membership;
use App\Models\User;
use App\Models\UserSession;
use App\Services\JwtService;
use App\Services\RbacService;
use App\Support\Rls;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected JwtService $jwt,
        protected RbacService $rbac,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password) || $user->status !== 'ACTIVE') {
            throw ValidationException::withMessages([
                'email' => ['Kredensial tidak valid atau akun dinonaktifkan.'],
            ]);
        }

        $tenant = $this->defaultTenant($user) ?? abort(403, 'Akun belum terdaftar pada tenant mana pun.');

        $session = $this->createSession($user);
        $token = $this->issueForTenant($user, $tenant, $session);

        return response()->json(['data' => [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => (int) config('auth.jwt_ttl', 900),
            'refresh_token' => $session['plain_token'],
            'user' => $user->only('id', 'name', 'email'),
            'tenants' => $this->tenantList($user),
        ]]);
    }

    public function refresh(Request $request): JsonResponse
    {
        $request->validate(['refresh_token' => ['required', 'string']]);

        $hash = hash('sha256', $request->refresh_token);
        $session = UserSession::where('refresh_token', $hash)
            ->where('revoked', false)
            ->first();

        if (! $session || $session->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'refresh_token' => ['Refresh token tidak valid atau sudah kedaluwarsa.'],
            ]);
        }

        $user = $session->user;

        if (! $user || $user->status !== 'ACTIVE') {
            throw ValidationException::withMessages(['refresh_token' => ['Sesi tidak valid.']]);
        }

        // Rotation: sesi lama di-revoke, dibuat sesi baru.
        $session->update(['revoked' => true]);
        $newSession = $this->createSession($user);
        $tenant = $this->defaultTenant($user);

        return response()->json(['data' => [
            'access_token' => $this->issueForTenant($user, $tenant, $newSession),
            'token_type' => 'Bearer',
            'expires_in' => (int) config('auth.jwt_ttl', 900),
            'refresh_token' => $newSession['plain_token'],
        ]]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->validate(['refresh_token' => ['required', 'string']]);

        UserSession::where('refresh_token', hash('sha256', $request->refresh_token))
            ->update(['revoked' => true]);

        return response()->json(['data' => ['ok' => true]], 200);
    }

    public function switchTenant(SwitchTenantRequest $request): JsonResponse
    {
        $user = $request->user();

        $token = DB::transaction(function () use ($user, $request) {
            Rls::setTenantContext($request->tenant_id);

            $membership = Membership::query()
                ->where('user_id', $user->getAuthIdentifier())
                ->where('tenant_id', $request->tenant_id)
                ->where('status', 'ACTIVE')
                ->first();

            if (! $membership) {
                abort(403, 'Anda bukan anggota tenant ini.');
            }

            $session = $this->rotateCurrentSession($request, $user);

            return $this->issueForTenant($user, $request->tenant_id, $session);
        });

        return response()->json(['data' => [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => (int) config('auth.jwt_ttl', 900),
            'refresh_token' => $session['plain_token'] ?? null,
            'tenant_id' => $request->tenant_id,
        ]]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $tenants = $this->tenantList($user);

        $tenantId = $request->attributes->get('jwt_payload')['tenant_id'] ?? null;

        return response()->json(['data' => [
            'user' => $user->only('id', 'name', 'email', 'status'),
            'tenants' => $tenants,
            'current_tenant' => $tenantId,
            'outlets' => $tenantId
                ? $user->outletAssignments()->where('tenant_id', $tenantId)->with('outlet')->get()
                    ->pluck('outlet')->map(fn ($o) => $o?->only('id', 'name', 'business_type'))
                : [],
            'permissions' => $tenantId ? $this->rbac->permissionsFor($user, $tenantId) : [],
        ]]);
    }

    /**
     * @return array<int, array{id: string, name: string, slug: string}>
     */
    protected function tenantList(User $user): array
    {
        return $user->memberships()
            ->with('tenant')
            ->where('status', 'ACTIVE')
            ->get()
            ->map(fn (Membership $m) => $m->tenant?->only('id', 'name', 'slug'))
            ->filter()
            ->values()
            ->all();
    }

    protected function defaultTenant(User $user): ?string
    {
        return $user->memberships()
            ->where('status', 'ACTIVE')
            ->value('tenant_id');
    }

    /**
     * @return array{id: string, plain_token: string}
     */
    protected function createSession(User $user): array
    {
        $plain = Str::random(64);
        $session = UserSession::query()->create([
            'user_id' => $user->id,
            'refresh_token' => hash('sha256', $plain),
            'expires_at' => now()->addSeconds((int) config('auth.refresh_ttl', 2592000)),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return ['id' => $session->id, 'plain_token' => $plain];
    }

    /**
     * Revoke sesi akses saat ini (dari claim jti), lalu buat sesi baru
     * (rotation) sehingga refresh token ikut berputar saat ganti tenant.
     *
     * @return array{id: string, plain_token: string}
     */
    protected function rotateCurrentSession(Request $request, User $user): array
    {
        $jti = $request->attributes->get('jwt_payload')['jti'] ?? null;

        if ($jti) {
            UserSession::where('id', $jti)
                ->where('revoked', false)
                ->update(['revoked' => true]);
        }

        return $this->createSession($user);
    }

    protected function issueForTenant(User $user, ?string $tenantId, array $session): string
    {
        $membership = null;

        if ($tenantId) {
            // `roles` dilindungi RLS; login/refresh tidak lewat middleware tenant,
            // jadi konteks harus disetel eksplisit agar relasi role terbaca
            // (di PostgreSQL policy menyembunyikan baris tanpa konteks).
            $membership = DB::transaction(function () use ($user, $tenantId) {
                Rls::setTenantContext($tenantId);

                return Membership::with('role')
                    ->where('user_id', $user->id)
                    ->where('tenant_id', $tenantId)
                    ->first();
            });
        }

        $outletIds = $tenantId
            ? $user->outletAssignments()->where('tenant_id', $tenantId)->pluck('outlet_id')->all()
            : [];

        return $this->jwt->issue([
            'sub' => $user->id,
            'jti' => $session['id'],
            'tenant_id' => $tenantId,
            'outlet_ids' => $outletIds,
            'role_code' => $membership?->role->code,
        ], (int) config('auth.jwt_ttl', 900));
    }
}
