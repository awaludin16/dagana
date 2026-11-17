<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Izin tambahan di luar preset role (revisi D-04, 2026-11-17).
 * Hanya berisi izin dari katalog D-03; preset role tidak pernah tersimpan di
 * sini sehingga tidak dapat dicabut melalui tabel ini.
 */
#[Fillable(['membership_id', 'permission'])]
class MembershipPermissionOverride extends Model
{
    public function membership(): BelongsTo
    {
        return $this->belongsTo(BusinessMembership::class, 'membership_id');
    }
}
