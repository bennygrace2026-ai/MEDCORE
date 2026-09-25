import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { coursesRouter } from './routes/courses.js';
import { settingsRouter } from './routes/settings.js';
import quizzesRouter from './routes/quizzes.js';
import { chatRouter } from './routes/chat.js';
import { contactRouter } from './routes/contact.js';

export function createApp() {
  const app = express();

  // Safely ensure upload directories exist
  try {
    const isServerless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
    const baseDir = isServerless ? '/tmp' : process.cwd();
    const uploadsDir = path.join(baseDir, 'uploads');
    const logosDir = path.join(uploadsDir, 'logos');
    const coursesDir = path.join(uploadsDir, 'courses');
    for (const dir of [uploadsDir, logosDir, coursesDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    // Serve uploads directory
    app.use('/uploads', express.static(uploadsDir));
  } catch (err) {
    console.warn('[App Warning] Uploads folder initialization notice:', err);
  }

  // Explicitly 404 missing uploads to prevent SPA index.html fallback for broken images
  app.all('/uploads/*', (req, res) => {
    res.status(404).json({ error: 'Uploaded asset not found' });
  });

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Create unified API router
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/courses', coursesRouter);
  apiRouter.use('/settings', settingsRouter);
  apiRouter.use('/quizzes', quizzesRouter);
  apiRouter.use('/chat', chatRouter);
  apiRouter.use('/contact', contactRouter);

  apiRouter.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'UNI9JA MEDIA MEDCORE ACADEMY API is running',
      environment: process.env.NODE_ENV || 'development',
      time: new Date().toISOString()
    });
  });

  // Mount API router at both standard '/api' and Netlify serverless prefix '/.netlify/functions/api'
  app.use('/api', apiRouter);
  app.use('/.netlify/functions/api', apiRouter);

  // Explicitly handle missing API routes to prevent SPA fallback (HTML) for API calls
  app.all(['/api/*', '/.netlify/functions/api/*'], (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);

    if (err instanceof Error && (err.message.includes('Only image files') || err.message.includes('File too large'))) {
      return res.status(400).json({ error: err.message });
    }

    res.status(err.status || 500).json({
      error: err.message || 'An internal server error occurred',
    });
  });

  return app;
}
