<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serializes a role preset entry for the client's role picker.
 *
 * @mixin array{value: string, label: string, permissions: array<int, string>, business_wide_outlet_access: bool}
 */
class RoleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'value' => $this->resource['value'],
            'label' => $this->resource['label'],
            'permissions' => $this->resource['permissions'],
            'business_wide_outlet_access' => $this->resource['business_wide_outlet_access'],
        ];
    }
}
