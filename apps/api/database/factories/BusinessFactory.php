<?php

namespace Database\Factories;

use App\Domain\Organization\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Business>
 */
class BusinessFactory extends Factory
{
    protected $model = Business::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'timezone' => 'Asia/Jakarta',
            'currency' => 'IDR',
            'status' => Business::STATUS_ACTIVE,
        ];
    }
}
