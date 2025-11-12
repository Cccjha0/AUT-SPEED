# Development Standards

## Branch Naming
- **Features:** `feat/<scope>-<short-description>`
- **Fixes:** `fix/<scope>-<short-description>`
- **Chores/Docs:** `chore/<scope>-<short-description>`
- **Releases:** `release/<version>`

Rules:
- lowercase letters, digits, and hyphens only.
- Scope should map to domain or package (e.g. `frontend`, `backend`, `docs`).
- Keep the short description concise (`feat/backend-moderation-queue`).

## Commit Messages
- Follow **Conventional Commits** format: `type(scope): summary`.
  - Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
- 72-character max on the summary line; describe intent.
- Optional body provides context, breaking changes, or links to tickets.
- Reference issues with `Refs #123` or close them with `Fixes #123`.

## Code Review Checklist
Reviewers should confirm:
- **Correctness:** logic matches requirements; no regressions or hidden side effects.
- **Testing:** tests were added/updated; reviewer can run `npm run lint/build/test` as needed.
- **Security & Validation:** inputs sanitized, secrets not logged, CORS or auth rules unaffected.
- **Performance:** queries paginated, indexes used, no unnecessary loops/network calls.
- **Clarity:** code is readable, minimal duplication, comments only where necessary.
- **Docs & Config:** relevant docs updated; environment variables documented.
- **CI Status:** PR passes lint/build jobs before approval.

## Definition of Ready (DoR)
Work can start when:
- Business value, success criteria, and scope are documented.
- Dependencies and external blockers are identified and resolved.
- Designs, mockups, or API contracts are available (where applicable).
- Engineering approach is understood and sized/estimated.
- Test data, environments, and rollout considerations are known.

## Definition of Done (DoD)
A change is complete when:
- Code complies with TS strict mode, ESLint, and Prettier; checks pass locally.
- Unit/integration tests cover new behaviour; CI (lint + build) is green.
- Docs are updated (README, API docs, changelog) and feature flags/environments configured.
- QA/demo completed if required; stakeholders sign off (product/PO).
- Feature deployed or queued for deployment with a rollback plan noted.

## Testing Commands
- Backend: `npm run lint --workspace backend`, `npm run test --workspace backend`
- Frontend: `npm run lint --workspace frontend`, `npm run test --workspace frontend`
- Full workspace build/lint: `npm run lint --workspaces`, `npm run build --workspaces`

## Demo Data Seeding
Use the Admin seed endpoints (`/api/admin/seed/*`) to load or refresh demo data in all environments by default. The routes are idempotent. To disable in production, set `ADMIN_SEED_DISABLED=true`. Refer to `docs/api.md#admin-development-only` for payload/response details.

## Test Suite Overview
- Frontend unit tests: 
pm run test --workspace frontend (Vitest + React Testing Library). Covers components like RatingButton, SubmitForm, Moderation guard, etc.
- Backend unit/integration tests: 
pm run test --workspace backend (Jest). Exercises controllers/services including submissions, evidence, search, admin seed, and ratings.
- Full workspace lint: 
pm run lint --workspaces ensures both packages pass ESLint.
- Full workspace build: 
pm run build --workspaces runs Next.js build + backend TypeScript compile.
- CI pipeline runs lint + build for both workspaces on every push/PR.
