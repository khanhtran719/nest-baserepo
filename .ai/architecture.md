# Architecture contract

## Dependency direction

`Presentation → Application → Domain / Ports ← Infrastructure`.

Domain and application layers must not import TypeORM, Redis clients, Kafka SDKs, HTTP clients, or vendor exceptions. Infrastructure implements ports and owns technology-specific details.

## Module ownership

A module represents a business capability, not a table. Its repositories and ORM entities are private. Cross-module access uses a public facade, port, query, or event; never another module's repository or ORM entity. Prefer scalar IDs over cross-module ORM relations.

## Transactions

Application code uses `UNIT_OF_WORK` and `UnitOfWork.transaction`. `AsyncLocalStorage` carries the active TypeORM `EntityManager` inside infrastructure. Repository adapters resolve their repository dynamically so calls inside an active transaction use the active manager. Nested calls join the existing transaction.

## Write and read sides

Write flows are command/use-case/domain/repository/transaction oriented. Read flows may use optimized query objects and DTOs. Do not add a full CQRS framework unless a real use case requires it.

## Events and integrations

Domain events are distinct from integration events and Kafka messages. A future outbox record is written in the same database transaction as aggregate changes; a publisher emits to Kafka after commit. Redis usage must be purpose-specific (cache, lock, rate limit, session), cache-aside by default, and have an explicit unavailable behavior.

## Operations

Configuration is typed and validated at the boundary. Logging is structured and request-correlated. `/live` reports process liveness; `/ready` reports whether the current runtime is ready and does not depend on optional services that are not instantiated.
