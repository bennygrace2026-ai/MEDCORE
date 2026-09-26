import serverless from 'serverless-http';
import { createApp } from '../../src/server/app.js';
import { dbInitialization } from '../../src/db/index.js';

let serverlessHandler: any = null;

export const handler = async (event: any, context: any) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // Wait for database initialization to complete
  try {
    await dbInitialization;
  } catch (err) {
    console.error('[Netlify Function] Database initialization warning:', err);
  }

  if (!serverlessHandler) {
    const app = createApp();
    serverlessHandler = serverless(app);
  }

  return serverlessHandler(event, context);
};
