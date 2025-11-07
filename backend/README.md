# Backend

## Serverless on Vercel
- The Vercel Serverless Function entrypoint lives in `api/[...path].ts` and captures every `/api/*` request.
- The handler lazily bootstraps the Nest app via `createApp` from `src/bootstrap.ts`, caches the adapter, and passes the request through `@vendia/serverless-express`.
