<?php

namespace Database\Factories;

use App\Models\Business;
use App\Models\InventoryItem;
use App\Models\Outlet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryItem>
 */
class InventoryItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'outlet_id' => Outlet::factory(),
            'name' => fake()->unique()->words(2, true),
            'unit' => 'pcs',
            'low_stock_threshold' => null,
            'is_active' => true,
        ];
    }
}
