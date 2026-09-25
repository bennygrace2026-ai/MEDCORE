import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createApp } from './app.js';
import { dbInitialization } from '../db/index.js';

// Resolve file paths safely in both ESM and CJS bundle environments
const currentFilename = typeof import.meta !== 'undefined' && import.meta.url
  ? fileURLToPath(import.meta.url)
  : (typeof __filename !== 'undefined' ? __filename : path.join(process.cwd(), 'src/server/index.ts'));

const currentDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(currentFilename);

async function startServer() {
  const port = process.env.NODE_ENV === 'production' && process.env.PORT
    ? Number(process.env.PORT)
    : 3000;

  // Wait for database initialization
  console.log('Waiting for database to be ready...');
  await dbInitialization;
  console.log('Database ready, starting server...');

  const app = createApp();

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
