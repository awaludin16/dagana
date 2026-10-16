<?php

namespace App\Domain\Organization\Models;

use App\Domain\Authorization\Enums\PermissionEffect;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Explicit permission override attached to a membership (docs/decision-log.md D-04).
 *
 * A membership keeps the role preset as its default capability. This table
 * records the deliberate exceptions: `allow` adds a permission beyond the
 * preset, `deny` removes one granted by the preset. Owner memberships ignore
 * overrides because they always hold the full catalog.
 */
#[Fillable(['membership_id', 'permission', 'effect'])]
class MembershipPermission extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'effect' => PermissionEffect::class,
        ];
    }

    /**
     * @return BelongsTo<Membership, $this>
     */
    public function membership(): BelongsTo
    {
        return $this->belongsTo(Membership::class);
    }
}
