<?php

namespace App\Models;

use Database\Factories\OutletFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'phone', 'address'])]
class Outlet extends Model
{
    /** @use HasFactory<OutletFactory> */
    use HasFactory;

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @param  Builder<Outlet>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        $query->whereHas('business', fn (Builder $query) => $query->visibleTo($user));
    }

    /**
     * Outlets an active membership may operate on: all for owners, explicit
     * outlet_accesses for managers and cashiers (D-05).
     *
     * @param  Builder<Outlet>  $query
     */
    public function scopeAccessibleTo(Builder $query, User $user): void
    {
        $query->whereHas('business.memberships', function (Builder $query) use ($user): void {
            $query->where('user_id', $user->id)
                ->where('status', BusinessMembership::STATUS_ACTIVE)
                ->where(function (Builder $query): void {
                    $query->where('role', BusinessMembership::ROLE_OWNER)
                        ->orWhereHas('outletAccesses', function (Builder $query): void {
                            $query->whereColumn('outlet_accesses.outlet_id', 'outlets.id');
                        });
                });
        });
    }
}
