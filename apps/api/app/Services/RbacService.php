<?php

namespace App\Services;

use App\Models\Membership;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Cache;

/**
 * Resolusi permission per user di dalam satu tenant.
 *
 * Hasil di-cache (Redis) dan di-invalidasi saat role/user berubah.
 */
class RbacService
{
    /**
     * @return list<string> kode permission
     */
    public function permissionsFor(Authenticatable $user, string $tenantId): array
    {
        $cacheKey = "rbac.perms.{$tenantId}.{$user->getAuthIdentifier()}";

        return Cache::remember($cacheKey, 300, function () use ($user, $tenantId) {
            $membership = Membership::query()
                ->with('role.permissions')
                ->where('user_id', $user->getAuthIdentifier())
                ->where('tenant_id', $tenantId)
                ->where('status', 'ACTIVE')
                ->first();

            if (! $membership?->role) {
                return [];
            }

            return $membership->role->permissions->pluck('code')->all();
        });
    }

    public function userCan(Authenticatable $user, string $tenantId, string $permission): bool
    {
        return in_array($permission, $this->permissionsFor($user, $tenantId), true);
    }

    public function flushCache(User $user, string $tenantId): void
    {
        Cache::forget("rbac.perms.{$tenantId}.{$user->getAuthIdentifier()}");
    }
}
