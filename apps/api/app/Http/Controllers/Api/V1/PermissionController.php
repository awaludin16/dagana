<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Authorization\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PermissionResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Read-only permission catalog for building role/permission UI.
 *
 * The catalog is static configuration, not tenant data, so any authenticated
 * user may read it.
 */
class PermissionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $permissions = collect(Permission::cases())->map(fn (Permission $permission): array => [
            'value' => $permission->value,
        ]);

        return PermissionResource::collection($permissions);
    }
}
