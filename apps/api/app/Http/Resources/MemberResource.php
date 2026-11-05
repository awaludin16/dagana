<?php

namespace App\Http\Resources;

use App\Models\BusinessMembership;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin BusinessMembership
 */
class MemberResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $this->user;

        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'business_id' => $this->business_id,
            'role' => $this->role,
            'status' => $this->status,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'business' => $this->whenLoaded('business', fn (): array => [
                'id' => $this->business->id,
                'name' => $this->business->name,
            ]),
            'outlets' => OutletResource::collection(
                $this->status === BusinessMembership::STATUS_ACTIVE
                    ? $this->accessibleOutlets()
                    : ($this->relationLoaded('outletAccesses')
                        ? $this->outletAccesses->pluck('outlet')->filter()->values()
                        : collect()),
            )->resolve(),
            'permissions' => $this->permissions(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
