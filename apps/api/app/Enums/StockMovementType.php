<?php

namespace App\Enums;

/**
 * Jenis pergerakan stok (docs/domain-modeling.md §7.5 + PRD §12,
 * quantity bertanda: + masuk, − keluar).
 */
enum StockMovementType: string
{
    case Adjustment = 'ADJUSTMENT';
    case Opname = 'OPNAME';
    case Receiving = 'RECEIVING';
    case Sale = 'SALE';

    /** Tampilan labuhan (frontend) — label pendek Bahasa Indonesia. */
    public function label(): string
    {
        return match ($this) {
            self::Adjustment => 'Adjustment',
            self::Opname => 'Opname',
            self::Receiving => 'Barang masuk',
            self::Sale => 'Penjualan',
        };
    }
}
