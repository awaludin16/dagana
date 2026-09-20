<?php

namespace App\Models;

use App\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * User ↔ Outlet di dalam satu tenant (D3: user bisa kerja di banyak outlet).
 */
class OutletAssignment extends Model
{
    use HasUuid;

    protected $fillable = ['user_id', 'tenant_id', 'outlet_id', 'status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }
}
