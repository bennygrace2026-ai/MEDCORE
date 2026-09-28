import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distServer = path.join(__dirname, 'dist', 'server.cjs');
if (fs.existsSync(distServer)) {
  await import('./dist/server.cjs' as any);
} else {
  await import('./src/server/index.ts' as any);
}

