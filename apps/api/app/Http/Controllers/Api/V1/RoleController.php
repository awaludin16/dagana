<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Access\PermissionCatalog;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => collect(PermissionCatalog::ROLES)
                ->map(fn (string $role): array => [
                    'role' => $role,
                    'permissions' => PermissionCatalog::forRole($role),
                ])
                ->values(),
        ]);
    }
}
