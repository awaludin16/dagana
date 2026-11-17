<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Alur lupa password (keputusan email 2026-11-18): respons lupa password
 * enumerasi-selamat, reset mencabut semua token, tautan mengarah ke halaman
 * admin-web.
 */
class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_response_is_enumeration_safe(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'ada@example.com']);

        $registered = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'ada@example.com']);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'tidakada@example.com']);

        $registered->assertOk();
        $unknown->assertOk();
        $this->assertSame(
            $registered->json('message'),
            $unknown->json('message'),
            'Respons untuk email terdaftar dan tidak terdaftar harus identik.',
        );

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_forgot_password_is_throttled_per_email(): void
    {
        Notification::fake();
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertOk();

        // Broker throttle 60 detik per email: permintaan kedua tidak mengirim ulang.
        Notification::assertSentTimes(ResetPasswordNotification::class, 1);
    }

    public function test_password_can_be_reset_and_all_tokens_are_revoked(): void
    {
        $user = User::factory()->create(['password' => Hash::make('passwordlama')]);
        Sanctum::actingAs($user);
        $oldTokenId = $user->currentAccessToken()->id;
        $resetToken = Password::createToken($user);
        $userId = $user->id;

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => $resetToken,
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ])->assertOk();

        $user = User::query()->findOrFail($userId);

        $this->assertTrue(Hash::check('passwordbaru123', $user->password));
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $oldTokenId]);

        // Login dengan password lama gagal; dengan password baru berhasil.
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'passwordlama',
        ])->assertUnprocessable();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'passwordbaru123',
        ])->assertOk();
    }

    public function test_invalid_reset_token_is_rejected(): void
    {
        $user = User::factory()->create(['password' => Hash::make('passwordlama')]);

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => $user->email,
            'token' => 'token-palsu',
            'password' => 'passwordbaru123',
            'password_confirmation' => 'passwordbaru123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $user->refresh();

        $this->assertTrue(Hash::check('passwordlama', $user->password));
        $this->assertSame(0, $user->tokens()->count());
    }
}
