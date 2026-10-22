<?php

namespace Database\Factories;

use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Menu;
use App\Domain\Organization\Models\Business;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Menu>
 */
class MenuFactory extends Factory
{
    protected $model = Menu::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'business_id' => Business::factory(),
            'category_id' => null,
            'name' => fake()->unique()->words(2, true),
            'price' => fake()->numberBetween(1000, 100000),
            'status' => Menu::STATUS_ACTIVE,
            'is_available' => true,
        ];
    }

    public function inCategory(Category $category): static
    {
        return $this->state(fn (): array => [
            'business_id' => $category->business_id,
            'category_id' => $category->getKey(),
        ]);
    }
}
