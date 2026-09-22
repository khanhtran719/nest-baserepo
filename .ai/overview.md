# Repository Architecture Overview

> **Purpose:** Fast architectural orientation for developers and AI/Coding Agents.  
> This file is intentionally concise. For normative rules and execution details, read `.ai/architecture.md`.

---

## 1. What This Repository Is

This repository is a production-grade NestJS backend foundation designed around:

```text
Modular Monolith
+
DDD-lite
+
Clean Architecture
+
Hexagonal Architecture / Ports & Adapters
+
CQRS-lite
+
Repository Pattern
+
Unit of Work
+
Transactional Outbox
+
Event-Driven Integration
```

It is **not a microservices-first architecture**.

The system starts as one logical backend while preserving strong business-module boundaries so selected modules can be extracted later if real scaling, ownership, or deployment requirements justify it.

The primary goals are:

```text
Clear ownership
Explicit boundaries
Correct transactions
Controlled coupling
Operational reliability
Testability
Future evolvability
```

The goal is not to maximize patterns, abstractions, or folder count.

---

## 2. Core Mental Model

The repository follows this dependency model:

```text
Presentation
     |
     v
Application
     |
     v
Domain / Ports
     ^
     |
Infrastructure
```

Think of each layer as:

```text
Presentation
    = how the outside world enters the system

Application
    = what the use case must do

Domain
    = what is valid according to business rules

Infrastructure
    = how technical work is performed
```

Allowed dependency direction:

```text
Presentation -> Application
Application  -> Domain
Application  -> Ports

Infrastructure -> Domain
Infrastructure -> Application Ports
```

Forbidden direction:

```text
Domain -> Infrastructure
Application -> TypeORM
Application -> raw Redis client
Application -> Kafka producer
Application -> vendor HTTP SDK
Module A -> Module B repository
Module A -> Module B ORM entity
```

---

## 3. Repository Shape

Target top-level structure:

```text
src/
├── main.ts
├── app.module.ts
│
├── config/
│
├── shared/
│   ├── domain/
│   ├── application/
│   └── common/
│
├── modules/
│   ├── invoice/
│   ├── member/
│   ├── promotion/
│   ├── loyalty/
│   ├── room/
│   ├── shift/
│   ├── store/
│   └── reporting/
│
├── infrastructure/
│   ├── database/
│   ├── messaging/
│   ├── outbox/
│   ├── cache/
│   ├── integrations/
│   ├── security/
│   ├── observability/
│   └── resilience/
│
└── workers/
    ├── kafka/
    ├── outbox/
    ├── scheduler/
    └── reconciliation/
```

Do not create empty folders merely to match the target tree.

Create only what current implementation requires.

---

## 4. Business Modules

A module represents a **business capability**, not a database table.

Good examples:

```text
InvoiceModule
PromotionModule
MemberModule
LoyaltyModule
RoomModule
ShiftModule
StoreModule
ReportingModule
```

Avoid table-driven modules such as:

```text
InvoiceItemModule
InvoiceVatModule
InvoiceDiscountModule
```

unless those concepts genuinely have their own business lifecycle and public capability.

A table does not automatically imply a NestJS module.

---

## 5. Module Internal Structure

A complex business module should generally follow:

```text
modules/<module>/
├── <module>.module.ts
│
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   ├── services/
│   ├── events/
│   ├── enums/
│   └── errors/
│
├── application/
│   ├── commands/
│   ├── queries/
│   ├── services/
│   ├── facades/
│   ├── ports/
│   └── dto/
│
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── entities/
│           ├── repositories/
│           └── mappers/
│
└── presentation/
    └── http/
        ├── controllers/
        └── dto/
```

Simple CRUD modules may use a smaller structure.

Do not force full DDD ceremony where business complexity does not justify it.

---

## 6. Ownership Rules

Business concepts belong to the module that owns their lifecycle and behavior.

Example:

```text
Invoice Aggregate
├── Invoice
├── InvoiceItem
├── InvoicePayment
├── InvoiceDiscount
├── InvoiceVAT
├── InvoiceCoupon
└── InvoiceRequiredCharge
```

Application code should usually persist the aggregate through one repository abstraction:

```ts
await invoiceRepository.save(invoice);
```

It should not need to know that persistence spans multiple database tables.

---

## 7. Domain Layer

Domain code contains:

```text
Business behavior
Business invariants
Entities
Aggregates
Value Objects
Domain Services
Domain Events
Domain Errors
```

Domain code must not depend on:

```text
NestJS
TypeORM
PostgreSQL
Redis
Kafka
HTTP
Axios
Express
Fastify
```

Example:

```ts
export class Invoice {
  pay(payment: Payment): void {
    if (this.status !== InvoiceStatus.OPEN) {
      throw new InvoiceCannotBePaidError();
    }

    this.payments.push(payment);
    this.status = InvoiceStatus.PAID;
  }
}
```

The Domain answers:

```text
"What is valid?"
```

---

## 8. Application Layer

Application code orchestrates use cases.

Examples:

```text
CreateInvoice
PayInvoice
CancelInvoice
ApplyPromotion
CloseShift
AddMemberPoints
```

Application may coordinate:

```text
Domain entities
Repository ports
UnitOfWork
Module facades/ports
Outbox
Cache ports
External integration ports
```

The Application answers:

```text
"What must happen?"
```

It must not know low-level TypeORM, Redis, Kafka, or vendor HTTP implementation details.

---

## 9. Standard Write Flow

State-changing APIs should follow:

```text
HTTP Request
    |
    v
Controller
    |
    v
Authentication / Authorization
    |
    v
Request Validation
    |
    v
Application Use Case
    |
    v
UnitOfWork.transaction()
    |
    +--> Load Aggregate / State
    +--> Validate Current State
    +--> Execute Domain Behavior
    +--> Persist Aggregate
    +--> Persist Outbox Event when required
    |
    v
COMMIT
    |
    v
Application Result
    |
    v
Response DTO
```

The Controller remains thin.

The Application defines the atomic use case.

The Domain protects business validity.

Infrastructure performs persistence mechanics.

---

## 10. Standard Read Flow

Read-heavy APIs should follow:

```text
HTTP Request
    |
    v
Controller
    |
    v
Query DTO
    |
    v
Application Query
    |
    v
Read Repository / Query Object
    |
    v
Optimized SQL / QueryBuilder / Projection
    |
    v
Read DTO
```

Read-side code does not need to rebuild a rich Domain Aggregate when the use case is only listing, searching, or reporting.

This repository uses **CQRS-lite**, not full CQRS by default.

---

## 11. Transactions

Application code declares the transaction boundary through:

```ts
return unitOfWork.transaction(async () => {
  ...
});
```

Application code must not receive or pass around:

```text
EntityManager
QueryRunner
DataSource
TypeORM Repository<T>
```

Infrastructure propagates the active transaction using `AsyncLocalStorage`.

Default nested transaction semantics:

```text
Existing transaction -> join existing transaction
No transaction       -> create transaction
```

Transactions should be short and protect a specific invariant.

---

## 12. Persistence

For complex domains:

```text
Domain Entity != ORM Entity
```

Example:

```text
domain/entities/invoice.ts

infrastructure/persistence/typeorm/entities/
invoice.orm-entity.ts
```

Persistence mapping belongs to infrastructure:

```text
Domain
  ^
  |
Mapper
  |
  v
ORM Entity
```

Do not maintain one global `src/database/entities/` directory.

ORM entities belong to the business module that owns them.

---

## 13. Repository Rules

Repository interfaces exposed to Application/Domain express business persistence semantics.

Prefer:

```text
findForUpdate()
findOpenInvoiceByRoom()
findActivePromotion()
save()
```

over meaningless wrappers around TypeORM CRUD.

Repository implementations belong to module infrastructure.

Repositories are private implementation details of the owning module.

---

## 14. Cross-Module Communication

Forbidden:

```text
InvoiceModule -> MemberRepository
RoomModule -> InvoiceRepository
PromotionModule -> InvoiceOrmEntity
```

Preferred:

```text
InvoiceModule -> MemberFacade
InvoiceModule -> PromotionPort
InvoiceModule -> MemberQuery
InvoiceModule -> Integration Event
```

A module exposes public capabilities, not its persistence internals.

NestJS `exports` should reflect that public API.

---

## 15. Sync vs Async Communication

Use synchronous communication when the caller needs an immediate result.

Example:

```text
InvoiceUseCase
    -> PromotionFacade
    -> PromotionResult
    -> InvoiceUseCase continues
```

Use asynchronous events when the producer does not require an immediate result and eventual consistency is acceptable.

Example:

```text
InvoicePaid
    -> Outbox
    -> Kafka
    -> Loyalty Consumer
    -> AddPoints Use Case
```

Do not use Kafka merely because Kafka exists.

---

## 16. Transactional Outbox

Never implement reliable DB + Kafka workflows as:

```text
save database
then
publish Kafka directly
```

Use:

```text
BEGIN

Update Aggregate
Insert Outbox Event

COMMIT
```

Then:

```text
Outbox
   |
   v
Publisher / CDC
   |
   v
Kafka
```

This prevents the database and message broker from becoming inconsistent due to a partial failure.

---

## 17. Kafka Consumers

Kafka consumers are inbound adapters.

Preferred flow:

```text
Kafka Message
    |
    v
Consumer Adapter
    |
    v
Deserialize / Validate
    |
    v
Inbox / Idempotency Check
    |
    v
Application Use Case
    |
    v
Domain / Repository / UnitOfWork
```

Consumers must assume messages may be delivered more than once.

Outbox protects producers.

Inbox/idempotency protects consumers.

---

## 18. Redis

Redis is infrastructure.

Do not inject raw Redis clients into Domain code.

Prefer purpose-specific abstractions:

```text
CachePort
DistributedLockPort
RateLimitPort
SessionStore
```

Default caching strategy:

```text
Cache-Aside
```

Database remains the source of truth unless explicitly designed otherwise.

Every Redis use case must define what happens when Redis is unavailable.

---

## 19. External Integrations

External systems are accessed through Ports & Adapters.

Example:

```text
Application
    |
    v
PaymentGateway Port
    ^
    |
VNPayAdapter / MoMoAdapter
```

Application code must not depend directly on Axios or vendor SDKs.

Each external call should explicitly define:

```text
Timeout
Retry policy
Backoff
Circuit breaker
Fallback
Idempotency requirements
```

---

## 20. API / Presentation

Controllers should handle only:

```text
Routing
Authentication
Authorization
Validation
DTO parsing
Application use-case invocation
Response mapping
```

Controllers must not contain:

```text
Business calculations
TypeORM queries
Transaction management
Kafka publishing
Redis implementation details
```

Do not return ORM entities directly from controllers.

---

## 21. Error Handling

Domain code throws transport-independent domain errors.

Example:

```ts
throw new InvoiceAlreadyPaidError();
```

Presentation maps them to transport errors:

```text
InvoiceAlreadyPaidError
    -> HTTP 409
    -> INVOICE_ALREADY_PAID
```

Domain code must not throw NestJS HTTP exceptions.

Production responses must not expose raw SQL, stack traces, secrets, or internal infrastructure errors.

---

## 22. Security

Keep Authentication and Authorization separate.

Authentication answers:

```text
Who is the caller?
```

Authorization answers:

```text
What is the caller allowed to do?
```

Prefer permissions/capabilities such as:

```text
invoice.create
invoice.pay
invoice.cancel
invoice.refund
promotion.update
```

Avoid scattered role checks throughout business code.

---

## 23. Observability

The system should support:

```text
Structured logging
Metrics
Distributed tracing
Audit logging
Correlation IDs
```

Useful context fields include:

```text
requestId
traceId
correlationId
userId
storeId
invoiceId
module
operation
duration
```

Do not rely on `console.log()` for production diagnostics.

Never log secrets, credentials, tokens, or sensitive payment data.

---

## 24. Background Workers

Asynchronous workloads may run as separate processes while remaining in the same repository.

Examples:

```text
Kafka consumers
Outbox publisher
Schedulers
Reconciliation jobs
Heavy background processing
```

Workers, cron jobs, and message handlers should call Application use cases rather than duplicate business logic.

---

## 25. Reporting

Reporting is allowed to cross module-owned tables on the **read side**.

Example:

```text
ReportingQuery
    -> Invoices
    -> Items
    -> Members
    -> Stores
    -> Users
    -> Shifts
```

Do not call multiple business services merely to compose a report.

Write-side ownership remains strict.

Read-side optimization may be pragmatic.

---

## 26. Testing

Testing strategy:

```text
Domain
    -> Unit tests

Application
    -> Use-case tests

Repositories
    -> Integration tests with real PostgreSQL

Kafka / Redis
    -> Integration tests

HTTP
    -> E2E tests

Cross-system contracts
    -> Contract tests where valuable
```

Do not mock TypeORM merely to prove a TypeORM repository implementation works.

---

## 27. Deployment

A Modular Monolith can still scale horizontally.

```text
Load Balancer
     |
 +---+---+
 |   |   |
 v   v   v
API API API
```

Application instances should remain stateless where practical.

Database failover, HAProxy, replicas, Kafka clustering, Redis clustering, and infrastructure failover are infrastructure concerns.

Business code must not contain deployment or failover awareness.

---

## 28. Architecture Decision Checklist

Before implementing a feature, determine:

```text
Which module owns this behavior?

Is this read-side or write-side?

Does it require a transaction?

Which invariant does the transaction protect?

Does it cross a module boundary?

Does the caller need an immediate result?

Is eventual consistency acceptable?

Does it emit an integration event?

Does it require idempotency?

Does it use Redis?

What happens when Redis is down?

Does it call an external system?

What is the timeout/retry/idempotency policy?

Is a new abstraction justified?
```

---

## 29. Rules Agents Must Preserve

Agents must:

```text
Keep business logic inside business modules.

Keep TypeORM inside persistence infrastructure.

Keep EntityManager hidden from Application/Domain.

Use UnitOfWork for multi-step atomic database operations.

Keep repositories private to owning modules.

Use facades/ports/events for cross-module communication.

Use Transactional Outbox for reliable DB + Kafka workflows.

Make Kafka consumers idempotent.

Keep controllers thin.

Keep Domain errors transport-independent.

Use structured observability.

Prefer simple architecture for simple CRUD.
```

Agents must not:

```text
Call DataSource.transaction() from Application services.

Pass EntityManager through business methods.

Access another module's repository directly.

Access another module's ORM entity directly.

Create one Nest module per database table.

Publish Kafka inside a PostgreSQL transaction.

Inject raw Redis clients into Domain code.

Return ORM entities directly from controllers.

Throw HTTP exceptions from Domain code.

Introduce full DDD/CQRS ceremony into trivial CRUD without justification.

Couple business logic to deployment or HA mechanics.
```

---

## 30. Reading Order

This file is a fast overview.

Before implementing or changing architecture-sensitive code, read:

```text
AGENTS.md
    |
    v
.ai/overview.md
    |
    v
.ai/architecture.md
    |
    v
.ai/rules.md
    |
    v
.ai/conventions.md
    |
    v
.ai/workflow.md
    |
    v
.ai/module-template.md when creating or restructuring a module
```

Use:

```text
overview.md
    = fast mental model

architecture.md
    = full normative architecture contract

rules.md
    = compact MUST / MUST NOT enforcement

conventions.md
    = normative code shape and naming contract

workflow.md
    = how agents should execute tasks

module-template.md
    = approved module blueprints; use only when applicable
```

---

## 31. Final Principle

Always choose the simplest implementation that still preserves:

```text
Clear ownership
Explicit boundaries
Correct transactions
Business readability
Controlled coupling
Operational reliability
Testability
Future evolvability
```

Framework convenience must never silently override architectural boundaries.
