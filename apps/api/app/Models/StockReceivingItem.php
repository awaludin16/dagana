<?php

namespace App\Models;

use App\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockReceivingItem extends Model
{
    use HasUuid;

    protected $fillable = [
        'tenant_id', 'stock_receiving_id', 'product_variant_id', 'quantity', 'cost_price',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'cost_price' => 'decimal:2',
        ];
    }

    public function receiving(): BelongsTo
    {
        return $this->belongsTo(StockReceiving::class, 'stock_receiving_id');
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
