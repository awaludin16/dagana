<?php

namespace App\Models;

use App\Concerns\HasUuid;
use App\Enums\StockMovementType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasUuid;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'product_variant_id', 'quantity',
        'movement_type', 'reference_type', 'reference_id', 'reason', 'note', 'actor_id',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'movement_type' => StockMovementType::class,
            'reference_type' => StockMovementType::class,
            'reference_id' => 'string',
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

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
