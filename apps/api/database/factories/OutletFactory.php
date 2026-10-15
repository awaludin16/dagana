<?php

namespace Database\Factories;

use App\Domain\Organization\Models\Business;
use App\Domain\Outlet\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Outlet>
 */
class OutletFactory extends Factory
{
    protected $model = Outlet::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->city().' Outlet',
            'address' => fake()->address(),
            'timezone' => 'Asia/Jakarta',
            'status' => Outlet::STATUS_ACTIVE,
        ];
    }
}
