<?php

namespace App\Domain\Organization\Models;

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\PermissionEffect;
use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Outlet\Models\Outlet;
use App\Models\User;
use App\Policies\MembershipPolicy;
use Database\Factories\MembershipFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

#[Fillable(['business_id', 'user_id', 'role', 'status'])]
#[UseFactory(MembershipFactory::class)]
#[UsePolicy(MembershipPolicy::class)]
class Membership extends Model
{
    /** @use HasFactory<MembershipFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INVITED = 'invited';

    public const STATUS_DISABLED = 'disabled';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'role' => RolePreset::class,
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Outlets a non-owner member is explicitly granted access to.
     *
     * @return BelongsToMany<Outlet, $this>
     */
    public function outlets(): BelongsToMany
    {
        return $this->belongsToMany(Outlet::class, 'membership_outlet')->withTimestamps();
    }

    /**
     * Explicit permission overrides that adjust the role preset (D-04).
     *
     * @return HasMany<MembershipPermission, $this>
     */
    public function permissionOverrides(): HasMany
    {
        return $this->hasMany(MembershipPermission::class);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isOwner(): bool
    {
        return $this->role === RolePreset::Owner;
    }

    /**
     * Permission values granted by the role preset alone, ignoring overrides.
     *
     * @return array<int, string>
     */
    public function presetPermissions(): array
    {
        return $this->role?->permissions() ?? [];
    }

    /**
     * Effective permission values: (preset + explicit allow) - explicit deny.
     *
     * Owner memberships always hold the full catalog; their overrides are
     * ignored because Owner is the administration fallback (ADR-0006).
     *
     * @return array<int, string>
     */
    public function permissions(): array
    {
        if ($this->isOwner()) {
            return Permission::values();
        }

        $effective = array_unique(array_merge(
            $this->presetPermissions(),
            $this->permissionGrants(),
        ));

        return array_values(array_diff($effective, $this->permissionDenials()));
    }

    /**
     * @return array<int, string>
     */
    public function permissionGrants(): array
    {
        return $this->overrideValues(PermissionEffect::Allow);
    }

    /**
     * @return array<int, string>
     */
    public function permissionDenials(): array
    {
        return $this->overrideValues(PermissionEffect::Deny);
    }

    public function hasPermission(Permission $permission): bool
    {
        return $this->isActive()
            && in_array($permission->value, $this->permissions(), strict: true);
    }

    /**
     * Owner has business-wide outlet access (PRD §13.3).
     */
    public function hasAllOutletAccess(): bool
    {
        return $this->role?->hasBusinessWideOutletAccess() ?? false;
    }

    public function hasOutletAccess(Outlet $outlet): bool
    {
        if (! $this->isActive()) {
            return false;
        }

        if ($this->hasAllOutletAccess()) {
            return true;
        }

        return $this->outlets()->whereKey($outlet->getKey())->exists();
    }

    /**
     * Override permission values for a given effect.
     *
     * @return array<int, string>
     */
    private function overrideValues(PermissionEffect $effect): array
    {
        /** @var Collection<int, MembershipPermission> $overrides */
        $overrides = $this->permissionOverrides;

        return $overrides
            ->filter(static fn (MembershipPermission $override): bool => $override->effect === $effect)
            ->pluck('permission')
            ->values()
            ->all();
    }
}
