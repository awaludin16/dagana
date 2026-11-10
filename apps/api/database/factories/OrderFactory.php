<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Order;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'outlet_id' => Outlet::factory(),
            'membership_id' => BusinessMembership::factory(),
            'source' => Order::SOURCE_POS,
            'status' => Order::STATUS_PENDING,
            'total_amount' => fake()->numberBetween(10_000, 500_000),
            'idempotency_key' => fake()->unique()->uuid(),
            'notes' => null,
        ];
    }
}
