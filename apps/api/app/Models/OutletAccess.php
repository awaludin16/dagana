<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['membership_id', 'outlet_id'])]
class OutletAccess extends Model
{
    /**
     * @return BelongsTo<BusinessMembership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(BusinessMembership::class, 'membership_id');
    }

    /**
     * @return BelongsTo<Outlet, $this>
     */
    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
