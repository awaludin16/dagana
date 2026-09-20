<?php

namespace App\Models;

use App\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LowStockRule extends Model
{
    use HasUuid;

    protected $fillable = [
        'tenant_id', 'product_variant_id', 'outlet_id', 'threshold',
    ];

    protected function casts(): array
    {
        return [
            'threshold' => 'decimal:2',
        ];
    }

    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
