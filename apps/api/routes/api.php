<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\OutletController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TenantController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes --- /api/v1 (Phase 0 baseline)
|--------------------------------------------------------------------------
|
| Contract lengkap: docs/API-Specification.md
|
*/

Route::prefix('v1')->group(function () {

    // ─── Auth (publik) ───────────────────────────────────────────────────
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // ─── Auth (perlu token) ──────────────────────────────────────────────
    Route::middleware('auth:api')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/switch-tenant', [AuthController::class, 'switchTenant']);
        Route::get('/auth/me', [AuthController::class, 'me']);
    });

    // ─── Tenancy (perlu token + konteks tenant) ──────────────────────────
    Route::middleware(['auth:api', 'tenant'])->group(function () {
        Route::get('/tenants', [TenantController::class, 'index'])
            ->middleware('permission:tenants.read');
        Route::post('/tenants', [TenantController::class, 'store']);
        Route::get('/tenants/{tenant}', [TenantController::class, 'show'])
            ->middleware('permission:tenants.read');
        Route::get('/tenants/{tenant}/outlets', [TenantController::class, 'outlets'])
            ->middleware('permission:outlets.read');

        Route::post('/outlets', [OutletController::class, 'store'])
            ->middleware('permission:outlets.create');
        Route::get('/outlets/{outlet}/menu', [OutletController::class, 'menu'])
            ->middleware('permission:menu.read');
    });

    // ─── Catalog (perlu token + tenant) ──────────────────────────────────
    Route::middleware(['auth:api', 'tenant'])->prefix('catalog')->group(function () {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store'])
            ->middleware('permission:categories.create');
        Route::put('/categories/{category}', [CategoryController::class, 'update'])
            ->middleware('permission:categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
            ->middleware('permission:categories.delete');

        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store'])
            ->middleware('permission:products.create');
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::put('/products/{product}', [ProductController::class, 'update'])
            ->middleware('permission:products.update');
        Route::post('/products/{product}/variants', [ProductController::class, 'addVariant'])
            ->middleware('permission:products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])
            ->middleware('permission:products.delete');
    });

    // ─── Inventory (perlu token + tenant; outlet opsional untuk baca, wajib untuk mutasi) ──────────
    Route::middleware(['auth:api', 'tenant', 'outlet'])->prefix('inventory')->group(function () {
        Route::get('/stocks', [InventoryController::class, 'stocks'])
            ->middleware('permission:inventory.read');
        Route::get('/stocks/{variant}', [InventoryController::class, 'stockByVariant'])
            ->middleware('permission:inventory.read');
        Route::get('/stock-movements', [InventoryController::class, 'stockMovements'])
            ->middleware('permission:inventory.read');

        Route::get('/opnames/active', [InventoryController::class, 'activeOpname'])
            ->middleware('permission:inventory.stock_opname');
        Route::post('/adjustments', [InventoryController::class, 'storeAdjustment'])
            ->middleware('permission:inventory.adjust');
        Route::post('/receivings', [InventoryController::class, 'storeReceiving'])
            ->middleware('permission:inventory.receiving');
        Route::post('/opnames', [InventoryController::class, 'storeOpname'])
            ->middleware('permission:inventory.stock_opname');
        Route::post('/opnames/{opname}/adjustments', [InventoryController::class, 'storeOpnameAdjustment'])
            ->middleware('permission:inventory.stock_opname');
        Route::post('/opnames/{opname}/complete', [InventoryController::class, 'completeOpname'])
            ->middleware('permission:inventory.stock_opname');

        Route::get('/low-stock-rules', [InventoryController::class, 'lowStockRules'])
            ->middleware('permission:inventory.read');
        Route::post('/low-stock-rules', [InventoryController::class, 'storeLowStockRule'])
            ->middleware('permission:inventory.adjust');
        Route::patch('/low-stock-rules/{rule}', [InventoryController::class, 'updateLowStockRule'])
            ->middleware('permission:inventory.adjust');
    });
});
