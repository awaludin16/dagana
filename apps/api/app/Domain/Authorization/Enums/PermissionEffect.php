<?php

namespace App\Domain\Authorization\Enums;

/**
 * Explicit permission override effect attached to a membership (D-04).
 *
 * - `allow` menambah kemampuan di luar preset role.
 * - `deny` mencabut permission yang seharusnya didapat dari preset.
 *
 * Bila sebuah permission punya salah satu baris override, effect itulah yang
 * berlaku; `deny` selalu menang atas preset (lihat Membership::permissions()).
 */
enum PermissionEffect: string
{
    case Allow = 'allow';
    case Deny = 'deny';
}
