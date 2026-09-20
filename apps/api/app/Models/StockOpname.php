<?php

namespace App\Models;

use App\Concerns\HasUuid;
use App\Enums\StockOpnameStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOpname extends Model
{
    use HasUuid;

    protected $fillable = [
        'tenant_id', 'outlet_id', 'started_at', 'completed_at', 'status', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'status' => StockOpnameStatus::class,
        ];
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(StockAdjustment::class);
    }
}
