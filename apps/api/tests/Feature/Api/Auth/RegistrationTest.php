<?php

namespace Tests\Feature\Api\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_register_and_becomes_authenticated(): void
    {
        $response = $this->withHeader('Origin', 'http://localhost')->postJson('/api/v1/auth/register', [
            'name' => 'Owner Satu',
            'email' => 'Owner@Example.com',
            'password' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.name', 'Owner Satu')
            ->assertJsonPath('data.email', 'owner@example.com')
            ->assertJsonMissingPath('data.password');

        $this->assertDatabaseHas('users', ['email' => 'owner@example.com']);
        $this->assertAuthenticated();
    }

    public function test_email_must_be_unique(): void
    {
        User::factory()->create(['email' => 'ada@example.com']);

        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/auth/register', [
                'name' => 'Duplikat',
                'email' => 'ada@example.com',
                'password' => 'password123',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_password_must_meet_minimum_length(): void
    {
        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/auth/register', [
                'name' => 'Owner',
                'email' => 'owner@example.com',
                'password' => 'short',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    public function test_required_fields_are_validated(): void
    {
        $this->withHeader('Origin', 'http://localhost')
            ->postJson('/api/v1/auth/register', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }
}
