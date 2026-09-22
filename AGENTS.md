# AGENTS.md

> **Purpose:** Primary entry point for every AI/Coding Agent and developer working in this repository.  
> Read this file before planning, editing, refactoring, reviewing, or generating code.

---

## 1. Repository Mission

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
Transaction Context
+
Transactional Outbox
+
Event-Driven Integration
```

The repository is not microservices-first.

The goal is to preserve:

```text
Clear business ownership

Explicit architectural boundaries

Correct transaction behavior

Controlled module coupling

Operational reliability

Testability

Future evolvability
```

Do not optimize for the maximum number of abstractions, layers, or patterns.

---

## 2. Mandatory Reading Order

Before architecture-sensitive implementation, read in this exact order:

```text
1. AGENTS.md

2. .ai/overview.md

3. .ai/architecture.md

4. .ai/rules.md

5. .ai/conventions.md

6. .ai/workflow.md

7. .ai/module-template.md when creating or restructuring a module

8. Relevant module-specific documentation

9. Relevant source code

10. Relevant tests
```

Do not rely on remembered architecture when the repository documentation is available.

The repository files are the source of truth.

---

## 3. Instruction Precedence

When instructions conflict, use this order:

```text
1. Explicit user/task requirement

2. AGENTS.md

3. .ai/rules.md

4. .ai/architecture.md

5. .ai/overview.md

6. .ai/conventions.md

7. .ai/workflow.md

8. .ai/module-template.md when applicable

9. Existing local code conventions
```

If an explicit task requires breaking an architecture rule:

```text
Do not violate it silently.

Explain:
- which rule conflicts;
- why the exception is necessary;
- what trade-off is introduced;
- whether the exception is temporary or permanent.
```

---

## 4. Core Architectural Mental Model

The repository follows this dependency direction:

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

Interpretation:

```text
Presentation
    = how external actors enter the system

Application
    = what the use case must do

Domain
    = what is valid according to business rules

Infrastructure
    = how technical work is performed
```

Allowed:

```text
Presentation -> Application

Application -> Domain

Application -> Ports

Infrastructure -> Domain

Infrastructure -> Application Ports
```

Forbidden:

```text
Domain -> Infrastructure

Application -> TypeORM

Application -> raw Redis client

Application -> Kafka producer

Application -> vendor HTTP implementation

Module A -> Module B repository

Module A -> Module B ORM entity
```

---

## 5. Default Agent Workflow

Every non-trivial task follows:

```text
Understand
    |
    v
Inspect
    |
    v
Classify
    |
    v
Plan
    |
    v
Implement
    |
    v
Validate
    |
    v
Review
    |
    v
Report
```

Do not jump directly from task description to implementation when ownership, transaction, or architecture is unclear.

---

## 6. Before Changing Code

Before editing, determine:

```text
Which business module owns this behavior?

Is this READ-side or WRITE-side?

What is the use case?

Which business invariant is involved?

Does the operation require a transaction?

Does it require row locking?

Does it cross a module boundary?

Does the caller need an immediate result?

Is eventual consistency acceptable?

Does it emit an integration event?

Does it require Transactional Outbox?

Does it require idempotency?

Does it use Redis?

Does it call an external service?

What is the failure behavior?

What is the public API impact?

What tests prove correctness?
```

If these questions materially affect the implementation and are unanswered, inspect further before coding.

---

## 7. Business Module Ownership

A NestJS module represents a business capability, not a database table.

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

Do not create one module per table by default.

A table does not automatically imply a module.

Business concepts belong to the module that owns:

```text
Lifecycle
Behavior
Invariant
Public capability
```

---

## 8. Layer Responsibilities

### Presentation

Presentation may handle:

```text
Routing
Authentication
Authorization
Input validation
DTO parsing
Calling Application use cases
Response mapping
```

Presentation must not contain:

```text
Business rules
TypeORM queries
Transaction management
Kafka publishing
Redis implementation details
Large workflow orchestration
```

---

### Application

Application may coordinate:

```text
Domain
Repository Ports
UnitOfWork
Module Facades
Application Ports
Outbox
Cache Ports
External Integration Ports
```

Application must not depend directly on:

```text
DataSource
EntityManager
QueryRunner
Repository<T>
raw Redis client
Kafka producer
Axios implementation
vendor SDK implementation
```

Application defines:

```text
WHAT must happen.
```

---

### Domain

Domain contains:

```text
Entities
Aggregates
Value Objects
Business invariants
Domain Services
Domain Events
Domain Errors
State transitions
```

Domain must not depend on:

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
Vendor SDKs
```

Domain defines:

```text
WHAT is valid.
```

---

### Infrastructure

Infrastructure may contain:

```text
TypeORM
PostgreSQL
Redis
Kafka
HTTP clients
Vendor SDKs
Outbox persistence
Observability
Security adapters
Resilience
```

Infrastructure defines:

```text
HOW technical work is performed.
```

---

## 9. Read vs Write

Every API/use case must be classified as:

```text
READ
or
WRITE
```

### WRITE

Default flow:

```text
Controller
    -> Application Use Case
    -> UnitOfWork
    -> Domain
    -> Repository
    -> Outbox when required
```

### READ

Default flow:

```text
Controller
    -> Application Query
    -> Read Repository / Query Object
    -> Optimized SQL / Projection
    -> Read DTO
```

Do not rebuild rich Aggregates for simple read-heavy queries unless business behavior requires it.

---

## 10. Transaction Rules

Application owns:

```text
WHAT must be atomic.
```

Infrastructure owns:

```text
HOW the transaction works.
```

Use:

```ts
unitOfWork.transaction(async () => {
  ...
});
```

Do not use in Application code:

```ts
dataSource.transaction(...)
```

Do not pass around:

```text
EntityManager
QueryRunner
DataSource
```

Default nested behavior:

```text
Existing transaction -> join existing transaction

No transaction -> create transaction
```

Keep transactions short.

Do not keep slow network calls inside a DB transaction unless explicitly justified.

---

## 11. Repository Rules

Repositories exposed to Domain/Application are Ports.

Prefer business-oriented methods:

```text
findForUpdate()
findOpenInvoiceByRoom()
findActiveInvoice()
save()
```

Do not expose:

```text
Repository<T>
EntityManager
QueryBuilder
```

outside infrastructure.

Repositories are private implementation details of the owning module.

---

## 12. Persistence Ownership

ORM entities belong to their owning business module.

Prefer:

```text
modules/invoice/
└── infrastructure/
    └── persistence/
        └── typeorm/
            ├── entities/
            ├── repositories/
            └── mappers/
```

Do not create a global business entity directory such as:

```text
src/database/entities/
```

For complex domains:

```text
Domain Entity != ORM Entity
```

For simple CRUD, simpler persistence models are allowed.

---

## 13. Cross-Module Communication

Never access another module's repository directly.

Never access another module's ORM entity directly.

Forbidden:

```text
InvoiceModule -> MemberRepository

RoomModule -> InvoiceRepository

PromotionModule -> InvoiceOrmEntity
```

Preferred:

```text
Facade

Public Application Service

Query Port

Integration Port

Event
```

NestJS `exports` defines the module's public API.

Export public capabilities, not persistence internals.

---

## 14. Sync vs Async

Use synchronous communication when:

```text
The caller needs an immediate result to continue.
```

Use asynchronous communication when:

```text
The producer does not need an immediate result.

Eventual consistency is acceptable.

Consumers may evolve independently.
```

Do not use Kafka merely because Kafka exists.

---

## 15. Event Rules

Keep separate:

```text
Domain Event

Integration Event

Kafka Message
```

Domain Events must not know:

```text
Kafka topic
Partition
Serializer
Kafka SDK
Broker config
```

Integration Events are public contracts and should be versioned intentionally.

---

## 16. Transactional Outbox

Reliable DB + Kafka workflows must use Transactional Outbox or an equivalent atomic pattern.

Correct:

```text
BEGIN

Update Aggregate

Insert Outbox Event

COMMIT

Publish asynchronously
```

Incorrect:

```ts
unitOfWork.transaction(async () => {
  await repository.save(entity);
  await kafka.publish(event);
});
```

Kafka does not participate in PostgreSQL transactions.

---

## 17. Kafka Consumer Rules

Kafka consumers are inbound adapters.

Preferred:

```text
Kafka Message
    -> Consumer Adapter
    -> Deserialize / Validate
    -> Idempotency Check
    -> Application Use Case
```

Consumers must assume duplicate delivery is possible.

Use Inbox/idempotency where required.

Do not put hidden business logic directly in the consumer handler.

---

## 18. Redis Rules

Redis is infrastructure.

Do not inject raw Redis clients into Domain.

Prefer purpose-specific Ports:

```text
CachePort
DistributedLockPort
RateLimitPort
SessionStore
```

Default cache pattern:

```text
Cache-Aside
```

Every Redis usage must define:

```text
Purpose

Source of truth

TTL

Invalidation

Failure behavior
```

---

## 19. External Integration Rules

External systems must be accessed through Ports & Adapters.

Application depends on:

```text
PaymentGateway
MemberProvider
ExternalConfigPort
```

Infrastructure implements:

```text
VNPayAdapter
MoMoAdapter
HttpMemberAdapter
```

Every external integration should define:

```text
Timeout
Retry
Backoff
Circuit breaker
Fallback
Idempotency
Error mapping
Observability
```

---

## 20. Error Rules

Domain errors must be transport-independent.

Correct:

```ts
throw new InvoiceAlreadyPaidError();
```

Incorrect in Domain:

```ts
throw new ConflictException();
```

Presentation maps Domain/Application errors to transport responses.

Do not expose:

```text
Raw SQL
Stack traces
Secrets
Credentials
Internal infrastructure messages
```

to production clients.

---

## 21. Security Rules

Keep Authentication and Authorization separate.

Authentication:

```text
Who is the caller?
```

Authorization:

```text
What is the caller allowed to do?
```

Prefer permissions:

```text
invoice.create
invoice.pay
invoice.cancel
invoice.refund
promotion.update
```

Avoid scattered hard-coded role checks.

Authorization does not replace Domain invariants.

---

## 22. Observability Rules

Use structured logging.

Preserve correlation context where appropriate:

```text
requestId
traceId
correlationId
causationId
userId
storeId
```

Propagate through:

```text
Logs
External calls
Outbox events
Kafka messages
Workers
```

Do not use `console.log()` as the primary production diagnostic mechanism.

Never log secrets, tokens, passwords, or sensitive payment values.

---

## 23. Worker Rules

Workers, schedulers, Kafka consumers, and background jobs are inbound adapters.

They should call Application use cases.

Do not duplicate business logic inside:

```text
@Cron(...)
Kafka handlers
Queue handlers
Worker loops
```

---

## 24. Reporting Rules

Reporting is allowed to cross module-owned tables on the read side.

Read-side optimization may use:

```text
QueryBuilder
Raw SQL
Cross-module joins
Projections
```

Write-side ownership remains strict.

Do not call multiple business services merely to compose reports.

---

## 25. Testing Rules

Preferred strategy:

```text
Domain
    -> Unit tests

Application
    -> Use-case tests

Repository
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

## 26. Simplicity Rule

Do not add abstraction only because a pattern exists.

Do not force full DDD/CQRS into trivial CRUD.

Use the simplest implementation that preserves:

```text
Correctness

Ownership

Boundaries

Transaction safety

Testability

Operational safety
```

---

## 27. Plan Requirement

A written plan is required for:

```text
Architecture-sensitive changes

Multi-module changes

Meaningful multi-file behavior changes

Database migrations

Transaction changes

Kafka/Event changes

Redis behavior changes

External integrations

Security-sensitive work

Large refactors
```

A plan may be skipped for truly trivial changes.

---

## 28. Validation Requirement

Before marking work complete, run the validations supported by the repository and relevant to the change.

Typical:

```text
format
lint
typecheck
build
unit tests
integration tests
e2e tests
```

Never claim validation passed if it was not executed.

If validation could not run, state exactly why.

---

## 29. Self-Review Requirement

Before completion, review:

```text
Architecture boundaries

Module ownership

Transaction correctness

Race conditions

Cross-module coupling

Event consistency

Idempotency

Retry behavior

Cache behavior

External integration safety

Error boundaries

API contract

Migration safety

Security

Logging

Tests

Dead code

Unnecessary abstractions

Documentation drift
```

---

## 30. Definition of Done

A task is complete only when:

```text
[ ] Requirement is satisfied.

[ ] Owning module is correct.

[ ] READ/WRITE classification is correct.

[ ] Architecture boundaries are preserved.

[ ] Transaction behavior is correct.

[ ] Persistence ownership is correct.

[ ] Cross-module communication is correct.

[ ] Event consistency is correct if events are involved.

[ ] Idempotency exists where required.

[ ] Redis failure behavior is explicit where Redis is used.

[ ] External integration resilience is explicit where required.

[ ] Error boundaries are correct.

[ ] Public contracts are intentional.

[ ] Relevant tests exist.

[ ] Relevant validation has run.

[ ] No secrets or sensitive logs were introduced.

[ ] No unnecessary abstraction was introduced.

[ ] Architecture documentation is updated when architectural behavior changes.
```

---

## 31. Required Final Report

When finishing a non-trivial task, report:

```text
Summary

Files Changed

Architecture Decisions

Behavior Changes

Database / Migration Impact

Event / Integration Impact

Validation Performed

Known Risks / Limitations

Follow-up
```

Only include relevant sections.

Do not report only:

```text
Done.
```

---

## 32. Architecture Documentation Maintenance

If implementation changes an architectural rule:

```text
1. Update .ai/architecture.md

2. Update .ai/rules.md if enforcement changes

3. Update .ai/overview.md if the mental model changes

4. Update .ai/workflow.md if the agent process changes

5. Update examples/reference implementation

6. Document migration impact if existing code is affected
```

Architecture documentation and implementation must not intentionally drift.

---

## 33. Branch and Pull Request Guidance

For non-trivial changes:

```text
Use a dedicated branch.

Keep commits logically grouped.

Do not mix unrelated refactors.

Run validation before opening the PR.

Review the full diff.

Document architecture decisions.

Document migrations/breaking changes.

Document validation results.

Document known risks.
```

Recommended branch examples:

```text
feat/invoice-payment

fix/invoice-double-payment

refactor/transaction-context

infra/kafka-outbox

docs/architecture
```

---

## 34. Commit Guidance

Prefer intent-based commit messages.

Examples:

```text
feat(invoice): add payment use case

refactor(database): introduce transaction-aware repository provider

fix(loyalty): make points consumer idempotent

docs(architecture): define write API execution flow
```

Avoid:

```text
update

fix

changes
```

---

## 35. Final Operating Principle

When in doubt, optimize in this order:

```text
Correct Business Behavior
    ->
Clear Ownership
    ->
Correct Transaction Boundary
    ->
Low Coupling
    ->
Operational Reliability
    ->
Performance
    ->
Abstraction Elegance
```

Framework convenience must never silently override architecture.

Use the simplest implementation that still respects the repository's boundaries.
