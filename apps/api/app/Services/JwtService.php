<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Mengeluarkan & memverifikasi access token JWT (HS256).
 *
 * @see docs/Authentication-RBAC.md
 */
class JwtService
{
    public function issue(array $claims, int $ttlSeconds): string
    {
        $now = time();

        $payload = array_merge([
            'iss' => config('app.url'),
            'iat' => $now,
            'exp' => $now + $ttlSeconds,
        ], $claims);

        return JWT::encode($payload, $this->secret(), 'HS256');
    }

    /**
     * Mengembalikan claims, atau null bila token tidak valid / kedaluwarsa.
     */
    public function parse(string $token): ?array
    {
        try {
            return (array) JWT::decode($token, new Key($this->secret(), 'HS256'));
        } catch (\Throwable) {
            return null;
        }
    }

    protected function secret(): string
    {
        return (string) config('auth.jwt_secret');
    }
}
