<?php

namespace App\Domain\Payment\Actions;

use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Payment\Models\Payment;
use App\Domain\Sales\Enums\OrderStatus;
use App\Domain\Sales\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class ConfirmOrderPaymentAction
{
    public function execute(Order $order, User $actor, ?string $reference): Order
    {
        return DB::transaction(function () use ($order, $actor, $reference): Order {
            $lockedOrder = Order::query()->whereKey($order->getKey())->lockForUpdate()->firstOrFail();
            $payment = Payment::query()
                ->where('order_id', $lockedOrder->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            if ($payment->status === PaymentStatus::Paid->value
                && $lockedOrder->status === OrderStatus::Paid->value) {
                return $lockedOrder->load(['items', 'payment']);
            }

            if ($payment->status !== PaymentStatus::Pending->value
                || $lockedOrder->status !== OrderStatus::PendingPayment->value) {
                throw new ConflictHttpException('Status order atau payment tidak dapat dikonfirmasi.');
            }

            $payment->update([
                'status' => PaymentStatus::Paid->value,
                'confirmed_by_user_id' => $actor->getKey(),
                'paid_at' => now(),
                'reference' => $reference ?? $payment->reference,
            ]);
            $lockedOrder->update(['status' => OrderStatus::Paid->value]);

            return $lockedOrder->load(['items', 'payment']);
        });
    }
}
