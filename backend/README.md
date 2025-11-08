# Backend

## Serverless on Vercel
- The Vercel Serverless Function entrypoint lives in `api/[...path].ts` and captures every `/api/*` request.
- The handler lazily bootstraps the Nest app via `createApp` from `src/bootstrap.ts`, caches the adapter, and passes the request through `@vendia/serverless-express`.
- Deploy with the project root set to `backend/` and no custom output directory; `vercel.json` ensures `/api/*` requests are routed to the catch-all handler built with `@vercel/node`.
