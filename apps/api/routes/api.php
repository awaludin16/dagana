<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BusinessController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\OutletController;
use App\Http\Controllers\Api\V1\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class)->name('api.v1.health');

    Route::post('/auth/register', [AuthController::class, 'register'])
        ->middleware('throttle:6,1')
        ->name('api.v1.auth.register');
    Route::post('/auth/login', [AuthController::class, 'login'])
        ->middleware('throttle:6,1')
        ->name('api.v1.auth.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
        Route::get('/me', ProfileController::class)->name('api.v1.me');

        Route::post('/businesses', [BusinessController::class, 'store'])->name('api.v1.businesses.store');
        Route::get('/businesses/{business}', [BusinessController::class, 'show'])->name('api.v1.businesses.show');
        Route::patch('/businesses/{business}', [BusinessController::class, 'update'])->name('api.v1.businesses.update');

        Route::get('/outlets', [OutletController::class, 'index'])->name('api.v1.outlets.index');
        Route::get('/outlets/{outlet}', [OutletController::class, 'show'])->name('api.v1.outlets.show');
        Route::patch('/outlets/{outlet}', [OutletController::class, 'update'])->name('api.v1.outlets.update');
    });
});
