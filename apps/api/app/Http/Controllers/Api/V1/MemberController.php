<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Access\Actions\CreateMemberAction;
use App\Domain\Access\Actions\DeleteMemberAction;
use App\Domain\Access\Actions\UpdateMemberAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Member\StoreMemberRequest;
use App\Http\Requests\Member\UpdateMemberRequest;
use App\Http\Resources\MemberResource;
use App\Models\BusinessMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MemberController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $actor = $request->user()->membership;

        return MemberResource::collection(
            BusinessMembership::query()
                ->where('business_id', $actor->business_id)
                ->with('user', 'business.outlets', 'outletAccesses.outlet')
                ->orderBy('id')
                ->get(),
        );
    }

    public function store(StoreMemberRequest $request, CreateMemberAction $action): JsonResponse
    {
        $membership = $action->execute($request->user()->membership, $request->validated());

        return response()->json(['data' => new MemberResource($membership)], 201);
    }

    public function update(UpdateMemberRequest $request, int $membership, UpdateMemberAction $action): MemberResource
    {
        return new MemberResource(
            $action->execute(
                $request->user()->membership,
                $this->scopedMembership($request, $membership),
                $request->validated(),
            ),
        );
    }

    public function destroy(Request $request, int $membership, DeleteMemberAction $action): JsonResponse
    {
        $action->execute(
            $request->user()->membership,
            $this->scopedMembership($request, $membership),
        );

        return response()->json(null, 204);
    }

    private function scopedMembership(Request $request, int $membershipId): BusinessMembership
    {
        return BusinessMembership::query()
            ->where('business_id', $request->user()->membership->business_id)
            ->with('user', 'business.outlets', 'outletAccesses.outlet')
            ->findOrFail($membershipId);
    }
}
