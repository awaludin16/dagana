<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Organization\Actions\ChangeMembershipStatusAction;
use App\Domain\Organization\Actions\UpdateMembershipAction;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Membership\UpdateMemberRequest;
use App\Http\Resources\Api\V1\MembershipResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Employee (membership) management within a business.
 *
 * `members.*` permissions are checked against the parent business for listing
 * and inviting, and against the target membership for update/status changes.
 * Permission overrides additionally require `permissions.manage_membership`
 * (D-04). The nested route binding scopes `{membership}` to the parent
 * business, so a membership from another tenant resolves to 404 before any
 * authorization runs.
 */
class MembershipController extends Controller
{
    public function index(Request $request, Business $business): AnonymousResourceCollection
    {
        $this->authorize('viewEmployees', $business);
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'status' => ['sometimes', Rule::in(['active', 'disabled'])],
        ]);

        $members = $business->memberships()
            ->with(['user', 'outlets', 'permissionOverrides'])
            ->when($validated['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->orderBy('id')
            ->paginate($validated['per_page'] ?? 20);

        return MembershipResource::collection($members);
    }

    public function update(
        UpdateMemberRequest $request,
        Business $business,
        Membership $membership,
        UpdateMembershipAction $action,
    ): MembershipResource {
        $this->authorize('update', $membership);

        if ($request->hasPermissionOverrides()) {
            $this->authorize('managePermissions', $membership);
        }

        return new MembershipResource(
            $action->execute(
                $this->actor($request, $business),
                $membership,
                $request->role(),
                $request->outletIds(),
                $request->permissionGrants(),
                $request->permissionDenials(),
            )
        );
    }

    public function disable(
        Business $business,
        Membership $membership,
        ChangeMembershipStatusAction $action,
    ): MembershipResource {
        $this->authorize('disable', $membership);

        return new MembershipResource($action->disable($membership));
    }

    public function enable(
        Business $business,
        Membership $membership,
        ChangeMembershipStatusAction $action,
    ): MembershipResource {
        $this->authorize('enable', $membership);

        return new MembershipResource($action->enable($membership));
    }

    private function actor(Request $request, Business $business): Membership
    {
        /** @var Membership $actor */
        $actor = $request->user()->memberships()
            ->where('business_id', $business->getKey())
            ->firstOrFail();

        return $actor;
    }
}
