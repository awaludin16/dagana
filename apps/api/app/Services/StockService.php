<?php

namespace App\Services;

use App\Models\ProductVariant;
use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Validation\ValidationException;

/**
 * Satu-satunya jalur perubahan stok (PRD §12).
 *
 * Setiap perubahan menghasilkan baris `stock_movements` (append-only) dan
 * memperbarui ringkasan `stocks` dalam transaksi yang sama. Pemanggil wajib
 * membungkus dengan `DB::transaction`.
 */
class StockService
{
    /**
     * Mencatat movement & menggeser saldo stok outlet+variant.
     *
     * @param  int|float|string  $quantity  bertanda: + masuk, − keluar
     * @param  string  $movementType  mis. ADJUSTMENT / RECEIVING / OPNAME
     * @param  string  $referenceType  jenis dokumen asal (sinkron dgn movementType)
     */
    public function move(
        ProductVariant $variant,
        string $outletId,
        int|float|string $quantity,
        string $movementType,
        string $referenceType,
        ?string $referenceId,
        ?string $reason,
        ?string $note,
        string|int $actorId,
        bool $preventNegative = true,
    ): StockMovement {
        $delta = (float) $quantity;

        // Kunci baris ringkasan agar dua request bersamaan tidak saling timpa
        // (PostgreSQL: lockForUpdate; SQLite local: no-op, cukup untuk tes).
        $stock = Stock::query()
            ->where('outlet_id', $outletId)
            ->where('product_variant_id', $variant->id)
            ->lockForUpdate()
            ->first();

        if ($stock === null) {
            $stock = new Stock([
                'tenant_id' => $variant->tenant_id,
                'outlet_id' => $outletId,
                'product_variant_id' => $variant->id,
                'quantity' => 0,
            ]);
        }

        $balance = (float) $stock->quantity + $delta;

        if ($preventNegative && $balance < 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Stok tidak mencukupi untuk outlet ini.',
            ]);
        }

        $stock->quantity = number_format($balance, 2, '.', '');
        $stock->save();

        return StockMovement::create([
            'tenant_id' => $variant->tenant_id,
            'outlet_id' => $outletId,
            'product_variant_id' => $variant->id,
            'quantity' => number_format($delta, 2, '.', ''),
            'movement_type' => $movementType,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'reason' => $reason,
            'note' => $note,
            'actor_id' => $actorId,
        ]);
    }

    /** Saldo stok saat ini untuk variant pada satu outlet. */
    public function balance(ProductVariant $variant, string $outletId): float
    {
        return (float) Stock::query()
            ->where('outlet_id', $outletId)
            ->where('product_variant_id', $variant->id)
            ->value('quantity');
    }
}
