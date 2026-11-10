<?php

namespace App\Domain\Order\Actions;

use App\Models\BusinessMembership;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Konfirmasi pembayaran server-side (PENDING → PAID). Digunakan untuk metode
 * non-tunai setelah bukti pembayaran diverifikasi backend (webhook/provider).
 * Hanya dapat dilakukan pada pembayaran PENDING milik Business yang bersangkutan.
 */
class MarkPaymentPaidAction
{
    public function execute(Payment $payment, BusinessMembership $membership): Payment
    {
        if ($payment->business_id !== $membership->business_id) {
            throw new AuthorizationException('Pembayaran tidak ditemukan.');
        }

        if (! $membership->canAccessOutlet($payment->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        if (! $payment->canBeConfirmed()) {
            throw ValidationException::withMessages([
                'status' => 'Hanya pembayaran dengan status PENDING yang dapat dikonfirmasi.',
            ]);
        }

        return DB::transaction(function () use ($payment, $membership): Payment {
            $payment->update([
                'status' => Payment::STATUS_PAID,
                'paid_at' => now(),
                'confirmed_by' => $membership->id,
            ]);

            $order = $payment->order;
            if ($order->isPending()) {
                $order->update(['status' => Order::STATUS_PAID]);
            }

            return $payment->fresh();
        });
    }

    /**
     * Menandai pembayaran gagal (PENDING → FAILED). Order tetap PENDING agar
     * merchant dapat mencoba pembayaran ulang melalui checkout baru bila diperlukan.
     */
    public function markFailed(Payment $payment, BusinessMembership $membership): Payment
    {
        if ($payment->business_id !== $membership->business_id) {
            throw new AuthorizationException('Pembayaran tidak ditemukan.');
        }

        if (! $membership->canAccessOutlet($payment->outlet_id)) {
            throw new AuthorizationException('Outlet tidak dalam cakupan akses Anda.');
        }

        if (! $payment->isPending()) {
            throw ValidationException::withMessages([
                'status' => 'Hanya pembayaran dengan status PENDING yang dapat ditandai gagal.',
            ]);
        }

        $payment->update(['status' => Payment::STATUS_FAILED]);

        return $payment->fresh();
    }
}
