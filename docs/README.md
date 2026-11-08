# Dagana Documentation Map

Dokumentasi Dagana sengaja dipisahkan agar setiap file punya satu tanggung jawab dan tidak ada satu PRD raksasa yang memuat seluruh detail produk, arsitektur, dan implementasi.

## Source-of-truth hierarchy

| Pertanyaan                                                 | Dokumen utama                                                                                                     | Fungsi                                                                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Produk apa yang dibangun dan untuk siapa?                  | [`../PRD-Dagana.md`](../PRD-Dagana.md)                                                                            | Visi, masalah, target pasar, tujuan, batas produk, ringkasan MVP, dan metrik. |
| Fitur harus berperilaku bagaimana?                         | [`requirements/`](requirements/)                                                                                  | Requirement fungsional dan kualitas per domain.                               |
| Sistem disusun dengan teknologi dan batas apa?             | [`architecture/`](architecture/)                                                                                  | System architecture, stack, API, dan model data konseptual.                   |
| Bagaimana tampilan Web dan Mobile harus konsisten?         | [`design-system/`](design-system/)                                                                                | Warna, tipografi, token, dan standar frontend React Web/Flutter.              |
| Bagaimana agent mengubah kode?                             | [`../AGENTS.md`](../AGENTS.md) dan [`engineering/engineering-standards.md`](engineering/engineering-standards.md) | Aturan agent dan praktik implementasi.                                        |
| Bagaimana menjalankan project lokal?                       | [`operations/development-environment.md`](operations/development-environment.md)                                  | Docker dan setup development.                                                 |
| Fase apa yang dikerjakan dan bagaimana dinyatakan selesai? | [`planning/`](planning/)                                                                                          | Roadmap, acceptance criteria, metrik produk, dan decision log.                |
| Prompt apa yang diberikan ke coding agent?                 | [`prompts/implementation-by-phase.md`](prompts/implementation-by-phase.md)                                        | Template prompt per fase dan per sisi aplikasi.                               |

Jika terdapat konflik: requirement produk menentukan behavior; architecture menentukan implementasi yang disetujui; decision log menunjukkan keputusan yang sudah disetujui, usulan, dan gate; phase targets menentukan pekerjaan/acceptance criteria; `AGENTS.md` mengatur perilaku coding agent. Jangan menutup konflik dengan asumsi tersembunyi.

## Requirements

- [`identity-and-access.md`](requirements/identity-and-access.md)
- [`catalog-and-pos.md`](requirements/catalog-and-pos.md)
- [`payments-and-cash.md`](requirements/payments-and-cash.md)
- [`inventory-and-reporting.md`](requirements/inventory-and-reporting.md)
- [`qr-ordering-and-kitchen.md`](requirements/qr-ordering-and-kitchen.md)
- [`billing.md`](requirements/billing.md)
- [`platform-quality.md`](requirements/platform-quality.md)
- [`mvp-scope-and-workflows.md`](requirements/mvp-scope-and-workflows.md)

## Architecture

- [`system-architecture.md`](architecture/system-architecture.md)
- [`technical-stack.md`](architecture/technical-stack.md)
- [`api-design.md`](architecture/api-design.md)
- [`data-model.md`](architecture/data-model.md)

## Design system and frontend standards

- [`visual-foundation.md`](design-system/visual-foundation.md) — arah visual, palet, tipografi, spacing, dan aksesibilitas.
- [`web-frontend-standards.md`](design-system/web-frontend-standards.md) — standar React Web untuk Admin dan Customer Ordering.
- [`mobile-frontend-standards.md`](design-system/mobile-frontend-standards.md) — standar Flutter POS.
- [`tokens.json`](design-system/tokens.json) — token desain bersama.
- [`web-theme.css`](design-system/web-theme.css) — contoh semantic CSS tokens untuk Tailwind/shadcn.
- [`flutter/dagana_theme.dart`](design-system/flutter/dagana_theme.dart) — starter Material 3 ThemeData Flutter.

## Engineering and operations

- [`engineering-standards.md`](engineering/engineering-standards.md)
- [`development-environment.md`](operations/development-environment.md)

## Planning and prompts

- [`development-phases.md`](planning/development-phases.md)
- [`product-metrics.md`](planning/product-metrics.md)
- [`post-mvp-roadmap.md`](planning/post-mvp-roadmap.md)
- [`phase-targets.md`](planning/phase-targets.md)
- [`decision-log.md`](planning/decision-log.md)
- [`technical-debt.md`](planning/technical-debt.md)
- [`implementation-by-phase.md`](prompts/implementation-by-phase.md)

## Maintenance rules

1. Setiap behavior baru atau perubahan behavior harus memperbarui requirement domain yang relevan.
2. Setiap perubahan struktur komponen, teknologi, API, atau data model harus memperbarui dokumen architecture terkait. Perubahan warna, font, spacing, atau pola komponen harus memperbarui dokumen design-system dan token implementasinya.
3. Keputusan yang belum final harus dicatat di decision log dengan status yang jelas; coding agent tidak boleh mengubah usulan menjadi keputusan final.
4. Perubahan acceptance criteria harus diperbarui di phase targets.
5. Prompt adalah alat kerja, bukan sumber requirement baru. Jika prompt berbeda dari requirement, ikuti requirement dan perbaiki prompt.
