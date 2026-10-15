<?php

namespace App\Domain\Authorization\Enums;

/**
 * Canonical permission catalog from the PRD (§15).
 *
 * Role presets map to subsets of these permissions (see config/authorization.php).
 * Permissions are the source of authorization; roles are only defaults.
 */
enum Permission: string
{
    case ProductsRead = 'products.read';
    case ProductsCreate = 'products.create';
    case ProductsUpdate = 'products.update';
    case ProductsDelete = 'products.delete';

    case OrdersRead = 'orders.read';
    case OrdersCreate = 'orders.create';
    case OrdersUpdate = 'orders.update';
    case OrdersCancel = 'orders.cancel';
    case OrdersRefund = 'orders.refund';

    case PaymentsRead = 'payments.read';
    case PaymentsCreate = 'payments.create';
    case PaymentsRefund = 'payments.refund';

    case CashOpen = 'cash.open';
    case CashRead = 'cash.read';
    case CashCashIn = 'cash.cash_in';
    case CashCashOut = 'cash.cash_out';
    case CashClose = 'cash.close';
    case CashReconcile = 'cash.reconcile';

    case InventoryRead = 'inventory.read';
    case InventoryAdjust = 'inventory.adjust';
    case InventoryStockOpname = 'inventory.stock_opname';

    case ReportsRead = 'reports.read';
    case ReportsExport = 'reports.export';

    case EmployeesRead = 'employees.read';
    case EmployeesCreate = 'employees.create';
    case EmployeesUpdate = 'employees.update';
    case EmployeesDisable = 'employees.disable';

    case OutletsRead = 'outlets.read';
    case OutletsManage = 'outlets.manage';

    case SettingsRead = 'settings.read';
    case SettingsUpdate = 'settings.update';

    case QrRead = 'qr.read';
    case QrManage = 'qr.manage';

    case BillingRead = 'billing.read';
    case BillingManage = 'billing.manage';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $permission): string => $permission->value, self::cases());
    }
}
