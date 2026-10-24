<?php

namespace Database\Factories;

use App\Domain\Sales\Models\Order;
use App\Domain\Sales\Models\OrderItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 10);
        $unitPrice = fake()->numberBetween(1000, 100000);

        return [
            'order_id' => Order::factory(),
            'menu_id' => null,
            'menu_name' => fake()->words(2, true),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total' => $quantity * $unitPrice,
        ];
    }
}
