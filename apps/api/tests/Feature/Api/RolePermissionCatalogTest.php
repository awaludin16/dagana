<?php

namespace Tests\Feature\Api;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\RolePreset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_list_role_presets(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/roles');

        $response->assertOk()->assertJsonCount(count(RolePreset::cases()), 'data');

        $values = collect($response->json('data'))->pluck('value');

        foreach (RolePreset::cases() as $role) {
            $this->assertTrue($values->contains($role->value));
        }

        $owner = collect($response->json('data'))->firstWhere('value', RolePreset::Owner->value);

        $this->assertTrue($owner['business_wide_outlet_access']);
        $this->assertEqualsCanonicalizing(Permission::values(), $owner['permissions']);
    }

    public function test_authenticated_user_can_list_permission_catalog(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/permissions');

        $response->assertOk()->assertJsonCount(count(Permission::cases()), 'data');

        $values = collect($response->json('data'))->pluck('value');

        foreach (Permission::cases() as $permission) {
            $this->assertTrue($values->contains($permission->value));
        }
    }

    public function test_guest_cannot_list_catalogs(): void
    {
        $this->getJson('/api/v1/roles')->assertUnauthorized();
        $this->getJson('/api/v1/permissions')->assertUnauthorized();
    }
}
