<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'product_id' => null,
            'product_name' => fake()->words(2, true),
            'product_price' => fake()->numberBetween(5_000, 50_000),
            'quantity' => fake()->numberBetween(1, 5),
            'total' => fake()->numberBetween(5_000, 250_000),
        ];
    }
}
