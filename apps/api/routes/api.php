<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (v1)
|--------------------------------------------------------------------------
|
| Routes declared here are mounted under the versioned API prefix defined in
| bootstrap/app.php (currently "/api/v1"). Keep transport concerns in the
| controller and business rules in domain actions/services.
|
*/

Route::get('/health', HealthController::class)->name('api.v1.health');
