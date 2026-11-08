<?php

namespace App\Domain\Order\Actions;

use App\Models\BusinessMembership;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Checkout adalah titik masuk tunggal Order Engine:
 * - menu diambil ulang dari database melalui Product::sellable() (harga/status dari client tidak dipercaya),
 * - total dan snapshot dihitung di backend,
 * - order, order items, dan payment dibuat dalam satu transaksi database,
 * - idempotency key mencegah transaksi ganda saat retry.
 */
class CheckoutAction
{
    /**
     * @param  array{
     *     membership: BusinessMembership,
     *     outlet_id: int,
     *     idempotency_key: string,
     *     payment_method: string,
     *     items: list<array{product_id: int, quantity: int}>,
     *     notes?: ?string,
     * }  $input
     * @return array{Order, bool} Order dan apakah baru dibuat (idempotency replay mengembalikan yang sudah ada).
     */
    public function execute(array $input): array
    {
        $membership = $input['membership'];
        $businessId = $membership->business_id;
        $outletId = $input['outlet_id'];
        $idempotencyKey = $input['idempotency_key'];
        $paymentMethod = $input['payment_method'];
        $itemsInput = $input['items'];
        $notes = $input['notes'] ?? null;

        if (! $membership->canAccessOutlet($outletId)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        // Idempotency: request ulang dengan kunci yang sama mengembalikan order yang sudah ada.
        if ($idempotencyKey !== '') {
            $existing = Order::query()
                ->where('business_id', $businessId)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing) {
                return [$existing->load(['items', 'payments']), false];
            }
        }

        try {
            return DB::transaction(function () use ($membership, $businessId, $outletId, $idempotencyKey, $paymentMethod, $itemsInput, $notes): array {
                // Row locking mengantisipasi request serentak pada produk yang sama.
                $productIds = array_unique(array_column($itemsInput, 'product_id'));
                $products = Product::query()
                    ->where('business_id', $businessId)
                    ->whereIn('id', $productIds)
                    ->sellable()
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $orderItemData = [];
                $totalAmount = 0;

                foreach ($itemsInput as $item) {
                    $productId = $item['product_id'];

                    if (! isset($products[$productId])) {
                        throw ValidationException::withMessages([
                            'items' => 'Salah satu menu tidak aktif, tidak tersedia, atau tidak berlaku untuk bisnis Anda.',
                        ]);
                    }

                    $product = $products[$productId];
                    $quantity = (int) $item['quantity'];
                    $unitPrice = (int) $product->price;
                    $lineTotal = $unitPrice * $quantity;

                    $orderItemData[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'product_price' => $unitPrice,
                        'quantity' => $quantity,
                        'total' => $lineTotal,
                    ];

                    $totalAmount += $lineTotal;
                }

                $order = Order::create([
                    'business_id' => $businessId,
                    'outlet_id' => $outletId,
                    'membership_id' => $membership->id,
                    'source' => Order::SOURCE_POS,
                    'status' => Order::STATUS_PENDING,
                    'total_amount' => $totalAmount,
                    'idempotency_key' => $idempotencyKey,
                    'notes' => $notes,
                ]);

                foreach ($orderItemData as $data) {
                    $order->items()->create($data);
                }

                // Tunai dibayar langsung di POS; metode lain PENDING menunggu konfirmasi server-side
                // (gateway/provider belum diintegrasikan pada MVP).
                $paymentStatus = $paymentMethod === Payment::METHOD_CASH
                    ? Payment::STATUS_PAID
                    : Payment::STATUS_PENDING;

                $order->payments()->create([
                    'business_id' => $businessId,
                    'outlet_id' => $outletId,
                    'membership_id' => $membership->id,
                    'method' => $paymentMethod,
                    'status' => $paymentStatus,
                    'amount' => $totalAmount,
                    'reference' => null,
                    'paid_at' => $paymentStatus === Payment::STATUS_PAID ? now() : null,
                    // Cash dipastikan langsung oleh operator yang melakukan checkout.
                    'confirmed_by' => $paymentStatus === Payment::STATUS_PAID ? $membership->id : null,
                ]);

                if ($paymentStatus === Payment::STATUS_PAID) {
                    $order->update(['status' => Order::STATUS_PAID]);
                }

                return [$order->load(['items', 'payments']), true];
            });
        } catch (UniqueConstraintViolationException $e) {
            // Request serentak dengan kunci idempotensi yang sama telah commit terlebih dahulu.
            $existing = Order::query()
                ->where('business_id', $businessId)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing) {
                return [$existing->load(['items', 'payments']), false];
            }

            throw $e;
        }
    }
}
