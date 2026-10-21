<?php

use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\BusinessController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\MemberInvitationController;
use App\Http\Controllers\Api\V1\MembershipController;
use App\Http\Controllers\Api\V1\OutletController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RoleController;
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
    Route::post('/outlets/{outlet}/disable', [OutletController::class, 'disable']);
    Route::post('/outlets/{outlet}/enable', [OutletController::class, 'enable']);

    // Role preset and permission catalogs for employee assignment UI.
    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/permissions', [PermissionController::class, 'index']);

    // Employee (membership) management; {membership} is scoped to {business}.
    Route::get('/businesses/{business}/members', [MembershipController::class, 'index']);
    Route::get('/businesses/{business}/invitations', [MemberInvitationController::class, 'index']);
    Route::post('/businesses/{business}/invitations', [MemberInvitationController::class, 'store'])
        ->middleware('throttle:10,1');
    Route::post('/businesses/{business}/invitations/{invitation}/resend', [MemberInvitationController::class, 'resend'])
        ->scopeBindings()
        ->middleware('throttle:10,1');
    Route::post('/businesses/{business}/invitations/{invitation}/cancel', [MemberInvitationController::class, 'cancel'])
        ->scopeBindings();
    Route::post('/invitations/accept', [MemberInvitationController::class, 'accept'])
        ->middleware('throttle:10,1');
    Route::patch('/businesses/{business}/members/{membership}', [MembershipController::class, 'update'])
        ->scopeBindings();
    Route::post('/businesses/{business}/members/{membership}/disable', [MembershipController::class, 'disable'])
        ->scopeBindings();
    Route::post('/businesses/{business}/members/{membership}/enable', [MembershipController::class, 'enable'])
        ->scopeBindings();
});
