<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BusinessController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\MemberController;
use App\Http\Controllers\Api\V1\OutletController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProfileController;
use App\Http\Controllers\Api\V1\RegionController;
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

    // First-party web session auth; mobile keeps the bearer token endpoints above.
    Route::post('/auth/web/register', [AuthController::class, 'webRegister'])
        ->middleware('throttle:6,1')
        ->name('api.v1.auth.web.register');
    Route::post('/auth/web/login', [AuthController::class, 'webLogin'])
        ->middleware('throttle:6,1')
        ->name('api.v1.auth.web.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('api.v1.auth.logout');
        Route::post('/auth/web/logout', [AuthController::class, 'webLogout'])
            ->name('api.v1.auth.web.logout');
        Route::get('/me', ProfileController::class)->name('api.v1.me');

        Route::get('/regions/provinces', [RegionController::class, 'provinces'])
            ->middleware('throttle:60,1')
            ->name('api.v1.regions.provinces');
        Route::get('/regions/regencies/{province}', [RegionController::class, 'regencies'])
            ->where('province', '[0-9.]+')
            ->middleware('throttle:60,1')
            ->name('api.v1.regions.regencies');
        Route::get('/regions/districts/{regency}', [RegionController::class, 'districts'])
            ->where('regency', '[0-9.]+')
            ->middleware('throttle:60,1')
            ->name('api.v1.regions.districts');
        Route::get('/regions/villages/{district}', [RegionController::class, 'villages'])
            ->where('district', '[0-9.]+')
            ->middleware('throttle:60,1')
            ->name('api.v1.regions.villages');

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
        Route::post('/outlets', [OutletController::class, 'store'])
            ->middleware('permission:outlets.create')
            ->name('api.v1.outlets.store');
        Route::get('/outlets/{outlet}', [OutletController::class, 'show'])
            ->middleware('permission:outlets.read')
            ->name('api.v1.outlets.show');
        Route::patch('/outlets/{outlet}', [OutletController::class, 'update'])
            ->middleware('permission:outlets.update')
            ->name('api.v1.outlets.update');
        Route::delete('/outlets/{outlet}', [OutletController::class, 'destroy'])
            ->middleware('permission:outlets.delete')
            ->name('api.v1.outlets.destroy');

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
            ->middleware('permission:members.delete')
            ->name('api.v1.members.destroy');

        Route::get('/roles', [RoleController::class, 'index'])
            ->middleware('permission:members.read')
            ->name('api.v1.roles.index');

        Route::get('/categories', [CategoryController::class, 'index'])
            ->middleware('permission:categories.read')
            ->name('api.v1.categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])
            ->middleware('permission:categories.create')
            ->name('api.v1.categories.store');
        Route::get('/categories/{category}', [CategoryController::class, 'show'])
            ->middleware('permission:categories.read')
            ->name('api.v1.categories.show');
        Route::patch('/categories/{category}', [CategoryController::class, 'update'])
            ->middleware('permission:categories.update')
            ->name('api.v1.categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
            ->middleware('permission:categories.delete')
            ->name('api.v1.categories.destroy');

        Route::get('/products', [ProductController::class, 'index'])
            ->middleware('permission:products.read')
            ->name('api.v1.products.index');
        Route::post('/products', [ProductController::class, 'store'])
            ->middleware('permission:products.create')
            ->name('api.v1.products.store');
        Route::get('/products/{product}', [ProductController::class, 'show'])
            ->middleware('permission:products.read')
            ->name('api.v1.products.show');
        Route::patch('/products/{product}', [ProductController::class, 'update'])
            ->middleware('permission:products.update')
            ->name('api.v1.products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])
            ->middleware('permission:products.delete')
            ->name('api.v1.products.destroy');
    });
});
