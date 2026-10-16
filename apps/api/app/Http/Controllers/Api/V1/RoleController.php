<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Authorization\Enums\RolePreset;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\RoleResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Read-only role preset catalog for building employee assignment UI.
 *
 * The catalog is static configuration, not tenant data, so any authenticated
 * user may read it; authorization still governs who can assign a role.
 */
class RoleController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $roles = collect(RolePreset::cases())->map(fn (RolePreset $role): array => [
            'value' => $role->value,
            'label' => $role->label(),
            'permissions' => $role->permissions(),
            'business_wide_outlet_access' => $role->hasBusinessWideOutletAccess(),
        ]);

        return RoleResource::collection($roles);
    }
}
