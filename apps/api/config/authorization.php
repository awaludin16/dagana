<?php

use App\Domain\Authorization\Enums\Permission;
use App\Domain\Authorization\Enums\RolePreset;

/*
|--------------------------------------------------------------------------
| Authorization
|--------------------------------------------------------------------------
|
| Role presets map to their default permission sets. The catalog and mapping
| are final for the MVP (docs/decision-log.md D-03/D-04): Owner holds the full
| catalog plus business-wide outlet access, and custom roles are explicitly
| out of scope (ADR-0006).
|
| Sebuah membership dapat menambah/mencabut permission lewat override eksplisit
| (tabel membership_permissions) tanpa membuat role baru. Preset di bawah adalah
| default-nya, bukan batas absolut.
|
| Preset Manager sengaja merupakan superset dari preset non-Owner lainnya agar
| aktor ber-permission `permissions.manage_membership` tidak bisa melakukan
| eskalasi melalui assignment role (lihat MembershipPermissionManager).
|
*/

$p = static fn (Permission $permission): string => $permission->value;

return [

    'role_permissions' => [
        RolePreset::Owner->value => Permission::values(),

        RolePreset::Manager->value => [
            $p(Permission::BusinessRead),
            $p(Permission::OutletsRead),
            $p(Permission::OutletsCreate),
            $p(Permission::OutletsUpdate),
            $p(Permission::MembersRead),
            $p(Permission::MembersInvite),
            $p(Permission::MembersUpdate),
            $p(Permission::RolesRead),
            $p(Permission::PermissionsRead),
            $p(Permission::PermissionsManageMembership),
            $p(Permission::CategoriesRead),
            $p(Permission::CategoriesCreate),
            $p(Permission::CategoriesUpdate),
            $p(Permission::CategoriesArchive),
            $p(Permission::ProductsRead),
            $p(Permission::ProductsCreate),
            $p(Permission::ProductsUpdate),
            $p(Permission::ProductsArchive),
            $p(Permission::OrdersRead),
            $p(Permission::OrdersCreate),
            $p(Permission::OrdersUpdate),
            $p(Permission::OrdersCancel),
            $p(Permission::PaymentsRead),
            $p(Permission::PaymentsCreate),
            $p(Permission::PaymentsRefund),
            $p(Permission::CashRead),
            $p(Permission::CashOpen),
            $p(Permission::CashCashIn),
            $p(Permission::CashCashOut),
            $p(Permission::CashClose),
            $p(Permission::CashReconcile),
            $p(Permission::InventoryRead),
            $p(Permission::InventoryAdjust),
            $p(Permission::InventoryStockOpname),
            $p(Permission::ReportsRead),
            $p(Permission::ReportsExport),
            $p(Permission::QrRead),
            $p(Permission::QrManage),
            $p(Permission::KitchenRead),
            $p(Permission::KitchenUpdateStatus),
            $p(Permission::BillingRead),
            $p(Permission::SettingsRead),
        ],

        RolePreset::Cashier->value => [
            $p(Permission::BusinessRead),
            $p(Permission::OutletsRead),
            $p(Permission::CategoriesRead),
            $p(Permission::ProductsRead),
            $p(Permission::OrdersRead),
            $p(Permission::OrdersCreate),
            $p(Permission::OrdersUpdate),
            $p(Permission::PaymentsRead),
            $p(Permission::PaymentsCreate),
            $p(Permission::CashRead),
            $p(Permission::CashOpen),
            $p(Permission::CashCashIn),
            $p(Permission::CashCashOut),
            $p(Permission::CashClose),
            $p(Permission::InventoryRead),
            $p(Permission::QrRead),
            $p(Permission::KitchenRead),
        ],

        RolePreset::Inventory->value => [
            $p(Permission::BusinessRead),
            $p(Permission::OutletsRead),
            $p(Permission::CategoriesRead),
            $p(Permission::ProductsRead),
            $p(Permission::InventoryRead),
            $p(Permission::InventoryAdjust),
            $p(Permission::InventoryStockOpname),
            $p(Permission::ReportsRead),
        ],

        RolePreset::Kitchen->value => [
            $p(Permission::BusinessRead),
            $p(Permission::OutletsRead),
            $p(Permission::CategoriesRead),
            $p(Permission::ProductsRead),
            $p(Permission::OrdersRead),
            $p(Permission::OrdersUpdate),
            $p(Permission::KitchenRead),
            $p(Permission::KitchenUpdateStatus),
        ],

        RolePreset::Staff->value => [
            $p(Permission::BusinessRead),
            $p(Permission::OutletsRead),
            $p(Permission::CategoriesRead),
            $p(Permission::ProductsRead),
            $p(Permission::OrdersRead),
            $p(Permission::KitchenRead),
        ],
    ],

];
