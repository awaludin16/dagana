<?php

namespace App\Providers;

use App\Auth\JwtGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Daftarkan guard kustom 'jwt' (dipakai config/auth.php → guards.api).
        // `refresh('request')` membuat guard tetap sinkron dengan request
        // aktif (setiap aplikasi handle request baru), mengikuti pola yang
        // sama dengan TokenGuard bawaan Laravel.
        Auth::extend('jwt', function ($app, $name, array $config) {
            $guard = new JwtGuard(
                Auth::createUserProvider($config['provider']),
                $app['request'],
            );

            $app->refresh('request', $guard, 'setRequest');

            return $guard;
        });
    }
}
