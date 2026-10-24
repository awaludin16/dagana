<?php

namespace Database\Factories;

use App\Domain\Organization\Models\Business;
use App\Domain\Outlet\Models\Outlet;
use App\Domain\Sales\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $business = Business::factory();

        return [
            'business_id' => $business,
            'outlet_id' => Outlet::factory()->for($business),
            'actor_user_id' => User::factory(),
            'source' => 'POS',
            'status' => 'PENDING_PAYMENT',
            'idempotency_key' => fake()->uuid(),
            'request_hash' => hash('sha256', fake()->uuid()),
            'total' => fake()->numberBetween(1000, 100000),
        ];
    }
}
