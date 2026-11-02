<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BusinessController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MemberController;
use App\Http\Controllers\Api\V1\OutletController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RoleController;
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

        // Available before onboarding so a user without a membership can create one.
        Route::post('/businesses', [BusinessController::class, 'store'])->name('api.v1.businesses.store');

        Route::get('/businesses/{business}', [BusinessController::class, 'show'])
            ->middleware('permission:business.read')
            ->name('api.v1.businesses.show');
        Route::patch('/businesses/{business}', [BusinessController::class, 'update'])
            ->middleware('permission:business.update')
            ->name('api.v1.businesses.update');

        Route::get('/outlets', [OutletController::class, 'index'])
            ->middleware('permission:outlets.read')
            ->name('api.v1.outlets.index');
        Route::get('/outlets/{outlet}', [OutletController::class, 'show'])
            ->middleware('permission:outlets.read')
            ->name('api.v1.outlets.show');
        Route::patch('/outlets/{outlet}', [OutletController::class, 'update'])
            ->middleware('permission:outlets.update')
            ->name('api.v1.outlets.update');

        Route::get('/members', [MemberController::class, 'index'])
            ->middleware('permission:members.read')
            ->name('api.v1.members.index');
        Route::post('/members', [MemberController::class, 'store'])
            ->middleware('permission:members.invite')
            ->name('api.v1.members.store');
        Route::patch('/members/{membership}', [MemberController::class, 'update'])
            ->middleware('permission:members.update')
            ->name('api.v1.members.update');
        Route::delete('/members/{membership}', [MemberController::class, 'destroy'])
            ->middleware('permission:members.remove')
            ->name('api.v1.members.destroy');

        Route::get('/roles', [RoleController::class, 'index'])
            ->middleware('permission:members.read')
            ->name('api.v1.roles.index');
    });
});
