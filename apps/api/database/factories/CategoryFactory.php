<?php

namespace Database\Factories;

use App\Domain\Catalog\Models\Category;
use App\Domain\Organization\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'name' => fake()->unique()->words(2, true),
            'status' => Category::STATUS_ACTIVE,
        ];
    }
}
