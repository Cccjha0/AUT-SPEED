import serverlessExpress from '@vendia/serverless-express';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'node:path';

type BootstrapModule = typeof import('../src/bootstrap');

let cachedBootstrap: BootstrapModule | null = null;
let cachedAppPromise: ReturnType<BootstrapModule['createApp']> | null = null;
let cachedProxy: ReturnType<typeof serverlessExpress> | undefined;

function loadBootstrap(): BootstrapModule {
  if (cachedBootstrap) {
    return cachedBootstrap;
  }

  const compiledPath = path.join(__dirname, '..', 'bootstrap');

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedBootstrap = require(compiledPath) as BootstrapModule;
    return cachedBootstrap;
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedBootstrap = require('../src/bootstrap') as BootstrapModule;
    return cachedBootstrap;
  }
}

async function getExpressApp() {
  if (!cachedAppPromise) {
    const { createApp } = loadBootstrap();
    cachedAppPromise = createApp();
  }
  return cachedAppPromise;
}

export default async function handler(req: any, res: any) {
  if (!cachedProxy) {
    const app = await getExpressApp();
    cachedProxy = serverlessExpress({ app });
  }

  if (looksLikeNodeRequest(req, res)) {
    const app = await getExpressApp();
    return app(req, res);
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
