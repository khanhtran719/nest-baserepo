# Module Template

> **Status:** Normative Module Blueprint  
> This file provides concrete templates for creating new business modules in this repository.  
> Read together with:
>
> - `AGENTS.md`
> - `.ai/overview.md`
> - `.ai/architecture.md`
> - `.ai/rules.md`
> - `.ai/conventions.md`
> - `.ai/workflow.md`

---

# 1. Purpose

This document answers:

```text
How should a new module be structured?

Which files are required?

Which files are optional?

How should read and write flows differ?

How should repositories be wired?

Where should DTOs, mappers, errors, events, and tests live?

How should a module expose a public API?

When is a simplified module acceptable?
```

The templates in this document are examples of approved structures.

Do not create every file or folder blindly.

Create only what the use case actually requires.

---

# 2. Choose the Module Type First

Before creating a module, classify it as one of:

```text
A. Complex Business Module

B. Simple CRUD Module

C. Read-Only / Reporting Module

D. Integration / Technical Module
```

Default selection guide:

```text
Has meaningful business invariants?
    -> Complex Business Module

Mostly CRUD/master data?
    -> Simple CRUD Module

Mostly optimized queries/reporting?
    -> Read-Only / Reporting Module

Pure technical mechanism?
    -> Infrastructure, not business modules/
```

---

# 3. Complex Business Module

Use this template when the module has:

```text
Meaningful state transitions

Business invariants

Aggregate ownership

Multiple write use cases

Cross-module public capabilities

Events

Transaction requirements
```

Example modules:

```text
Invoice
Promotion
Loyalty
Room
Shift
Payment
Order
```

---

# 4. Complex Module Folder Template

Recommended structure:

```text
modules/<module>/
├── <module>.module.ts
│
├── domain/
│   ├── entities/
│   │   └── <aggregate>.ts
│   │
│   ├── value-objects/
│   │   └── <value-object>.ts
│   │
│   ├── repositories/
│   │   └── <aggregate>.repository.ts
│   │
│   ├── services/
│   │   └── <domain-capability>.service.ts
│   │
│   ├── events/
│   │   └── <business-event>.event.ts
│   │
│   ├── enums/
│   │   └── <concept>.enum.ts
│   │
│   └── errors/
│       └── <problem>.error.ts
│
├── application/
│   ├── use-cases/
│   │   ├── <write-action>.use-case.ts
│   │   └── <write-action>.use-case.spec.ts
│   │
│   ├── queries/
│   │   ├── <read-purpose>.query.ts
│   │   └── <read-purpose>.query.spec.ts
│   │
│   ├── facades/
│   │   └── <module>.facade.ts
│   │
│   ├── ports/
│   │   └── <capability>.port.ts
│   │
│   └── dto/
│       ├── <use-case>.input.ts
│       └── <use-case>.result.ts
│
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── entities/
│           │   └── <aggregate>.orm-entity.ts
│           │
│           ├── repositories/
│           │   └── typeorm-<aggregate>.repository.ts
│           │
│           └── mappers/
│               └── <aggregate>.mapper.ts
│
└── presentation/
    └── http/
        ├── <module>.controller.ts
        │
        ├── dto/
        │   ├── <action>.request.dto.ts
        │   └── <resource>.response.dto.ts
        │
        └── mappers/
            └── <resource>.response-mapper.ts
```

Do not create empty directories just to match this tree.

---

# 5. Complex Module Example: Invoice

Approved example:

```text
modules/invoice/
├── invoice.module.ts
│
├── domain/
│   ├── entities/
│   │   └── invoice.ts
│   ├── value-objects/
│   │   └── invoice-number.ts
│   ├── repositories/
│   │   └── invoice.repository.ts
│   ├── events/
│   │   └── invoice-paid.event.ts
│   ├── enums/
│   │   └── invoice-status.enum.ts
│   └── errors/
│       ├── invoice-not-found.error.ts
│       └── invoice-already-paid.error.ts
│
├── application/
│   ├── use-cases/
│   │   └── pay-invoice.use-case.ts
│   ├── queries/
│   │   └── get-invoice-detail.query.ts
│   ├── facades/
│   │   └── invoice.facade.ts
│   └── dto/
│       ├── pay-invoice.input.ts
│       └── pay-invoice.result.ts
│
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           ├── entities/
│           │   ├── invoice.orm-entity.ts
│           │   └── invoice-payment.orm-entity.ts
│           ├── repositories/
│           │   └── typeorm-invoice.repository.ts
│           └── mappers/
│               └── invoice.mapper.ts
│
└── presentation/
    └── http/
        ├── invoice.controller.ts
        ├── dto/
        │   ├── pay-invoice.request.dto.ts
        │   └── invoice.response.dto.ts
        └── mappers/
            └── invoice.response-mapper.ts
```

---

# 6. Domain Aggregate Template

Example:

```ts
export class Invoice {
  private constructor(
    private readonly id: string,
    private status: InvoiceStatus,
    private readonly payments: Payment[],
  ) {}

  static create(input: {
    id: string;
  }): Invoice {
    return new Invoice(
      input.id,
      InvoiceStatus.OPEN,
      [],
    );
  }

  static reconstitute(input: {
    id: string;
    status: InvoiceStatus;
    payments: Payment[];
  }): Invoice {
    return new Invoice(
      input.id,
      input.status,
      input.payments,
    );
  }

  pay(payment: Payment): void {
    if (this.status !== InvoiceStatus.OPEN) {
      throw new InvoiceAlreadyPaidError();
    }

    this.payments.push(payment);
    this.status = InvoiceStatus.PAID;
  }

  getId(): string {
    return this.id;
  }

  getStatus(): InvoiceStatus {
    return this.status;
  }

  getPayments(): readonly Payment[] {
    return this.payments;
  }
}
```

Rules:

```text
No NestJS decorators

No TypeORM decorators

No Redis

No Kafka

No HTTP exceptions

Business invariants remain inside Domain
```

---

# 7. Domain Error Template

File:

```text
domain/errors/invoice-already-paid.error.ts
```

Example:

```ts
export class InvoiceAlreadyPaidError
  extends Error {

  constructor() {
    super('Invoice has already been paid');

    this.name = 'InvoiceAlreadyPaidError';
  }
}
```

If the repository defines a shared DomainError base class, use it consistently.

Do not import NestJS exceptions here.

---

# 8. Repository Port Template

File:

```text
domain/repositories/invoice.repository.ts
```

Example:

```ts
export const INVOICE_REPOSITORY =
  Symbol('INVOICE_REPOSITORY');

export interface InvoiceRepository {
  findById(
    invoiceId: string,
  ): Promise<Invoice | null>;

  findForUpdate(
    invoiceId: string,
  ): Promise<Invoice | null>;

  save(
    invoice: Invoice,
  ): Promise<void>;
}
```

Use business persistence semantics.

Do not expose:

```text
Repository<InvoiceOrmEntity>

EntityManager

QueryBuilder
```

---

# 9. Write Use Case Template

File:

```text
application/use-cases/pay-invoice.use-case.ts
```

Example:

```ts
@Injectable()
export class PayInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY)
    private readonly invoices:
      InvoiceRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork:
      UnitOfWork,

    @Inject(OUTBOX)
    private readonly outbox:
      OutboxPort,
  ) {}

  async execute(
    input: PayInvoiceInput,
  ): Promise<PayInvoiceResult> {
    return this.unitOfWork.transaction(
      async () => {
        const invoice =
          await this.invoices.findForUpdate(
            input.invoiceId,
          );

        if (!invoice) {
          throw new InvoiceNotFoundError(
            input.invoiceId,
          );
        }

        invoice.pay(
          Payment.create({
            amount: input.amount,
            method: input.method,
          }),
        );

        await this.invoices.save(invoice);

        await this.outbox.add(
          InvoicePaidIntegrationEvent.from(
            invoice,
          ),
        );

        return PayInvoiceResult.from(
          invoice,
        );
      },
    );
  }
}
```

---

# 10. Write Use Case Rules

A write use case may:

```text
Load Aggregate

Call Domain behavior

Call module Ports

Open UnitOfWork transaction

Persist Aggregate

Persist Outbox event

Return Application Result
```

A write use case must not:

```text
Use EntityManager

Use DataSource.transaction()

Use TypeORM Repository<T>

Publish Kafka directly

Return ORM Entity

Reach into another module's repository
```

---

# 11. Application Input Template

File:

```text
application/dto/pay-invoice.input.ts
```

Example:

```ts
export interface PayInvoiceInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
}
```

Application input must not depend on HTTP decorators.

Do not pass Request DTOs directly into Domain when the boundary matters.

---

# 12. Application Result Template

File:

```text
application/dto/pay-invoice.result.ts
```

Example:

```ts
export class PayInvoiceResult {
  constructor(
    readonly invoiceId: string,
    readonly status: InvoiceStatus,
  ) {}

  static from(
    invoice: Invoice,
  ): PayInvoiceResult {
    return new PayInvoiceResult(
      invoice.getId(),
      invoice.getStatus(),
    );
  }
}
```

Application Result:

```text
is not an ORM Entity

is not necessarily an HTTP Response DTO
```

---

# 13. Read Query Template

File:

```text
application/queries/get-invoice-detail.query.ts
```

Example:

```ts
@Injectable()
export class GetInvoiceDetailQuery {
  constructor(
    private readonly invoiceReadRepository:
      InvoiceReadRepository,
  ) {}

  execute(
    invoiceId: string,
  ): Promise<InvoiceDetail> {
    return this.invoiceReadRepository
      .getDetail(invoiceId);
  }
}
```

Read-side code may return optimized projection types.

It does not need to reconstruct the Aggregate unless business behavior requires it.

---

# 14. Read Repository Template

Example:

```ts
export interface InvoiceReadRepository {
  getDetail(
    invoiceId: string,
  ): Promise<InvoiceDetail>;

  list(
    input: ListInvoicesInput,
  ): Promise<PageResult<InvoiceListItem>>;
}
```

Read repository implementation may use:

```text
TypeORM QueryBuilder

Raw SQL

Joins

Projection

Database-specific optimization
```

Keep it in infrastructure.

---

# 15. ORM Entity Template

File:

```text
infrastructure/persistence/typeorm/entities/
invoice.orm-entity.ts
```

Example:

```ts
@Entity('Invoices')
export class InvoiceOrmEntity {
  @PrimaryColumn({
    name: 'Id',
    type: 'uuid',
  })
  id!: string;

  @Column({
    name: 'Status',
    type: 'varchar',
    length: 30,
  })
  status!: string;

  @Column({
    name: 'StoreId',
    type: 'uuid',
  })
  storeId!: string;
}
```

Rules:

```text
Persistence decorators stay here.

Cross-module references prefer scalar IDs.

Do not add business behavior here.
```

---

# 16. Persistence Mapper Template

File:

```text
infrastructure/persistence/typeorm/mappers/
invoice.mapper.ts
```

Example:

```ts
export class InvoiceMapper {
  static toDomain(
    entity: InvoiceOrmEntity,
  ): Invoice {
    return Invoice.reconstitute({
      id: entity.id,
      status: entity.status
        as InvoiceStatus,
      payments: [],
    });
  }

  static toPersistence(
    invoice: Invoice,
  ): InvoiceOrmEntity {
    const entity =
      new InvoiceOrmEntity();

    entity.id = invoice.getId();
    entity.status =
      invoice.getStatus();

    return entity;
  }
}
```

Mapping belongs to persistence infrastructure.

Do not place persistence mapping methods on the Domain Entity.

---

# 17. TypeORM Repository Template

File:

```text
infrastructure/persistence/typeorm/repositories/
typeorm-invoice.repository.ts
```

Example:

```ts
@Injectable()
export class TypeOrmInvoiceRepository
  implements InvoiceRepository {

  constructor(
    private readonly repositories:
      TypeOrmRepositoryProvider,
  ) {}

  private get repository():
    Repository<InvoiceOrmEntity> {

    return this.repositories.getRepository(
      InvoiceOrmEntity,
    );
  }

  async findById(
    invoiceId: string,
  ): Promise<Invoice | null> {
    const entity =
      await this.repository.findOne({
        where: {
          id: invoiceId,
        },
      });

    return entity
      ? InvoiceMapper.toDomain(entity)
      : null;
  }

  async findForUpdate(
    invoiceId: string,
  ): Promise<Invoice | null> {
    const entity =
      await this.repository
        .createQueryBuilder('invoice')
        .setLock('pessimistic_write')
        .where(
          'invoice.Id = :invoiceId',
          { invoiceId },
        )
        .getOne();

    return entity
      ? InvoiceMapper.toDomain(entity)
      : null;
  }

  async save(
    invoice: Invoice,
  ): Promise<void> {
    const entity =
      InvoiceMapper.toPersistence(
        invoice,
      );

    await this.repository.save(entity);
  }
}
```

Important:

```text
Do not cache a transaction-aware repository in the constructor.
```

---

# 18. Controller Template

File:

```text
presentation/http/invoice.controller.ts
```

Example:

```ts
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly payInvoice:
      PayInvoiceUseCase,

    private readonly getInvoiceDetail:
      GetInvoiceDetailQuery,
  ) {}

  @Post(':id/pay')
  async pay(
    @Param('id') invoiceId: string,
    @Body() dto: PayInvoiceRequestDto,
  ): Promise<PayInvoiceResponseDto> {

    const result =
      await this.payInvoice.execute({
        invoiceId,
        amount: dto.amount,
        method: dto.method,
      });

    return InvoiceResponseMapper
      .fromPayResult(result);
  }

  @Get(':id')
  async getDetail(
    @Param('id') invoiceId: string,
  ): Promise<InvoiceDetailResponseDto> {

    const result =
      await this.getInvoiceDetail
        .execute(invoiceId);

    return InvoiceResponseMapper
      .fromDetail(result);
  }
}
```

Controller must remain thin.

---

# 19. Request DTO Template

File:

```text
presentation/http/dto/
pay-invoice.request.dto.ts
```

Example:

```ts
export class PayInvoiceRequestDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
```

Transport validation does not replace Domain validation.

---

# 20. Response DTO Template

Example:

```ts
export class PayInvoiceResponseDto {
  invoiceId!: string;
  status!: InvoiceStatus;
}
```

Do not return ORM Entities directly.

---

# 21. Response Mapper Template

File:

```text
presentation/http/mappers/
invoice.response-mapper.ts
```

Example:

```ts
export class InvoiceResponseMapper {
  static fromPayResult(
    result: PayInvoiceResult,
  ): PayInvoiceResponseDto {
    return {
      invoiceId:
        result.invoiceId,
      status:
        result.status,
    };
  }
}
```

HTTP response mapping belongs to Presentation.

Do not reuse Persistence Mapper here.

---

# 22. NestJS Module Template

File:

```text
invoice.module.ts
```

Example:

```ts
@Module({
  imports: [
    DatabaseModule,

    TypeOrmModule.forFeature([
      InvoiceOrmEntity,
      InvoicePaymentOrmEntity,
    ]),
  ],

  controllers: [
    InvoiceController,
  ],

  providers: [
    PayInvoiceUseCase,
    GetInvoiceDetailQuery,

    TypeOrmInvoiceRepository,

    {
      provide:
        INVOICE_REPOSITORY,

      useExisting:
        TypeOrmInvoiceRepository,
    },
  ],

  exports: [
    InvoiceFacade,
  ],
})
export class InvoiceModule {}
```

Only export public module capabilities.

Do not export persistence internals by default.

---

# 23. Public Facade Template

Use when another module needs a synchronous capability.

File:

```text
application/facades/invoice.facade.ts
```

Example:

```ts
@Injectable()
export class InvoiceFacade {
  constructor(
    private readonly query:
      GetInvoiceDetailQuery,
  ) {}

  getDetail(
    invoiceId: string,
  ): Promise<InvoiceDetail> {
    return this.query.execute(
      invoiceId,
    );
  }
}
```

Facade should expose a deliberate public capability.

It must not become a pass-through for every internal repository method.

---

# 24. Cross-Module Port Template

Caller-side abstraction:

```ts
export interface PromotionPricingPort {
  calculate(
    input: PromotionPricingInput,
  ): Promise<PromotionPricingResult>;
}
```

Possible adapter:

```ts
@Injectable()
export class PromotionPricingAdapter
  implements PromotionPricingPort {

  constructor(
    private readonly promotionFacade:
      PromotionFacade,
  ) {}

  calculate(
    input: PromotionPricingInput,
  ): Promise<PromotionPricingResult> {
    return this.promotionFacade
      .calculate(input);
  }
}
```

This keeps the caller dependent on its own required capability instead of another module's persistence internals.

---

# 25. Integration Event Template

Example:

```ts
export interface InvoicePaidPayload {
  invoiceId: string;
  storeId: string;
  total: number;
}

export class InvoicePaidIntegrationEvent {
  static from(
    invoice: Invoice,
  ): EventEnvelope<InvoicePaidPayload> {
    return {
      eventId: crypto.randomUUID(),
      eventType:
        'invoice.paid.v1',
      aggregateId:
        invoice.getId(),
      occurredAt:
        new Date().toISOString(),
      source:
        'backend',
      version: 1,
      payload: {
        invoiceId:
          invoice.getId(),
        storeId:
          invoice.getStoreId(),
        total:
          invoice.getTotal(),
      },
    };
  }
}
```

Do not include Kafka topic or partition here.

---

# 26. Outbox Usage Template

Application:

```ts
await this.outbox.add(
  InvoicePaidIntegrationEvent.from(
    invoice,
  ),
);
```

Runtime flow:

```text
BEGIN

Invoice write

Outbox write

COMMIT
```

Then:

```text
Outbox Publisher / CDC
    -> Kafka
```

Do not publish Kafka directly from the write use case.

---

# 27. Kafka Consumer Template

Example inbound adapter:

```ts
@Injectable()
export class InvoicePaidConsumer {
  constructor(
    private readonly addPoints:
      AddMemberPointsUseCase,

    private readonly inbox:
      InboxPort,
  ) {}

  async handle(
    message: EventEnvelope<
      InvoicePaidPayload
    >,
  ): Promise<void> {

    if (
      await this.inbox
        .isProcessed(
          message.eventId,
        )
    ) {
      return;
    }

    await this.addPoints.execute({
      invoiceId:
        message.payload.invoiceId,
    });

    await this.inbox.markProcessed(
      message.eventId,
    );
  }
}
```

Production implementation should make Inbox processing atomic with the business transaction where required.

---

# 28. Simple CRUD Module

Use a simpler structure when:

```text
No meaningful Aggregate behavior

No complex invariant

No complex transaction

Mostly master/reference data

No need for Domain/ORM separation
```

Example modules:

```text
TaxCategory
Country
SimpleConfiguration
Lookup
```

---

# 29. Simple CRUD Folder Template

Approved simplified structure:

```text
modules/<module>/
├── <module>.module.ts
├── <module>.controller.ts
├── <module>.service.ts
├── <module>.orm-entity.ts
├── <module>.repository.ts
├── dto/
│   ├── create-<module>.request.dto.ts
│   ├── update-<module>.request.dto.ts
│   └── <module>.response.dto.ts
└── <module>.spec.ts
```

This is acceptable only while the business complexity remains simple.

If business behavior grows, migrate toward the complex module structure.

---

# 30. Simple CRUD Example

```text
modules/tax-category/
├── tax-category.module.ts
├── tax-category.controller.ts
├── tax-category.service.ts
├── tax-category.orm-entity.ts
├── tax-category.repository.ts
└── dto/
    ├── create-tax-category.request.dto.ts
    └── tax-category.response.dto.ts
```

Do not introduce:

```text
Aggregate Root
Domain Event
Outbox
Value Objects
CQRS handlers
```

without actual need.

---

# 31. Simple CRUD Rules

Even a simplified module must preserve:

```text
Controller remains thin

Persistence does not leak into API responses

Cross-module access remains controlled

Validation remains at boundary

Business-specific logic stays in the module

Infrastructure dependency does not leak into Domain if Domain is introduced later
```

Simplified does not mean unstructured.

---

# 32. Read-Only / Reporting Module

Use when the module is primarily:

```text
Reporting

Analytics

Dashboard

Export

Cross-module projection

Read model
```

Example:

```text
ReportingModule
```

---

# 33. Reporting Module Template

```text
modules/reporting/
├── reporting.module.ts
│
├── application/
│   └── queries/
│       ├── daily-sales.query.ts
│       ├── revenue-by-store.query.ts
│       └── shift-performance.query.ts
│
├── infrastructure/
│   └── persistence/
│       └── typeorm/
│           └── queries/
│               ├── typeorm-daily-sales.query.ts
│               └── typeorm-revenue-by-store.query.ts
│
└── presentation/
    └── http/
        ├── reporting.controller.ts
        └── dto/
            └── daily-sales.response.dto.ts
```

A reporting module often does not need:

```text
Aggregate

Domain Entity

Domain Repository
```

if it is truly read-only.

---

# 34. Reporting Query Rules

Reporting queries may:

```text
JOIN tables from multiple business modules

Use raw SQL

Use projections

Use materialized views

Use read replicas

Use database-specific optimization
```

Reporting must not:

```text
Mutate another module's business state

Bypass a write-side invariant

Use write repositories as a reporting composition layer
```

---

# 35. Integration / Technical Module

Pure technical mechanisms do not belong in `modules/`.

Examples:

```text
Kafka

Redis

Database

Outbox

Logging

Tracing

Vault

HTTP clients

Circuit breaker
```

Place them under:

```text
infrastructure/
```

Example:

```text
infrastructure/
├── database/
├── messaging/
├── cache/
├── outbox/
├── integrations/
├── observability/
└── resilience/
```

---

# 36. Module With External Integration

Example structure:

```text
modules/payment/
├── payment.module.ts
│
├── domain/
│   ├── entities/
│   └── errors/
│
├── application/
│   ├── use-cases/
│   └── ports/
│       └── payment.gateway.ts
│
├── infrastructure/
│   └── integrations/
│       ├── vnpay-payment.adapter.ts
│       └── momo-payment.adapter.ts
│
└── presentation/
    └── http/
```

Application depends on:

```text
PaymentGateway
```

not:

```text
Axios
VNPay SDK
MoMo SDK
```

---

# 37. External Integration Port Template

```ts
export interface PaymentGateway {
  charge(
    request: ChargeRequest,
  ): Promise<ChargeResult>;
}
```

Adapter:

```ts
@Injectable()
export class VNPayPaymentAdapter
  implements PaymentGateway {

  async charge(
    request: ChargeRequest,
  ): Promise<ChargeResult> {
    // timeout
    // idempotency
    // request mapping
    // external call
    // response mapping
  }
}
```

---

# 38. Module With Redis Cache

Application-facing port:

```ts
export interface InvoiceCachePort {
  get(
    invoiceId: string,
  ): Promise<InvoiceDetail | null>;

  set(
    invoiceId: string,
    value: InvoiceDetail,
  ): Promise<void>;

  invalidate(
    invoiceId: string,
  ): Promise<void>;
}
```

Infrastructure:

```text
redis-invoice-cache.adapter.ts
```

Before creating module-specific cache, define:

```text
TTL

Key format

Source of truth

Invalidation

Redis-down behavior
```

---

# 39. Cache Read Template

```ts
const cached =
  await this.cache.get(
    input.invoiceId,
  );

if (cached) {
  return cached;
}

const result =
  await this.readRepository
    .getDetail(
      input.invoiceId,
    );

await this.cache.set(
  input.invoiceId,
  result,
);

return result;
```

If Redis is non-critical, cache failure should generally not break the query.

Failure policy must be explicit.

---

# 40. Cache Write Template

Correct ordering:

```text
DB Transaction
    -> COMMIT
    -> Cache Invalidate
```

Example:

```ts
const result =
  await this.unitOfWork.transaction(
    async () => {
      // write business state

      return output;
    },
  );

await this.cache.invalidate(
  input.invoiceId,
);

return result;
```

Do not invalidate before commit.

---

# 41. Module With Distributed Lock

Use only when database locking/unique constraints/idempotency are insufficient or the lock protects a distributed technical resource.

Application depends on:

```text
DistributedLockPort
```

Infrastructure implements:

```text
RedisLockAdapter
```

Do not place raw Redis lock commands inside Domain/Application.

---

# 42. Module Error Mapping

Domain:

```text
InvoiceAlreadyPaidError
```

Application:

```text
may propagate unchanged
```

Presentation:

```text
InvoiceAlreadyPaidError
    -> HTTP 409
    -> INVOICE_ALREADY_PAID
```

Keep HTTP exceptions out of Domain.

---

# 43. Module Public API

A module should expose only capabilities intentionally required by other modules.

Example:

```ts
@Module({
  providers: [
    PromotionFacade,
  ],
  exports: [
    PromotionFacade,
  ],
})
export class PromotionModule {}
```

Do not export:

```text
TypeOrmPromotionRepository

PROMOTION_REPOSITORY

PromotionOrmEntity
```

by default.

---

# 44. Module Dependency Example

Correct:

```text
InvoiceModule
    |
    v
PromotionFacade
    |
    v
PromotionModule
```

Incorrect:

```text
InvoiceModule
    |
    v
PromotionRepository
```

---

# 45. Module Circular Dependency Rule

If:

```text
Module A needs Module B

and

Module B needs Module A
```

do not immediately use:

```ts
forwardRef(...)
```

First inspect:

```text
Incorrect ownership?

Missing event boundary?

Missing neutral shared capability?

Public API too broad?

One responsibility belongs elsewhere?
```

Use `forwardRef` only when the cycle is genuinely valid and documented.

---

# 46. Module Test Layout

Recommended:

```text
modules/invoice/
├── domain/
│   └── entities/
│       ├── invoice.ts
│       └── invoice.spec.ts
│
├── application/
│   └── use-cases/
│       ├── pay-invoice.use-case.ts
│       └── pay-invoice.use-case.spec.ts
│
└── infrastructure/
    └── persistence/
        └── typeorm/
            └── repositories/
                ├── typeorm-invoice.repository.ts
                └── typeorm-invoice.repository.spec.ts
```

E2E tests may live in:

```text
test/
```

or another repository-wide E2E directory.

Follow one project-wide convention.

---

# 47. Domain Test Template

```ts
describe('Invoice', () => {
  it(
    'marks an open invoice as paid',
    () => {
      const invoice =
        createInvoiceFixture({
          status:
            InvoiceStatus.OPEN,
        });

      invoice.pay(
        createPaymentFixture(),
      );

      expect(
        invoice.getStatus(),
      ).toBe(
        InvoiceStatus.PAID,
      );
    },
  );

  it(
    'rejects payment when already paid',
    () => {
      const invoice =
        createInvoiceFixture({
          status:
            InvoiceStatus.PAID,
        });

      expect(() =>
        invoice.pay(
          createPaymentFixture(),
        ),
      ).toThrow(
        InvoiceAlreadyPaidError,
      );
    },
  );
});
```

No NestJS bootstrap is needed.

---

# 48. Application Use Case Test Template

Example:

```ts
describe(
  'PayInvoiceUseCase',
  () => {

    it(
      'persists invoice and outbox event atomically',
      async () => {
        const invoices =
          new FakeInvoiceRepository();

        const unitOfWork =
          new FakeUnitOfWork();

        const outbox =
          new FakeOutbox();

        const useCase =
          new PayInvoiceUseCase(
            invoices,
            unitOfWork,
            outbox,
          );

        // arrange

        // act

        // assert
      },
    );
  },
);
```

Test orchestration through Ports.

Do not mock TypeORM here.

---

# 49. Repository Integration Test Template

Repository tests should validate real persistence behavior.

Test:

```text
Mapping

Insert/update

Find

Lock behavior where practical

Unique constraints

Transaction participation

Queries
```

Prefer real PostgreSQL/Testcontainers.

---

# 50. API E2E Test Template

E2E should validate:

```text
Route

Authentication / Authorization

DTO validation

Use case integration

HTTP status

Response contract

Error mapping
```

Do not rely on E2E tests as the only test for Domain invariants.

---

# 51. New Module Creation Workflow

When creating a module:

```text
1. Identify business capability.

2. Choose module type.

3. Identify public capability.

4. Identify Aggregate, if any.

5. Identify write use cases.

6. Identify read queries.

7. Identify transactions.

8. Identify repository ports.

9. Identify persistence model.

10. Identify cross-module dependencies.

11. Decide sync vs event.

12. Identify external integrations.

13. Identify cache/lock needs.

14. Define errors.

15. Define tests.

16. Create only required files.

17. Wire NestJS module.

18. Validate architecture.

19. Run tests/build/lint/typecheck.

20. Review module exports.
```

---

# 52. Complex Module Creation Checklist

```text
[ ] Module represents a business capability.

[ ] Aggregate ownership is clear.

[ ] Domain behavior is meaningful.

[ ] Domain has no infrastructure dependency.

[ ] Write use cases are explicit.

[ ] Read queries are separated when useful.

[ ] Repository Port is business-oriented.

[ ] TypeORM implementation is infrastructure-only.

[ ] ORM Entity is owned by this module.

[ ] Persistence mapping is explicit if Domain/ORM are separated.

[ ] Transaction boundary is clear.

[ ] Locking intent is explicit where needed.

[ ] Cross-module calls use public capability.

[ ] Event usage is justified.

[ ] Outbox is used for reliable DB + Kafka flow.

[ ] Kafka consumer is idempotent if present.

[ ] External integration uses Port/Adapter.

[ ] Redis behavior is explicit if present.

[ ] Errors remain transport-independent.

[ ] Controller remains thin.

[ ] Public module exports are minimal.

[ ] Tests exist at appropriate layers.
```

---

# 53. Simple CRUD Module Checklist

```text
[ ] Business complexity is actually simple.

[ ] Full DDD structure would add little value.

[ ] Controller remains thin.

[ ] Service owns simple orchestration.

[ ] Persistence is localized.

[ ] ORM Entity is not exposed as API response.

[ ] Validation exists.

[ ] Cross-module boundary remains controlled.

[ ] No unnecessary Domain/Event/Outbox ceremony.

[ ] Tests cover relevant behavior.
```

---

# 54. Reporting Module Checklist

```text
[ ] Module is read-only or primarily read-side.

[ ] Query responsibility is clear.

[ ] Optimized SQL is allowed.

[ ] Cross-module joins are read-only.

[ ] No business state mutation occurs.

[ ] Response/read models are explicit.

[ ] Pagination/export concerns are clear.

[ ] Query performance is tested/reviewed.

[ ] Index requirements are considered.
```

---

# 55. Anti-Pattern: Controller to Repository

Do not implement:

```text
Controller
    -> TypeORM Repository
    -> Database
```

for complex business writes.

Approved:

```text
Controller
    -> Use Case
    -> Domain
    -> Repository Port
    -> Infrastructure
```

---

# 56. Anti-Pattern: Module Per Table

Do not create:

```text
InvoiceModule
InvoiceItemModule
InvoicePaymentModule
InvoiceVatModule
```

if all concepts share one Invoice lifecycle.

Prefer one owning module.

---

# 57. Anti-Pattern: Cross-Module Repository

Do not:

```ts
class InvoiceUseCase {
  constructor(
    private readonly members:
      MemberRepository,
  ) {}
}
```

Prefer:

```ts
class InvoiceUseCase {
  constructor(
    private readonly memberProfile:
      MemberProfilePort,
  ) {}
}
```

or:

```text
MemberFacade
```

---

# 58. Anti-Pattern: HTTP Error in Domain

Do not:

```ts
throw new ConflictException(
  'Invoice already paid',
);
```

inside Domain.

Use:

```ts
throw new InvoiceAlreadyPaidError();
```

then map at Presentation.

---

# 59. Anti-Pattern: Kafka in Transaction

Do not:

```ts
await unitOfWork.transaction(
  async () => {
    await invoices.save(invoice);
    await kafka.publish(event);
  },
);
```

Use:

```text
Aggregate + Outbox
    -> COMMIT
    -> Kafka later
```

---

# 60. Anti-Pattern: Global Generic Service

Avoid:

```text
CommonService
BaseService
GlobalRepository
GenericCrudService
```

that become dependencies of unrelated business modules.

Shared abstraction must have clear, stable technical purpose.

---

# 61. Anti-Pattern: Generic CRUD Repository for Complex Domain

Avoid exposing generic:

```ts
findOne()
findAll()
create()
update()
delete()
```

as the Domain Repository API for a complex Aggregate.

Prefer business persistence semantics.

---

# 62. Anti-Pattern: Over-Modeling CRUD

Do not create:

```text
Aggregate Root
5 Value Objects
3 Domain Events
Domain Service
Command Handler
Query Handler
Mapper
Factory
Policy
Strategy
```

for a table that only stores static lookup values.

Architecture complexity must follow business complexity.

---

# 63. Anti-Pattern: Returning ORM Entity

Do not:

```ts
return this.invoiceRepository
  .findOne(...);
```

directly from Controller when that returns an ORM Entity.

Use response contracts.

---

# 64. Anti-Pattern: Persistence Mapper as API Mapper

Do not use:

```text
InvoiceMapper
```

for both:

```text
ORM <-> Domain

and

Domain -> HTTP Response
```

Keep persistence and transport mapping separate.

---

# 65. Anti-Pattern: Shared Business Helpers

Do not move:

```text
calculateInvoiceDiscount()
calculateRoomCharge()
validatePromotion()
```

into:

```text
shared/common/utils
```

if they belong to one business module.

Keep business concepts close to ownership.

---

# 66. Anti-Pattern: Hidden Transaction

Avoid architecture where atomicity is impossible to see from Application code.

Approved:

```ts
unitOfWork.transaction(async () => {
  ...
});
```

The technical manager remains hidden, but the business transaction boundary remains visible.

---

# 67. Anti-Pattern: Redis as Hidden Source of Truth

Do not implement business correctness based solely on cache values unless explicitly designed.

Default:

```text
Database
    = source of truth

Redis
    = acceleration / lock / technical state
```

---

# 68. Anti-Pattern: Framework-Driven Architecture

Do not choose structure only because NestJS makes it easy.

Example:

```text
@InjectRepository()
inside every service
```

is technically possible but not automatically architecturally valid.

Framework capability is not an Architecture Decision.

---

# 69. Minimal Module Rule

A valid module can be small.

Example:

```text
modules/country/
├── country.module.ts
├── country.controller.ts
├── country.service.ts
├── country.orm-entity.ts
└── dto/
```

Do not create architecture ceremony with no business value.

---

# 70. Module Evolution Rule

A module may evolve:

```text
Simple CRUD
    |
    v
Business rules appear
    |
    v
Introduce Application boundary
    |
    v
Introduce Domain model
    |
    v
Separate ORM model
    |
    v
Add events/outbox only when required
```

Do not predict every future requirement upfront.

---

# 71. Public API Evolution Rule

If another module starts depending on internal code:

```text
Stop.

Define a deliberate public capability.

Facade / Port / Query API / Event.
```

Do not normalize internal imports into a permanent module API.

---

# 72. Extraction Readiness

A well-designed business module should make future extraction possible by already having:

```text
Clear ownership

Explicit public API

Private persistence

No foreign repository access

No foreign ORM graph dependency

Versioned integration events where applicable
```

Do not build microservice infrastructure before extraction is actually required.

---

# 73. Module Documentation

A complex module MAY include:

```text
modules/<module>/README.md
```

when it needs local documentation for:

```text
Business responsibility

Aggregate boundaries

Important invariants

Public capabilities

Events

State machine

Operational notes
```

Do not duplicate the global architecture document.

---

# 74. Module README Suggested Structure

```text
# <Module Name>

## Responsibility

## Owned Concepts

## Aggregate Boundaries

## Public API

## Write Use Cases

## Read Queries

## Events Produced

## Events Consumed

## External Dependencies

## Important Invariants

## Persistence Notes

## Operational Notes
```

Only create it when the module complexity justifies it.

---

# 75. Agent Decision Tree

Before scaffolding:

```text
Does this represent a business capability?
    |
    +-- NO -> Do not create a business module.
    |
    `-- YES
          |
          v
Does it have meaningful business behavior?
          |
          +-- NO
          |     |
          |     v
          |  Simple CRUD Module
          |
          `-- YES
                |
                v
        Complex Business Module
```

Then:

```text
Mostly read/reporting only?
    |
    +-- YES -> Reporting/Read Module
    |
    `-- NO  -> Business Module
```

---

# 76. Agent Scaffold Rule

Agents MUST NOT generate the entire target folder tree automatically.

Instead:

```text
1. Choose module type.

2. Identify required behaviors.

3. Create only files required by those behaviors.

4. Add optional architecture pieces only when justified.
```

---

# 77. Final Module Principle

A module is correct when a developer or agent can answer:

```text
What business capability does this module own?

What data lifecycle does it own?

What invariants does it protect?

What is its public API?

Which repositories are private?

Which use cases are writes?

Which queries are reads?

Where is the transaction boundary?

Which events leave the module?

Which external systems does it depend on?

What happens when dependencies fail?
```

If these answers are unclear, the module boundary is probably unclear.

---

# 78. Final Template Principle

Use this document as a blueprint, not a code generator specification.

The preferred implementation is:

```text
The smallest module structure

that clearly expresses ownership,

preserves architecture boundaries,

keeps transaction behavior correct,

and remains easy to evolve.
```

Do not create complexity merely to make the module look architecturally complete.
