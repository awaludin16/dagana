# Dagana — Engineering Standards

This document turns the architecture and product constraints in `PRD-Dagana.md` into concrete implementation and review standards. It is subordinate to the PRD for product behavior and complements the mandatory `AGENTS.md` rules.

## 1. Architecture boundaries

Dagana starts as a **modular monolith**. A module boundary is a business responsibility, not a deployable service. The code should be easy to split in the future, but future possibility is not a reason to implement distributed infrastructure now.

Initial logical domains:

| Domain | Primary responsibility |
|---|---|
| Identity | Authentication and user identity |
| Organization | Business, membership, and onboarding |
| Outlet | Outlet configuration and active operating context |
| Authorization | Permission catalog, role presets, outlet access |
| Catalog | Categories, menu/products, pricing, availability |
| Sales | Orders, order items, transaction lifecycle |
| Payment | Payment attempts, confirmations, refunds |
| Cash | Cash sessions, cash in/out, reconciliation |
| Inventory | Items, stock movements, adjustment, low stock |
| Ordering | POS and QR order channels using the same order use cases |
| Kitchen | Preparation status and queue |
| Reporting | Read-oriented summaries and reports |
| Billing | Platform usage fees; separate from customer payment |
| Audit | Traceable events for sensitive business actions |
| Notification | Delivery of system and realtime notifications |

Do not implement every domain before the MVP needs it. Establish boundaries incrementally as modules are built.

## 2. Laravel request-to-domain flow

Preferred flow:

```text
HTTP Route
  -> Authentication / tenant context
  -> Form Request validation
  -> Policy / permission check
  -> Thin Controller
  -> Domain Service or Action
  -> Eloquent + PostgreSQL transaction
  -> API Resource / consistent response
```

Recommended responsibilities:

- **Routes:** naming, middleware, version prefix, and endpoint-to-controller mapping.
- **Controller:** translate HTTP input into a use-case call and translate the result into HTTP output. No multi-step business process.
- **Form Request:** required/optional fields, type/range checks, and safe request validation.
- **Service/Action:** use-case orchestration and business rules. Give the operation an intention-revealing name such as `CheckoutService::checkout()`.
- **Model:** fields/casts, relationships, and narrow scopes. Avoid business process logic hidden inside observers/callbacks.
- **Policy:** resource- and context-specific access decisions. Permission keys may be checked by policies or shared authorization helpers.
- **API Resource:** explicit serialization, hiding internal fields, and consistent nested response shapes.
- **Job/Event:** work that is truly asynchronous or a side effect, such as sending a notification. Prefer dispatch after commit when the consumer needs persisted state.

A possible directory shape:

```text
apps/api/app/
├── Domain/
│   ├── Sales/
│   │   ├── Actions/
│   │   ├── DTOs/
│   │   ├── Exceptions/
│   │   ├── Models/
│   │   └── Services/
│   ├── Payment/
│   ├── Cash/
│   ├── Inventory/
│   └── ...
├── Http/
│   ├── Controllers/Api/V1/
│   ├── Requests/Api/V1/
│   └── Resources/Api/V1/
└── Policies/
```

This is a target convention, not a demand to reorganize working code wholesale. It is acceptable to keep common Laravel files where Laravel expects them, as long as ownership and responsibilities remain clear.

### Service vs. Action

Use a **Service** when a cohesive domain capability has several related operations or collaborators. Use an **Action** for a single, explicit use case when that makes the entry point clearer. Avoid a service that becomes a giant grab-bag, and avoid creating Service + Action + Manager + Handler + Repository layers that all forward the same call.

### Repository pattern

Do not create a repository interface and implementation for every model by default. Eloquent can remain the persistence layer unless complex queries, an actual persistence boundary, or tests justify a repository abstraction.

## 3. Tenancy and outlet scoping

The core relationship is `User -> Membership -> Business -> Outlet access -> Permission`. Keep that context explicit.

For every endpoint and job that accesses business data:

1. Authenticate the actor.
2. Resolve active membership/business context from trusted server-side context.
3. Verify the required permission.
4. Verify outlet access when the record is outlet-scoped.
5. Query the resource through the authorized business/outlet scope.
6. Record an audit event for sensitive state changes where required.

Avoid a convenience function that silently chooses the first business or outlet. Make context selection explicit. Use database constraints where applicable and include cross-tenant negative tests for endpoints, nested resources, exports, and background jobs.

## 4. Financial and operational invariants

### Checkout

A successful checkout should have a well-defined transaction boundary. Determine which features are enabled for that business/outlet, validate the cart and current prices on the server, and create immutable order-item price/name snapshots so future catalog edits do not change past receipts.

Within a database transaction, persist the order, item snapshots, internal payment state, applicable stock movements, cash-session impact, and audit information that must be atomic. Roll back together if a critical write fails. External payment-gateway requests should be modeled as a clear state machine and should not hold a database transaction open during network I/O.

### Idempotency and concurrency

- Define an idempotency key for retryable checkout/payment operations and enforce uniqueness in the database for the relevant scope.
- Store enough request/result state to return the original outcome for a repeated key rather than repeating side effects.
- Protect stock and cash records from concurrent updates using database constraints and row locks where a race is possible.
- Handle webhook duplicates, delayed callbacks, and invalid state transitions deterministically.

### Payment states

Keep the allowed transition graph explicit. Do not let any arbitrary API call set a payment to `PAID`. Provider confirmation must be authenticated and matched to the expected order/reference/amount. Refunds and partial refunds require separate, auditable records and rules.

### Cash

Treat the expected-cash calculation as a domain rule with unit tests. Record actual cash, expected cash, variance, responsible operator/session, and optional explanation at close. Do not infer the cause of a variance.

### Inventory

Use a stock-movement ledger for receipts, sales deductions, adjustment, and reversal. Define whether a transaction affects stock based on the enabled inventory/recipe behavior; absence of inventory setup must not block ordinary selling. Never silently overwrite stock history.

### Money and time

For the initial Indonesia-focused version, represent IDR amounts as integer whole rupiah (`BIGINT` where appropriate), not floating-point values. Use consistent timezone handling (store timestamps in UTC where the application configuration supports it and display in the configured local timezone, initially Asia/Jakarta). Document the rule when the first migrations/configuration are introduced.

## 5. Database standards

- Use migrations for every schema change and factories/seeders for repeatable developer/test data.
- Use foreign keys and database uniqueness constraints for important invariants, including idempotency and business-scoped keys where relevant.
- Add indexes based on query patterns (for example tenant/outlet scope plus created date/status), not blindly to every column.
- Avoid deleting orders, payment history, inventory movements, and closed cash sessions to repair mistakes; use explicit domain corrections.
- Prefer eager loading when returning relationship data; ensure list endpoints are paginated and have a reasonable maximum page size.
- If a schema decision is difficult to reverse or affects tenant boundaries, record it as an ADR under `docs/adr/`.

## 6. API standards

- Keep public API routes under `/api/v1`.
- Use stable resource names and consistent pluralization; avoid exposing internal class names as API contract.
- Standardize validation error shape, pagination, and error responses using one documented response convention.
- Use API Resources to define returned fields. Do not expose password hashes, internal tokens, secrets, or fields that are not required by clients.
- Use correct HTTP status codes and avoid returning HTTP 200 for failed operations.
- For breaking contract changes, document the migration/versioning plan instead of silently changing clients' expectations.

## 7. Frontend standards

### React applications

- Use React + TypeScript as specified in the PRD. Keep `strict` type checking enabled where the application setup supports it.
- Centralize API base URL, authentication/session handling, error parsing, and request metadata in an API client layer.
- Use the chosen query/cache library consistently for server state. Avoid duplicating the same server data in component-local state without a reason.
- Keep UI components focused. Put complex derived presentation logic in small functions/hooks, but keep domain authority in the backend.
- Make web views mobile-first and responsive. Include loading, empty, error, disabled, and success states, and keep form controls keyboard accessible.
- Do not hard-code permission assumptions into navigation alone. The UI may hide unavailable actions, while the API remains the security boundary.

### Flutter POS

- Treat Flutter as an API client, not a second implementation of the business domain.
- If offline POS is implemented later, document queue, retry, conflict, idempotency, and reconciliation behavior before considering it production-capable.
- Do not claim offline transaction sync is safe merely because local writes succeed.

## 8. Testing strategy

Use the testing level that proves the behavior without excessive setup.

| Test type | Use for |
|---|---|
| Unit | Money calculations, cash variance, state transitions, isolated inventory rules |
| Feature/API | Request validation, authentication, permissions, tenant/outlet scoping, response contract |
| Integration | PostgreSQL constraints, locking/idempotency behavior, queue/webhook integration |
| UI/component | Important form states, responsive navigation, loading/error states |
| End-to-end | A small number of high-value flows: onboarding, first sale, checkout/payment, closing cash |

Minimum test coverage when relevant:

- user A cannot read/change user B's business data;
- an employee cannot operate on an unauthorized outlet;
- invalid requests do not partially change records;
- failed checkout rolls back all related critical writes;
- retrying with the same idempotency key does not duplicate a sale;
- repeated payment callbacks do not duplicate stock/cash effects;
- cash expected/actual/variance calculations handle edge cases;
- transaction history remains stable after catalog price/name changes.

## 9. Code review checklist

- [ ] Does the change match the PRD and the MVP scope?
- [ ] Is each business rule in the appropriate domain service/action rather than in the controller/UI?
- [ ] Are authentication, permission, business scope, and outlet scope checked server-side?
- [ ] Could a retry or concurrent request duplicate or corrupt a payment, sale, stock, or cash result?
- [ ] Are critical writes transactional and state changes auditable?
- [ ] Are inputs validated and responses safe/consistent?
- [ ] Are migration constraints and indexes appropriate?
- [ ] Are tests added for happy path, invalid input, forbidden access, and important failure paths?
- [ ] Are secrets and real customer data absent from the diff?
- [ ] Are docs/API contracts updated where required?
- [ ] Were relevant automated checks executed, and are failures reported honestly?

## 10. CI baseline to establish

As the codebases are initialized, add automated checks appropriate to each package:

- Laravel: automated tests, Laravel Pint formatting check, and static analysis if adopted.
- React: lint, TypeScript type-check, unit/component tests, and production build.
- Flutter: `dart format --output=none --set-exit-if-changed`, `flutter analyze`, and relevant tests.
- Dependency and secret scanning should be added when the repository hosting/CI is selected.

CI should fail on a broken required check. Avoid making a check mandatory until its setup and command are reproducible in a clean checkout.
