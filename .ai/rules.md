# Repository Rules

> **Status:** Normative Enforcement Rules  
> This file is a compact enforcement layer for developers and AI/Coding Agents.  
> For full reasoning, examples, and execution flows, read `.ai/architecture.md`.

---

## 1. Rule Precedence

When instructions conflict, use this precedence:

```text
1. Explicit user/task requirement
2. AGENTS.md
3. .ai/rules.md
4. .ai/architecture.md
5. .ai/overview.md
6. .ai/conventions.md
7. .ai/workflow.md
8. .ai/module-template.md when applicable
9. Existing code conventions
```

If a task requires violating an architecture rule:

```text
DO NOT violate it silently.

Explain:
- which rule conflicts;
- why the exception is required;
- what trade-off is introduced;
- whether the exception is temporary or permanent.
```

---

## 2. Core Architectural Rule

The repository follows:

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

### MUST

```text
Presentation -> Application

Application -> Domain

Application -> Ports

Infrastructure -> Domain

Infrastructure -> Application Ports
```

### MUST NOT

```text
Domain -> Infrastructure

Application -> TypeORM

Application -> raw Redis client

Application -> Kafka producer

Application -> vendor SDK implementation

Module A -> Module B repository

Module A -> Module B ORM entity
```

---

## 3. Business Module Ownership

A NestJS module MUST represent a business capability.

Examples:

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

### MUST

- Keep business behavior inside its owning module.
- Keep persistence implementation inside its owning module.
- Keep module public API explicit.
- Treat NestJS `exports` as part of the module's public contract.

### MUST NOT

- Create one module per database table by default.
- Move business-specific helpers into global `common`.
- Let another module access internal repository implementations.
- Let another module access internal ORM entities directly.

A table does not automatically imply a module.

---

## 4. Module Creation Rule

Before creating a new module, the agent MUST answer:

```text
Does this represent a real business capability?

Does it own a distinct lifecycle?

Does it expose meaningful behavior?

Would another module interact with it through a public capability?
```

If the answer is mostly `no`, the code probably belongs in an existing module.

---

## 5. DDD-lite Rule

The repository uses DDD selectively.

### MUST

Use rich Domain modeling when the business concept has:

```text
Meaningful behavior
Invariants
State transitions
Business rules
Complex lifecycle
```

### MUST NOT

Force these into trivial CRUD without justification:

```text
Aggregate
Value Object
Domain Service
Domain Event
Separate Domain Entity
Separate ORM Entity
CQRS Command/Handler ceremony
```

Use the simplest implementation that preserves boundaries.

---

## 6. Domain Rules

Domain code owns business validity.

Domain MAY contain:

```text
Entities
Aggregates
Value Objects
Domain Services
Domain Events
Domain Errors
Business invariants
```

### MUST

- Keep business state transitions inside Domain when they are true domain behavior.
- Use domain-specific errors.
- Keep Domain tests independent from NestJS.

### MUST NOT

Domain MUST NOT depend on:

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

Domain MUST NOT throw:

```text
BadRequestException
ConflictException
HttpException
```

---

## 7. Application Rules

Application code orchestrates use cases.

Application MAY depend on:

```text
Domain
Repository Ports
UnitOfWork
Module Facades
Application Ports
Outbox Port
Cache Port
Integration Port
```

### MUST

- Make important use cases explicit.
- Make transaction boundaries visible.
- Coordinate Domain behavior and ports.
- Return application results, not ORM entities.

### MUST NOT

Application MUST NOT directly use:

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

---

## 8. Presentation Rules

Controllers, Kafka consumers, schedulers, and workers are inbound adapters.

### Controllers MUST handle only

```text
Routing
Authentication
Authorization
Input validation
DTO parsing
Application use-case invocation
Response mapping
```

### Controllers MUST NOT contain

```text
Business calculations
TypeORM queries
Transaction management
Kafka publishing
Redis implementation details
Large workflow orchestration
```

### MUST NOT

- Return ORM entities directly.
- Put business rules in DTOs.
- Put business state transitions in controllers.

---

## 9. Read vs Write Rule

Every API/use case MUST be classified as:

```text
READ
or
WRITE
```

### WRITE

Prefer:

```text
Controller
    -> Application Use Case
    -> UnitOfWork
    -> Domain
    -> Repository
```

### READ

Prefer:

```text
Controller
    -> Application Query
    -> Read Repository / Query Object
    -> Optimized SQL / Projection
    -> Read DTO
```

### MUST NOT

Rebuild rich Aggregates for simple list/search/report queries unless business rules require it.

---

## 10. Transaction Rule

Application owns **what must be atomic**.

Infrastructure owns **how the transaction works**.

### MUST

Use:

```ts
unitOfWork.transaction(async () => {
  ...
});
```

for multi-step atomic DB operations.

### MUST NOT

Do not write:

```ts
dataSource.transaction(...)
```

inside Application code.

Do not write:

```ts
unitOfWork.transaction(async manager => {
  ...
});
```

Do not pass through business methods:

```text
EntityManager
QueryRunner
DataSource
```

### Default nested transaction behavior

```text
Existing transaction -> join existing transaction
No transaction       -> create transaction
```

Do not create independent nested transactions unless explicitly required.

---

## 11. Transaction Length Rule

Transactions MUST be as short as practical.

### MUST

Identify the invariant being protected.

Example:

```text
Invoice status update
+
Payment record
+
Outbox event
```

may need one atomic transaction.

### MUST NOT

Wrap unrelated workflows in one transaction.

Avoid long external network calls while holding DB locks or transactions.

---

## 12. Transaction Context Rule

The infrastructure transaction context MAY use `AsyncLocalStorage`.

### MUST

- Keep the active `EntityManager` inside infrastructure.
- Resolve transaction-aware TypeORM repositories at call time.

### MUST NOT

- Expose transaction context to Domain.
- Expose transaction context to Application.
- Cache a transaction-aware TypeORM repository in a constructor.

Correct:

```ts
private get repository() {
  return this.repositories.getRepository(
    InvoiceOrmEntity,
  );
}
```

or resolve inside each method.

---

## 13. Repository Rule

Repository Ports represent business persistence capabilities.

### MUST

Prefer business-oriented methods:

```text
findForUpdate()
findOpenInvoiceByRoom()
findActiveInvoice()
save()
```

### MUST NOT

- Expose TypeORM `Repository<T>` outside infrastructure.
- Expose `QueryBuilder` outside infrastructure.
- Expose `EntityManager` outside infrastructure.
- Create repositories that only mirror generic TypeORM CRUD without value.

---

## 14. Aggregate Persistence Rule

Application SHOULD persist an Aggregate through one primary repository abstraction.

Example:

```ts
await invoiceRepository.save(invoice);
```

### MUST NOT

Application should not know aggregate table structure:

```ts
await invoiceRepository.save(invoice);
await invoiceItemRepository.save(items);
await invoicePaymentRepository.save(payments);
```

Infrastructure may persist multiple tables internally.

---

## 15. ORM Entity Ownership Rule

ORM entities belong to the module that owns the business lifecycle.

### MUST

Prefer:

```text
modules/invoice/
└── infrastructure/
    └── persistence/
        └── typeorm/
            └── entities/
```

### MUST NOT

Create or maintain a global business entity directory such as:

```text
src/database/entities/
```

Shared database infrastructure should contain only technical DB concerns:

```text
database.module.ts
data-source.ts
transaction/
migrations/
```

---

## 16. Domain Entity vs ORM Entity Rule

For complex modules:

```text
Domain Entity != ORM Entity
```

### MUST

Use mappers when the business model and persistence model are separated.

### MUST NOT

Put TypeORM decorators on Domain Entities in complex domains.

### EXCEPTION

Simple CRUD modules may use a simpler model if there is no meaningful Domain behavior.

---

## 17. Cross-Module ORM Rule

Within the same module:

```text
ORM relations are allowed when useful.
```

Across modules:

```text
Prefer scalar IDs.
```

Example:

```ts
storeId: string;
```

instead of:

```ts
@ManyToOne(() => StoreOrmEntity)
store: StoreOrmEntity;
```

### Important

```text
Database Foreign Key
!=
ORM Object Graph
!=
Business Dependency
```

Database foreign keys may remain.

---

## 18. Cross-Module Communication Rule

Repositories are private to their owning modules.

### MUST NOT

```text
InvoiceModule -> MemberRepository

RoomModule -> InvoiceRepository

PromotionModule -> InvoiceOrmEntity
```

### MUST

Use one of:

```text
Facade
Public Application Service
Query Port
Integration Port
Domain/Application Event
```

---

## 19. Synchronous Communication Rule

Use synchronous cross-module communication when the caller needs an immediate result.

Example:

```text
InvoiceUseCase
    -> PromotionFacade
    -> PromotionResult
    -> InvoiceUseCase continues
```

### MUST

The owning module remains responsible for its business rules.

### MUST NOT

Bypass the owning module by reading its repository directly.

---

## 20. Asynchronous Communication Rule

Use events when:

```text
The producer does not need the consumer result immediately.

Eventual consistency is acceptable.

Consumers may evolve independently.
```

### MUST NOT

Use Kafka merely because Kafka already exists.

---

## 21. Domain Event Rule

A Domain Event represents something meaningful that happened in the Domain.

### MUST NOT

Domain Events know about:

```text
Kafka topics
Partitions
Kafka SDK
Serializer implementation
Broker configuration
```

---

## 22. Integration Event Rule

Integration Events are public asynchronous contracts.

### MUST

- Version event schemas intentionally.
- Include stable event/message identifiers.
- Include correlation metadata where appropriate.

Recommended metadata:

```text
eventId
eventType
aggregateId
occurredAt
correlationId
causationId
source
version
payload
```

---

## 23. Transactional Outbox Rule

Reliable DB + Kafka workflows MUST use Transactional Outbox or an equivalent atomic integration pattern.

### MUST

```text
BEGIN

Update Aggregate

Insert Outbox Event

COMMIT
```

### MUST NOT

```ts
unitOfWork.transaction(async () => {
  await repository.save(entity);
  await kafka.publish(event);
});
```

Kafka does not participate in the PostgreSQL transaction.

---

## 24. Kafka Producer Rule

Business/Application code MUST NOT publish directly to Kafka when the event must be consistent with a DB transaction.

Preferred flow:

```text
Application
    -> Outbox
    -> DB COMMIT
    -> Publisher / CDC
    -> Kafka
```

---

## 25. Kafka Consumer Rule

Kafka consumers are adapters.

Preferred flow:

```text
Kafka
    -> Consumer Adapter
    -> Deserialize / Validate
    -> Idempotency Check
    -> Application Use Case
```

### MUST

Consumers MUST assume duplicate delivery is possible.

### MUST NOT

Consumers directly manipulate business persistence unless explicitly designed as:

```text
ETL
CDC synchronization adapter
technical replication pipeline
```

with no hidden business invariant.

---

## 26. Idempotency Rule

For message-driven workflows:

```text
Outbox protects the producer.

Inbox / idempotency protects the consumer.
```

### MUST

Use a stable event/message identifier.

### MUST

Handle:

```text
already processed -> ACK / ignore

new -> execute -> mark processed
```

---

## 27. Retry Rule

Retry behavior MUST distinguish:

```text
Transient technical failure
Business rejection
Invalid schema/message
Permanent dependency failure
```

### MUST NOT

- Retry every error indefinitely.
- Blindly retry non-idempotent external operations.
- Hide permanent failures behind endless retry loops.

Retry and DLQ behavior must be observable.

---

## 28. Redis Rule

Redis is infrastructure.

### MUST NOT

Inject a raw Redis client into Domain code.

### Prefer

```text
CachePort
DistributedLockPort
RateLimitPort
SessionStore
```

### MUST NOT

Create a giant generic `RedisService` that becomes a dependency of every module.

---

## 29. Cache Rule

Default strategy:

```text
Cache-Aside
```

Read:

```text
Cache
  -> hit  -> return
  -> miss -> DB -> cache -> return
```

Write:

```text
DB update
    -> COMMIT
    -> cache invalidate / refresh
```

### MUST

Every cache usage defines:

```text
Key format
TTL
Source of truth
Invalidation strategy
Stale-data tolerance
Redis unavailable behavior
```

### MUST NOT

Invalidate cache before DB commit.

---

## 30. Redis Failure Rule

Failure behavior MUST be explicit.

Examples:

```text
Non-critical cache
    -> fallback to DB

Distributed lock
    -> operation may fail

Rate limit
    -> choose fail-open or fail-closed intentionally

Session store
    -> behavior depends on auth design
```

Do not assume Redis is always available.

---

## 31. External Integration Rule

External systems must be accessed through Ports & Adapters.

Example:

```text
Application
    -> PaymentGateway
    <- VNPayAdapter
```

### MUST

External call policies define:

```text
Timeout
Retry
Backoff
Circuit breaker
Fallback
Idempotency
```

### MUST NOT

Application code depend directly on:

```text
Axios implementation
Vendor SDK implementation
Low-level HTTP client details
```

---

## 32. External Call Inside Transaction Rule

Do not hold DB transactions open around slow network calls unless there is a strong, documented reason.

Avoid:

```text
BEGIN
lock row
call external API
wait several seconds
update DB
COMMIT
```

Prefer staged workflows when practical.

For complex distributed workflows, consider explicit state machines or Saga-like coordination.

---

## 33. DTO Rule

DTOs are transport contracts.

DTOs MAY contain:

```text
Validation
Serialization
Transformation
```

DTOs MUST NOT contain:

```text
Business calculations
Aggregate behavior
State transitions
Business invariants
```

---

## 34. API Response Rule

### MUST NOT

Return ORM entities directly.

### MUST

Prefer:

```text
Domain/Application Result
    -> Response Mapper
    -> Response DTO
```

Database schema and API contract must remain independently evolvable.

---

## 35. Error Rule

Domain errors must be transport-independent.

Example:

```ts
throw new InvoiceAlreadyPaidError();
```

Presentation maps:

```text
InvoiceAlreadyPaidError
    -> HTTP 409
    -> INVOICE_ALREADY_PAID
```

### MUST NOT

Expose to clients:

```text
Raw SQL
Stack traces
Database credentials
Internal infrastructure messages
Secrets
```

---

## 36. Authentication Rule

Authentication answers:

```text
Who is the caller?
```

Authentication belongs to security/presentation infrastructure.

Business Domain code should not depend on transport-specific authentication mechanics.

---

## 37. Authorization Rule

Authorization answers:

```text
What is the caller allowed to do?
```

### Prefer

```text
invoice.create
invoice.pay
invoice.cancel
invoice.refund
promotion.update
```

### MUST NOT

Scatter hard-coded checks such as:

```ts
user.role === 'ADMIN'
```

throughout business code.

### Important

Authorization does not replace Domain invariants.

---

## 38. Request Context Rule

Where appropriate, propagate:

```text
requestId
traceId
correlationId
causationId
userId
storeId
```

through:

```text
Logs
External requests
Outbox events
Kafka messages
Workers
```

Request metadata is not Domain state.

---

## 39. Logging Rule

Use structured logging.

### MUST NOT

Use `console.log()` as the primary production diagnostic mechanism.

### MUST NOT LOG

```text
Passwords
Access tokens
Refresh tokens
API secrets
Database passwords
Sensitive payment values
Sensitive credentials
```

---

## 40. Metrics Rule

Technical metrics SHOULD include:

```text
HTTP rate
HTTP latency
HTTP errors

DB pool usage
DB query latency
DB errors

Redis latency
Redis hit/miss

Kafka producer errors
Kafka consumer lag
Kafka processing latency
```

Business metrics MAY be added where they provide operational value.

---

## 41. Tracing Rule

Correlation/tracing context SHOULD propagate across:

```text
HTTP
Database
Kafka
Redis
External APIs
Workers
```

Outgoing integration events should preserve correlation metadata where appropriate.

---

## 42. Worker Rule

Workers may share the same repository but run as separate runtime entry points.

Examples:

```text
Kafka consumers
Outbox publisher
Schedulers
Reconciliation
Heavy background jobs
```

### MUST

Workers call Application use cases.

### MUST NOT

Duplicate business logic inside worker handlers.

---

## 43. Scheduler Rule

Cron is a trigger, not a business layer.

Preferred:

```text
Scheduler Adapter
    -> Application Use Case
```

### MUST NOT

Place large business workflows directly inside:

```ts
@Cron(...)
```

---

## 44. Lock Rule

Application may express business intent:

```ts
repository.findForUpdate(id);
```

Infrastructure implements:

```text
SELECT ... FOR UPDATE
pessimistic_write
```

### MUST NOT

Leak TypeORM lock syntax into Domain code.

---

## 45. Reporting Rule

Reporting MAY cross business data boundaries on the read side.

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

### MUST NOT

Call many business services just to compose a reporting query.

Write-side ownership remains strict.

Read-side optimization may be pragmatic.

---

## 46. Configuration Rule

Use typed configuration.

### MUST NOT

Scatter:

```ts
process.env.X
```

through business/application code.

Environment variables should be parsed and validated at configuration boundaries.

---

## 47. Secret Rule

Production secrets MUST NOT be embedded in:

```text
Source code
Committed .env files
Docker images
Git-tracked configuration
```

Use a deployment/platform secret mechanism such as Vault or equivalent.

---

## 48. Health Rule

Keep liveness and readiness conceptually separate.

```text
/live
    Is the process alive?

/ready
    Can this instance serve traffic?
```

Dependency criticality must be explicit.

Optional dependency failure should not automatically make the process unready.

---

## 49. Deployment Rule

Modular Monolith does not mean single-server deployment.

The application may scale horizontally.

### MUST

Avoid machine-local mutable state for critical runtime behavior.

### MUST NOT

Put database failover, HAProxy, replica selection, or deployment mechanics into business code.

---

## 50. Testing Rule

Preferred strategy:

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

### MUST NOT

Mock TypeORM merely to prove a TypeORM repository works.

---

## 51. Validation Rule

Before marking a task complete, run the validations supported by the repository and relevant to the change.

Typical commands:

```text
format
lint
typecheck
build
unit tests
integration tests
e2e tests
```

### MUST NOT

Claim a validation passed unless it actually ran successfully.

---

## 52. Simplicity Rule

Architecture exists to protect the system, not to maximize ceremony.

### MUST

Choose the simplest implementation that preserves:

```text
Ownership
Boundaries
Correctness
Transactions
Testability
Operational safety
```

### MUST NOT

Add abstraction only because a pattern exists.

---

## 53. New Repository Decision Rule

Before creating a repository, ask:

```text
Is this an Aggregate persistence abstraction?

Does Application need this capability?

Do its methods express business persistence semantics?

Or is it only wrapping generic TypeORM CRUD?
```

If it adds no boundary or semantic value, do not add it.

---

## 54. Domain Model Decision Rule

Before introducing Domain Entity + ORM Entity separation, ask:

```text
Does the concept have meaningful behavior?

Does it enforce invariants?

Does the persistence shape differ from the business shape?

Is the complexity high enough to justify mapping?
```

If not, a simpler CRUD model is acceptable.

---

## 55. Transaction Decision Rule

Before opening a transaction:

```text
Identify the invariant.

Identify all writes that must commit together.

Keep the transaction short.

Avoid unrelated work.

Avoid slow external calls where possible.
```

---

## 56. Sync vs Event Decision Rule

Use synchronous communication when:

```text
The caller needs an immediate result to continue.
```

Use asynchronous events when:

```text
The producer does not need an immediate consumer result.

Eventual consistency is acceptable.

Consumers can evolve independently.
```

Do not use events to avoid designing a proper synchronous module API.

---

## 57. Cache Decision Rule

Before adding cache, answer:

```text
What is cached?

Why is it cached?

What is the source of truth?

What is the TTL?

How is it invalidated?

What happens if Redis is unavailable?
```

If these are unanswered, do not add cache.

---

## 58. API Pre-Implementation Checklist

Before coding an API/use case, determine:

```text
[ ] Owning module

[ ] READ or WRITE

[ ] Application use case

[ ] Domain behavior / invariant

[ ] Transaction requirement

[ ] Lock requirement

[ ] Repository ownership

[ ] Cross-module dependency

[ ] Sync or async interaction

[ ] Event / Outbox requirement

[ ] Idempotency requirement

[ ] External integration requirement

[ ] Cache / Redis requirement

[ ] Failure strategy

[ ] Error contract

[ ] Response DTO

[ ] Test strategy
```

---

## 59. API Post-Implementation Checklist

Before considering an API/use case complete:

```text
[ ] Controller/consumer/scheduler is thin.

[ ] Application use case is explicit.

[ ] Business rules are in the correct layer.

[ ] Transaction boundary is visible.

[ ] No EntityManager/DataSource/QueryRunner leak exists.

[ ] Repository belongs to the owning module.

[ ] Cross-module access uses a public capability.

[ ] ORM entities do not cross module boundaries by default.

[ ] DB + Kafka consistency uses Outbox where required.

[ ] Kafka consumer is idempotent.

[ ] External calls use Ports/Adapters.

[ ] Retry behavior is safe.

[ ] Redis usage defines TTL/invalidation/failure behavior.

[ ] Domain errors remain transport-independent.

[ ] ORM entities are not returned directly.

[ ] Sensitive values are not logged.

[ ] Relevant tests and validation have run.

[ ] No unnecessary abstraction was introduced.
```

---

## 60. Agent Enforcement Rule

Agents MUST read:

```text
AGENTS.md
.ai/overview.md
.ai/architecture.md
.ai/rules.md
.ai/workflow.md
```

before architecture-sensitive implementation.

Agents MUST NOT silently reinterpret architecture based on framework convenience.

Example:

```text
NestJS allows direct @InjectRepository() usage.

That does not mean every layer is allowed to depend on TypeORM.
```

Framework capability is not an Architecture Decision.

---

## 61. Final Rule

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

Never sacrifice correctness or ownership merely to make code shorter.

Use the simplest implementation that still respects the architecture.
