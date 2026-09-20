<?php

namespace App\Models;

use App\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustment extends Model
{
    use HasUuid;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'product_variant_id',
        'system_qty', 'counted_qty', 'diff', 'reason',
        'stock_opname_id', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'system_qty' => 'decimal:2',
            'counted_qty' => 'decimal:2',
            'diff' => 'decimal:2',
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function opname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class, 'stock_opname_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
