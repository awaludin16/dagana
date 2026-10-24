<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'method' => $this->method,
            'amount' => $this->amount,
            'status' => $this->status,
            'reference' => $this->reference,
            'actor_user_id' => $this->actor_user_id,
            'confirmed_by_user_id' => $this->confirmed_by_user_id,
            'created_at' => $this->created_at,
            'paid_at' => $this->paid_at,
        ];
    }
}
