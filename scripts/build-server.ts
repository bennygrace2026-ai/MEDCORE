import { build } from 'esbuild';

build({
  entryPoints: ['src/server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'dist/server.cjs',
  external: [
    'express', 'better-sqlite3', 'cors', 'jsonwebtoken', 'bcryptjs', 'multer', '@libsql/client', 'drizzle-orm'
  ],
  format: 'cjs',
}).catch(() => process.exit(1));
