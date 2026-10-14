# AGENTS.md — Dagana Engineering Rules

This file is the mandatory operating guide for coding agents working in the Dagana repository. The product specification remains in `PRD-Dagana.md`; implementation detail is in `docs/engineering-standards.md` and `docs/development-environment.md`.

## 1. Source of truth and first steps

1. Read this file, the relevant PRD sections, and relevant documents under `docs/` before making changes.
2. Inspect the repository layout, current Git branch, `git status`, nearby implementation, and tests before assuming how something works.
3. Treat existing uncommitted user changes as intentional. Do not overwrite, reset, clean, or reformat unrelated work.
4. For changes spanning multiple domains, changing architecture, or touching a critical transaction, outline a short plan and identify risks before editing.
5. Implement the smallest coherent change that satisfies the request. Do not add dependencies, abstractions, services, or scope without a concrete reason.
6. If requirements conflict, follow the PRD for product behavior, this file for agent behavior, and the relevant engineering document for implementation standards. Call out unresolved product decisions rather than silently deciding them.

## 2. Product and architecture guardrails

- Dagana is an F&B operating platform. Keep scope aligned with the PRD and the defined MVP.
- Use a **modular monolith**: one Laravel backend, one primary relational database, and clear business-domain boundaries. Do not introduce microservices without an explicit decision recorded in an ADR.
- Backend business rules are authoritative. Frontend validation improves UX but never replaces backend validation or authorization.
- POS, QR ordering, payment, cash, inventory, and reporting must share the same order/domain rules and source of truth. Do not duplicate checkout rules in different channels.
- Keep merchant onboarding and the first-sale workflow simple. Do not make optional setup (employees, QR, recipes, or inventory) mandatory unless the PRD is explicitly revised.
- Maintain mobile-first responsive behavior for web screens. Do not assume a mobile operator will always use portrait orientation; operational screens such as POS/cashier should remain usable in the supported orientations described by the UX requirements.

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

## 4. Multi-tenancy and authorization — critical

- Every business-owned record must be scoped to the active `business_id`; outlet-owned operational records must also be scoped to the correct `outlet_id` when relevant.
- Resolve the active business, membership, and outlet access from trusted authenticated context. Never trust a client-supplied `business_id`, `outlet_id`, membership ID, or role without verifying that the authenticated user may access it.
- Enforce authorization on the backend for every read and write path, including exports, nested routes, background jobs, and realtime subscriptions.
- Do not query a record by its ID alone when it belongs to a tenant. Scope the query first, then retrieve the record.
- Roles are permission presets; permissions and explicit outlet access govern authorization. Do not scatter hard-coded `OWNER`/`CASHIER` checks when a permission check is appropriate.
- A user lacking access must not be able to infer another tenant's data from response bodies, counts, errors, search results, reports, or logs exposed to clients.
- Add tests proving that Business A cannot read or mutate Business B data and that users without outlet access cannot act on that outlet.

## 5. Transaction, payment, cash, and inventory integrity

- Checkout must be atomic for database changes that must succeed together: order and item snapshots, payment record/status, inventory movement where enabled, cash-session impact where applicable, and audit event.
- Use `DB::transaction()` for multi-record operations. Use row locking (for example, `lockForUpdate`) only where concurrent requests can cause lost updates, overselling, or cash/session inconsistencies.
- Add idempotency handling to retryable transaction/payment endpoints. A retry must not create a duplicate sale, payment, stock deduction, or platform fee.
- Do not trust a payment success redirect as proof of payment. Verify provider webhooks/signatures and handle duplicate/out-of-order notifications safely if a gateway is integrated.
- Keep external network calls out of a long-running database transaction wherever possible. Persist the internal state safely, then use an explicit retryable workflow for the external operation.
- Do not delete completed financial/stock history to correct mistakes. Use the domain's cancellation, refund, reversal, or adjustment flow and retain an audit trail.
- Represent IDR amounts as integer whole-rupiah values in the initial Indonesia-focused product; never calculate money using PHP/JavaScript floating-point values. Revisit the model explicitly before adding other currencies or fractional minor units.
- Stock changes should be explainable through stock-movement records, not an unexplained update to a current-stock number.

## 6. Validation, errors, and API compatibility

- Keep API routes versioned under `/api/v1` as specified in the PRD.
- Validate all untrusted input server-side through Form Requests or an equally clear validation boundary.
- Return consistent status codes and response shapes using the project's established response convention. Do not introduce a second response envelope without an explicit migration plan.
- Do not expose stack traces, SQL errors, secrets, internal filesystem paths, or payment credentials in API errors.
- Paginate potentially large lists and define sensible limits for search/filter inputs. Avoid unbounded queries and accidental N+1 relationships.
- Treat changes to response fields, status enums, and permission names as API/domain changes: update contracts, tests, and docs.

## 7. Database and migrations

- Use PostgreSQL as the primary database and Redis for the purposes defined in the PRD (cache/queue/rate limiting/realtime support as adopted).
- Schema changes must be represented by migrations. Do not rely on manually editing a developer's database.
- Make migrations reversible where practical and safe. Do not modify a migration that may already have run in a shared environment; create a new migration instead.
- Add foreign keys, unique constraints, useful indexes, and tenant-aware constraints where the domain requires them. Application validation alone is not enough for important uniqueness/integrity rules.
- Use factories and seeders for repeatable local/test data. Never place real customer or production data in committed seeds or fixtures.
- Consider existing data and lock duration before writing migrations that alter large tables.

## 8. Testing and quality gates

- Add or update tests whenever behavior changes. Do not weaken/remove a test only to make a change pass; explain and replace it when the expected behavior truly changed.
- Minimum critical coverage: validation, permissions, tenant isolation, checkout atomicity/rollback, idempotency, payment state transitions, cash reconciliation arithmetic, and inventory movement whenever those areas change.
- Prefer feature tests for HTTP/API behavior and unit tests for isolated calculations/rules. Test failure paths as well as happy paths.
- Run the narrowest relevant tests while iterating, then run the broader available test/lint/static-analysis commands before declaring completion.
- Do not claim a test passed unless it was actually executed. If environment/dependencies prevent running it, state exactly what was not run and why.
- Never edit generated files or lockfiles by hand unless the tool/workflow requires it; use the package manager and explain dependency changes.

## 9. React, TypeScript, and Flutter boundaries

- Use TypeScript for React applications; avoid `any` unless justified and tightly contained.
- Keep API calls in a consistent API/client layer and use the established query/cache approach. Do not scatter fetch logic throughout unrelated UI components.
- Keep financial totals and authorization decisions authoritative on the backend; client calculations are previews only and must be revalidated by the API.
- Build mobile-first and responsive interfaces with loading, empty, error, disabled, and success states. Preserve keyboard accessibility and semantic controls.
- Keep reusable UI components generic only when reuse is real; do not create an abstraction for a single trivial screen without a clear benefit.
- Flutter POS is a client of the same API/domain. Do not create a separate set of business rules for checkout, payments, cash, or inventory in Flutter.

## 10. Git and collaboration rules

- Use a feature/fix/docs/refactor/test branch for a discrete unit of work. Suggested names: `feat/checkout-flow`, `fix/tenant-scope`, `docs/docker-setup`.
- Use Conventional Commits, e.g. `feat(pos): add checkout flow`, `fix(auth): enforce outlet access`, `test(cash): cover closing variance`, `docs(dev): document Docker setup`.
- Do not create commits, push branches, open PRs, merge, rebase shared branches, or change remote settings unless the user explicitly asks.
- Never use `git reset --hard`, `git clean -fd`, force-push, or other destructive Git operations unless the user specifically requests the operation and its impact is clear.
- Before finishing, inspect `git diff` and `git status`; report files changed, key choices, commands/tests run, and remaining caveats.

## 11. Secrets, dependencies, and destructive operations

- Never commit `.env`, API keys, signing keys, tokens, real credentials, production dumps, or sensitive customer data. Keep safe placeholders in example files.
- Explain the purpose and impact before adding a new runtime dependency. Prefer existing framework capabilities when they fit.
- Ask for explicit authorization before destructive database actions, volume deletion, bulk data cleanup, or external actions with real side effects.
- Never point development tools at production by default. Local Docker settings must be clearly marked development-only.

## 12. Completion report

At the end of a task, summarize:

1. What changed and why.
2. Important files/modules touched.
3. Tests, formatters, linters, or checks actually run and their results.
4. Any decisions still open, assumptions made, or steps the user must perform.

Do not claim the application is production-ready solely because it compiles or the happy path works.
