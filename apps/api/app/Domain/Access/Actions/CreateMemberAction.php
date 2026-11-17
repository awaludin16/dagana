<?php

namespace App\Domain\Access\Actions;

use App\Domain\Access\PermissionCatalog;
use App\Models\BusinessMembership;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateMemberAction
{
    /**
     * Owner/manager adds an employee account directly. Email invitation delivery
     * is not part of Phase 2; the operator supplies the initial password.
     * Hanya Owner yang dapat mengatur izin tambahan di luar preset (revisi D-04).
     *
     * @param  array{name: string, email: string, password: string, role: string, outlet_ids: list<int>, extra_permissions?: list<string>}  $data
     */
    public function execute(BusinessMembership $actor, array $data): BusinessMembership
    {
        if (! $actor->canGrantOutletAccess($data['outlet_ids'])) {
            throw ValidationException::withMessages([
                'outlet_ids' => 'Anda hanya dapat memberikan outlet yang Anda akses sendiri.',
            ]);
        }

        if (array_key_exists('extra_permissions', $data)) {
            if (! $actor->isOwner()) {
                throw new AuthorizationException('Hanya Owner yang dapat mengatur izin tambahan.');
            }

            self::assertExtraPermissions($data['role'], $data['extra_permissions']);
        }

        return DB::transaction(function () use ($actor, $data): BusinessMembership {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);

            $membership = BusinessMembership::create([
                'business_id' => $actor->business_id,
                'user_id' => $user->id,
                'role' => $data['role'],
                'status' => BusinessMembership::STATUS_ACTIVE,
            ]);

            $membership->outletAccesses()->createMany(
                collect($data['outlet_ids'])->map(fn (int $outletId): array => ['outlet_id' => $outletId])->all(),
            );

            if (! empty($data['extra_permissions'])) {
                $membership->permissionOverrides()->createMany(
                    collect($data['extra_permissions'])->map(fn (string $permission): array => ['permission' => $permission])->all(),
                );
            }

            return $membership->load('user', 'outletAccesses.outlet', 'business.outlets', 'permissionOverrides');
        });
    }

    /**
     * @param  list<string>  $extraPermissions
     */
    public static function assertExtraPermissions(string $role, array $extraPermissions): void
    {
        $overlap = array_intersect($extraPermissions, PermissionCatalog::forRole($role));

        if ($overlap !== []) {
            throw ValidationException::withMessages([
                'extra_permissions' => 'Izin berikut sudah termasuk izin bawaan role dan tidak dapat dikirim ulang: '.implode(', ', $overlap).'.',
            ]);
        }
    }
}
