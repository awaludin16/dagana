<?php

namespace App\Models;

use Database\Factories\InventoryItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Item inventory dimiliki satu Business+Outlet. Saldo tidak disimpan sebagai
 * kolom; saldo adalah jumlah movement ledger sehingga selalu dapat dijelaskan.
 */
#[Fillable([
    'business_id',
    'outlet_id',
    'name',
    'unit',
    'low_stock_threshold',
    'is_active',
])]
class InventoryItem extends Model
{
    /** @use HasFactory<InventoryItemFactory> */
    use HasFactory;

    protected $attributes = [
        'is_active' => true,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'low_stock_threshold' => 'integer',
            'is_active' => 'boolean',
        ];
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
     * @return HasMany<StockMovement, $this>
     */
    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function currentStock(): int
    {
        return (int) $this->movements()->sum('quantity_change');
    }

    public function isLowStock(int $stock): bool
    {
        return $this->low_stock_threshold !== null && $stock <= $this->low_stock_threshold;
    }

    /**
     * Hanya item dengan threshold yang dihitung sebagai low stock.
     *
     * @param  Builder<InventoryItem>  $query
     */
    public function scopeLowStock(Builder $query): void
    {
        $query->whereNotNull('low_stock_threshold')
            ->whereRaw(
                '(SELECT COALESCE(SUM(quantity_change), 0) FROM stock_movements
                WHERE stock_movements.inventory_item_id = inventory_items.id)
                <= inventory_items.low_stock_threshold'
            );
    }
}
