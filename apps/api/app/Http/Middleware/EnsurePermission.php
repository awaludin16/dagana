<?php

namespace App\Http\Middleware;

use App\Models\BusinessMembership;
use Closure;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authorization boundary for business-scoped routes: the authenticated user
 * must have an active membership and the role preset must grant the permission.
 */
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $membership = $request->user()?->membership;

        if (! $membership || $membership->status !== BusinessMembership::STATUS_ACTIVE) {
            throw new AuthorizationException('Membership aktif diperlukan.');
        }

        if (! $membership->hasPermission($permission)) {
            throw new AuthorizationException('Anda tidak memiliki izin untuk aksi ini.');
        }

        return $next($request);
    }
}
