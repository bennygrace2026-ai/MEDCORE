import serverless from 'serverless-http';
import { createApp } from '../src/server/app.js';
import { dbInitialization } from '../src/db/index.js';

let serverlessHandler: any = null;

export default async function handler(req: any, res: any) {
  try {
    await dbInitialization;
  } catch (err) {
    console.warn('[Vercel Serverless] DB initialization notice:', err);
  }

  if (!serverlessHandler) {
    const app = createApp();
    serverlessHandler = serverless(app);
  }

  return serverlessHandler(req, res);
}
