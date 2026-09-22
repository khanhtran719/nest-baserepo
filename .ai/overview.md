# Architecture overview

This repository is a modular monolith, not a microservices system. It uses DDD-lite, Clean/Hexagonal boundaries, CQRS-lite, repositories, Unit of Work, transactional-outbox conventions, and infrastructure adapters that can evolve independently.

The current bootstrap deliberately implements only a small Example module and the reusable transaction foundation. Future modules own their domain behavior, application use cases, persistence adapters, and presentation endpoints.

The application is designed to be stateless at the API layer and horizontally scalable. PostgreSQL is the required persistence dependency for the runtime; Redis and Kafka are documented extension points and are not required to boot the example application.
