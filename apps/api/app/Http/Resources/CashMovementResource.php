<?php

namespace App\Http\Resources;

use App\Models\CashMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CashMovement
 */
class CashMovementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'cash_session_id' => $this->cash_session_id,
            'business_id' => $this->business_id,
            'outlet_id' => $this->outlet_id,
            'membership_id' => $this->membership_id,
            'type' => $this->type,
            // Nominal dengan tanda: masuk positif, keluar/refund minus.
            'amount' => $this->amount,
            'reason' => $this->reason,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
