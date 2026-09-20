<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\CreatesTenant;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use CreatesTenant, RefreshDatabase;

    public function test_login_returns_access_and_refresh_token(): void
    {
        ['user' => $user] = $this->createTenantWithOwner();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data' => [
                'access_token', 'refresh_token', 'token_type', 'expires_in',
                'user' => ['id', 'name', 'email'],
                'tenants',
            ]]);
    }

    public function test_login_with_wrong_credentials_is_rejected(): void
    {
        ['user' => $user] = $this->createTenantWithOwner();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'salah',
        ])->assertUnprocessable();
    }

    public function test_me_requires_token(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_me_returns_tenant_context_and_permissions(): void
    {
        ['user' => $user, 'tenant' => $tenant] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.current_tenant', $tenant->id)
            ->assertJsonStructure(['data' => ['tenants', 'permissions']])
            ->assertJsonPath('data.permissions.0', 'tenants.read');
    }

    public function test_refresh_rotates_refresh_token(): void
    {
        ['user' => $user] = $this->createTenantWithOwner();

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $oldRefresh = $login->json('data.refresh_token');

        $refreshed = $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $oldRefresh,
        ])->assertOk();

        $this->assertNotEquals($oldRefresh, $refreshed->json('data.refresh_token'));

        // Refresh token lama sudah ter-revoke → harus ditolak.
        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $oldRefresh,
        ])->assertUnprocessable();
    }

    public function test_logout_revokes_refresh_token(): void
    {
        ['user' => $user] = $this->createTenantWithOwner();
        $token = $this->loginAs($user);

        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $this->withToken($token)->postJson('/api/v1/auth/logout', [
            'refresh_token' => $login->json('data.refresh_token'),
        ])->assertOk();

        $this->postJson('/api/v1/auth/refresh', [
            'refresh_token' => $login->json('data.refresh_token'),
        ])->assertUnprocessable();
    }
}
