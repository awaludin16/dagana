<?php

namespace App\Domain\Authorization\Enums;

/**
 * Canonical, final permission catalog for the MVP.
 *
 * The catalog follows the reviewed baseline in `docs/decision-log.md` (D-03)
 * and is referenced by PRD §61. Role presets map to subsets of these
 * permissions (see config/authorization.php). Permissions are the source of
 * authorization; roles are only defaults. Custom roles are explicitly out of
 * scope for the MVP.
 *
 * Permission dapat ditambah ketika requirement yang sah muncul, tetapi
 * perubahan katalog adalah keputusan produk yang disengaja, bukan penyesuaian
 * bebas di dalam kode.
 */
enum Permission: string
{
    case BusinessRead = 'business.read';
    case BusinessUpdate = 'business.update';

    case OutletsRead = 'outlets.read';
    case OutletsCreate = 'outlets.create';
    case OutletsUpdate = 'outlets.update';
    case OutletsDisable = 'outlets.disable';

    case MembersRead = 'members.read';
    case MembersInvite = 'members.invite';
    case MembersUpdate = 'members.update';
    case MembersDisable = 'members.disable';

    case RolesRead = 'roles.read';
    case PermissionsRead = 'permissions.read';
    case PermissionsManageMembership = 'permissions.manage_membership';

    case CategoriesRead = 'categories.read';
    case CategoriesCreate = 'categories.create';
    case CategoriesUpdate = 'categories.update';
    case CategoriesArchive = 'categories.archive';

    case ProductsRead = 'products.read';
    case ProductsCreate = 'products.create';
    case ProductsUpdate = 'products.update';
    case ProductsArchive = 'products.archive';

    case OrdersRead = 'orders.read';
    case OrdersCreate = 'orders.create';
    case OrdersUpdate = 'orders.update';
    case OrdersCancel = 'orders.cancel';

    case PaymentsRead = 'payments.read';
    case PaymentsCreate = 'payments.create';
    case PaymentsRefund = 'payments.refund';

    case CashRead = 'cash.read';
    case CashOpen = 'cash.open';
    case CashCashIn = 'cash.cash_in';
    case CashCashOut = 'cash.cash_out';
    case CashClose = 'cash.close';
    case CashReconcile = 'cash.reconcile';

    case InventoryRead = 'inventory.read';
    case InventoryAdjust = 'inventory.adjust';
    case InventoryStockOpname = 'inventory.stock_opname';

    case ReportsRead = 'reports.read';
    case ReportsExport = 'reports.export';

    case QrRead = 'qr.read';
    case QrManage = 'qr.manage';

    case KitchenRead = 'kitchen.read';
    case KitchenUpdateStatus = 'kitchen.update_status';

    case BillingRead = 'billing.read';
    case BillingManageSettings = 'billing.manage_settings';

    case AuditRead = 'audit.read';

    case SettingsRead = 'settings.read';
    case SettingsUpdate = 'settings.update';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $permission): string => $permission->value, self::cases());
    }
}
