<?php

namespace App\Models;

use App\Domain\Access\PermissionCatalog;
use Database\Factories\BusinessMembershipFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

#[Fillable(['business_id', 'user_id', 'role', 'status'])]
class BusinessMembership extends Model
{
    /** @use HasFactory<BusinessMembershipFactory> */
    use HasFactory;

    public const ROLE_OWNER = 'OWNER';

    public const ROLE_MANAGER = 'MANAGER';

    public const ROLE_CASHIER = 'CASHIER';

    public const STATUS_ACTIVE = 'ACTIVE';

    public const STATUS_INACTIVE = 'INACTIVE';

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<OutletAccess, $this>
     */
    public function outletAccesses(): HasMany
    {
        return $this->hasMany(OutletAccess::class, 'membership_id');
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isOwner(): bool
    {
        return $this->role === self::ROLE_OWNER;
    }

    /**
     * @return list<string>
     */
    public function permissions(): array
    {
        return $this->isActive() ? PermissionCatalog::forRole($this->role) : [];
    }

    public function hasPermission(string $permission): bool
    {
        return in_array($permission, $this->permissions(), true);
    }

    /**
     * Managers may only grant outlet access they already hold themselves.
     *
     * @param  list<int>  $outletIds
     */
    public function canGrantOutletAccess(array $outletIds): bool
    {
        if ($this->isOwner()) {
            return true;
        }

        return array_diff($outletIds, $this->accessibleOutlets()->pluck('id')->all()) === [];
    }

    public function canAccessOutlet(int $outletId): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        if ($this->isOwner()) {
            return $this->business->outlets()->whereKey($outletId)->exists();
        }

        return $this->outletAccesses()->where('outlet_id', $outletId)->exists();
    }

    /**
     * Outlets granted to this membership. Owners implicitly get every outlet.
     *
     * @return Collection<int, Outlet>
     */
    public function accessibleOutlets(): Collection
    {
        if (! $this->isActive()) {
            return collect();
        }

        if ($this->isOwner()) {
            return $this->relationLoaded('business') && $this->business->relationLoaded('outlets')
                ? $this->business->outlets->sortBy('name')->values()
                : $this->business->outlets()->orderBy('name')->get();
        }

        return ($this->relationLoaded('outletAccesses')
            ? $this->outletAccesses
            : $this->outletAccesses()->with('outlet')->get())
            ->pluck('outlet')
            ->filter()
            ->sortBy('name')
            ->values();
    }
}
