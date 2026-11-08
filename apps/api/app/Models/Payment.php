<?php

namespace App\Models;

use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pencatatan pembayaran terkait order. Status:
 * PENDING → PAID (dikonfirmasi server-side), → FAILED,
 * → REFUNDED / PARTIALLY_REFUNDED (alur pembatalan, belum diimbolkan endpoint).
 */
#[Fillable([
    'order_id',
    'business_id',
    'outlet_id',
    'membership_id',
    'confirmed_by',
    'method',
    'status',
    'amount',
    'reference',
    'paid_at',
])]
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    public const METHOD_CASH = 'cash';

    public const METHOD_QR_PAYMENT = 'qr_payment';

    public const METHOD_BANK_TRANSFER = 'bank_transfer';

    public const METHOD_DEBIT = 'debit';

    public const METHOD_CREDIT = 'credit';

    /** @var list<string> */
    public const METHODS = [
        self::METHOD_CASH,
        self::METHOD_QR_PAYMENT,
        self::METHOD_BANK_TRANSFER,
        self::METHOD_DEBIT,
        self::METHOD_CREDIT,
    ];

    public const STATUS_PENDING = 'PENDING';

    public const STATUS_PAID = 'PAID';

    public const STATUS_FAILED = 'FAILED';

    public const STATUS_REFUNDED = 'REFUNDED';

    public const STATUS_PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED';

    /** @var list<string> */
    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PAID,
        self::STATUS_FAILED,
        self::STATUS_REFUNDED,
        self::STATUS_PARTIALLY_REFUNDED,
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
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
     * Anggota yang memverifikasi dan mengonfirmasi pembayaran menjadi PAID
     * (audit trail konfirmasi manual; null untuk pembayaran belum konfirmasi).
     *
     * @return BelongsTo<BusinessMembership, $this>
     */
    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(BusinessMembership::class, 'confirmed_by');
    }

    /**
     * @param  Builder<Payment>  $query
     */
    public function scopeForBusiness(Builder $query, int $businessId): void
    {
        $query->where('business_id', $businessId);
    }

    /**
     * @param  Builder<Payment>  $query
     */
    public function scopeForOutlet(Builder $query, int $outletId): void
    {
        $query->where('outlet_id', $outletId);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function canBeConfirmed(): bool
    {
        return $this->isPending();
    }
}
