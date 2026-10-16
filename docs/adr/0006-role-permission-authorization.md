# ADR-0006: Role Preset, Permission, dan Outlet Access

- **Status:** Accepted
- **Tanggal:** 2026-10-15
- **Pemilik:** Engineering

## Context

PRD §13–§17 menetapkan model `User -> Membership -> Business -> Outlet -> Permission`. Role bukan pembatas absolut, melainkan preset permission; authorization sebenarnya ditentukan oleh permission. Fase 2 perlu menetapkan bagaimana employee ditambahkan, bagaimana role preset dipetakan ke permission, bagaimana outlet access diterapkan, dan bagaimana mencegah business kehilangan owner.

Keputusan ini menyentuh kontrak API (`/api/v1/roles`, `/api/v1/permissions`, endpoint `members`) dan aturan authorization, sehingga layak dicatat sebagai ADR.

## Options considered

1. **Role-only authorization** — hak akses ditentukan langsung oleh label role. Sederhana, tetapi bertentangan dengan PRD §15 "permission adalah sumber authorization" dan sulit berkembang untuk custom role.
2. **Permission-based via preset role (dipilih)** — role memetakan ke sekumpulan permission di `config/authorization.php`; policy memeriksa permission. Selaras PRD, mudah diuji, dan tetap mendukung custom role di masa depan.
3. **Custom role granular sejak MVP** — role bisa dibuat/diedit per business. Menambah kompleksitas yang belum dibutuhkan MVP; ditolak (D-04). Fleksibilitas individu disediakan lewat override permission per membership.

Untuk invitation employee: (a) undangan email penuh berbasis token, (b) user terdaftar diundang lalu membership `invited` dan diaktifkan lewat `accept`, (c) user terdaftar langsung diaktifkan (`active`). Infrastruktur mail/queue belum dibangun pada fase ini.

## Decision

1. **Authorization berbasis permission.** Katalog permission kanonik ada di `App\Domain\Authorization\Enums\Permission` dan mengikuti baseline `docs/decision-log.md` D-03; pemetaan role preset ke permission ada di `config/authorization.php`. `App\Domain\Authorization\Enums\RolePreset` menyediakan preset Owner, Manager, Cashier, Inventory, Kitchen, Staff. Policy (`BusinessPolicy`, `OutletPolicy`, `MembershipPolicy`) memeriksa permission eksplisit, bukan label role.
2. **Katalog permission dan preset role bersifat final untuk MVP.** Enam preset (Owner, Manager, Cashier, Inventory, Kitchen, Staff) dan katalog permission D-03 tidak diubah selama MVP. **Custom role tidak diperlukan dan dinyatakan di luar scope MVP.**
3. **Owner punya seluruh permission dan business-wide outlet access.** Owner preset memetakan ke seluruh katalog dan `hasBusinessWideOutletAccess() === true`; grant outlet eksplisit untuk Owner diabaikan.
4. **Outlet access eksplisit untuk non-Owner** melalui pivot `membership_outlet`. Akses outlet diperiksa di `Membership::hasOutletAccess()`, dan outlet di luar cakupan dijawab `404` agar keberadaannya tidak terbocor.
5. **Override permission per membership (D-04).** Tanpa custom role, fleksibilitas individu disediakan lewat tabel `membership_permissions` (`effect` = `allow`/`deny`). Permission efektif = `(preset ∪ allow) \ deny`; `deny` menang atas preset. Pengelolaannya memerlukan `permissions.manage_membership`. Anti-eskalasi ditegakkan di `MembershipPermissionManager`: aktor tidak dapat memberikan role maupun permission yang tidak dimilikinya sendiri. Override pada membership Owner diabaikan karena Owner selalu memegang seluruh katalog.
6. **Invitation Fase 2 menargetkan user terdaftar** (dicari via `email`) dan langsung membuat membership `active`. Undangan berbasis email/token ditunda.
7. **Setiap business wajib menyisakan minimal satu Owner aktif.** `AddMemberAction`, `UpdateMembershipAction`, dan `ChangeMembershipStatusAction` memakai `BusinessOwnershipGuard`; pelanggaran dijawab `409 Conflict`. Perubahan membership mengunci baris business (`lockForUpdate`) untuk mencegah race menghapus owner terakhir secara bersamaan.
8. **Employee bersifat opsional.** Owner tetap dapat beroperasi setelah employee dibuat; tidak ada prasyarat employee untuk penjualan.

## Consequences

- Penambahan permission/role baru cukup mengubah enum + `config/authorization.php`; policy dan test menyesuaikan. Karena katalog dinyatakan final, perubahan berikutnya adalah keputusan produk yang disengaja, bukan penyesuaian bebas.
- Karena custom role tidak termasuk MVP, tidak ada tabel/endpoint role kustom; assignment employee memakai preset, sedangkan penyesuaian individu memakai override pada `membership_permissions`.
- Preset Manager sengaja dibuat superset dari preset non-Owner lainnya, sehingga aktor ber-`permissions.manage_membership` tidak dapat melakukan eskalasi lewat assignment role; Owner sengaja bukan subset Manager agar hanya Owner yang dapat membuat Owner lain.
- Setiap endpoint tenant-owned wajib menguji isolasi lintas tenant dan outlet access (sudah ditambahkan di `MemberManagementTest` dan `MembershipPermissionOverrideTest`).
- Status `invited` tetap ada untuk masa depan, tetapi belum digunakan pada alur saat ini.
- Perubahan permission penting (mis. role/status membership) belum tercatat di audit log karena modul Audit (Phase 11) belum dibangun; ini dicatat sebagai dependency.

## Follow-up

- [ ] Catat perubahan role/permission/membership penting ke audit log saat domain Audit tersedia.
- [ ] Rancang alur undangan berbasis email/token beserta infrastruktur mail saat dibutuhkan.
