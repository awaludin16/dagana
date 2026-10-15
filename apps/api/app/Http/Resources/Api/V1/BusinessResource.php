<?php

namespace App\Http\Resources\Api\V1;

use App\Domain\Organization\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Business
 */
class BusinessResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'timezone' => $this->timezone,
            'currency' => $this->currency,
            'status' => $this->status,
            'role' => $this->whenPivotLoaded('memberships', fn () => $this->pivot->role),
            'outlets' => OutletResource::collection($this->whenLoaded('outlets')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
