<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Organization\Actions\AcceptMemberInvitationAction;
use App\Domain\Organization\Actions\CreateMemberInvitationAction;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\MemberInvitation;
use App\Domain\Organization\Models\Membership;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Membership\AcceptMemberInvitationRequest;
use App\Http\Requests\Api\V1\Membership\StoreMemberInvitationRequest;
use App\Http\Resources\Api\V1\MemberInvitationResource;
use App\Http\Resources\Api\V1\MembershipResource;
use App\Mail\MemberInvitationMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class MemberInvitationController extends Controller
{
    public function index(Request $request, Business $business): AnonymousResourceCollection
    {
        $this->authorize('viewEmployees', $business);
        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'status' => ['sometimes', Rule::in(['pending', 'accepted', 'canceled', 'expired'])],
        ]);

        $invitations = $business->invitations()
            ->when(
                $validated['status'] ?? null,
                function ($query, string $status): void {
                    if ($status === 'expired') {
                        $query->where('status', MemberInvitation::STATUS_PENDING)
                            ->where('expires_at', '<=', now());
                    } elseif ($status === MemberInvitation::STATUS_PENDING) {
                        $query->where('status', $status)->where('expires_at', '>', now());
                    } else {
                        $query->where('status', $status);
                    }
                },
            )
            ->orderByDesc('id')
            ->paginate($validated['per_page'] ?? 20);

        return MemberInvitationResource::collection($invitations);
    }

    public function store(
        StoreMemberInvitationRequest $request,
        Business $business,
        CreateMemberInvitationAction $action,
    ): JsonResponse {
        $this->authorize('createEmployee', $business);

        if ($request->hasPermissionOverrides()) {
            $this->authorize('manageMembershipPermissions', $business);
        }

        $created = $action->execute(
            $this->actor($request, $business),
            $business,
            $request->email(),
            $request->role(),
            $request->outletIds(),
            $request->permissionGrants(),
            $request->permissionDenials(),
        );

        if (! $this->deliver($created['invitation'], $created['token'])) {
            return response()->json(['message' => 'Undangan tersimpan, tetapi email gagal dikirim. Coba kirim ulang.'], 503);
        }

        return (new MemberInvitationResource($created['invitation']->refresh()))
            ->response()
            ->setStatusCode(201);
    }

    public function resend(Business $business, MemberInvitation $invitation): JsonResponse|MemberInvitationResource
    {
        $this->authorize('createEmployee', $business);

        if (in_array($invitation->status, [
            MemberInvitation::STATUS_ACCEPTED,
            MemberInvitation::STATUS_CANCELED,
        ], true)) {
            return response()->json(['message' => 'Undangan yang sudah diterima atau dibatalkan tidak dapat dikirim ulang.'], 409);
        }

        $token = $invitation->rotateToken();
        if (! $this->deliver($invitation, $token)) {
            return response()->json(['message' => 'Email undangan gagal dikirim. Coba lagi.'], 503);
        }

        return new MemberInvitationResource($invitation->refresh());
    }

    public function cancel(Business $business, MemberInvitation $invitation): JsonResponse|MemberInvitationResource
    {
        $this->authorize('createEmployee', $business);

        if ($invitation->status !== MemberInvitation::STATUS_PENDING) {
            return response()->json(['message' => 'Hanya undangan yang masih menunggu yang dapat dibatalkan.'], 409);
        }

        $invitation->update(['status' => MemberInvitation::STATUS_CANCELED]);

        return new MemberInvitationResource($invitation);
    }

    public function accept(
        AcceptMemberInvitationRequest $request,
        AcceptMemberInvitationAction $action,
    ): MembershipResource {
        return new MembershipResource($action->execute($request->user(), $request->token()));
    }

    private function deliver(MemberInvitation $invitation, string $token): bool
    {
        try {
            Mail::to($invitation->email)->send(new MemberInvitationMail($invitation, $token));
        } catch (TransportExceptionInterface $exception) {
            $invitation->update(['delivery_status' => 'failed']);
            Log::error('Unable to deliver Dagana member invitation.', [
                'invitation_id' => $invitation->getKey(),
                'business_id' => $invitation->business_id,
                'exception' => $exception,
            ]);

            return false;
        }

        $invitation->update(['delivery_status' => 'sent']);

        return true;
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
