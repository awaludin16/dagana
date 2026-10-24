<?php

namespace App\Domain\Outlet\Models;

use App\Domain\Organization\Models\Business;
use App\Domain\Sales\Models\Order;
use App\Policies\OutletPolicy;
use Database\Factories\OutletFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['business_id', 'name', 'address', 'timezone', 'status'])]
#[UseFactory(OutletFactory::class)]
#[UsePolicy(OutletPolicy::class)]
class Outlet extends Model
{
    /** @use HasFactory<OutletFactory> */
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_DISABLED = 'disabled';

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
