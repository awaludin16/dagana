<?php

namespace App\Domain\Order\Actions;

use App\Models\BusinessMembership;
use App\Models\Order;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;

/**
 * Pembatalan order hanya diizinkan saat masih PENDING dan belum ada
 * pembayaran PAID. Order yang sudah dibayar tidak dapat dibatalkan langsung;
 * gunakan alur refund (pembatalan pembayaran) terpisah.
 */
class CancelOrderAction
{
    public function execute(Order $order, BusinessMembership $membership): Order
    {
        if ($order->business_id !== $membership->business_id) {
            throw new AuthorizationException('Order tidak ditemukan.');
        }

        if (! $membership->canAccessOutlet($order->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        if (! $order->canBeCancelled()) {
            throw ValidationException::withMessages([
                'order' => 'Order tidak dapat dibatalkan (hanya order PENDING tanpa pembayaran PAID yang dapat dibatalkan).',
            ]);
        }

        $order->update(['status' => Order::STATUS_CANCELLED]);

        return $order->fresh();
    }
}
