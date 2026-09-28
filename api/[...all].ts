import { createApp } from '../src/server/app.js';
import { dbInitialization } from '../src/db/index.js';

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await dbInitialization;
  } catch (err) {
    console.warn('[Vercel Serverless] DB initialization notice:', err);
  }

  if (!appInstance) {
    appInstance = createApp();
  }

  return appInstance(req, res);
}
