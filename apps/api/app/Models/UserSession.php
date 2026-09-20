<?php

namespace App\Models;

use App\Concerns\HasUuid;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Sesi refresh token. Hanya hash yang disimpan; dibuat ulang pada
 * setiap refresh (rotation) dan di-revoke saat logout.
 */
#[Hidden(['refresh_token'])]
class UserSession extends Model
{
    use HasUuid;

    protected $fillable = [
        'user_id', 'refresh_token', 'expires_at', 'revoked', 'ip_address', 'user_agent',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'revoked' => 'boolean',
        ];
    }
}
