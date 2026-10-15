<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Organization\Models\Membership;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Membership
 */
class MembershipResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'role' => $this->role?->value,
            'status' => $this->status,
            'permissions' => $this->permissions(),
            'business' => new BusinessResource($this->whenLoaded('business')),
            'outlets' => OutletResource::collection($this->whenLoaded('outlets')),
        ];
    }
}
