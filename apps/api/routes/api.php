<?php

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\BusinessController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\OutletController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

/*
|--------------------------------------------------------------------------
| Authentication (SPA session cookie)
|--------------------------------------------------------------------------
|
| Register and login are throttled to slow credential stuffing. The SPA
| obtains a CSRF cookie from GET /sanctum/csrf-cookie before posting.
|
*/
Route::post('/auth/register', RegisterController::class)->middleware('throttle:6,1');
Route::post('/auth/login', LoginController::class)->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/auth/logout', LogoutController::class);
    Route::get('/me', MeController::class);

    Route::get('/businesses', [BusinessController::class, 'index']);
    Route::post('/businesses', [BusinessController::class, 'store']);
    Route::get('/businesses/{business}', [BusinessController::class, 'show']);
    Route::patch('/businesses/{business}', [BusinessController::class, 'update']);

    Route::get('/businesses/{business}/outlets', [OutletController::class, 'index']);
    Route::post('/businesses/{business}/outlets', [OutletController::class, 'store']);

    Route::get('/outlets/{outlet}', [OutletController::class, 'show']);
    Route::patch('/outlets/{outlet}', [OutletController::class, 'update']);
});
