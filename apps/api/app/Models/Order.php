<?php

namespace App\Models;

use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Order adalah akar transaksi inti (Order Engine). Status bertransisi:
 * PENDING → PAID (pembayaran dikonfirmasi), PENDING → CANCELLED (batal).
 */
#[Fillable([
    'business_id',
    'outlet_id',
    'membership_id',
    'source',
    'status',
    'total_amount',
    'idempotency_key',
    'notes',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    public const SOURCE_POS = 'POS';

    public const SOURCE_QR = 'QR';

    public const SOURCE_ADMIN = 'ADMIN';

    /** @var list<string> */
    public const SOURCES = [self::SOURCE_POS, self::SOURCE_QR, self::SOURCE_ADMIN];

    public const STATUS_PENDING = 'PENDING';

    public const STATUS_PAID = 'PAID';

    public const STATUS_CANCELLED = 'CANCELLED';

    /** @var list<string> */
    public const STATUSES = [self::STATUS_PENDING, self::STATUS_PAID, self::STATUS_CANCELLED];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_amount' => 'integer',
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
     * @return BelongsTo<BusinessMembership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(BusinessMembership::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('id');
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderBy('id');
    }

    /**
     * @param  Builder<Order>  $query
     */
    public function scopeForBusiness(Builder $query, int $businessId): void
    {
        $query->where('business_id', $businessId);
    }

    /**
     * @param  Builder<Order>  $query
     */
    public function scopeForOutlet(Builder $query, int $outletId): void
    {
        $query->where('outlet_id', $outletId);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Order hanya dapat dibatalkan saat masih PENDING dan belum ada pembayaran PAID.
     */
    public function canBeCancelled(): bool
    {
        return $this->isPending() && $this->payments->where('status', Payment::STATUS_PAID)->isEmpty();
    }
}
