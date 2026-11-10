<?php

namespace App\Http\Resources;

use App\Models\CashSession;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin CashSession
 */
class CashSessionResource extends JsonResource
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
            'operator_membership_id' => $this->operator_membership_id,
            'status' => $this->status,
            'opening_cash' => $this->opening_cash,
            'expected_cash' => CashSession::computeExpectedCash(
                $this->opening_cash,
                (int) ($this->movements_sum_amount ?? $this->netMovement()),
            ),
            'actual_cash' => $this->actual_cash,
            'variance' => $this->variance,
            'variance_note' => $this->variance_note,
            'opened_at' => $this->opened_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'closed_by_membership_id' => $this->closed_by_membership_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
