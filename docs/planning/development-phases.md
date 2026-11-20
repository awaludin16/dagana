# Development Phases — Dagana

> Dokumen ini menjelaskan urutan fase tingkat tinggi. Detail target dan acceptance criteria ada di [`phase-targets.md`](phase-targets.md).

## Development Phases

| Phase | Fokus |
|---|---|
| 0 | Foundation: repository, Docker, environment, CI, testing, agent rules |
| 1 | Identity, Business, Outlet |
| 2 | Membership, tiga role, permission, outlet access |
| 3 | Catalog |
| 4 | POS + Payment |
| 5 | Cash Session |
| 6 | Dihapus oleh D-36; nomor tidak dipakai |
| 7 | Reporting |
| 8 | QR Ordering |
| 9 | Realtime |
| 10 | Billing |
| 11 | Stabilization dan release readiness |
| 12 | Ditunda (D-36); tidak ada target aktif |

Urutan dapat disesuaikan berdasarkan dependency dan validasi, tanpa menghilangkan kebutuhan atau acceptance criteria fase.

---

## Prinsip sequencing

- Implementasikan fase berdasarkan dependency, bukan sekadar urutan nomor jika ada alasan yang terdokumentasi.
- Jangan menghilangkan acceptance criteria ketika urutan diubah.
- Fitur yang bergantung pada keputusan tertunda harus berhenti pada gate terkait, bukan diimplementasikan dengan asumsi diam-diam.
