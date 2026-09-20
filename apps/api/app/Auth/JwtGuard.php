<?php

namespace App\Auth;

use App\Models\UserSession;
use App\Services\JwtService;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Http\Request;

/**
 * Custom JWT Guard untuk Laravel (didaftarkan via Auth::extend('jwt')).
 *
 * - Access token (JWT HS256) dibaca dari header Authorization Bearer.
 * - Verifikasi token + status user ACTIVE.
 * - Verifikasi sesi (jti) masih valid & belum di-revoke → logout/refresh
 *   langsung mematikan akses berikutnya.
 */
class JwtGuard implements Guard
{
    protected ?Authenticatable $user = null;

    public function __construct(
        protected UserProvider $provider,
        protected Request $request,
    ) {}

    public function user(): ?Authenticatable
    {
        if ($this->user !== null) {
            return $this->user;
        }

        $token = $this->getTokenForRequest();

        if ($token === null) {
            return null;
        }

        $payload = app(JwtService::class)->parse($token);

        if ($payload === null) {
            return null;
        }

        $user = $this->provider->retrieveById($payload['sub'] ?? null);

        if (! $user || $user->status !== 'ACTIVE') {
            return null;
        }

        // Sesi (jti) harus valid: ada, belum di-revoke, belum kedaluwarsa.
        $session = UserSession::find($payload['jti'] ?? null);

        if (! $session || $session->revoked || $session->expires_at->isPast()) {
            return null;
        }

        // Simpan payload agar middleware tenant/permission dapat membacanya.
        $this->request->attributes->set('jwt_payload', $payload);

        return $this->user = $user;
    }

    public function check(): bool
    {
        return $this->user() !== null;
    }

    public function guest(): bool
    {
        return ! $this->check();
    }

    public function id(): ?string
    {
        return $this->user()?->getAuthIdentifier();
    }

    public function setUser(Authenticatable $user): void
    {
        $this->user = $user;
    }

    public function hasUser(): bool
    {
        return $this->user !== null;
    }

    /**
     * Disebut otomatis oleh container ketika binding 'request' diperbarui
     * (lihat AppServiceProvider → Auth::extend('jwt')). Meyakinkan guard
     * tidak me-memoize user/request dari request sebelumnya.
     */
    public function setRequest(Request $request): static
    {
        $this->request = $request;
        $this->user = null;

        return $this;
    }

    public function validate(array $credentials = []): bool
    {
        return false;
    }

    public function attempt(array $credentials = []): bool
    {
        return false;
    }

    protected function getTokenForRequest(): ?string
    {
        return $this->request->bearerToken();
    }
}
