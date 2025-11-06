# Non-Functional Requirements

## Security
- **Data scope**: the platform stores metadata only. PDF uploads and external download links must never be persisted.
- **Input validation**: every API endpoint validates and whitelists incoming fields using NestJS validation pipes and DTOs, preventing unexpected payloads.
- **CORS control**: front-end origins are restricted via the `CORS_ORIGINS` environment variable. Credentials are disabled by default.
- **Secret management**: MongoDB credentials and other secrets are injected through environment variables (not in source control).

## Performance
- **Pagination enforced**: list/search endpoints require pagination. The default `limit` is 10 and the maximum is capped at **50** to avoid abusive requests.
- **Indexed queries**: Mongo collections include indexes on keys (`practiceKey`, `claimKey`, `articleDoi`, `doi`, etc.) to keep lookups efficient.
- **Async pipelines**: search endpoints batch aggregation (counts + documents) in single Mongo pipelines to limit round trips.

## Reliability
- **Health monitoring**: `GET /api/health` returns consolidated service status plus timestamp for uptime checks.
- **Database resilience**: the Mongo connection is established via Mongoose with built-in retry semantics. Connection success is logged (`MongoDB connected: …`).
- **Moderation safeguards**: Accept/Reject endpoints ensure submissions exist before state transitions, reducing inconsistent data.

## Maintainability
- **TypeScript strictness**: project-wide `strict` flags catch type issues at build time in both frontend (Next.js) and backend (NestJS).
- **Linting & formatting**: ESLint + Prettier rules run in CI (`npm run lint --workspaces`) to maintain consistent style and catch common bugs.
- **Modular architecture**: domain-specific NestJS modules (practices, claims, submissions, evidence, ratings, search) encapsulate schema + service logic.
- **Continuous Integration**: GitHub Actions workflow (`.github/workflows/ci.yml`) runs lint and build for every push/PR against `main`.
