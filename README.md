# Nest Base Repository

Production-grade NestJS modular monolith foundation. The repository establishes boundaries and reusable infrastructure; it intentionally does not contain Invoice, Promotion, Member, or other real business features.

## Architecture

The code uses DDD-lite, Clean/Hexagonal boundaries, repository ports, CQRS-lite conventions, and a transaction-aware Unit of Work. Read the [agent contract](AGENTS.md), [overview](.ai/overview.md), and [architecture contract](.ai/architecture.md) before changing code.

The Example module is a small reference implementation. TypeORM is kept in module infrastructure, while application code depends on ports and `UNIT_OF_WORK`. Redis and Kafka configuration is documented but optional until an adapter and failure policy are introduced.

## Local setup

```bash
cp .env.example .env
npm install
docker compose up -d postgres redis
npm run start:dev
```

The API listens on `PORT` (default `3000`). Liveness is `GET /live`, readiness is `GET /ready`, and the example write endpoint is `POST /examples` with `{ "name": "sample" }`.

## Commands

`npm run format`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, and `npm run test:e2e` are the standard validation commands.

## Adding a module

Create a capability-owned module under `src/modules/<name>` with `domain`, `application`, `infrastructure`, and `presentation` boundaries as needed. Keep ORM entities and repositories private, export only public application APIs, and use the Unit of Work for transactional write flows.

## Environment

Supported application and PostgreSQL settings are in `.env.example`. Redis and Kafka variables are reserved for future infrastructure adapters and do not make the current process fail when unavailable.
