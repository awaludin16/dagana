<?php

namespace App\Domain\Organization\Models;

use App\Domain\Authorization\Enums\RolePreset;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

#[Fillable([
    'business_id',
    'invited_by_membership_id',
    'email',
    'role',
    'outlet_ids',
    'permission_grants',
    'permission_denials',
    'token_hash',
    'status',
    'delivery_status',
    'expires_at',
    'accepted_at',
])]
class MemberInvitation extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_ACCEPTED = 'accepted';

    public const STATUS_CANCELED = 'canceled';

    protected function casts(): array
    {
        return [
            'role' => RolePreset::class,
            'outlet_ids' => 'array',
            'permission_grants' => 'array',
            'permission_denials' => 'array',
            'expires_at' => 'immutable_datetime',
            'accepted_at' => 'immutable_datetime',
        ];
    }

    /**
     * @return BelongsTo<Business, $this>
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * @return BelongsTo<Membership, $this>
     */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(Membership::class, 'invited_by_membership_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function displayStatus(): string
    {
        if ($this->status === self::STATUS_PENDING && $this->isExpired()) {
            return 'expired';
        }

        return $this->status;
    }

    public function rotateToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $this->forceFill([
            'token_hash' => hash('sha256', $token),
            'status' => self::STATUS_PENDING,
            'delivery_status' => 'pending',
            'expires_at' => Carbon::now()->addDays(7),
        ])->save();

        return $token;
    }
}
