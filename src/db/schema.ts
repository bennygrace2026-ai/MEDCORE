import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { pgTable, text as pgText, integer as pgInteger, timestamp as pgTimestamp, boolean as pgBoolean, real as pgReal } from 'drizzle-orm/pg-core';

const isPostgres = !!process.env.SUPABASE_DATABASE_URL;

// Helper to choose table builder
const table: any = isPostgres ? pgTable : sqliteTable;
const tText: any = isPostgres ? pgText : text;
const tInt: any = isPostgres ? pgInteger : integer;
const tTime: any = isPostgres ? pgTimestamp : (name: string) => integer(name, { mode: 'timestamp' });
const tBool: any = isPostgres ? pgBoolean : (name: string) => integer(name, { mode: 'boolean' });

export const users = table('users', {
  id: tText('id').primaryKey(),
  email: tText('email').notNull().unique(),
  password: tText('password').notNull(),
  role: tText('role').notNull().default('STUDENT'),
  name: tText('name').notNull(),
  phone: tText('phone'),
  country: tText('country'),
  state: tText('state'),
  profilePhoto: tText('profile_photo'),
  secondaryEmail: tText('secondary_email'),
  status: tText('status').notNull().default('ACTIVE'),
  createdAt: tTime('created_at').notNull(),
});

export const students = table('students', {
  id: tText('id').primaryKey(),
  userId: tText('user_id').notNull().references(() => users.id),
  institution: tText('institution'),
  department: tText('department'),
  level: tText('level'),
  coins: tInt('coins').default(0).notNull(),
  accessDaysRemaining: tInt('access_days_remaining').default(7).notNull(),
  accessExpiryDate: tTime('access_expiry_date'),
  streak: tInt('streak').default(0).notNull(),
  isApproved: tBool('is_approved').default(false).notNull(),
  paymentProofUrl: tText('payment_proof_url'),
  status: tText('status').notNull().default('ACTIVE'),
});

export const courses = table('courses', {
  id: tText('id').primaryKey(),
  title: tText('title').notNull(),
  code: tText('code').notNull().default(''),
  description: tText('description'),
  thumbnail: tText('thumbnail'),
  pdfUrl: tText('pdf_url'),
  pdfName: tText('pdf_name'),
  pdfSize: tInt('pdf_size'),
  noteTitle: tText('note_title'),
  noteContent: tText('note_content'),
  isPublished: tBool('is_published').default(false).notNull(),
  isProtected: tBool('is_protected').default(true).notNull(),
  authorId: tText('author_id').notNull().references(() => users.id),
  createdAt: tTime('created_at').notNull(),
});

export const topics = table('topics', {
  id: tText('id').primaryKey(),
  courseId: tText('course_id').notNull().references(() => courses.id),
  title: tText('title').notNull(),
  description: tText('description'),
  orderIndex: tInt('order_index').default(0).notNull(),
  createdAt: tTime('created_at').notNull(),
});

export const quizzes = table('quizzes', {
  id: tText('id').primaryKey(),
  topicId: tText('topic_id').notNull().references(() => topics.id),
  title: tText('title').notNull(),
  description: tText('description'),
  timeLimitMinutes: tInt('time_limit_minutes').default(30).notNull(),
  createdAt: tTime('created_at').notNull(),
});

export const systemSettings = table('system_settings', {
  id: tText('id').primaryKey(),
  siteTitle: tText('site_title').notNull().default('Medcore Academy'),
  siteSubtitle: tText('site_subtitle').notNull().default('UNI9JA MEDIA'),
  maintenanceMode: tBool('maintenance_mode').default(false).notNull(),
  allowRegistrations: tBool('allow_registrations').default(true).notNull(),
  defaultAccessDays: tInt('default_access_days').default(7).notNull(),
  enableCoinPurchases: tBool('enable_coin_purchases').default(true).notNull(),
  quizCoinCost: tInt('quiz_coin_cost').default(30).notNull(),
  showLeaderboard: tBool('show_leaderboard').default(true).notNull(),
  adminCourseCreation: tBool('admin_course_creation').default(true).notNull(),
  adminManualApprovals: tBool('admin_manual_approvals').default(true).notNull(),
  adminViewAnalytics: tBool('admin_view_analytics').default(true).notNull(),
  bankName: tText('bank_name').notNull().default('Guaranty Trust Bank (GTB)'),
  accountName: tText('account_name').notNull().default('UNI9JA MEDIA MEDCORE'),
  accountNumber: tText('account_number').notNull().default('0123456789'),
  paymentInstructions: tText('payment_instructions').notNull().default('Transfer instructions...'),
  supportPhone: tText('support_phone').notNull().default('+234 800 000 0000'),
  paystackPublicKey: tText('paystack_public_key').notNull().default('pk_test_sample_key'),
  paystackSecretKey: tText('paystack_secret_key').notNull().default('sk_test_sample_key'),
  enablePaystack: tBool('enable_paystack').default(true).notNull(),
  allowTrialSubmissions: tBool('allow_trial_submissions').default(true).notNull(),
  coinPackages: tText('coin_packages'),
  updatedAt: tTime('updated_at').notNull(),
});

export const frontendSettings = table('frontend_settings', {
  id: tText('id').primaryKey(),
  heroHeading: tText('hero_heading').notNull().default('Accelerate Your Medical Career'),
  heroSubheading: tText('hero_subheading').notNull().default('Join thousands of medical students...'),
  heroButtonText: tText('hero_button_text').notNull().default('Start Your Free Trial'),
  featuresHeading: tText('features_heading').notNull().default('Everything you need to excel'),
  featuresSubheading: tText('features_subheading').notNull().default('Platform designed for medical students.'),
  primaryColor: tText('primary_color').notNull().default('purple'),
  contactEmail: tText('contact_email').notNull().default('support@medcore.com'),
  contactPhone: tText('contact_phone').notNull().default('+1 (555) 000-0000'),
  heroLogo: tText('hero_logo'),
  registrationLogo: tText('registration_logo'),
  loginLogo: tText('login_logo'),
  updatedAt: tTime('updated_at').notNull(),
});

export const questions = table('questions', {
  id: tText('id').primaryKey(),
  quizId: tText('quiz_id').notNull().references(() => quizzes.id),
  text: tText('text').notNull(),
  optionA: tText('option_a').notNull(),
  optionB: tText('option_b').notNull(),
  optionC: tText('option_c').notNull(),
  optionD: tText('option_d').notNull(),
  correctAnswer: tText('correct_answer').notNull(),
  explanation: tText('explanation'),
  imageUrl: tText('image_url'),
  orderIndex: tInt('order_index').default(0).notNull(),
});

export const enrollments = table('enrollments', {
  id: tText('id').primaryKey(),
  userId: tText('user_id').notNull().references(() => users.id),
  courseId: tText('course_id').notNull().references(() => courses.id),
  enrolledAt: tTime('enrolled_at').notNull(),
});

export const paymentRequests = table('payment_requests', {
  id: tText('id').primaryKey(),
  userId: tText('user_id').notNull().references(() => users.id),
  studentId: tText('student_id').notNull(),
  studentName: tText('student_name').notNull(),
  studentEmail: tText('student_email').notNull(),
  packageTitle: tText('package_title').notNull(),
  coins: tInt('coins').notNull(),
  amountNgn: tInt('amount_ngn').notNull(),
  durationMonths: tInt('duration_months').default(1).notNull(),
  durationDays: tInt('duration_days').default(30).notNull(),
  paymentMethod: tText('payment_method').notNull(),
  reference: tText('reference'),
  proofUrl: tText('proof_url'),
  status: tText('status').notNull().default('PENDING'),
  adminNotes: tText('admin_notes'),
  createdAt: tTime('created_at').notNull(),
  confirmedAt: tTime('confirmed_at'),
});

export const chatMessages = table('chat_messages', {
  id: tText('id').primaryKey(),
  channelId: tText('channel_id').notNull(),
  senderId: tText('sender_id').notNull().references(() => users.id),
  senderName: tText('sender_name').notNull(),
  senderRole: tText('sender_role').notNull(),
  senderAvatar: tText('sender_avatar'),
  recipientId: tText('recipient_id'),
  encryptedContent: tText('encrypted_content').notNull(),
  iv: tText('iv'),
  messageType: tText('message_type').notNull().default('TEXT'),
  mediaUrl: tText('media_url'),
  audioDuration: tInt('audio_duration'),
  isPinned: tBool('is_pinned').default(false).notNull(),
  createdAt: tTime('created_at').notNull(),
});

export const friendRequests = table('friend_requests', {
  id: tText('id').primaryKey(),
  requesterId: tText('requester_id').notNull().references(() => users.id),
  recipientId: tText('recipient_id').notNull().references(() => users.id),
  status: tText('status').notNull().default('PENDING'),
  createdAt: tTime('created_at').notNull(),
  updatedAt: tTime('updated_at').notNull(),
});

export const classroomChannels = table('classroom_channels', {
  id: tText('id').primaryKey(),
  name: tText('name').notNull(),
  description: tText('description').notNull(),
  category: tText('category').notNull().default('Classroom'),
  createdBy: tText('created_by').references(() => users.id),
  createdByName: tText('created_by_name'),
  createdAt: tTime('created_at').notNull(),
});

export const courseCompletions = table('course_completions', {
  id: tText('id').primaryKey(),
  userId: tText('user_id').notNull().references(() => users.id),
  courseId: tText('course_id').notNull().references(() => courses.id),
  completedAt: tTime('completed_at').notNull(),
});

export const quizAttempts = table('quiz_attempts', {
  id: tText('id').primaryKey(),
  userId: tText('user_id').notNull().references(() => users.id),
  quizId: tText('quiz_id').notNull().references(() => quizzes.id),
  score: tInt('score').default(0).notNull(),
  maxScore: tInt('max_score').default(0).notNull(),
  timeSpentSeconds: tInt('time_spent_seconds').default(0).notNull(),
  completedAt: tTime('completed_at').notNull(),
});

export const studentStudySessions = table('student_study_sessions', {
  id: tText('id').primaryKey(),
  userId: tText('user_id').notNull().references(() => users.id),
  minutes: tInt('minutes').default(0).notNull(),
  activityTitle: tText('activity_title').notNull(),
  courseId: tText('course_id'),
  createdAt: tTime('created_at').notNull(),
});

export const videos = table('videos', {
  id: tText('id').primaryKey(),
  title: tText('title').notNull(),
  description: tText('description'),
  videoUrl: tText('video_url').notNull(),
  courseId: tText('course_id').references(() => courses.id),
  duration: tText('duration').default('0:00'),
  createdAt: tTime('created_at').notNull(),
});

export const notifications = table('notifications', {
  id: tText('id').primaryKey(),
  userId: tText('user_id'), // Can be null to broadcast to ALL students, or user ID for specific
  title: tText('title').notNull(),
  message: tText('message').notNull(),
  type: tText('type').notNull().default('info'), // 'info', 'success', 'warning'
  isRead: tBool('is_read').default(false).notNull(),
  createdAt: tTime('created_at').notNull(),
});



