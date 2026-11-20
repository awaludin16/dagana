<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'business_id',
    'category_id',
    'name',
    'price',
    'is_active',
    'is_available',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $attributes = [
        'is_active' => true,
        'is_available' => true,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_available' => 'boolean',
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
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return HasMany<ProductOutletAvailability, $this>
     */
    public function outletAvailabilities(): HasMany
    {
        return $this->hasMany(ProductOutletAvailability::class);
    }

    /**
     * Phase 4 checkout guard hook: only active AND available menus may enter a
     * new transaction. When an outlet is given, a per-outlet override can only
     * narrow availability further (D-35). Checkout must re-resolve products
     * through this scope on the server; client-supplied price/status/
     * availability is never trusted.
     *
     * @param  Builder<Product>  $query
     */
    public function scopeSellable(Builder $query, ?int $outletId = null): void
    {
        $query->where('is_active', true)->where('is_available', true);

        if ($outletId !== null) {
            $query->whereDoesntHave('outletAvailabilities', function ($query) use ($outletId): void {
                $query->where('outlet_id', $outletId)->where('is_available', false);
            });
        }
    }
}
