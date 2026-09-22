# Engineering rules

- Keep business logic out of controllers and infrastructure.
- Keep ORM entities out of domain and API responses.
- Use domain errors, then map them to transport errors at the presentation boundary.
- Prefer explicit ports over generic services and avoid abstraction without a current consumer.
- Use strict TypeScript; avoid `any` and unjustified non-null assertions.
- Add tests for domain behavior, application outcomes, transaction semantics, and HTTP contracts where applicable.
- Do not commit secrets, generated output, `node_modules`, or coverage.
- Do not make optional Kafka/Redis services hard requirements for the example runtime.
- Treat idempotency and retry behavior as part of every external integration design.
