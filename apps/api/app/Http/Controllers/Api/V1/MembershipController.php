<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Organization\Actions\AddMemberAction;
use App\Domain\Organization\Actions\ChangeMembershipStatusAction;
use App\Domain\Organization\Actions\UpdateMembershipAction;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Membership\StoreMemberRequest;
use App\Http\Requests\Api\V1\Membership\UpdateMemberRequest;
use App\Http\Resources\Api\V1\MembershipResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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

        $members = $business->memberships()
            ->with(['user', 'outlets', 'permissionOverrides'])
            ->orderBy('id')
            ->get();

        return MembershipResource::collection($members);
    }

    public function store(StoreMemberRequest $request, Business $business, AddMemberAction $action): JsonResponse
    {
        $this->authorize('createEmployee', $business);

        if ($request->hasPermissionOverrides()) {
            $this->authorize('manageMembershipPermissions', $business);
        }

        $membership = $action->execute(
            $this->actor($request, $business),
            $business,
            $request->email(),
            $request->role(),
            $request->outletIds(),
            $request->permissionGrants(),
            $request->permissionDenials(),
        );

        return (new MembershipResource($membership))->response()->setStatusCode(201);
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

    /**
     * The acting user's active membership in the business.
     *
     * Authorization has already confirmed it exists and is active; this only
     * materializes it for the domain anti-escalation checks.
     */
    private function actor(Request $request, Business $business): Membership
    {
        /** @var Membership $actor */
        $actor = $request->user()->memberships()
            ->where('business_id', $business->getKey())
            ->firstOrFail();

        return $actor;
    }
}
