<?php

namespace App\Http\Middleware;

use App\Models\Membership;
use App\Support\Rls;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Menyetel konteks tenant aktif pada request + mereplikasi ke database
 * (RLS) untuk setiap tabel ber-tenant_id.
 *
 * Prioritas:
 *   1. Header X-Tenant-Context (divalidasi via Membership aktif).
 *   2. Default tenant dari claims JWT (jika header tidak ada).
 *
 * Seluruh request dibungkus transaksi agar `set_config(..., true)` (SET
 * LOCAL) berlaku untuk setiap query — syarat agar policy RLS bekerja.
 */
class TenantScope
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $tenantId = $request->header('X-Tenant-Context')
            ?? $request->attributes->get('jwt_payload')['tenant_id'] ?? null;

        return DB::transaction(function () use ($request, $next, $user, $tenantId) {
            if ($tenantId !== null) {
                Rls::setTenantContext($tenantId);

                // Validasi keanggotaan aktif (PRD §17: otorisasi di backend).
                $hasAccess = Membership::query()
                    ->where('user_id', $user->getAuthIdentifier())
                    ->where('tenant_id', $tenantId)
                    ->where('status', 'ACTIVE')
                    ->exists();

                if (! $hasAccess) {
                    abort(403, 'Anda bukan anggota tenant ini.');
                }

                $request->attributes->set('tenant_context', $tenantId);
            }

            return $next($request);
        });
    }
}
