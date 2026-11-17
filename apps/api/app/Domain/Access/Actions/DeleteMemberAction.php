<?php

namespace App\Domain\Access\Actions;

use App\Models\BusinessMembership;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeleteMemberAction
{
    /**
     * Hard-delete an employee membership while keeping the user record for
     * historical attribution. The owner and the actor cannot be deleted.
     * Members with transactional history must be deactivated instead: their
     * records are referenced by order/payment/cash/stock FKs (restrict).
     */
    public function execute(BusinessMembership $actor, BusinessMembership $target): void
    {
        if ($target->isOwner()) {
            throw new AuthorizationException('Owner tidak dapat dihapus.');
        }

        if (! $actor->isOwner() || $actor->is($target)) {
            throw new AuthorizationException('Anda tidak dapat menghapus akses ini.');
        }

        $membershipId = $target->id;

        $hasHistory = DB::table('orders')->where('membership_id', $membershipId)->exists()
            || DB::table('payments')
                ->where(fn (Builder $query): Builder => $query
                    ->where('membership_id', $membershipId)
                    ->orWhere('confirmed_by', $membershipId))
                ->exists()
            || DB::table('cash_sessions')
                ->where(fn (Builder $query): Builder => $query
                    ->where('operator_membership_id', $membershipId)
                    ->orWhere('closed_by_membership_id', $membershipId))
                ->exists()
            || DB::table('cash_movements')->where('membership_id', $membershipId)->exists()
            || DB::table('stock_movements')->where('membership_id', $membershipId)->exists();

        if ($hasHistory) {
            throw ValidationException::withMessages([
                'member' => 'Anggota ini memiliki data historis (transaksi, kas, atau stok) sehingga tidak dapat dihapus permanen. Gunakan Nonaktifkan untuk mencabut aksesnya.',
            ]);
        }

        DB::transaction(function () use ($target): void {
            $target->user->tokens()->delete();
            $target->delete();
        });
    }
}
