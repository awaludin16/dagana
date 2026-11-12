<?php

namespace App\Domain\Inventory\Actions;

use App\Models\BusinessMembership;
use App\Models\InventoryItem;
use App\Models\StockMovement;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Stock adjustment adalah satu-satunya jalur penulisan saldo Phase 6:
 * - item di-row-lock agar dua adjustment serentak tidak melewati guard saldo,
 * - saldo diperiksa dari SUM ledger sebelum movement ditulis,
 * - idempotency key mencegah movement ganda saat retry,
 * - stok negatif ditolak (baseline D-10; masih menunggu persetujuan PO).
 */
class AdjustStockAction
{
    /**
     * @return array{StockMovement, bool} Movement dan apakah baru dibuat.
     */
    public function execute(
        BusinessMembership $membership,
        InventoryItem $item,
        int $quantityChange,
        string $reason,
        string $idempotencyKey,
    ): array {
        if ($item->business_id !== $membership->business_id) {
            throw new AuthorizationException('Item tidak ditemukan.');
        }

        if (! $membership->canAccessOutlet($item->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        $existing = $this->findByKey($membership->business_id, $idempotencyKey);

        if ($existing !== null) {
            return [$this->replay($existing, $item), false];
        }

        try {
            return DB::transaction(function () use ($membership, $item, $quantityChange, $reason, $idempotencyKey): array {
                $locked = InventoryItem::query()
                    ->where('business_id', $membership->business_id)
                    ->whereKey($item->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->ensureActive($locked);

                $currentStock = (int) $locked->movements()->sum('quantity_change');

                if ($currentStock + $quantityChange < 0) {
                    throw ValidationException::withMessages([
                        'quantity_change' => 'Stok tidak mencukupi untuk adjustment ini.',
                    ]);
                }

                $movement = $locked->movements()->create([
                    'business_id' => $membership->business_id,
                    'outlet_id' => $locked->outlet_id,
                    'membership_id' => $membership->id,
                    'type' => StockMovement::TYPE_ADJUSTMENT,
                    'quantity_change' => $quantityChange,
                    'reason' => $reason,
                    'idempotency_key' => $idempotencyKey,
                ]);

                return [$movement, true];
            });
        } catch (UniqueConstraintViolationException $e) {
            // Request serentak dengan key yang sama sudah commit lebih dulu.
            $existing = $this->findByKey($membership->business_id, $idempotencyKey);

            if ($existing !== null) {
                return [$this->replay($existing, $item), false];
            }

            throw $e;
        }
    }

    private function ensureActive(InventoryItem $item): void
    {
        if (! $item->is_active) {
            throw ValidationException::withMessages([
                'item' => 'Item inventory tidak aktif dan tidak menerima adjustment baru.',
            ]);
        }
    }

    private function findByKey(int $businessId, string $idempotencyKey): ?StockMovement
    {
        return StockMovement::query()
            ->where('business_id', $businessId)
            ->where('idempotency_key', $idempotencyKey)
            ->first();
    }

    /**
     * Key yang sama hanya boleh dipakai untuk item yang sama. Reuse lintas item
     * ditolak agar tidak diam-diam mengembalikan movement item lain.
     */
    private function replay(StockMovement $movement, InventoryItem $item): StockMovement
    {
        if ($movement->inventory_item_id !== $item->id) {
            throw ValidationException::withMessages([
                'idempotency_key' => 'Idempotency key sudah dipakai untuk item inventory lain.',
            ]);
        }

        return $movement;
    }
}
