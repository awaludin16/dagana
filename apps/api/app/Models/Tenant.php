<?php

namespace App\Models;

use App\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    use HasUuid;

    protected $fillable = ['name', 'slug', 'status', 'plan'];

    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(Membership::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(Role::class);
    }
}
