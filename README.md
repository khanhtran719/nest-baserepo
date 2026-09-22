# Nest Base Repository

Production-grade NestJS modular monolith foundation. The repository establishes boundaries and reusable infrastructure; it intentionally does not contain Invoice, Promotion, Member, or other real business features.

## Architecture

The code uses DDD-lite, Clean/Hexagonal boundaries, repository ports, CQRS-lite conventions, and a transaction-aware Unit of Work. Read the [agent contract](AGENTS.md), [overview](.ai/overview.md), and [architecture contract](.ai/architecture.md) before changing code.

The current runtime contains health endpoints and a database-backed authentication module. TypeORM transaction infrastructure, outbox ports, and Redis/Kafka configuration remain extension points for future capability-owned modules.

## Local setup

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run migration:run
npm run start:dev
```

Authentication requires PostgreSQL and separate `ACCESS_KEY` / `REFRESH_KEY` values. Create a local account without committing credentials:

```bash
AUTH_SEED_EMAIL=admin@example.com AUTH_SEED_PASSWORD='replace-with-a-strong-password' npm run seed:auth
```

The API listens on `PORT` (default `3000`). It provides `POST /auth/login`, `POST /auth/refresh`, `GET /auth/profile`, and `POST /auth/logout`. Tokens are set as `HttpOnly`, `SameSite=Lax` cookies; `Secure` is enabled in production. Liveness is `GET /live` and readiness is `GET /ready`.

## Commands

`npm run format`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm test`, `npm run test:integration`, and `npm run test:e2e` are the standard validation commands.

TypeORM migrations use `npm run migration:generate -- <migration-path>`, `npm run migration:run`, and `npm run migration:revert`. Database commands require the `DB_*` variables from `.env.example`.

## Adding a module

Create a capability-owned module under `src/modules/<name>` with `domain`, `application`, `infrastructure`, and `presentation` boundaries as needed. Keep ORM entities and repositories private, export only public application APIs, and use the Unit of Work for transactional write flows.

## Environment

Supported application, authentication, and PostgreSQL settings are in `.env.example`. Redis and Kafka variables are reserved for future infrastructure adapters and do not make the current process fail when unavailable.
