# Agent Contract

This repository is a production-grade NestJS modular monolith. Before planning or modifying code, every agent must read the following documents in order:

1. `AGENTS.md`
2. `.ai/overview.md`
3. `.ai/architecture.md`
4. `.ai/rules.md`
5. `.ai/workflow.md`
6. Documentation local to the module being changed

## Default workflow

Understand → Inspect → Plan → Implement → Validate → Review.

Before changing code, identify the owning module, read/write side, transaction boundary, module boundaries, infrastructure leakage risks, idempotency requirements, Redis/Kafka/external failure behavior, and whether a new abstraction is justified.

## Definition of Done

- The change has a clear owning module and preserves dependency direction.
- Domain and application code do not depend on TypeORM, Redis, Kafka, HTTP clients, or framework exceptions.
- Transactions are expressed through `UNIT_OF_WORK`; repositories resolve transaction-aware persistence at call time.
- Tests cover every new behavior and validation commands are run honestly.
- Formatting, linting, typechecking, and documentation are updated as needed.
- The diff is reviewed for secrets, unused scaffolding, business logic in controllers, and unnecessary abstraction.

## Precedence

System and developer instructions, together with explicit user requirements, take precedence over repository instructions. Then this contract, the `.ai` documents, and module documentation apply in that order. When instructions conflict, stop and document the conflict rather than silently weakening a boundary.
