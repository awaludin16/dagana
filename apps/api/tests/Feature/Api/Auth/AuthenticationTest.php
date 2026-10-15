<?php

namespace Tests\Feature\Api\Auth;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_log_in_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'owner@example.com',
            'password' => 'password123',
        ]);

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/auth/login', [
                'email' => 'owner@example.com',
                'password' => 'password123',
            ])
            ->assertOk()
            ->assertJsonPath('data.id', $user->id);

        $this->assertAuthenticated();
    }

    public function test_login_fails_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'owner@example.com',
            'password' => 'password123',
        ]);

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/auth/login', [
                'email' => 'owner@example.com',
                'password' => 'salah-password',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_authenticated_user_can_log_out(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/auth/logout')
            ->assertNoContent();

        $this->assertGuest('web');
    }

    public function test_guest_cannot_access_protected_routes(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->getJson('/api/v1/businesses')->assertUnauthorized();
    }

    public function test_me_returns_profile_with_memberships(): void
    {
        $user = User::factory()->create();
        $business = Business::factory()->create();
        Membership::factory()
            ->forBusiness($business)
            ->forUser($user)
            ->role(RolePreset::Owner)
            ->create();

        $this->actingAs($user)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonPath('data.memberships.0.role', 'owner')
            ->assertJsonPath('data.memberships.0.business.id', $business->id)
            ->assertJsonPath('data.memberships.0.permissions.0', 'products.read');
    }
}
