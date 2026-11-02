<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_use_the_issued_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Budi',
            'email' => 'Budi@Example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user.name', 'Budi')
            ->assertJsonPath('data.user.email', 'budi@example.com')
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonStructure(['data' => ['token', 'user' => ['id', 'name', 'email', 'email_verified_at']]]);

        $this->assertDatabaseCount('users', 1);
        $this->assertTrue(Hash::check('password123', User::firstOrFail()->password));

        $token = $response->json('data.token');

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'budi@example.com');
    }

    public function test_invalid_registration_creates_no_user(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);

        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_duplicate_email_is_rejected_case_insensitively(): void
    {
        User::factory()->create(['email' => 'budi@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Budi Lain',
            'email' => 'BUDI@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'BUDI@example.com',
            'password' => 'password123',
            'device_name' => 'pos-mobile',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.email', 'budi@example.com')
            ->assertJsonMissingPath('data.user.password')
            ->assertJsonStructure(['data' => ['token']]);

        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'name' => 'pos-mobile',
        ]);
    }

    public function test_login_with_invalid_credentials_is_rejected_without_issuing_a_token(): void
    {
        User::factory()->create([
            'email' => 'budi@example.com',
            'password' => Hash::make('password123'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'budi@example.com',
            'password' => 'wrong-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_logout_revokes_only_the_current_token(): void
    {
        $user = User::factory()->create();

        $firstToken = $user->createToken('first')->plainTextToken;
        $secondToken = $user->createToken('second')->plainTextToken;

        $this->withToken($firstToken)
            ->postJson('/api/v1/auth/logout')
            ->assertNoContent();

        // Requests share the test application instance, so clear the cached guard
        // before proving that the deleted token can no longer authenticate.
        Auth::forgetGuards();

        $this->withToken($firstToken)->getJson('/api/v1/me')->assertUnauthorized();
        $this->withToken($secondToken)->getJson('/api/v1/me')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_profile_returns_only_safe_user_fields(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.remember_token')
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email', 'email_verified_at', 'created_at', 'updated_at'],
            ]);
    }

    public function test_protected_endpoints_require_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
        $this->getJson('/api/v1/businesses/1')->assertUnauthorized();
        $this->postJson('/api/v1/businesses', [])->assertUnauthorized();
        $this->postJson('/api/v1/auth/logout')->assertUnauthorized();
    }
}
