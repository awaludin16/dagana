<?php

namespace Database\Factories;

use App\Domain\Payment\Models\Payment;
use App\Domain\Sales\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'method' => 'cash',
            'amount' => fake()->numberBetween(1000, 100000),
            'status' => 'PENDING',
            'reference' => null,
            'actor_user_id' => User::factory(),
            'confirmed_by_user_id' => null,
            'paid_at' => null,
        ];
    }
}
