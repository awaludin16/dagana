<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => 'ORD-'.str_pad((string) $this->id, 8, '0', STR_PAD_LEFT),
            'outlet_id' => $this->outlet_id,
            'actor_user_id' => $this->actor_user_id,
            'source' => $this->source,
            'status' => $this->status,
            'total' => $this->total,
            'created_at' => $this->created_at,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payment' => new PaymentResource($this->whenLoaded('payment')),
        ];
    }
}
