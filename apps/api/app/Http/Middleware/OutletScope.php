<?php

namespace App\Http\Middleware;

use App\Models\OutletAssignment;
use App\Support\Rls;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Opsional: menetapkan outlet aktif dari header X-Outlet-Context dan
 * memvalidasi assignment user pada tenant aktif.
 *
 * Pada RLS, juga menyetel app.current_outlet_id untuk tabel ber-outlet_id
 * (policy outlet-level, lihat docs/Authentication-RBAC.md §8).
 */
class OutletScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $tenantId = $request->attributes->get('tenant_context');
        $outletId = $request->header('X-Outlet-Context');

        if ($outletId === null) {
            return $next($request);
        }

        if ($tenantId === null) {
            abort(403, 'OUTLET_SCOPE_REQUIRED');
        }

        $assigned = OutletAssignment::query()
            ->where('user_id', $user->getAuthIdentifier())
            ->where('tenant_id', $tenantId)
            ->where('outlet_id', $outletId)
            ->where('status', 'ACTIVE')
            ->exists();

        if (! $assigned) {
            abort(403, 'User tidak di-assign ke outlet ini.');
        }

        $request->attributes->set('outlet_context', $outletId);

        return DB::transaction(function () use ($request, $next, $outletId) {
            Rls::setOutletContext($outletId);

            return $next($request);
        });
    }
}
