<?php

namespace Tests\Feature\Api;

use App\Domain\Authorization\Enums\PermissionEffect;
use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Menu;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Outlet\Models\Outlet;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_manage_categories_and_menus(): void
    {
        [$owner, $business] = $this->ownerForNewBusiness();

        $categoryResponse = $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/categories", ['name' => '  Minuman  '])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Minuman')
            ->assertJsonPath('data.status', Category::STATUS_ACTIVE);

        $categoryId = $categoryResponse->json('data.id');
        $this->getJson("/api/v1/businesses/{$business->id}/categories/{$categoryId}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Minuman');
        $this->patchJson("/api/v1/businesses/{$business->id}/categories/{$categoryId}", [
            'name' => 'Minuman Dingin',
        ])->assertOk()->assertJsonPath('data.name', 'Minuman Dingin');

        $menuResponse = $this->postJson("/api/v1/businesses/{$business->id}/menus", [
            'name' => 'Kopi Susu',
            'price' => 18000,
            'category_id' => $categoryId,
        ])
            ->assertCreated()
            ->assertJsonPath('data.price', 18000)
            ->assertJsonPath('data.category.name', 'Minuman Dingin')
            ->assertJsonPath('data.is_available', true);

        $menuId = $menuResponse->json('data.id');
        $this->getJson("/api/v1/businesses/{$business->id}/menus/{$menuId}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Kopi Susu');

        $this->patchJson("/api/v1/businesses/{$business->id}/menus/{$menuId}", [
            'name' => 'Kopi Susu Gula Aren',
            'price' => 20000,
            'is_available' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Kopi Susu Gula Aren')
            ->assertJsonPath('data.price', 20000)
            ->assertJsonPath('data.is_available', false);
        $this->getJson("/api/v1/businesses/{$business->id}/menus?search=KOPI&status=all")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->postJson("/api/v1/businesses/{$business->id}/menus/{$menuId}/disable")
            ->assertOk()
            ->assertJsonPath('data.status', Menu::STATUS_DISABLED);
        $this->postJson("/api/v1/businesses/{$business->id}/menus/{$menuId}/enable")
            ->assertOk()
            ->assertJsonPath('data.status', Menu::STATUS_ACTIVE);
        $this->postJson("/api/v1/businesses/{$business->id}/categories/{$categoryId}/disable")
            ->assertOk()
            ->assertJsonPath('data.status', Category::STATUS_DISABLED);
        $this->postJson("/api/v1/businesses/{$business->id}/categories/{$categoryId}/enable")
            ->assertOk()
            ->assertJsonPath('data.status', Category::STATUS_ACTIVE);
    }

    public function test_invalid_catalog_input_does_not_mutate_existing_menu(): void
    {
        [$owner, $business] = $this->ownerForNewBusiness();
        $menu = Menu::factory()->for($business)->create(['price' => 18000, 'name' => 'Americano']);

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/menus", [
                'name' => '',
                'price' => 0,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'price']);

        $this->patchJson("/api/v1/businesses/{$business->id}/menus/{$menu->id}", [
            'price' => '18000.50',
        ])->assertUnprocessable()->assertJsonValidationErrors('price');

        $this->assertSame('Americano', $menu->fresh()->name);
        $this->assertSame(18000, $menu->fresh()->price);
    }

    public function test_category_from_another_business_cannot_be_attached_to_menu(): void
    {
        [$owner, $business] = $this->ownerForNewBusiness();
        $otherBusiness = Business::factory()->create();
        $foreignCategory = Category::factory()->for($otherBusiness)->create();

        $this->actingAs($owner)
            ->postJson("/api/v1/businesses/{$business->id}/menus", [
                'name' => 'Menu',
                'price' => 12000,
                'category_id' => $foreignCategory->id,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('category_id');

        $this->assertDatabaseMissing('menus', ['business_id' => $business->id, 'name' => 'Menu']);
    }

    public function test_database_rejects_a_menu_category_from_another_business(): void
    {
        $business = Business::factory()->create();
        $otherBusiness = Business::factory()->create();
        $foreignCategory = Category::factory()->for($otherBusiness)->create();

        $this->expectException(QueryException::class);
        Menu::factory()->for($business)->create(['category_id' => $foreignCategory->id]);
    }

    public function test_catalog_reads_and_mutations_are_isolated_between_businesses(): void
    {
        [$owner, $business] = $this->ownerForNewBusiness();
        $foreignBusiness = Business::factory()->create();
        $foreignCategory = Category::factory()->for($foreignBusiness)->create();
        $foreignMenu = Menu::factory()->for($foreignBusiness)->create();
        $originalMenuName = $foreignMenu->name;

        $this->actingAs($owner)
            ->getJson("/api/v1/businesses/{$business->id}/categories")
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->getJson("/api/v1/businesses/{$business->id}/menus/{$foreignMenu->id}")
            ->assertNotFound();
        $this->patchJson("/api/v1/businesses/{$business->id}/menus/{$foreignMenu->id}", [
            'price' => 1,
        ])->assertNotFound();
        $this->patchJson("/api/v1/businesses/{$business->id}/categories/{$foreignCategory->id}", [
            'name' => 'Changed',
        ])->assertNotFound();

        $this->assertSame($originalMenuName, $foreignMenu->fresh()->name);
        $this->assertNotSame('Changed', $foreignCategory->fresh()->name);
    }

    public function test_user_without_catalog_permission_cannot_read_or_create_catalog(): void
    {
        $business = Business::factory()->create();
        $outlet = Outlet::factory()->for($business)->create();
        $kitchen = User::factory()->create();
        $membership = Membership::factory()
            ->forBusiness($business)
            ->forUser($kitchen)
            ->role(RolePreset::Kitchen)
            ->create();
        $membership->outlets()->attach($outlet);
        $membership->permissionOverrides()->create([
            'permission' => 'products.read',
            'effect' => PermissionEffect::Deny,
        ]);

        $this->actingAs($kitchen)
            ->getJson("/api/v1/businesses/{$business->id}/menus")
            ->assertForbidden();
        $this->postJson("/api/v1/businesses/{$business->id}/menus", [
            'name' => 'Blocked',
            'price' => 5000,
        ])->assertForbidden();
    }

    public function test_pos_catalog_only_lists_active_available_items_for_authorized_outlet(): void
    {
        [$owner, $business] = $this->ownerForNewBusiness();
        $outlet = Outlet::factory()->for($business)->create();
        $visible = Menu::factory()->for($business)->create(['name' => 'Ready']);
        Menu::factory()->for($business)->create(['name' => 'Unavailable', 'is_available' => false]);
        Menu::factory()->for($business)->create(['name' => 'Disabled', 'status' => Menu::STATUS_DISABLED]);
        $activeCategory = Category::factory()->for($business)->create(['name' => 'Makanan']);
        Category::factory()->for($business)->create([
            'name' => 'Nonaktif',
            'status' => Category::STATUS_DISABLED,
        ]);

        $this->actingAs($owner)
            ->getJson("/api/v1/outlets/{$outlet->id}/menus")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $visible->id);
        $this->getJson("/api/v1/outlets/{$outlet->id}/categories")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $activeCategory->id);

        $this->postJson("/api/v1/outlets/{$outlet->id}/disable")->assertOk();
        $this->getJson("/api/v1/outlets/{$outlet->id}/menus")->assertNotFound();
    }

    public function test_pos_catalog_rejects_outlets_outside_members_access(): void
    {
        $business = Business::factory()->create();
        $outlet = Outlet::factory()->for($business)->create();
        $staff = User::factory()->create();
        Membership::factory()
            ->forBusiness($business)
            ->forUser($staff)
            ->role(RolePreset::Staff)
            ->create();

        $this->actingAs($staff)
            ->getJson("/api/v1/outlets/{$outlet->id}/menus")
            ->assertNotFound();
    }

    public function test_catalog_lists_are_paginated_and_limit_page_size(): void
    {
        [$owner, $business] = $this->ownerForNewBusiness();
        Menu::factory()->for($business)->count(3)->create();

        $this->actingAs($owner)
            ->getJson("/api/v1/businesses/{$business->id}/menus?per_page=2")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.per_page', 2);

        $this->getJson("/api/v1/businesses/{$business->id}/menus?per_page=101")
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');
    }

    /**
     * @return array{User, Business}
     */
    private function ownerForNewBusiness(): array
    {
        $owner = User::factory()->create();
        $business = Business::factory()->create();
        Membership::factory()
            ->forBusiness($business)
            ->forUser($owner)
            ->role(RolePreset::Owner)
            ->create();

        return [$owner, $business];
    }
}
