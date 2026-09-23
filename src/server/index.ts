import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { coursesRouter } from './routes/courses.js';
import { settingsRouter } from './routes/settings.js';
import quizzesRouter from './routes/quizzes.js';
import { chatRouter } from './routes/chat.js';
import { contactRouter } from './routes/contact.js';
import { dbInitialization } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = 3000;

  // Wait for database initialization
  console.log('Waiting for database to be ready...');
  await dbInitialization;
  console.log('Database ready, starting server...');

  // Ensure upload directories exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const logosDir = path.join(uploadsDir, 'logos');
  const coursesDir = path.join(uploadsDir, 'courses');
  for (const dir of [uploadsDir, logosDir, coursesDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Serve uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // Explicitly 404 missing uploads to prevent SPA index.html fallback for broken images
  app.all('/uploads/*', (req, res) => {
    res.status(404).json({ error: 'Uploaded asset not found' });
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/courses', coursesRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/quizzes', quizzesRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/contact', contactRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'UNI9JA MEDIA MEDCORE ACADEMY API is running' });
  });

  // Explicitly handle missing API routes to prevent SPA fallback (HTML) for API calls
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

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

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    
    // Multer error handling
    if (err instanceof Error && (err.message.includes('Only image files') || err.message.includes('File too large'))) {
      return res.status(400).json({ error: err.message });
    }

    res.status(err.status || 500).json({
      error: err.message || 'An internal server error occurred',
    });
  });

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
