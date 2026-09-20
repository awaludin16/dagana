<?php

namespace App\Enums;

/**
 * Status batch stock opname (docs/domain-modeling.md §7.5).
 */
enum StockOpnameStatus: string
{
    case Draft = 'DRAFT';
    case InProgress = 'IN_PROGRESS';
    case Completed = 'COMPLETED';
    case Cancelled = 'CANCELLED';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf',
            self::InProgress => 'Berjalan',
            self::Completed => 'Selesai',
            self::Cancelled => 'Dibatalkan',
        };
    }
}
