<?php

use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\ForceJsonResponse;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->statefulApi();

        $middleware->redirectGuestsTo(
            fn (Request $request) => $request->is('api/*')
                ? null
                : route('login'),
        );

        $middleware->prepend(ForceJsonResponse::class);

        $middleware->alias([
            'permission' => EnsurePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(
            function (AuthenticationException $exception, Request $request) {
                if ($request->is('api/*')) {
                    return response()->json([
                        'message' => $exception->getMessage(),
                    ], 401);
                }

                return null;
            },
        );

        // Jangan pernah bocorkan SQL/detail database ke client, termasuk di
        // mode debug. Domain guard mengembalikan 422 sebelum sampai di sini.
        $exceptions->render(
            function (QueryException $exception, Request $request) {
                if ($request->is('api/*')) {
                    report($exception);

                    return response()->json([
                        'message' => 'Layanan sedang mengalami gangguan. Silakan coba lagi.',
                    ], 500);
                }

                return null;
            },
        );
    })
    ->create();
