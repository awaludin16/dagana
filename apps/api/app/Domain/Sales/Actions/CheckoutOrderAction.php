<?php

namespace App\Domain\Sales\Actions;

use App\Domain\Catalog\Models\Menu;
use App\Domain\Outlet\Models\Outlet;
use App\Domain\Payment\Enums\PaymentMethod;
use App\Domain\Payment\Enums\PaymentStatus;
use App\Domain\Sales\Enums\OrderStatus;
use App\Domain\Sales\Models\Order;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class CheckoutOrderAction
{
    /**
     * @param  array<int, array{menu_id: int, quantity: int}>  $items
     * @return array{order: Order, replayed: bool}
     */
    public function execute(
        Outlet $outlet,
        User $actor,
        string $idempotencyKey,
        array $items,
        PaymentMethod $method,
    ): array {
        $requestHash = $this->requestHash($items, $method);

        try {
            return DB::transaction(function () use ($outlet, $actor, $idempotencyKey, $items, $method, $requestHash): array {
                $existing = Order::query()
                    ->where('business_id', $outlet->business_id)
                    ->where('outlet_id', $outlet->getKey())
                    ->where('idempotency_key', $idempotencyKey)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    return $this->replay($existing, $requestHash);
                }

                $menuIds = array_column($items, 'menu_id');
                $menus = Menu::query()
                    ->where('business_id', $outlet->business_id)
                    ->whereIn('id', $menuIds)
                    ->get()
                    ->keyBy('id');

                if ($menus->count() !== count($menuIds)) {
                    throw ValidationException::withMessages([
                        'items' => ['Satu atau lebih menu tidak ditemukan untuk Business ini.'],
                    ]);
                }

                $total = 0;
                $preparedItems = [];
                foreach ($items as $index => $item) {
                    /** @var Menu $menu */
                    $menu = $menus->get($item['menu_id']);
                    if ($menu->status !== Menu::STATUS_ACTIVE || ! $menu->is_available) {
                        throw ValidationException::withMessages([
                            "items.{$index}.menu_id" => ['Menu tidak aktif atau tidak tersedia.'],
                        ]);
                    }

                    $unitPrice = (int) $menu->price;
                    $quantity = $item['quantity'];
                    if ($unitPrice > intdiv(PHP_INT_MAX, $quantity)) {
                        throw ValidationException::withMessages([
                            'items' => ['Total pesanan melebihi batas nilai yang didukung.'],
                        ]);
                    }

                    $lineTotal = $unitPrice * $quantity;
                    if ($total > PHP_INT_MAX - $lineTotal) {
                        throw ValidationException::withMessages([
                            'items' => ['Total pesanan melebihi batas nilai yang didukung.'],
                        ]);
                    }

                    $total += $lineTotal;
                    $preparedItems[] = [
                        'menu' => $menu,
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'total' => $lineTotal,
                    ];
                }

                $isCash = $method === PaymentMethod::Cash;
                $order = Order::query()->create([
                    'business_id' => $outlet->business_id,
                    'outlet_id' => $outlet->getKey(),
                    'actor_user_id' => $actor->getKey(),
                    'source' => 'POS',
                    'status' => $isCash ? OrderStatus::Paid->value : OrderStatus::PendingPayment->value,
                    'idempotency_key' => $idempotencyKey,
                    'request_hash' => $requestHash,
                    'total' => $total,
                ]);

                foreach ($preparedItems as $item) {
                    /** @var Menu $menu */
                    $menu = $item['menu'];
                    $order->items()->create([
                        'menu_id' => $menu->getKey(),
                        'menu_name' => $menu->name,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total' => $item['total'],
                    ]);
                }

                $order->payment()->create([
                    'method' => $method->value,
                    'amount' => $total,
                    'status' => $isCash ? PaymentStatus::Paid->value : PaymentStatus::Pending->value,
                    'actor_user_id' => $actor->getKey(),
                    'confirmed_by_user_id' => $isCash ? $actor->getKey() : null,
                    'paid_at' => $isCash ? now() : null,
                ]);

                return [
                    'order' => $order->load(['items', 'payment']),
                    'replayed' => false,
                ];
            });
        } catch (QueryException $exception) {
            $existing = Order::query()
                ->with(['items', 'payment'])
                ->where('business_id', $outlet->business_id)
                ->where('outlet_id', $outlet->getKey())
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($existing === null) {
                throw $exception;
            }

            return $this->replay($existing, $requestHash);
        }
    }

    /**
     * @param  array<int, array{menu_id: int, quantity: int}>  $items
     */
    private function requestHash(array $items, PaymentMethod $method): string
    {
        $normalizedItems = array_map(
            static fn (array $item): array => [
                'menu_id' => (int) $item['menu_id'],
                'quantity' => (int) $item['quantity'],
            ],
            $items,
        );
        usort($normalizedItems, static fn (array $left, array $right): int => $left['menu_id'] <=> $right['menu_id']);

        return hash('sha256', json_encode([
            'items' => $normalizedItems,
            'payment_method' => $method->value,
        ], JSON_THROW_ON_ERROR));
    }

    /**
     * @return array{order: Order, replayed: bool}
     */
    private function replay(Order $order, string $requestHash): array
    {
        if (! hash_equals($order->request_hash, $requestHash)) {
            throw new ConflictHttpException('Idempotency-Key sudah digunakan untuk checkout yang berbeda.');
        }

        return [
            'order' => $order->load(['items', 'payment']),
            'replayed' => true,
        ];
    }
}
