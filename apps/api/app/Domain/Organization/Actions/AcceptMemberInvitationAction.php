<?php

namespace App\Domain\Organization\Actions;

use App\Domain\Organization\Models\MemberInvitation;
use App\Domain\Organization\Models\Membership;
use App\Domain\Organization\Services\MembershipPermissionManager;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AcceptMemberInvitationAction
{
    public function __construct(private readonly MembershipPermissionManager $permissionManager) {}

    public function execute(User $user, string $token): Membership
    {
        return DB::transaction(function () use ($user, $token): Membership {
            $invitation = MemberInvitation::query()
                ->where('token_hash', hash('sha256', $token))
                ->lockForUpdate()
                ->first();

            if (
                $invitation === null
                || $invitation->status !== MemberInvitation::STATUS_PENDING
                || $invitation->isExpired()
            ) {
                throw ValidationException::withMessages([
                    'token' => __('This invitation is invalid, expired, or already used.'),
                ]);
            }

            if (mb_strtolower($user->email) !== mb_strtolower($invitation->email)) {
                throw ValidationException::withMessages([
                    'token' => __('Sign in with the email address this invitation was sent to.'),
                ]);
            }

            if ($invitation->business->memberships()->where('user_id', $user->getKey())->exists()) {
                throw ValidationException::withMessages([
                    'token' => __('This account is already a member of the business.'),
                ]);
            }

            $membership = $invitation->business->memberships()->create([
                'user_id' => $user->getKey(),
                'role' => $invitation->role,
                'status' => Membership::STATUS_ACTIVE,
            ]);

            if (! $membership->isOwner()) {
                $membership->outlets()->sync($invitation->outlet_ids ?? []);
            }

            $this->permissionManager->sync(
                $membership,
                $invitation->permission_grants ?? [],
                $invitation->permission_denials ?? [],
            );

            $invitation->forceFill([
                'status' => MemberInvitation::STATUS_ACCEPTED,
                'accepted_at' => now(),
                'token_hash' => hash('sha256', bin2hex(random_bytes(32))),
            ])->save();

            return $membership->load(['user', 'business', 'outlets', 'permissionOverrides']);
        });
    }
}
