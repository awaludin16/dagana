<?php

namespace App\Domain\Outlet\Models;

use App\Domain\Organization\Models\Business;
use App\Policies\OutletPolicy;
use Database\Factories\OutletFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
}
