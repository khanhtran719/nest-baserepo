# Auth Module

## Responsibility

Authenticate credential-based accounts, issue JWT cookie pairs, rotate refresh tokens, expose the current profile, and revoke refresh sessions.

## Owned Concepts

- User credentials, activation state, and audit/soft-delete metadata.
- Refresh sessions and their revocation lifecycle.
- Authentication token contracts.

## Public HTTP API

- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/profile`
- `POST /auth/logout`

## Security Decisions

- Access and refresh JWTs use separate `ACCESS_KEY` and `REFRESH_KEY` secrets.
- Cookies are `HttpOnly`, `SameSite=Lax`, and become `Secure` in production.
- Access and refresh tokens rotate together. The `sessions.access_token` and `sessions.refresh_token` columns store only SHA-256 digests, never bearer-token plaintext.
- Reuse of an already-rotated refresh token revokes its session.
- Passwords use bcrypt with cost 12. The seed command requires an explicit password and never creates a default credential.
- Request cookies, authorization headers, and response `Set-Cookie` values are redacted from logs.

## Transactions

Login creates a session transactionally. Refresh locks the session row, validates it, and rotates its digest within one transaction. Logout revokes the refresh session transactionally and remains idempotent for missing or expired cookies.

## Operational Notes

Run the Auth migration before starting the application. Expired-session cleanup, rate limiting, account registration, password reset, MFA, and authorization permissions are intentionally outside the current scope.
