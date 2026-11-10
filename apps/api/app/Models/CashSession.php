<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Cash Session (Phase 5): konteks tanggung jawab kas per operator per outlet,
 * bukan shift management (requirement payments-and-cash). Expected cash
 * dihitung dari opening cash plus total arus ledger; variance adalah
 * actual_cash - expected_cash.
 */
#[Fillable(['business_id', 'outlet_id', 'operator_membership_id', 'status', 'opening_cash', 'actual_cash', 'expected_cash', 'variance', 'variance_note', 'opened_at', 'closed_at', 'closed_by_membership_id'])]
class CashSession extends Model
{
    public const STATUS_OPEN = 'OPEN';

    public const STATUS_CLOSED = 'CLOSED';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'opening_cash' => 'integer',
            'actual_cash' => 'integer',
            'expected_cash' => 'integer',
            'variance' => 'integer',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    /**
     * Expected cash = opening cash + semua arus kas bertanda pada ledger.
     */
    public static function computeExpectedCash(int $openingCash, int $netMovement): int
    {
        return $openingCash + $netMovement;
    }

    /**
     * Total arus kas bertanda pada session ini: masuk positif, keluar minus.
     */
    public function netMovement(): int
    {
        $sum = $this->relationLoaded('movements')
            ? $this->movements->sum('amount')
            : $this->movements()->sum('amount');

        return (int) $sum;
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    public function isClosed(): bool
    {
        return $this->status === self::STATUS_CLOSED;
    }

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @return BelongsTo<Outlet, $this>
     */
    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    /**
     * Operator penanggung jawab (D-06): satu session, satu operator.
     *
     * @return BelongsTo<BusinessMembership, $this>
     */
    public function operatorMembership(): BelongsTo
    {
        return $this->belongsTo(BusinessMembership::class, 'operator_membership_id');
    }

    /**
     * @return BelongsTo<BusinessMembership, $this>
     */
    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(BusinessMembership::class, 'closed_by_membership_id');
    }

    /**
     * @return HasMany<CashMovement, $this>
     */
    public function movements(): HasMany
    {
        return $this->hasMany(CashMovement::class);
    }
}
