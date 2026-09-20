<?php

use App\Http\Middleware\OutletScope;
use App\Http\Middleware\PermissionMiddleware;
use App\Http\Middleware\TenantScope;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'tenant' => TenantScope::class,
            'outlet' => OutletScope::class,
            'permission' => PermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Permissions/authorization yang ditolak backend → respons JSON konsisten.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['error' => [
                    'code' => 'UNAUTHENTICATED',
                    'message' => 'Token tidak valid atau belum login.',
                ]], 401);
            }

            return null;
        });

        $exceptions->render(function (HttpException $e, Request $request) {
            if ($request->is('api/*') && in_array($e->getStatusCode(), [403, 404, 422, 429])) {
                return response()->json(['error' => [
                    'code' => match ($e->getStatusCode()) {
                        403 => 'FORBIDDEN',
                        404 => 'NOT_FOUND',
                        422 => 'UNPROCESSABLE',
                        429 => 'TOO_MANY_REQUESTS',
                        default => 'ERROR',
                    },
                    'message' => $e->getMessage() ?: 'Akses ditolak.',
                ]], $e->getStatusCode());
            }

            return null;
        });
    })->create();
