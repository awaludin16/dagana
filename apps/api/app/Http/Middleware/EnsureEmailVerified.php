<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Bisnis hanya untuk akun dengan email terverifikasi. Self-register (Owner)
 * memverifikasi lewat tautan email; akun yang dibuat Owner otomatis
 * terverifikasi saat dibuat (keputusan email 2026-11-18).
 */
class EnsureEmailVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        self::assertVerified($request->user());

        return $next($request);
    }

    public static function assertVerified(?User $user): void
    {
        if ($user && ! $user->hasVerifiedEmail()) {
            throw new AuthorizationException('Verifikasi email Anda untuk mengakses layanan bisnis. Buka tautan verifikasi yang dikirim ke email Anda.');
        }
    }
}
