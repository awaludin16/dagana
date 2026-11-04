<?php

namespace App\Domain\Access;

use App\Models\BusinessMembership;

/**
 * Central, code-owned role presets. Merchant cannot edit these (D-04).
 */
final class PermissionCatalog
{
    /** @var list<string> */
    public const ROLES = [
        BusinessMembership::ROLE_OWNER,
        BusinessMembership::ROLE_MANAGER,
        BusinessMembership::ROLE_CASHIER,
    ];

    /** @var list<string> */
    public const PERMISSIONS = [
        'business.read',
        'business.update',
        'outlets.read',
        'outlets.create',
        'outlets.update',
        'outlets.delete',
        'members.read',
        'members.invite',
        'members.update',
        'members.delete',
        'categories.read',
        'categories.create',
        'categories.update',
        'categories.delete',
        'products.read',
        'products.create',
        'products.update',
        'products.delete',
        'orders.read',
        'orders.create',
        'orders.update',
        'orders.cancel',
        'payments.read',
        'payments.create',
        'payments.refund',
        'cash.read',
        'cash.open',
        'cash.cash_in',
        'cash.cash_out',
        'cash.close',
        'cash.reconcile',
        'inventory.read',
        'inventory.adjust',
        'inventory.stock_opname',
        'reports.read',
        'reports.export',
        'qr.read',
        'qr.manage',
        'kitchen.read',
        'kitchen.update_status',
        'billing.read',
        'billing.manage_settings',
        'audit.read',
        'settings.read',
        'settings.update',
    ];

    /**
     * @return list<string>
     */
    public static function forRole(string $role): array
    {
        return match ($role) {
            BusinessMembership::ROLE_OWNER => self::PERMISSIONS,
            BusinessMembership::ROLE_MANAGER => array_values(array_diff(
                self::PERMISSIONS,
                ['billing.manage_settings', 'audit.read', 'members.delete'],
            )),
            BusinessMembership::ROLE_CASHIER => [
                'business.read',
                'outlets.read',
                'categories.read',
                'products.read',
                'orders.read',
                'orders.create',
                'orders.update',
                'payments.read',
                'payments.create',
                'cash.read',
                'cash.open',
                'cash.cash_in',
                'cash.cash_out',
                'cash.close',
            ],
            default => [],
        };
    }
}
