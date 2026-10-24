<?php

namespace App\Domain\Organization\Models;

use App\Domain\Authorization\Enums\RolePreset;
use App\Domain\Catalog\Models\Category;
use App\Domain\Catalog\Models\Menu;
use App\Domain\Outlet\Models\Outlet;
use App\Policies\BusinessPolicy;
use Database\Factories\BusinessFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'timezone', 'currency', 'status'])]
#[UseFactory(BusinessFactory::class)]
#[UsePolicy(BusinessPolicy::class)]
class Business extends Model
{
    /** @use HasFactory<BusinessFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    /**
     * @return HasMany<Outlet, $this>
     */
    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class);
    }

    /**
     * @return HasMany<Category, $this>
     */
    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    /**
     * @return HasMany<Menu, $this>
     */
    public function menus(): HasMany
    {
        return $this->hasMany(Menu::class);
    }

    /**
     * @return HasMany<Membership, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    /**
     * @return HasMany<MemberInvitation, $this>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(MemberInvitation::class);
    }

    /**
     * Active memberships that hold the Owner preset.
     *
     * @return HasMany<Membership, $this>
     */
    public function owners(): HasMany
    {
        return $this->memberships()
            ->where('role', RolePreset::Owner->value)
            ->where('status', Membership::STATUS_ACTIVE);
    }
}
