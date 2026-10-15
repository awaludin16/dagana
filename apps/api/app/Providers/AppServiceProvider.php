<?php

namespace App\Providers;

use App\Domain\Organization\Models\Business;
use App\Domain\Organization\Models\Membership;
use App\Domain\Outlet\Models\Outlet;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerTenantScopedRouteBindings();
    }

    /**
     * Scope tenant-owned route bindings to the authenticated user's active
     * memberships. A record the user cannot access resolves to a 404 so that
     * another tenant's data existence is never disclosed (PRD/AGENTS §4).
     */
    private function registerTenantScopedRouteBindings(): void
    {
        Route::bind('business', function (string $value): Business {
            $user = request()->user();

            abort_unless($user !== null, 404);

            return $user->businesses()
                ->wherePivot('status', Membership::STATUS_ACTIVE)
                ->whereKey($value)
                ->firstOrFail();
        });

        Route::bind('outlet', function (string $value): Outlet {
            $user = request()->user();

            abort_unless($user !== null, 404);

            return Outlet::query()
                ->whereKey($value)
                ->whereHas('business.memberships', function ($query) use ($user): void {
                    $query->where('user_id', $user->getKey())
                        ->where('status', Membership::STATUS_ACTIVE);
                })
                ->firstOrFail();
        });
    }
}
