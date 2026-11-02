<?php

namespace App\Domain\Access\Actions;

use App\Models\BusinessMembership;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class RemoveMemberAction
{
    /**
     * Revoke access without deleting the membership so historical attribution
     * stays intact. Current API tokens are revoked immediately.
     */
    public function execute(BusinessMembership $actor, BusinessMembership $target): BusinessMembership
    {
        if ($target->isOwner()) {
            throw new AuthorizationException('Owner tidak dapat dihapus.');
        }

        if (! $actor->isOwner() && $actor->is($target)) {
            throw new AuthorizationException('Anda tidak dapat menghapus akses Anda sendiri.');
        }

        return DB::transaction(function () use ($target): BusinessMembership {
            $target->update(['status' => BusinessMembership::STATUS_INACTIVE]);
            $target->outletAccesses()->delete();
            $target->user->tokens()->delete();

            return $target;
        });
    }
}
