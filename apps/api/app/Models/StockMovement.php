<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Baris ledger stok (append-only). Koreksi dilakukan dengan movement baru,
 * bukan mengubah/menghapus baris lama.
 */
#[Fillable([
    'business_id',
    'outlet_id',
    'inventory_item_id',
    'membership_id',
    'type',
    'quantity_change',
    'reason',
    'idempotency_key',
])]
class StockMovement extends Model
{
    /** Penyesuaian stok manual; arah mengikuti tanda quantity_change. */
    public const TYPE_ADJUSTMENT = 'ADJUSTMENT';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity_change' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<InventoryItem, $this>
     */
    public function inventoryItem(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class);
    }

    /**
     * @return BelongsTo<BusinessMembership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(BusinessMembership::class);
    }
}
