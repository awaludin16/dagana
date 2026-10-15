# Architecture Decision Records (ADR)

Gunakan ADR untuk keputusan teknis yang berdampak luas, sulit dibalik, atau mengubah kontrak arsitektur—misalnya model multi-tenancy, strategi offline sync, payment gateway, inventory costing, atau deployment architecture.

Aturan:
- Satu keputusan penting per file.
- Gunakan nomor berurutan: `0001-short-title.md`.
- Status: `Proposed`, `Accepted`, `Superseded`, atau `Rejected`.
- Jelaskan konteks, opsi utama, keputusan, konsekuensi, dan tanggal.
- Agent tidak boleh mengubah keputusan `Accepted` diam-diam. Usulkan ADR pengganti jika perlu.

## Indeks

| ADR | Judul | Status |
| --- | --- | --- |
| [0001](0001-modular-monolith.md) | Modular Monolith sebagai Arsitektur Awal | Accepted |
| [0002](0002-tenancy-and-outlet-scoping.md) | Model Multi-Tenancy dan Outlet Scoping | Accepted |
| [0003](0003-money-representation-idr.md) | Representasi Uang sebagai Integer Rupiah | Accepted |
| [0004](0004-time-and-timezone.md) | Penyimpanan Waktu UTC dan Timezone Tampilan Asia/Jakarta | Accepted |
| [0005](0005-authentication-sanctum-spa.md) | Autentikasi SPA Berbasis Session Cookie dengan Laravel Sanctum | Accepted |
