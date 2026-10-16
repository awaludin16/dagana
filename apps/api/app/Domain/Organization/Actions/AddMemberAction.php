<?php

namespace App\Domain\Organization\Actions;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Organization\Services\MembershipPermissionManager;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Adds an existing Dagana user as a member (employee) of a business.
 *
 * The invitation flow for Phase 2 targets registered users directly and
 * activates the membership immediately; email-based invitations with tokens
 * are a later concern. The acting membership is passed in so the action can
 * reject role assignment or overrides that would escalate the actor's own
 * permissions (D-04). The Owner preset keeps business-wide outlet access, so
 * explicit outlet grants only apply to the other presets.
 */
class AddMemberAction
{
    public function __construct(private readonly MembershipPermissionManager $permissionManager) {}

    /**
     * @param  array<int, int>  $outletIds
     * @param  array<int, string>  $permissionGrants
     * @param  array<int, string>  $permissionDenials
     */
    public function execute(
        Membership $actor,
        Business $business,
        string $email,
        RolePreset $role,
        array $outletIds = [],
        array $permissionGrants = [],
        array $permissionDenials = [],
    ): Membership {
        $this->permissionManager->assertRoleAssignableBy($actor, $role);
        $this->permissionManager->assertOverridesWithinActor($actor, $permissionGrants, $permissionDenials);

        return DB::transaction(function () use ($business, $email, $role, $outletIds, $permissionGrants, $permissionDenials): Membership {
            $user = User::query()->where('email', $email)->first();

            if ($user === null) {
                throw ValidationException::withMessages([
                    'email' => __('No registered Dagana user uses this email.'),
                ]);
            }

            if ($business->memberships()->where('user_id', $user->getKey())->exists()) {
                throw ValidationException::withMessages([
                    'email' => __('This user is already a member of the business.'),
                ]);
            }

            $membership = $business->memberships()->create([
                'user_id' => $user->getKey(),
                'role' => $role,
                'status' => Membership::STATUS_ACTIVE,
            ]);

            if (! $role->hasBusinessWideOutletAccess()) {
                $membership->outlets()->sync($outletIds);
            }

            $this->permissionManager->sync($membership, $permissionGrants, $permissionDenials);

            return $membership->load(['user', 'outlets', 'permissionOverrides']);
        });
    }
}
