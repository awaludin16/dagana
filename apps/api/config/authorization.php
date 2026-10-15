<?php

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\RolePreset;

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
|
| Role presets map to default permission sets. Only the Owner set is fully
| exercised in Phase 1 (owner-as-operator). The other presets are provisional
| defaults and can be tuned before employee management ships (Phase 2).
|
*/

$p = static fn (Permission $permission): string => $permission->value;

return [

    'role_permissions' => [
        RolePreset::Owner->value => Permission::values(),

        RolePreset::Manager->value => [
            $p(Permission::ProductsRead),
            $p(Permission::ProductsCreate),
            $p(Permission::ProductsUpdate),
            $p(Permission::ProductsDelete),
            $p(Permission::OrdersRead),
            $p(Permission::OrdersCreate),
            $p(Permission::OrdersUpdate),
            $p(Permission::OrdersCancel),
            $p(Permission::OrdersRefund),
            $p(Permission::PaymentsRead),
            $p(Permission::PaymentsCreate),
            $p(Permission::PaymentsRefund),
            $p(Permission::CashOpen),
            $p(Permission::CashRead),
            $p(Permission::CashCashIn),
            $p(Permission::CashCashOut),
            $p(Permission::CashClose),
            $p(Permission::CashReconcile),
            $p(Permission::InventoryRead),
            $p(Permission::InventoryAdjust),
            $p(Permission::InventoryStockOpname),
            $p(Permission::ReportsRead),
            $p(Permission::ReportsExport),
            $p(Permission::EmployeesRead),
            $p(Permission::EmployeesCreate),
            $p(Permission::EmployeesUpdate),
            $p(Permission::OutletsRead),
            $p(Permission::OutletsManage),
            $p(Permission::SettingsRead),
            $p(Permission::SettingsUpdate),
            $p(Permission::QrRead),
            $p(Permission::QrManage),
        ],

        RolePreset::Cashier->value => [
            $p(Permission::ProductsRead),
            $p(Permission::OrdersRead),
            $p(Permission::OrdersCreate),
            $p(Permission::OrdersUpdate),
            $p(Permission::PaymentsRead),
            $p(Permission::PaymentsCreate),
            $p(Permission::CashOpen),
            $p(Permission::CashRead),
            $p(Permission::CashCashIn),
            $p(Permission::CashCashOut),
            $p(Permission::CashClose),
            $p(Permission::InventoryRead),
            $p(Permission::OutletsRead),
            $p(Permission::QrRead),
        ],

        RolePreset::Inventory->value => [
            $p(Permission::ProductsRead),
            $p(Permission::ProductsUpdate),
            $p(Permission::InventoryRead),
            $p(Permission::InventoryAdjust),
            $p(Permission::InventoryStockOpname),
            $p(Permission::ReportsRead),
            $p(Permission::OutletsRead),
        ],

        RolePreset::Kitchen->value => [
            $p(Permission::ProductsRead),
            $p(Permission::OrdersRead),
            $p(Permission::OrdersUpdate),
            $p(Permission::OutletsRead),
        ],

        RolePreset::Staff->value => [
            $p(Permission::ProductsRead),
            $p(Permission::OrdersRead),
            $p(Permission::OutletsRead),
        ],
    ],

];
