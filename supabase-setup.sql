-- ==============================================================================
-- MEDCORE ACADEMY - SUPABASE / POSTGRESQL COMPLETE DATABASE SCHEMA & SEED
-- ==============================================================================
-- Run this script directly in your Supabase SQL Editor:
-- Supabase Dashboard -> Select Project -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'STUDENT',
  name TEXT NOT NULL,
  phone TEXT,
  country TEXT,
  state TEXT,
  profile_photo TEXT,
  secondary_email TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure all users columns exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS secondary_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

-- 2. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution TEXT,
  department TEXT,
  level TEXT,
  coins INTEGER NOT NULL DEFAULT 0,
  access_days_remaining INTEGER NOT NULL DEFAULT 7,
  access_expiry_date TIMESTAMP WITH TIME ZONE,
  streak INTEGER NOT NULL DEFAULT 0,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
);

ALTER TABLE students ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS level TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS access_days_remaining INTEGER NOT NULL DEFAULT 7;
ALTER TABLE students ADD COLUMN IF NOT EXISTS access_expiry_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';

-- 3. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  description TEXT,
  thumbnail TEXT,
  pdf_url TEXT,
  pdf_name TEXT,
  pdf_size INTEGER,
  note_title TEXT,
  note_content TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_protected BOOLEAN NOT NULL DEFAULT true,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS code TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS pdf_name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS pdf_size INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS note_title TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS note_content TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_protected BOOLEAN NOT NULL DEFAULT true;

-- 4. TOPICS TABLE
CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

-- 7. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  site_title TEXT NOT NULL DEFAULT 'Medcore Academy',
  site_subtitle TEXT NOT NULL DEFAULT 'UNI9JA MEDIA',
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  allow_registrations BOOLEAN NOT NULL DEFAULT true,
  default_access_days INTEGER NOT NULL DEFAULT 7,
  enable_coin_purchases BOOLEAN NOT NULL DEFAULT true,
  quiz_coin_cost INTEGER NOT NULL DEFAULT 30,
  show_leaderboard BOOLEAN NOT NULL DEFAULT true,
  admin_course_creation BOOLEAN NOT NULL DEFAULT true,
  admin_manual_approvals BOOLEAN NOT NULL DEFAULT true,
  admin_view_analytics BOOLEAN NOT NULL DEFAULT true,
  bank_name TEXT NOT NULL DEFAULT 'Guaranty Trust Bank (GTB)',
  account_name TEXT NOT NULL DEFAULT 'UNI9JA MEDIA MEDCORE',
  account_number TEXT NOT NULL DEFAULT '0123456789',
  payment_instructions TEXT NOT NULL DEFAULT 'Transfer instructions...',
  support_phone TEXT NOT NULL DEFAULT '+234 800 000 0000',
  paystack_public_key TEXT DEFAULT 'pk_test_sample_key',
  paystack_secret_key TEXT DEFAULT 'sk_test_sample_key',
  enable_paystack BOOLEAN NOT NULL DEFAULT true,
  allow_trial_submissions BOOLEAN NOT NULL DEFAULT true,
  coin_packages TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS enable_paystack BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS allow_trial_submissions BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS coin_packages TEXT;

-- 8. FRONTEND SETTINGS TABLE
CREATE TABLE IF NOT EXISTS frontend_settings (
  id TEXT PRIMARY KEY,
  hero_heading TEXT NOT NULL DEFAULT 'Accelerate Your Medical Career',
  hero_subheading TEXT NOT NULL DEFAULT 'Join thousands of medical students...',
  hero_button_text TEXT NOT NULL DEFAULT 'Start Your Free Trial',
  features_heading TEXT NOT NULL DEFAULT 'Everything you need to excel',
  features_subheading TEXT NOT NULL DEFAULT 'Platform designed for medical students.',
  primary_color TEXT NOT NULL DEFAULT 'purple',
  contact_email TEXT NOT NULL DEFAULT 'support@medcore.com',
  contact_phone TEXT NOT NULL DEFAULT '+1 (555) 000-0000',
  hero_logo TEXT,
  registration_logo TEXT,
  login_logo TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE frontend_settings ADD COLUMN IF NOT EXISTS hero_logo TEXT;
ALTER TABLE frontend_settings ADD COLUMN IF NOT EXISTS registration_logo TEXT;
ALTER TABLE frontend_settings ADD COLUMN IF NOT EXISTS login_logo TEXT;

-- 9. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS enrollments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. PAYMENT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS payment_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  package_title TEXT NOT NULL,
  coins INTEGER NOT NULL,
  amount_ngn INTEGER NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  duration_days INTEGER NOT NULL DEFAULT 30,
  payment_method TEXT NOT NULL,
  reference TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- 11. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  sender_avatar TEXT,
  recipient_id TEXT,
  encrypted_content TEXT NOT NULL,
  iv TEXT,
  message_type TEXT NOT NULL DEFAULT 'TEXT',
  media_url TEXT,
  audio_duration INTEGER,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 12. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS friend_requests (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 13. CLASSROOM CHANNELS TABLE
CREATE TABLE IF NOT EXISTS classroom_channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Classroom',
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 14. COURSE COMPLETIONS TABLE
CREATE TABLE IF NOT EXISTS course_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 15. QUIZ ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 16. STUDENT STUDY SESSIONS TABLE
CREATE TABLE IF NOT EXISTS student_study_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  minutes INTEGER DEFAULT 0,
  activity_title TEXT NOT NULL,
  course_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 17. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  duration TEXT DEFAULT '0:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 18. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR FAST PERFORMANCE & LOOKUPS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_author_id ON courses(author_id);
CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic_id ON quizzes(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ==============================================================================
-- INITIAL SEEDING: SUPER ADMIN & DEMO STUDENT
-- ==============================================================================
-- Password 'chimuanya2001' bcrypt hash: $2a$10$w8.2Zf5D1b4qM51Dq.1yQOFc4vP8K17qK1fT8b.sEaKx9kP0R0O0G (or standard bcrypt)

-- 1. Insert/Update Super Admin Account
INSERT INTO users (id, email, password, role, name, status, created_at)
VALUES (
  '4ef0b09c-531b-49bb-bb22-13dfbe873d9d',
  'bennygrace2026@gmail.com',
  '$2a$10$wKkS3qFm9a7R/5GqHh88xexiJmsqfWcT62261s1gT14sV5r1bQZ6m',
  'SUPER_ADMIN',
  'Main Administrator',
  'ACTIVE',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'SUPER_ADMIN',
  status = 'ACTIVE';

-- 2. Insert/Update Demo Student Account
INSERT INTO users (id, email, password, role, name, status, created_at)
VALUES (
  '2eec0034-55f6-4b11-a5f5-9254f97037ec',
  'student@medcore.com',
  '$2a$10$wKkS3qFm9a7R/5GqHh88xexiJmsqfWcT62261s1gT14sV5r1bQZ6m',
  'STUDENT',
  'Registered Student',
  'ACTIVE',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'STUDENT',
  status = 'ACTIVE';

-- 3. Link Student Record
INSERT INTO students (id, user_id, institution, department, level, coins, access_days_remaining, streak, is_approved, status)
VALUES (
  'MCA-2026-00001',
  '2eec0034-55f6-4b11-a5f5-9254f97037ec',
  'Medcore Academy',
  'Medicine & Surgery',
  '300 Level',
  100,
  30,
  1,
  true,
  'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Global Settings Defaults
INSERT INTO system_settings (id, updated_at) 
VALUES ('global_settings', NOW()) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO frontend_settings (id, updated_at) 
VALUES ('default', NOW()) 
ON CONFLICT (id) DO NOTHING;
