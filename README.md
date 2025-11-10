# Speed Monorepo Starter

This repository provides a batteries-included monorepo template that couples a Next.js 14 frontend with a NestJS 10 backend backed by MongoDB (via Mongoose). It is configured for TypeScript strict mode, consistent linting and formatting, and continuous integration on GitHub Actions.

## Structure

- `frontend/` – Next.js 14 (App Router, TypeScript) application for the web UI.
- `backend/` – NestJS 10 service with Mongoose integration for API and data access.
- `.github/workflows/ci.yml` – GitHub Actions workflow running lint and build for all workspaces on Node.js 20.
- `docs/Development-Standards.md` – Team conventions for branches, commits, pull requests, CI and quality bars.
- Root configuration (`.editorconfig`, `.eslintrc.json`, `.prettierrc.json`, `.gitignore`) keeps tooling consistent across packages.

## Requirements

- Node.js ≥ 20
- npm ≥ 10
- MongoDB instance (local or remote) for the backend service.

## Quickstart

```bash
npm run bootstrap
npm run dev:back
npm run dev:front
# or run both with:
npm run dev
```

Run the backend server first to expose the API on port 3001, then launch the frontend on port 3000. Update `.env` files in each workspace if your environment differs from the defaults.

## Bootstrap

```bash
npm run bootstrap
```

The bootstrap script installs dependencies for the root and both workspaces using npm workspaces.

## Common Scripts

| Script | Description |
| --- | --- |
| `npm run dev --workspace frontend` | Start the Next.js development server on port 3000. |
| `npm run dev --workspace backend` | Start the NestJS server in watch mode on port 3001. |
| `npm run build` | Run production builds for all workspaces. |
| `npm run lint` | Execute ESLint for every workspace. |
| `npm run test` | Placeholder test command (customise per workspace). |

Each package also declares its own scripts (`frontend/package.json`, `backend/package.json`) so that `npm run <script> --workspace <name>` executes the scoped command.

## Environment Variables

| Location | File | Variables |
| --- | --- | --- |
| Frontend | `frontend/.env` (see `.env.example`) | `NEXT_PUBLIC_API_BASE_URL` – Base URL for API requests, defaults to `http://localhost:3001/api`. |
| Backend | `backend/.env` (see `.env.example`) | `PORT` – API port (default `3001`); `MONGODB_URI` – MongoDB connection string (default `mongodb://localhost:27017/speed`); `NOTIFY_MODERATORS` / `NOTIFY_ANALYSTS` – optional comma-separated lists used once to seed the Staff directory; `STAFF_DEFAULT_PASSWORD` – optional default password when the env lists seed staff (default `changeme123`); `NOTIFICATION_STAFF_CACHE_TTL_MS` – optional cache duration for staff lookups (default `60000`). |

Copy the respective `.env.example` file to `.env` within each workspace and adjust values as needed.

The backend auto-seeds staff credentials in empty databases so you can sign in immediately:

- `admin@example.com` / `admin` – admin role
- `moderator@example.com` / `modpass` – moderator role
- `analyst@example.com` / `analyst` – analyst role

Update or delete these accounts via the `/api/staff` endpoints (or the admin UI) once your own staff directory is ready.

## Development Flow

1. Create a feature branch following the rules in `docs/Development-Standards.md`.
2. Install dependencies with `npm run bootstrap`.
3. Run the backend and frontend locally via their respective `dev` scripts.
4. Before opening a pull request, ensure `npm run lint` and `npm run build` succeed locally.

Refer to `docs/Development-Standards.md` for commit message expectations, pull request checklists, Definition of Ready (DoR), and Definition of Done (DoD).
