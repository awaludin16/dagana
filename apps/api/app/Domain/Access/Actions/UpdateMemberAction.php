<?php

namespace App\Domain\Access\Actions;

use App\Models\BusinessMembership;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateMemberAction
{
    /**
     * Managers may manage employees, but never the owner or their own access.
     *
     * @param  array{role?: string, outlet_ids?: list<int>}  $data
     */
    public function execute(BusinessMembership $actor, BusinessMembership $target, array $data): BusinessMembership
    {
        if ($target->isOwner()) {
            throw new AuthorizationException('Owner tidak dapat diubah melalui pengelolaan employee.');
        }

        if (! $actor->isOwner() && $actor->is($target)) {
            throw new AuthorizationException('Anda tidak dapat mengubah akses Anda sendiri.');
        }

        if (array_key_exists('outlet_ids', $data) && ! $actor->canGrantOutletAccess($data['outlet_ids'])) {
            throw ValidationException::withMessages([
                'outlet_ids' => 'Anda hanya dapat memberikan outlet yang Anda akses sendiri.',
            ]);
        }

        return DB::transaction(function () use ($target, $data): BusinessMembership {
            if (array_key_exists('role', $data)) {
                $target->update(['role' => $data['role']]);
            }

            if (array_key_exists('outlet_ids', $data)) {
                $target->outletAccesses()->delete();
                $target->outletAccesses()->createMany(
                    collect($data['outlet_ids'])->map(fn (int $outletId): array => ['outlet_id' => $outletId])->all(),
                );
            }

            return $target->load('user', 'outletAccesses.outlet', 'business.outlets');
        });
    }
}
