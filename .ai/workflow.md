# Change workflow

1. Read the agent contract and module documentation.
2. Inspect the repository, current tests, and dependency direction.
3. Write a small plan and identify the transaction and failure boundaries.
4. Add a failing test for each new behavior, then implement the smallest change that passes.
5. Run format, lint, typecheck, build, unit tests, and e2e tests where supported.
6. Review the diff for leakage, coupling, secrets, and unused ceremony.
7. Update documentation and record limitations honestly.

For a new module, start with ownership and use-case boundaries, then add domain, application ports, infrastructure adapters, and presentation. Export only the module's public application API.
