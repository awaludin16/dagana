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
            'role_label' => $this->role?->label(),
            'status' => $this->status,
            'business_wide_outlet_access' => $this->hasAllOutletAccess(),
            // Effective permissions after applying explicit overrides to the preset.
            'permissions' => $this->permissions(),
            'preset_permissions' => $this->presetPermissions(),
            'permission_grants' => $this->permissionGrants(),
            'permission_denials' => $this->permissionDenials(),
            'user' => new UserResource($this->whenLoaded('user')),
            'business' => new BusinessResource($this->whenLoaded('business')),
            'outlets' => OutletResource::collection($this->whenLoaded('outlets')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
