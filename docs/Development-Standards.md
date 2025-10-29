# Development Standards

## Branch Naming
- Feature work: `feat/<scope>-<short-description>`
- Bug fixes: `fix/<scope>-<short-description>`
- Chores / tooling: `chore/<scope>-<short-description>`
- Release branches: `release/<version>`
- Use lowercase alphanumeric characters with hyphens, no underscores or spaces.

## Commit Messages
- Follow Conventional Commits (`type(scope): summary`).
- Keep summaries under 72 characters; describe intent rather than implementation.
- Include additional context in the body when the change is non-trivial.
- Reference related issues using `Refs #123` or `Fixes #123` when applicable.

## Pull Requests
- Keep PRs focused; split large changes into reviewable increments.
- Provide a clear summary, screenshots (UI), and testing notes.
- Check the "Definition of Ready" before requesting review.
- Require at least one peer review approval before merging.
- Ensure conversations and review comments are resolved.

## Continuous Integration
- GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request to `main`.
- CI must pass lint (`npm run lint --workspaces`) and build (`npm run build --workspaces`) before merging.
- Add or update automated tests alongside features or bug fixes where practical.

## Definition of Ready (DoR)
- User story or task has a clear goal, acceptance criteria, and impact.
- Dependencies, blockers, and assumptions are documented.
- Designs or UX flows are available and reviewed when applicable.
- Engineering approach is understood, and size is estimated.
- Test data or environment needs are identified.

## Definition of Done (DoD)
- Code follows linting, formatting, and TypeScript strict mode guidelines.
- Unit/integration tests are added or updated; all tests pass locally and in CI.
- Documentation (README, docs, inline comments) is updated if behaviour changes.
- Feature is deployed or queued for deployment (feature flags, env vars configured).
- Product owner or stakeholder sign-off obtained when required.
