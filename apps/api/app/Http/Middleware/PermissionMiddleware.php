<?php

namespace App\Http\Middleware;

use App\Services\RbacService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cek RBAC.
 *
 * Usage: ->middleware('permission:products.create')
 *        ->middleware('permission:products.create,products.update') // salah satu
 */
class PermissionMiddleware
{
    public function __construct(protected RbacService $rbac) {}

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();
        $tenantId = $request->attributes->get('tenant_context');

        if (! $user || $tenantId === null) {
            abort(403, 'FORBIDDEN');
        }

        foreach ($permissions as $permission) {
            if ($this->rbac->userCan($user, $tenantId, $permission)) {
                return $next($request);
            }
        }

        abort(403, 'Anda tidak memiliki permission yang diperlukan.');
    }
}
