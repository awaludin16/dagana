<?php

namespace App\Domain\Authorization\Enums;

/**
 * Role presets from the PRD (§14). A role is a bundle of default permissions,
 * not an absolute boundary; permissions remain the source of authorization.
 *
 * The preset-to-permission mapping lives in config/authorization.php. The preset
 * set and permission catalog are final for the MVP; custom roles are explicitly
 * out of scope.
 */
enum RolePreset: string
{
    case Owner = 'owner';
    case Manager = 'manager';
    case Cashier = 'cashier';
    case Inventory = 'inventory';
    case Kitchen = 'kitchen';
    case Staff = 'staff';

    /**
     * Permission values granted by this preset.
     *
     * @return array<int, string>
     */
    public function permissions(): array
    {
        /** @var array<string, array<int, string>> $map */
        $map = config('authorization.role_permissions', []);

        return $map[$this->value] ?? [];
    }

    public function hasBusinessWideOutletAccess(): bool
    {
        // The Owner preset has business-wide outlet access by default (PRD §13.3).
        return $this === self::Owner;
    }

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Manager => 'Manager',
            self::Cashier => 'Cashier',
            self::Inventory => 'Inventory',
            self::Kitchen => 'Kitchen',
            self::Staff => 'Staff',
        };
    }
}
