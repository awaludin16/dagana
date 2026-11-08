<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'outlet_id' => $this->outlet_id,
            'source' => $this->source,
            'status' => $this->status,
            'total_amount' => $this->total_amount,
            'idempotency_key' => $this->idempotency_key,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'payment' => $this->whenLoaded('payments', function () {
                return $this->payments->isNotEmpty()
                    ? new PaymentResource($this->payments->first())
                    : null;
            }),
        ];
    }
}
