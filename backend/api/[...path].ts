import serverlessExpress from '@vendia/serverless-express';
import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../src/bootstrap';

let cachedApp: Awaited<ReturnType<typeof createApp>> | undefined;
let cachedProxy: ReturnType<typeof serverlessExpress> | undefined;

export default async function handler(req: any, res: any) {
  if (!cachedProxy) {
    cachedApp = await createApp();
    cachedProxy = serverlessExpress({ app: cachedApp });
  }

  if (cachedApp && looksLikeNodeRequest(req, res)) {
    return cachedApp(req, res);
  }

  return cachedProxy(req, res);
}

function looksLikeNodeRequest(
  req: any,
  res: any
): req is IncomingMessage & { body?: unknown } {
  return (
    req &&
    res &&
    typeof req.method === 'string' &&
    typeof req.url === 'string' &&
    typeof res.setHeader === 'function'
  );
}
