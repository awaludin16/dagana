<?php

namespace App\Domain\Organization\Actions;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\MemberInvitation;
use App\Domain\Organization\Models\Membership;
use App\Domain\Organization\Services\MembershipPermissionManager;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateMemberInvitationAction
{
    public function __construct(private readonly MembershipPermissionManager $permissionManager) {}

    /**
     * @param  array<int, int>  $outletIds
     * @param  array<int, string>  $permissionGrants
     * @param  array<int, string>  $permissionDenials
     * @return array{invitation: MemberInvitation, token: string}
     */
    public function execute(
        Membership $actor,
        Business $business,
        string $email,
        RolePreset $role,
        array $outletIds,
        array $permissionGrants,
        array $permissionDenials,
    ): array {
        $this->permissionManager->assertRoleAssignableBy($actor, $role);
        $this->permissionManager->assertOverridesWithinActor($actor, $permissionGrants, $permissionDenials);

        return DB::transaction(function () use (
            $actor,
            $business,
            $email,
            $role,
            $outletIds,
            $permissionGrants,
            $permissionDenials,
        ): array {
            Business::query()->whereKey($business->getKey())->lockForUpdate()->firstOrFail();

            $existingMember = $business->memberships()
                ->whereHas('user', fn ($query) => $query->whereRaw('LOWER(email) = ?', [$email]))
                ->exists();

            if ($existingMember) {
                throw ValidationException::withMessages([
                    'email' => __('This user is already a member of the business.'),
                ]);
            }

            $existingInvitation = $business->invitations()
                ->whereRaw('LOWER(email) = ?', [$email])
                ->where('status', MemberInvitation::STATUS_PENDING)
                ->where('expires_at', '>', now())
                ->exists();

            if ($existingInvitation) {
                throw ValidationException::withMessages([
                    'email' => __('An active invitation already exists for this email.'),
                ]);
            }

            $token = bin2hex(random_bytes(32));
            $invitation = $business->invitations()->create([
                'invited_by_membership_id' => $actor->getKey(),
                'email' => $email,
                'role' => $role,
                'outlet_ids' => $role->hasBusinessWideOutletAccess() ? [] : $outletIds,
                'permission_grants' => $permissionGrants,
                'permission_denials' => $permissionDenials,
                'token_hash' => hash('sha256', $token),
                'status' => MemberInvitation::STATUS_PENDING,
                'delivery_status' => 'pending',
                'expires_at' => now()->addDays(7),
            ]);

            return ['invitation' => $invitation, 'token' => $token];
        });
    }
}
