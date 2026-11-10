<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Baris ledger kas (append-only). Koreksi dituliskan sebagai movement baru,
 * bukan mengubah/menghapus baris lama.
 */
#[Fillable(['cash_session_id', 'business_id', 'outlet_id', 'membership_id', 'type', 'amount', 'reason'])]
class CashMovement extends Model
{
    /** Penjualan tunai yang tercatat otomatis saat checkout cash. */
    public const TYPE_CASH_SALE = 'CASH_SALE';

    /** Kemasan uang masuk ke kas (mis. modal tambahan). */
    public const TYPE_CASH_IN = 'CASH_IN';

    /** Uang keluar dari kas (mis. belanja operasional). */
    public const TYPE_CASH_OUT = 'CASH_OUT';

    /** Pengembalian uang ke pelanggan. */
    public const TYPE_REFUND = 'REFUND';

    /** Koreksi kas yang diizinkan (bisa masuk atau keluar). */
    public const TYPE_ADJUSTMENT = 'ADJUSTMENT';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<CashSession, $this>
     */
    public function cashSession(): BelongsTo
    {
        return $this->belongsTo(CashSession::class);
    }

    /**
     * @return BelongsTo<BusinessMembership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(BusinessMembership::class);
    }
}
