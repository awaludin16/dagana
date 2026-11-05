<?php

namespace App\Domain\Access\Actions;

use App\Models\BusinessMembership;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class DeleteMemberAction
{
    /**
     * Hard-delete an employee membership while keeping the user record for
     * historical attribution. The owner and the actor cannot be deleted.
     */
    public function execute(BusinessMembership $actor, BusinessMembership $target): void
    {
        if ($target->isOwner()) {
            throw new AuthorizationException('Owner tidak dapat dihapus.');
        }

        if (! $actor->isOwner() || $actor->is($target)) {
            throw new AuthorizationException('Anda tidak dapat menghapus akses ini.');
        }

        DB::transaction(function () use ($target): void {
            $target->user->tokens()->delete();
            $target->delete();
        });
    }
}
