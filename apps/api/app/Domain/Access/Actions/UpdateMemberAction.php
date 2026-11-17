<?php

namespace App\Domain\Access\Actions;

use App\Domain\Access\PermissionCatalog;
use App\Models\BusinessMembership;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateMemberAction
{
    /**
     * Managers may manage employees, but never the owner or their own access.
     * Status changes are updates: INACTIVE revokes tokens, ACTIVE restores access.
     * Hanya Owner yang dapat mengatur izin tambahan di luar preset (revisi D-04).
     *
     * @param  array{role?: string, status?: string, outlet_ids?: list<int>, extra_permissions?: list<string>}  $data
     */
    public function execute(BusinessMembership $actor, BusinessMembership $target, array $data): BusinessMembership
    {
        if ($target->isOwner()) {
            throw new AuthorizationException('Owner tidak dapat diubah melalui pengelolaan employee.');
        }

        if (! $actor->isOwner() && $actor->is($target)) {
            throw new AuthorizationException('Anda tidak dapat mengubah akses Anda sendiri.');
        }

        if (array_key_exists('extra_permissions', $data)) {
            if (! $actor->isOwner()) {
                throw new AuthorizationException('Hanya Owner yang dapat mengatur izin tambahan.');
            }

            CreateMemberAction::assertExtraPermissions($data['role'] ?? $target->role, $data['extra_permissions']);
        }

        if (array_key_exists('outlet_ids', $data) && ! $actor->canGrantOutletAccess($data['outlet_ids'])) {
            throw ValidationException::withMessages([
                'outlet_ids' => 'Anda hanya dapat memberikan outlet yang Anda akses sendiri.',
            ]);
        }

        return DB::transaction(function () use ($target, $data): BusinessMembership {
            if (array_key_exists('role', $data)) {
                $target->update(['role' => $data['role']]);

                // Izin yang kini menjadi preset role baru tidak lagi disimpan
                // sebagai override agar daftar extra_permissions tetap bersih.
                $target->permissionOverrides()
                    ->whereIn('permission', PermissionCatalog::forRole($data['role']))
                    ->delete();
            }

            if (array_key_exists('status', $data)) {
                $target->update(['status' => $data['status']]);

                if ($data['status'] === BusinessMembership::STATUS_INACTIVE) {
                    $target->user->tokens()->delete();
                }
            }

            if (array_key_exists('outlet_ids', $data)) {
                $target->outletAccesses()->delete();
                $target->outletAccesses()->createMany(
                    collect($data['outlet_ids'])->map(fn (int $outletId): array => ['outlet_id' => $outletId])->all(),
                );
            }

            if (array_key_exists('extra_permissions', $data)) {
                $target->permissionOverrides()->delete();
                $target->permissionOverrides()->createMany(
                    collect($data['extra_permissions'])->map(fn (string $permission): array => ['permission' => $permission])->all(),
                );
            }

            return $target->load('user', 'outletAccesses.outlet', 'business.outlets', 'permissionOverrides');
        });
    }
}
