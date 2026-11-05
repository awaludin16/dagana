<?php

namespace App\Domain\Access\Actions;

use App\Models\BusinessMembership;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateMemberAction
{
    /**
     * Owner/manager adds an employee account directly. Email invitation delivery
     * is not part of Phase 2; the operator supplies the initial password.
     *
     * @param  array{name: string, email: string, password: string, role: string, outlet_ids: list<int>}  $data
     */
    public function execute(BusinessMembership $actor, array $data): BusinessMembership
    {
        if (! $actor->canGrantOutletAccess($data['outlet_ids'])) {
            throw ValidationException::withMessages([
                'outlet_ids' => 'Anda hanya dapat memberikan outlet yang Anda akses sendiri.',
            ]);
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

            return $membership->load('user', 'outletAccesses.outlet', 'business.outlets');
        });
    }
}
