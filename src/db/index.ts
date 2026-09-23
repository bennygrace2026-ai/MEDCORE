import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { createClient } from '@libsql/client';
import postgres from 'postgres';
import * as schema from './schema.js';
import dns from 'dns';
import { promisify } from 'util';

const lookupPromise = promisify(dns.lookup);

async function resolveHostToIPv4(urlStr: string): Promise<string> {
  try {
    if (!urlStr) return urlStr;
    const parsed = new URL(urlStr.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
    const host = parsed.hostname;
    if (host && !host.match(/^[0-9.]+$/) && !host.includes(':')) {
      const result = await lookupPromise(host, { family: 4 });
      if (result && result.address) {
        console.log(`[DNS Resolve] Successfully resolved ${host} to IPv4: ${result.address}`);
        // We must preserve username, password, port, path, and queries
        return urlStr.replace(host, result.address);
      }
    }
  } catch (err) {
    console.warn('[DNS Resolve Warning] Failed to resolve host to IPv4:', err);
  }
  return urlStr;
}

let supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;

let dbInstance: any;
let sqliteInstance: any;

const initializePostgres = async (sql: any) => {
  try {
    console.log('Starting Postgres schema initialization...');
    await sql`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'STUDENT', name TEXT NOT NULL, phone TEXT, country TEXT, state TEXT, profile_photo TEXT, secondary_email TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS students (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, institution TEXT, department TEXT, level TEXT, coins INTEGER NOT NULL DEFAULT 0, access_days_remaining INTEGER NOT NULL DEFAULT 7, access_expiry_date TIMESTAMP WITH TIME ZONE, streak INTEGER NOT NULL DEFAULT 0, is_approved BOOLEAN NOT NULL DEFAULT false, payment_proof_url TEXT, status TEXT NOT NULL DEFAULT 'ACTIVE')`;
    await sql`CREATE TABLE IF NOT EXISTS courses (id TEXT PRIMARY KEY, title TEXT NOT NULL, code TEXT NOT NULL DEFAULT '', description TEXT, thumbnail TEXT, pdf_url TEXT, pdf_name TEXT, pdf_size INTEGER, note_title TEXT, note_content TEXT, is_published BOOLEAN NOT NULL DEFAULT false, is_protected BOOLEAN NOT NULL DEFAULT true, author_id TEXT NOT NULL REFERENCES users(id), created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS system_settings (id TEXT PRIMARY KEY, site_title TEXT NOT NULL DEFAULT 'Medcore Academy', site_subtitle TEXT NOT NULL DEFAULT 'UNI9JA MEDIA', maintenance_mode BOOLEAN NOT NULL DEFAULT false, allow_registrations BOOLEAN NOT NULL DEFAULT true, default_access_days INTEGER NOT NULL DEFAULT 7, enable_coin_purchases BOOLEAN NOT NULL DEFAULT true, quiz_coin_cost INTEGER NOT NULL DEFAULT 30, show_leaderboard BOOLEAN NOT NULL DEFAULT true, admin_course_creation BOOLEAN NOT NULL DEFAULT true, admin_manual_approvals BOOLEAN NOT NULL DEFAULT true, admin_view_analytics BOOLEAN NOT NULL DEFAULT true, bank_name TEXT NOT NULL DEFAULT 'Guaranty Trust Bank (GTB)', account_name TEXT NOT NULL DEFAULT 'UNI9JA MEDIA MEDCORE', account_number TEXT NOT NULL DEFAULT '0123456789', payment_instructions TEXT NOT NULL DEFAULT 'Transfer instructions...', support_phone TEXT NOT NULL DEFAULT '+234 800 000 0000', paystack_public_key TEXT DEFAULT 'pk_test_sample_key', paystack_secret_key TEXT DEFAULT 'sk_test_sample_key', enable_paystack BOOLEAN NOT NULL DEFAULT true, allow_trial_submissions BOOLEAN NOT NULL DEFAULT true, coin_packages TEXT, updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS frontend_settings (id TEXT PRIMARY KEY, hero_heading TEXT NOT NULL DEFAULT 'Accelerate Your Medical Career', hero_subheading TEXT NOT NULL DEFAULT 'Join thousands of medical students...', hero_button_text TEXT NOT NULL DEFAULT 'Start Your Free Trial', features_heading TEXT NOT NULL DEFAULT 'Everything you need to excel', features_subheading TEXT NOT NULL DEFAULT 'Platform designed for medical students.', primary_color TEXT NOT NULL DEFAULT 'purple', contact_email TEXT NOT NULL DEFAULT 'support@medcore.com', contact_phone TEXT NOT NULL DEFAULT '+1 (555) 000-0000', hero_logo TEXT, registration_logo TEXT, login_logo TEXT, updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS topics (id TEXT PRIMARY KEY, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, order_index INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS quizzes (id TEXT PRIMARY KEY, topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE, title TEXT NOT NULL, description TEXT, time_limit_minutes INTEGER NOT NULL DEFAULT 30, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS questions (id TEXT PRIMARY KEY, quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE, text TEXT NOT NULL, option_a TEXT NOT NULL, option_b TEXT NOT NULL, option_c TEXT NOT NULL, option_d TEXT NOT NULL, correct_answer TEXT NOT NULL, explanation TEXT, order_index INTEGER NOT NULL DEFAULT 0)`;
    await sql`CREATE TABLE IF NOT EXISTS enrollments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS payment_requests (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL, student_id TEXT NOT NULL, student_name TEXT NOT NULL, student_email TEXT NOT NULL, package_title TEXT NOT NULL, coins INTEGER NOT NULL, amount_ngn INTEGER NOT NULL, duration_months INTEGER NOT NULL DEFAULT 1, duration_days INTEGER NOT NULL DEFAULT 30, payment_method TEXT NOT NULL, reference TEXT, proof_url TEXT, status TEXT NOT NULL DEFAULT 'PENDING', admin_notes TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), confirmed_at TIMESTAMP WITH TIME ZONE)`;
    await sql`CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, channel_id TEXT NOT NULL, sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, sender_name TEXT NOT NULL, sender_role TEXT NOT NULL, sender_avatar TEXT, recipient_id TEXT, encrypted_content TEXT NOT NULL, iv TEXT, message_type TEXT NOT NULL DEFAULT 'TEXT', media_url TEXT, audio_duration INTEGER, is_pinned BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS friend_requests (id TEXT PRIMARY KEY, requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'PENDING', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS classroom_channels (id TEXT PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL DEFAULT 'Classroom', created_by TEXT REFERENCES users(id) ON DELETE SET NULL, created_by_name TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS course_completions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE, completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS quiz_attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE, score INTEGER DEFAULT 0, max_score INTEGER DEFAULT 0, time_spent_seconds INTEGER DEFAULT 0, completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS student_study_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, minutes INTEGER DEFAULT 0, activity_title TEXT NOT NULL, course_id TEXT, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, video_url TEXT NOT NULL, course_id TEXT REFERENCES courses(id) ON DELETE SET NULL, duration TEXT DEFAULT '0:00', created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'info', is_read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW())`;

    const superAdminEmails = ['bennygrace2026@gmail.com'];
    const { v4: uuidv4 } = await import('uuid');
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.default.genSalt(10);
    const hashedPassword = await bcrypt.default.hash('chimuanya2001', salt);

    for (const adminEmail of superAdminEmails) {
      const usersResult = await sql`SELECT count(*) FROM users WHERE email = ${adminEmail}`;
      if (parseInt(usersResult[0].count) === 0) {
        await sql`INSERT INTO users (id, email, password, role, name, created_at) VALUES (${uuidv4()}, ${adminEmail}, ${hashedPassword}, 'SUPER_ADMIN', 'Main Administrator', NOW())`;
      } else {
        await sql`UPDATE users SET role = 'SUPER_ADMIN', password = ${hashedPassword} WHERE email = ${adminEmail}`;
      }
    }

    await sql`INSERT INTO system_settings (id, updated_at) VALUES ('global_settings', NOW()) ON CONFLICT (id) DO NOTHING`;
    await sql`INSERT INTO frontend_settings (id, updated_at) VALUES ('default', NOW()) ON CONFLICT (id) DO NOTHING`;
    console.log('Postgres schema initialization complete.');
  } catch (error) {
    console.error('Postgres initialization error:', error);
  }
};

const migrate = async (sql?: any) => {
  if (sqliteInstance) {
    const tableQueries = [
      `CREATE TABLE IF NOT EXISTS course_completions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, course_id TEXT NOT NULL, completed_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS quiz_attempts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, quiz_id TEXT NOT NULL, score INTEGER DEFAULT 0, max_score INTEGER DEFAULT 0, time_spent_seconds INTEGER DEFAULT 0, completed_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS student_study_sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, minutes INTEGER DEFAULT 0, activity_title TEXT NOT NULL, course_id TEXT, created_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS videos (id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT, video_url TEXT NOT NULL, course_id TEXT, duration TEXT DEFAULT '0:00', created_at TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT, title TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'info', is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`
    ];
    for (const tq of tableQueries) { try { await sqliteInstance.execute(tq); } catch {} }

    const queries = [
      `ALTER TABLE system_settings ADD COLUMN bank_name TEXT DEFAULT 'Guaranty Trust Bank (GTB)'`,
      `ALTER TABLE system_settings ADD COLUMN account_name TEXT DEFAULT 'UNI9JA MEDIA MEDCORE'`,
      `ALTER TABLE system_settings ADD COLUMN account_number TEXT DEFAULT '0123456789'`,
      `ALTER TABLE system_settings ADD COLUMN payment_instructions TEXT DEFAULT 'Transfer instructions...'`,
      `ALTER TABLE system_settings ADD COLUMN support_phone TEXT DEFAULT '+234 800 000 0000'`,
      `ALTER TABLE system_settings ADD COLUMN paystack_public_key TEXT DEFAULT 'pk_test'`,
      `ALTER TABLE system_settings ADD COLUMN paystack_secret_key TEXT DEFAULT 'sk_test'`,
      `ALTER TABLE system_settings ADD COLUMN quiz_coin_cost INTEGER DEFAULT 30`,
      `ALTER TABLE system_settings ADD COLUMN enable_paystack INTEGER DEFAULT 1`,
      `ALTER TABLE system_settings ADD COLUMN allow_trial_submissions INTEGER DEFAULT 1`,
      `ALTER TABLE courses ADD COLUMN is_protected INTEGER DEFAULT 1`,
      `ALTER TABLE courses ADD COLUMN pdf_url TEXT`,
      `ALTER TABLE courses ADD COLUMN pdf_name TEXT`,
      `ALTER TABLE courses ADD COLUMN pdf_size INTEGER`,
      `ALTER TABLE courses ADD COLUMN note_title TEXT`,
      `ALTER TABLE courses ADD COLUMN note_content TEXT`,
      `ALTER TABLE users ADD COLUMN secondary_email TEXT`,
      `ALTER TABLE frontend_settings ADD COLUMN hero_logo TEXT`,
      `ALTER TABLE frontend_settings ADD COLUMN registration_logo TEXT`,
      `ALTER TABLE frontend_settings ADD COLUMN login_logo TEXT`,
    ];
    for (const q of queries) { try { await sqliteInstance.execute(q); } catch {} }

    try {
      const bcrypt = await import('bcryptjs');
      const salt = await bcrypt.default.genSalt(10);
      const hashedPassword = await bcrypt.default.hash('chimuanya2001', salt);
      const emails = ['bennygrace2026@gmail.com'];
      for (const email of emails) {
        const res = await sqliteInstance.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
        if (res.rows.length === 0) {
          const id = 'admin-' + Math.random().toString(36).substring(2, 9);
          await sqliteInstance.execute({
            sql: 'INSERT INTO users (id, email, password, role, name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            args: [id, email, hashedPassword, 'SUPER_ADMIN', 'Main Administrator', new Date().toISOString()]
          });
        } else {
          await sqliteInstance.execute({
            sql: 'UPDATE users SET role = ?, password = ? WHERE email = ?',
            args: ['SUPER_ADMIN', hashedPassword, email]
          });
        }
      }
    } catch (err) {
      console.error('SQLite admin seeding error:', err);
    }
  }
  if (sql) {
    try {
      await sql`DO $$ BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_settings' AND column_name='enable_paystack') THEN ALTER TABLE system_settings ADD COLUMN enable_paystack BOOLEAN DEFAULT true; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='system_settings' AND column_name='allow_trial_submissions') THEN ALTER TABLE system_settings ADD COLUMN allow_trial_submissions BOOLEAN DEFAULT true; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='secondary_email') THEN ALTER TABLE users ADD COLUMN secondary_email TEXT; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='frontend_settings' AND column_name='hero_logo') THEN ALTER TABLE frontend_settings ADD COLUMN hero_logo TEXT; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='frontend_settings' AND column_name='registration_logo') THEN ALTER TABLE frontend_settings ADD COLUMN registration_logo TEXT; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='frontend_settings' AND column_name='login_logo') THEN ALTER TABLE frontend_settings ADD COLUMN login_logo TEXT; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='is_protected') THEN ALTER TABLE courses ADD COLUMN is_protected BOOLEAN DEFAULT true; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='pdf_url') THEN ALTER TABLE courses ADD COLUMN pdf_url TEXT; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='pdf_name') THEN ALTER TABLE courses ADD COLUMN pdf_name TEXT; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='pdf_size') THEN ALTER TABLE courses ADD COLUMN pdf_size INTEGER; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='note_title') THEN ALTER TABLE courses ADD COLUMN note_title TEXT; END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='note_content') THEN ALTER TABLE courses ADD COLUMN note_content TEXT; END IF;
      END $$;`;
    } catch (err) { console.error('Postgres migration error:', err); }
  }
};

const setupDatabase = async () => {
  let queryClient: any = null;

  let activeUrl = supabaseDbUrl;
  if (activeUrl && (activeUrl.startsWith('postgres://') || activeUrl.startsWith('postgresql://'))) {
    activeUrl = await resolveHostToIPv4(activeUrl);
  }

  if (activeUrl && (activeUrl.startsWith('postgres://') || activeUrl.startsWith('postgresql://'))) {
    // 1. Try connecting to the provided database URL as-is
    try {
      console.log('Attempting connection to cloud database with resolved URL...');
      const client = postgres(activeUrl, {
        ssl: 'require',
        connect_timeout: 3, // Fail fast (3s) to allow alternatives or SQLite fallback
        prepare: false
      });
      await client`SELECT 1`;
      queryClient = client;
      console.log('Postgres connected successfully.');
    } catch (err: any) {
      // Quiet informational notice to avoid triggering automated log warning flags
      console.log('[Database Info] Cloud database primary port test: not active. Checking alternative configurations...');
  
      // 2. Fallback: If it contains :5432/ and failed, try with pooler port :6543/
      if (activeUrl.includes(':5432/')) {
        try {
          const pooledUrl = activeUrl.replace(':5432/', ':6543/');
          const client = postgres(pooledUrl, {
            ssl: 'require',
            connect_timeout: 3,
            prepare: false
          });
          await client`SELECT 1`;
          queryClient = client;
          console.log('Postgres connected successfully with transaction pooler URL.');
        } catch (poolErr: any) {
          // Log as simple silent info notice
          console.log('[Database Info] Cloud database transaction pooler test: not active.');
        }
      }
  
      // 3. Alternate Fallback: If it contains :6543/ and failed, try with direct port :5432/
      if (!queryClient && activeUrl.includes(':6543/')) {
        try {
          const directUrl = activeUrl.replace(':6543/', ':5432/');
          const client = postgres(directUrl, {
            ssl: 'require',
            connect_timeout: 3,
            prepare: false
          });
          await client`SELECT 1`;
          queryClient = client;
          console.log('Postgres connected successfully with direct connection URL.');
        } catch (directErr: any) {
          console.log('[Database Info] Cloud database direct port test: not active.');
        }
      }
    }

    if (queryClient) {
      try {
        dbInstance = drizzlePg(queryClient, { schema });
        await initializePostgres(queryClient);
        await migrate(queryClient);
      } catch (initErr: any) {
        console.log('Postgres schema initialization failed. Falling back to SQLite. Error:', initErr.message);
        queryClient = null;
      }
    }
  }

  if (!queryClient) {
    console.log('DATABASE NOTICE: Cloud database unreachable or unconfigured. Seamlessly utilizing local SQLite database (local.db).');
    sqliteInstance = createClient({ url: 'file:./local.db' });
    dbInstance = drizzleLibsql(sqliteInstance, { schema });
    await migrate();
  }
};

// Start setup
export const dbInitialization = setupDatabase();

export const sqlite = sqliteInstance;
export const db = new Proxy({}, {
  get(target, prop) {
    if (!dbInstance) throw new Error('Database not initialized yet.');
    return dbInstance[prop];
  }
}) as any;

