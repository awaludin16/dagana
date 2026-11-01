# Engineering Standards — Dagana

> Dokumen pendamping untuk praktik implementasi. `AGENTS.md` tetap menjadi instruksi wajib bagi coding agent. Jika ada konflik, ikuti `AGENTS.md` dan keputusan Product Owner yang tercatat.

## Prinsip umum

- Implementasikan sesuai requirement dan fase yang sedang dikerjakan.
- Utamakan perubahan kecil yang mudah diuji.
- Pisahkan HTTP/UI concerns dari business logic.
- Jangan menambahkan abstraction atau dependency tanpa kebutuhan konkret.
- Test behavior termasuk failure path, security boundary, dan retry.

## 3. Laravel code organization

Organize code around domains/use cases. Prefer the existing repository convention if one has already been established; do not conduct a broad file migration merely to match an example.

For new business logic, use the following responsibilities:

- **Controller:** HTTP concerns only—receive the request, invoke authorization/validation, call a use case, and return a response. Do not place checkout, stock, cash, or billing rules in controllers.
- **Form Request:** input validation and request-specific authorization where appropriate.
- **Service/Action:** application use case and business-rule orchestration. Examples include `CheckoutService`, `OpenCashSessionAction`, and `AdjustInventoryService`.
- **Model:** persistence mapping, relationships, casts, and small query scopes. Avoid hiding multi-step workflows in model callbacks or fat model methods.
- **Policy/Gate:** authorization decisions. Reuse explicit permission checks; do not rely on frontend visibility or a role label alone.
- **API Resource:** stable response serialization. Avoid returning raw models with accidental fields/relationships.
- **Event/Job:** side effects or deferred work when useful. Dispatch after a successful commit when the action depends on committed database state.
- **DTO/value object:** introduce when it clarifies a meaningful boundary or complex input/output. Do not create classes for every primitive value.
- **Repository:** not required by default. Introduce a repository only when it solves a real persistence/testing/complex-query problem; do not add a generic repository layer around every Eloquent model.

A possible domain-oriented layout is `app/Domain/<Domain>/{Actions,DTOs,Events,Exceptions,Models,Services}` with HTTP adapters under `app/Http/Controllers/Api/V1`. Adapt it to the existing codebase rather than creating empty folders for every possible domain.

---

## 4. Multi-tenancy and authorization — critical

- Every business-owned record must be scoped to the active `business_id`; a User has exactly one Business in MVP and cannot switch to or join another Business; outlet-owned operational records must also be scoped to the correct `outlet_id` when relevant.
- Resolve the active business, membership, and outlet access from trusted authenticated context. Never trust a client-supplied `business_id`, `outlet_id`, membership ID, or role without verifying that the authenticated user may access it.
- Enforce authorization on the backend for every read and write path, including exports, nested routes, background jobs, and realtime subscriptions.
- Do not query a record by its ID alone when it belongs to a tenant. Scope the query first, then retrieve the record.
- MVP roles are only `OWNER`, `MANAGER`, and `CASHIER`. Roles are permission presets; permissions and explicit outlet access govern authorization. Do not scatter hard-coded role checks when a permission check is appropriate. A User may belong to exactly one Business; enforce this in schema, validation, authorization, and tests.
- A user lacking access must not be able to infer another tenant's data from response bodies, counts, errors, search results, reports, or logs exposed to clients.
- Add tests proving that Business A cannot read or mutate Business B data and that users without outlet access cannot act on that outlet.

---

## 5. Transaction, payment, cash, and inventory integrity

- Checkout must be atomic for database changes that must succeed together: order and item snapshots, payment record/status, inventory movement where enabled, cash-session impact where applicable, and audit event.
- Use `DB::transaction()` for multi-record operations. Use row locking (for example, `lockForUpdate`) only where concurrent requests can cause lost updates, overselling, or cash/session inconsistencies.
- Add idempotency handling to retryable transaction/payment endpoints. A retry must not create a duplicate sale, payment, stock deduction, or platform fee.
- Do not trust a payment success redirect as proof of payment. Verify provider webhooks/signatures and handle duplicate/out-of-order notifications safely if a gateway is integrated.
- Keep external network calls out of a long-running database transaction wherever possible. Persist the internal state safely, then use an explicit retryable workflow for the external operation.
- Do not delete completed financial/stock history to correct mistakes. Use the domain's cancellation, refund, reversal, or adjustment flow and retain an audit trail.
- Represent IDR amounts as integer whole-rupiah values in the initial Indonesia-focused product; never calculate money using PHP/JavaScript floating-point values. Revisit the model explicitly before adding other currencies or fractional minor units.
- Stock changes should be explainable through stock-movement records, not an unexplained update to a current-stock number.

---

## 6. Validation, errors, and API compatibility

- Keep API routes versioned under `/api/v1` as specified in the PRD.
- Validate all untrusted input server-side through Form Requests or an equally clear validation boundary.
- Return consistent status codes and response shapes using the project's established response convention. Do not introduce a second response envelope without an explicit migration plan.
- Do not expose stack traces, SQL errors, secrets, internal filesystem paths, or payment credentials in API errors.
- Paginate potentially large lists and define sensible limits for search/filter inputs. Avoid unbounded queries and accidental N+1 relationships.
- Treat changes to response fields, status enums, and permission names as API/domain changes: update contracts, tests, and docs.

---

## 7. Database and migrations

- Use PostgreSQL as the primary database and Redis for the purposes defined in the PRD (cache/queue/rate limiting/realtime support as adopted).
- Schema changes must be represented by migrations. Do not rely on manually editing a developer's database.
- Make migrations reversible where practical and safe. Do not modify a migration that may already have run in a shared environment; create a new migration instead.
- Add foreign keys, unique constraints, useful indexes, and tenant-aware constraints where the domain requires them. Application validation alone is not enough for important uniqueness/integrity rules.
- Use factories and seeders for repeatable local/test data. Never place real customer or production data in committed seeds or fixtures.
- Consider existing data and lock duration before writing migrations that alter large tables.

---

## 8. Testing and quality gates

- Add or update tests whenever behavior changes. Do not weaken/remove a test only to make a change pass; explain and replace it when the expected behavior truly changed.
- Minimum critical coverage: validation, permissions, tenant isolation, checkout atomicity/rollback, idempotency, payment state transitions, cash reconciliation arithmetic, and inventory movement whenever those areas change.
- Prefer feature tests for HTTP/API behavior and unit tests for isolated calculations/rules. Test failure paths as well as happy paths.
- Run the narrowest relevant tests while iterating, then run the broader available test/lint/static-analysis commands before declaring completion.
- Do not claim a test passed unless it was actually executed. If environment/dependencies prevent running it, state exactly what was not run and why.
- Never edit generated files or lockfiles by hand unless the tool/workflow requires it; use the package manager and explain dependency changes.

---

## 9. Frontend boundaries: React Web and Flutter

- Use TypeScript for React Web. The POS mobile app uses Flutter + Dart; follow the pinned Flutter/Dart SDK versions and repository lint rules.
- Keep API calls in a consistent API/client layer and use TanStack Query for server state when established in the project. Use Zustand only for cross-screen client state that needs it; avoid duplicating server state in global stores. Do not scatter fetch logic throughout unrelated UI components.
- Keep financial totals and authorization decisions authoritative on the backend; client calculations are previews only and must be revalidated by the API.
- Build mobile-first and responsive interfaces with loading, empty, error, disabled, and success states. Preserve keyboard accessibility and semantic controls.
- Keep reusable UI components generic only when reuse is real; do not create an abstraction for a single trivial screen without a clear benefit.
- Flutter POS is a client of the same API/domain. Do not create a separate set of business rules for checkout, payments, cash, or inventory in the mobile app. Keep HTTP/API access in a dedicated data layer, use Riverpod for app state/dependency injection where appropriate, and verify plugin compatibility with the pinned Flutter/Dart SDK before adding native dependencies.

## Flutter implementation notes

- Jaga pemisahan presentation, application/state, data access, dan domain logic sesuai kompleksitas fitur.
- Letakkan komunikasi HTTP di data/API layer; widget tidak boleh menyimpan detail endpoint atau token.
- Riverpod dipakai untuk dependency/state lifecycle; jangan jadikan provider sebagai tempat menumpuk business rules.
- Model client hanya untuk kebutuhan tampilan dan serialization; backend tetap menghitung nilai final dan memutuskan authorization.
- Pisahkan local persistence/sync dari domain operations. Local database tidak boleh dianggap sebagai source of truth server.
- Uji business logic dengan unit test, UI dengan widget test, dan alur kritis dengan integration test bila tersedia.
- Periksa lifecycle, permission, dan plugin native pada perangkat/emulator target sebelum menyatakan fitur kamera, storage, atau printer siap.
