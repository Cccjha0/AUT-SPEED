import serverlessExpress from '@vendia/serverless-express';
import { createApp } from '../src/bootstrap';

let cached: ReturnType<typeof serverlessExpress> | undefined;

export default async function handler(req: any, res: any) {
  if (!cached) {
    const app = await createApp();
    cached = serverlessExpress({ app });
  }

  return cached(req, res);
}
