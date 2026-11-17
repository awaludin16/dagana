<?php

namespace Tests\Feature\Api\V1;

use App\Models\Business;
use App\Models\BusinessMembership;
use App\Models\Outlet;
use App\Models\User;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Verifikasi email (keputusan email 2026-11-18): akun self-register (Owner)
 * wajib verifikasi sebelum mengakses layanan bisnis; akun yang dibuat Owner
 * langsung terverifikasi. Login tidak diblokir.
 */
class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_sends_verification_and_business_apis_stay_locked(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Owner Baru',
            'email' => 'ownerbaru@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::query()->where('email', 'ownerbaru@example.com')->sole();

        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, VerifyEmailNotification::class);

        // Layanan bisnis terkunci sampai verifikasi (via token API).
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/businesses', [
            'business' => ['name' => 'Kedai Baru'],
            'outlet' => ['name' => 'Outlet Pusat', 'phone' => '081298765432'],
        ])->assertForbidden();
    }

    public function test_owner_can_verify_email_via_signed_link_and_unlock_business(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Owner Baru',
            'email' => 'ownerbaru@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::query()->where('email', 'ownerbaru@example.com')->sole();
        $userId = $user->id;

        // Simulasi tautan yang dibangun VerifyEmailNotification: URL bertanda
        // tangan ke endpoint API, parameternya diteruskan SPA.
        $signed = URL::temporarySignedRoute(
            'api.v1.auth.email.verify',
            now()->addMinutes(60),
            ['id' => $userId, 'hash' => sha1($user->getEmailForVerification())],
        );
        $path = parse_url($signed, PHP_URL_PATH).'?'.parse_url($signed, PHP_URL_QUERY);

        $this->getJson($path)->assertOk();

        $this->assertTrue((bool) User::query()->findOrFail($userId)->email_verified_at);

        // Layanan bisnis terbuka: onboarding berhasil setelah verifikasi.
        Sanctum::actingAs(User::query()->findOrFail($userId));

        $this->postJson('/api/v1/businesses', [
            'business' => ['name' => 'Kedai Baru'],
            'outlet' => [
                'name' => 'Outlet Pusat',
                'phone' => '081298765432',
                'address' => [
                    'street' => 'Jl. Merdeka No. 1',
                    'village' => 'Kelurahan Menteng',
                    'district' => 'Kecamatan Menteng',
                    'regency' => 'Jakarta Pusat',
                    'province' => 'DKI JAKARTA',
                    'postal_code' => '10310',
                ],
            ],
        ])->assertCreated();

        $this->postJson('/api/v1/auth/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('message', 'Email Anda sudah terverifikasi.');
    }

    public function test_verification_link_carries_all_signature_params(): void
    {
        $user = User::factory()->unverified()->create();
        $notification = new VerifyEmailNotification;

        $method = new \ReflectionMethod($notification, 'verificationUrl');
        $url = $method->invoke($notification, $user);

        $this->assertStringContainsString('/verify-email?', $url);
        $this->assertStringContainsString("id={$user->id}", $url);
        $this->assertStringContainsString('hash='.sha1($user->getEmailForVerification()), $url);
        $this->assertStringContainsString('expires=', $url);
        $this->assertStringContainsString('signature=', $url);
    }

    public function test_verification_link_with_wrong_hash_is_rejected(): void
    {
        Notification::fake();

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Owner Baru',
            'email' => 'ownerbaru@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $user = User::query()->where('email', 'ownerbaru@example.com')->sole();

        $signed = URL::temporarySignedRoute(
            'api.v1.auth.email.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('bukan-email-yang-dimaksud@example.com')],
        );
        $path = parse_url($signed, PHP_URL_PATH).'?'.parse_url($signed, PHP_URL_QUERY);

        $this->getJson($path)->assertUnprocessable();

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_expired_verification_link_is_rejected(): void
    {
        $user = User::factory()->unverified()->create();

        $signed = URL::temporarySignedRoute(
            'api.v1.auth.email.verify',
            now()->subMinutes(5),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );
        $path = parse_url($signed, PHP_URL_PATH).'?'.parse_url($signed, PHP_URL_QUERY);

        $this->getJson($path)->assertForbidden();

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_resend_verification_is_throttled(): void
    {
        $user = User::factory()->unverified()->create();
        Notification::fake();

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/email/verification-notification')
            ->assertOk()
            ->assertJsonPath('message', 'Tautan verifikasi baru telah dikirim ke email Anda.');

        // Endpoint pakai throttle:6,1 — spam beruntun harus berhenti di 429.
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/v1/auth/email/verification-notification');
        }

        $this->postJson('/api/v1/auth/email/verification-notification')->assertTooManyRequests();
    }

    public function test_member_created_by_owner_is_verified_automatically(): void
    {
        [$owner, $business, $outlet] = $this->merchant();

        Sanctum::actingAs($owner);

        $this->postJson('/api/v1/members', [
            'name' => 'Kasir Baru',
            'email' => 'kasirbaru@example.com',
            'password' => 'password123',
            'role' => BusinessMembership::ROLE_CASHIER,
            'outlet_ids' => [$outlet->id],
        ])->assertCreated();

        $employee = User::query()->where('email', 'kasirbaru@example.com')->sole();

        $this->assertNotNull($employee->email_verified_at);
    }

    /**
     * @return array{User, Business, Outlet}
     */
    private function merchant(): array
    {
        $owner = User::factory()->create();
        $membership = BusinessMembership::factory()->for($owner)->create();
        $outlet = Outlet::factory()->for($membership->business)->create();

        return [$owner, $membership->business, $outlet];
    }

    /**
     * Sesi web SPA (stateful) memerlukan Origin dari SANCTUM_STATEFUL_DOMAINS.
     *
     * @return array<string, string>
     */
    private function webSessionHeaders(): array
    {
        return ['Origin' => 'http://localhost:5173'];
    }
}
