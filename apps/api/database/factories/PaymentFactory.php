<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Outlet;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => null,
            'business_id' => Business::factory(),
            'outlet_id' => Outlet::factory(),
            'membership_id' => BusinessMembership::factory(),
            'method' => Payment::METHOD_CASH,
            'status' => Payment::STATUS_PAID,
            'amount' => fake()->numberBetween(10_000, 500_000),
            'reference' => null,
            'paid_at' => now(),
        ];
    }
}
