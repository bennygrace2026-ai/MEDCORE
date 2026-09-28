import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, getDatabaseStatus, dbInitialization } from '../../db/index.js';
import { supabase, isSupabaseConfigured } from '../../db/supabase.js';
import { users, students, systemSettings } from '../../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { authenticateToken, AuthRequest, JWT_SECRET } from '../middleware/auth.js';
import { syncAndFormatStudent } from '../utils/studentAccess.js';

const router = Router();

const generateStudentId = async (): Promise<string> => {
  try {
    const allStudents = await db.select().from(students);
    const count = (allStudents?.length || 0) + 1;
    const paddedCount = count.toString().padStart(5, '0');
    const prospectiveId = `MCA-2026-${paddedCount}`;
    const exists = allStudents?.some((s: any) => s.id === prospectiveId);
    if (!exists) return prospectiveId;
  } catch (err) {
    console.warn('generateStudentId count query warning:', err);
  }
  return `MCA-2026-${Math.floor(10000 + Math.random() * 90000)}`;
};

router.post('/register', async (req, res) => {
  try {
    await dbInitialization;
    const { name, email, phone, password, country, state, institution, department, level } = req.body;

    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanName = name ? String(name).trim() : '';

    if (!cleanName || !cleanEmail || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Check if new registrations are allowed in system settings
    try {
      const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'global_settings')).limit(1);
      if (settings.length > 0 && settings[0].allowRegistrations === false) {
        res.status(403).json({ error: 'Student registration is currently closed by the administrator.' });
        return;
      }
    } catch (err) {
      console.warn('Could not check allowRegistrations setting:', err);
    }

    // Check if user exists (case-insensitive check)
    const existingUser = await db.select().from(users).where(
      or(
        eq(users.email, cleanEmail),
        eq(users.secondaryEmail, cleanEmail)
      )
    ).limit(1);

    if (existingUser.length > 0) {
      res.status(400).json({ error: 'Email already registered. Please sign in or use a different email.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = crypto.randomUUID();
    
    // Create user
    await db.insert(users).values({
      id: userId,
      email: cleanEmail,
      password: hashedPassword,
      name: cleanName,
      phone: phone ? String(phone).trim() : '',
      country: country ? String(country).trim() : '',
      state: state ? String(state).trim() : '',
      role: 'STUDENT',
      status: 'ACTIVE',
      createdAt: new Date(),
    });

    const studentId = await generateStudentId();

    // Fetch configured default access days from system settings
    let defaultDays = 7;
    try {
      const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'global_settings')).limit(1);
      if (settings.length > 0 && typeof settings[0].defaultAccessDays === 'number' && settings[0].defaultAccessDays > 0) {
        defaultDays = settings[0].defaultAccessDays;
      }
    } catch (err) {
      console.warn('Could not read defaultAccessDays, fallback to 7:', err);
    }

    // Give free access trial based on system settings
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + defaultDays);

    // Create student profile
    await db.insert(students).values({
      id: studentId,
      userId: userId,
      institution: institution ? String(institution).trim() : 'Medcore Academy',
      department: department ? String(department).trim() : 'Medicine & Surgery',
      level: level ? String(level).trim() : '100 Level',
      coins: 0,
      accessDaysRemaining: defaultDays,
      accessExpiryDate: expiryDate,
      streak: 0,
      isApproved: true,
      status: 'ACTIVE'
    });

    const studentRecord = await syncAndFormatStudent({
      id: studentId,
      userId: userId,
      institution: institution ? String(institution).trim() : 'Medcore Academy',
      department: department ? String(department).trim() : 'Medicine & Surgery',
      level: level ? String(level).trim() : '100 Level',
      coins: 0,
      accessDaysRemaining: defaultDays,
      accessExpiryDate: expiryDate,
      streak: 0,
      isApproved: true,
      status: 'ACTIVE'
    });

    const tokenPayload = {
      id: userId,
      role: 'STUDENT',
      studentId: studentId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ 
      message: 'Registration successful', 
      studentId,
      token,
      user: {
        id: userId,
        name: cleanName,
        email: cleanEmail,
        phone: phone ? String(phone).trim() : '',
        country: country ? String(country).trim() : '',
        state: state ? String(state).trim() : '',
        role: 'STUDENT',
        status: 'ACTIVE',
        studentId
      },
      studentData: studentRecord
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    await dbInitialization;
    const { email, password, expectedRole } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();

    let user = await db.select().from(users).where(
      or(
        eq(users.email, cleanEmail),
        eq(users.secondaryEmail, cleanEmail)
      )
    ).limit(1);

    if (user.length === 0) {
      user = await db.select().from(users).where(
        or(
          eq(users.email, String(email).trim()),
          eq(users.secondaryEmail, String(email).trim())
        )
      ).limit(1);
    }

    if (user.length === 0) {
      res.status(401).json({ error: 'EMAIL NOT REGISTERED' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user[0].password);

    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Check account status (Suspension or Ban)
    if (user[0].status === 'SUSPENDED') {
      res.status(403).json({ error: 'Your account has been SUSPENDED by the administrator. Please contact support.' });
      return;
    }
    if (user[0].status === 'BANNED') {
      res.status(403).json({ error: 'Your account has been BANNED from Medcore Academy.' });
      return;
    }

    // Role verification for dedicated admin portals:
    if (expectedRole === 'SUPER_ADMIN' && user[0].role !== 'SUPER_ADMIN') {
      if (user[0].role === 'ADMIN') {
        res.status(403).json({ error: 'This account is an Administrator. Please use the Admin Login portal at /admin/login.' });
        return;
      }
      res.status(403).json({ error: 'Access Denied: Super Admin portal requires Super Administrator credentials.' });
      return;
    }

    if (expectedRole === 'ADMIN' && user[0].role !== 'ADMIN' && user[0].role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Access Denied: Administrator account required. Students please sign in at the Student portal.' });
      return;
    }

    let studentRecord = undefined;
    if (user[0].role === 'STUDENT') {
      const result = await db.select().from(students).where(eq(students.userId, user[0].id)).limit(1);
      if (result.length > 0) {
        studentRecord = await syncAndFormatStudent(result[0]);
      } else {
        const studentId = await generateStudentId();
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);
        const newRecord = {
          id: studentId,
          userId: user[0].id,
          institution: 'Medcore Academy',
          department: 'Medicine & Surgery',
          level: '300',
          coins: 100,
          accessDaysRemaining: 30,
          accessExpiryDate: expiryDate,
          streak: 0,
          isApproved: true,
          status: 'ACTIVE'
        };
        await db.insert(students).values(newRecord);
        studentRecord = await syncAndFormatStudent(newRecord);
      }
    }

    const tokenPayload = {
      id: user[0].id,
      role: user[0].role,
      studentId: studentRecord?.id
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        secondaryEmail: user[0].secondaryEmail,
        role: user[0].role,
        status: user[0].status || 'ACTIVE',
        studentId: studentRecord?.id
      },
      studentData: studentRecord ? { ...studentRecord, status: user[0].status || studentRecord.status || 'ACTIVE' } : undefined
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: error?.message || 'Server error during login. Please try again in a few moments.',
      specificError: {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        routine: error?.routine,
        hint: error?.hint,
        diagnosticUrl: '/api/auth/diagnostic'
      }
    });
  }
});

// Diagnostic endpoint: GET /api/auth/diagnostic
// Returns full database engine status, Supabase client report, and role account counts
router.get('/diagnostic', async (req, res) => {
  try {
    await dbInitialization;
    const dbStatus = getDatabaseStatus();

    // 1. Test Drizzle DB query
    let drizzleStatus = 'OK';
    let drizzleError: any = null;
    let userStats: any = {};
    try {
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
        createdAt: users.createdAt
      }).from(users);

      userStats = {
        total: allUsers.length,
        superAdmins: allUsers.filter((u: any) => u.role === 'SUPER_ADMIN').map((u: any) => ({ email: u.email, status: u.status })),
        admins: allUsers.filter((u: any) => u.role === 'ADMIN').map((u: any) => ({ email: u.email, status: u.status })),
        students: allUsers.filter((u: any) => u.role === 'STUDENT').map((u: any) => ({ email: u.email, status: u.status })),
      };
    } catch (err: any) {
      drizzleStatus = 'FAILED';
      drizzleError = {
        message: err?.message,
        code: err?.code,
        detail: err?.detail,
        routine: err?.routine,
        stack: err?.stack?.split('\n').slice(0, 3)
      };
    }

    // 2. Test Supabase JS Client
    const supabaseClientReport: any = {
      isConfigured: isSupabaseConfigured(),
      hasUrl: !!process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY
    };

    if (supabase) {
      try {
        const { data, error, status, statusText } = await supabase
          .from('users')
          .select('id, email, role, status')
          .limit(5);

        supabaseClientReport.directQuery = {
          httpStatus: status,
          statusText,
          recordsReturned: data?.length || 0,
          error: error ? {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          } : null
        };
      } catch (sbErr: any) {
        supabaseClientReport.directQuery = {
          thrownError: sbErr?.message || String(sbErr)
        };
      }
    }

    // 3. JWT Signing Test
    let jwtStatus = 'OK';
    try {
      jwt.sign({ test: true }, JWT_SECRET, { expiresIn: '1m' });
    } catch (jErr: any) {
      jwtStatus = `FAILED: ${jErr?.message}`;
    }

    res.json({
      status: 'diagnostic_complete',
      timestamp: new Date().toISOString(),
      database: {
        ...dbStatus,
        queryStatus: drizzleStatus,
        error: drizzleError
      },
      supabaseClient: supabaseClientReport,
      jwtStatus,
      registeredAccountsByRole: userStats,
      diagnosticGuide: {
        superAdminPortal: '/admin/super-login',
        adminPortal: '/admin/login',
        studentPortal: '/login',
        postDiagnosticUsage: 'POST /api/auth/diagnostic with { email, password, expectedRole }'
      }
    });
  } catch (outerErr: any) {
    res.status(500).json({
      status: 'diagnostic_failed',
      error: outerErr?.message || String(outerErr),
      stack: outerErr?.stack?.split('\n').slice(0, 3)
    });
  }
});

// Diagnostic endpoint: POST /api/auth/diagnostic
// Probes authentication step-by-step for a given email, password, and expected role, returning exact errors
router.post('/diagnostic', async (req, res) => {
  const steps: Array<{ step: string; status: 'PASSED' | 'FAILED' | 'WARNING' | 'SKIPPED'; details: any }> = [];
  try {
    const { email, password, expectedRole } = req.body || {};
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';
    const cleanRole = expectedRole ? String(expectedRole).trim().toUpperCase() : '';

    // Step 1: Input Validation
    if (!cleanEmail) {
      steps.push({
        step: 'Input Validation',
        status: 'FAILED',
        details: 'Missing email address to diagnose.'
      });
      res.status(400).json({
        success: false,
        failureReason: 'Email is required for diagnostic probe',
        steps
      });
      return;
    }
    steps.push({
      step: 'Input Validation',
      status: 'PASSED',
      details: {
        testedEmail: cleanEmail,
        hasPasswordProvided: !!password,
        expectedRole: cleanRole || 'ANY'
      }
    });

    // Step 2: Database Engine Connectivity Probe
    try {
      await dbInitialization;
      const dbStatus = getDatabaseStatus();
      steps.push({
        step: 'Database Engine Connectivity',
        status: 'PASSED',
        details: dbStatus
      });
    } catch (dbInitErr: any) {
      steps.push({
        step: 'Database Engine Connectivity',
        status: 'FAILED',
        details: {
          message: dbInitErr?.message,
          code: dbInitErr?.code,
          stack: dbInitErr?.stack?.split('\n').slice(0, 3)
        }
      });
    }

    // Step 3: Supabase JS Client Probe
    let supabaseClientError: any = null;
    if (supabase) {
      try {
        const { data: sbData, error: sbErr, status: sbStatus } = await supabase
          .from('users')
          .select('id, email, role, status')
          .or(`email.eq.${cleanEmail},secondary_email.eq.${cleanEmail}`)
          .limit(1);

        if (sbErr) {
          supabaseClientError = {
            message: sbErr.message,
            code: sbErr.code,
            details: sbErr.details,
            hint: sbErr.hint,
            status: sbStatus
          };
          steps.push({
            step: 'Supabase Client REST API Probe',
            status: 'FAILED',
            details: supabaseClientError
          });
        } else {
          steps.push({
            step: 'Supabase Client REST API Probe',
            status: 'PASSED',
            details: {
              httpStatus: sbStatus,
              found: (sbData?.length || 0) > 0,
              userPreview: sbData?.[0] || null
            }
          });
        }

        // Test Supabase Auth signInWithPassword if password provided
        if (password) {
          try {
            const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password: String(password)
            });
            steps.push({
              step: 'Supabase Auth (GoTrue) API Probe',
              status: authErr ? 'WARNING' : 'PASSED',
              details: authErr ? {
                message: authErr.message,
                status: authErr.status,
                name: authErr.name,
                note: 'App uses custom PostgreSQL auth with bcrypt, but Supabase GoTrue Auth was also probed.'
              } : {
                userId: authData?.user?.id,
                sessionActive: !!authData?.session
              }
            });
          } catch (goTrueErr: any) {
            steps.push({
              step: 'Supabase Auth (GoTrue) API Probe',
              status: 'WARNING',
              details: {
                message: goTrueErr?.message,
                note: 'App relies primarily on SQL user table with bcrypt verification.'
              }
            });
          }
        }
      } catch (sbProbeErr: any) {
        supabaseClientError = { message: sbProbeErr?.message, stack: sbProbeErr?.stack?.split('\n').slice(0, 3) };
        steps.push({
          step: 'Supabase Client REST API Probe',
          status: 'WARNING',
          details: supabaseClientError
        });
      }
    } else {
      steps.push({
        step: 'Supabase Client REST API Probe',
        status: 'SKIPPED',
        details: 'SUPABASE_URL or SUPABASE_ANON_KEY not configured. Application using direct PostgreSQL / Pooler connection.'
      });
    }

    // Step 4: Database User Record Lookup
    let foundUser: any = null;
    try {
      const userResult = await db.select().from(users).where(
        or(
          eq(users.email, cleanEmail),
          eq(users.secondaryEmail, cleanEmail)
        )
      ).limit(1);

      if (userResult.length > 0) {
        foundUser = userResult[0];
        steps.push({
          step: 'Database User Record Lookup',
          status: 'PASSED',
          details: {
            userId: foundUser.id,
            email: foundUser.email,
            actualRole: foundUser.role,
            status: foundUser.status,
            hasPasswordHash: !!foundUser.password,
            passwordHashFormat: foundUser.password?.startsWith('$2') ? 'bcrypt' : 'unknown'
          }
        });
      } else {
        // Query other emails for helpful suggestion
        const sampleUsers = await db.select({ email: users.email, role: users.role }).from(users).limit(10);
        steps.push({
          step: 'Database User Record Lookup',
          status: 'FAILED',
          details: {
            message: `No account exists with email: ${cleanEmail}`,
            availableAccounts: sampleUsers
          }
        });

        res.json({
          success: false,
          failureReason: 'USER_NOT_FOUND',
          specificMessage: `The email "${cleanEmail}" is not registered in the database.`,
          supabaseClientError,
          steps,
          remedy: 'Please check your spelling or register a new student account at /register.'
        });
        return;
      }
    } catch (lookupErr: any) {
      steps.push({
        step: 'Database User Record Lookup',
        status: 'FAILED',
        details: {
          message: lookupErr?.message,
          code: lookupErr?.code,
          detail: lookupErr?.detail,
          routine: lookupErr?.routine
        }
      });
      res.json({
        success: false,
        failureReason: 'DATABASE_QUERY_ERROR',
        specificMessage: `Database error querying user table: ${lookupErr?.message}`,
        supabaseClientError: supabaseClientError || { message: lookupErr?.message, code: lookupErr?.code },
        steps,
        remedy: 'Database connection failed. Ensure Supabase Pooler is accessible.'
      });
      return;
    }

    // Step 5: Account Status Verification
    if (foundUser.status === 'SUSPENDED' || foundUser.status === 'BANNED') {
      steps.push({
        step: 'Account Status Check',
        status: 'FAILED',
        details: {
          accountStatus: foundUser.status,
          message: `Account is flagged as ${foundUser.status}`
        }
      });
      res.json({
        success: false,
        failureReason: `ACCOUNT_${foundUser.status}`,
        specificMessage: `This account has status: ${foundUser.status}. Access is blocked.`,
        supabaseClientError,
        steps,
        remedy: 'An administrator must restore the account status to ACTIVE in the admin dashboard.'
      });
      return;
    }
    steps.push({
      step: 'Account Status Check',
      status: 'PASSED',
      details: { accountStatus: foundUser.status }
    });

    // Step 6: Role Matching
    if (cleanRole && foundUser.role !== cleanRole) {
      let roleAdvice = '';
      if (cleanRole === 'SUPER_ADMIN' && foundUser.role === 'ADMIN') {
        roleAdvice = 'This account is an Administrator. Please log in at /admin/login instead of /admin/super-login.';
      } else if (cleanRole === 'SUPER_ADMIN' && foundUser.role === 'STUDENT') {
        roleAdvice = 'This account is a Student. Please log in at /login.';
      } else if (cleanRole === 'ADMIN' && foundUser.role === 'STUDENT') {
        roleAdvice = 'This account is a Student. Administrator privileges are required for /admin/login.';
      } else {
        roleAdvice = `Account role is ${foundUser.role}, but sign-in was attempted for ${cleanRole}.`;
      }

      steps.push({
        step: 'Role Authorization Check',
        status: 'FAILED',
        details: {
          expectedRole: cleanRole,
          actualRole: foundUser.role,
          advice: roleAdvice
        }
      });

      res.json({
        success: false,
        failureReason: 'ROLE_MISMATCH',
        specificMessage: roleAdvice,
        supabaseClientError,
        steps,
        remedy: roleAdvice
      });
      return;
    }
    steps.push({
      step: 'Role Authorization Check',
      status: 'PASSED',
      details: {
        role: foundUser.role,
        roleMatchesExpected: true
      }
    });

    // Step 7: Password Comparison Probe
    if (password) {
      try {
        const passwordMatches = await bcrypt.compare(String(password), foundUser.password);
        if (!passwordMatches) {
          steps.push({
            step: 'Password Hash Verification',
            status: 'FAILED',
            details: {
              passwordMatches: false,
              providedPasswordLength: String(password).length,
              hashType: foundUser.password?.substring(0, 4)
            }
          });

          res.json({
            success: false,
            failureReason: 'INVALID_PASSWORD',
            specificMessage: `Password verification failed for ${cleanEmail}. The provided password does not match the stored hash.`,
            supabaseClientError,
            steps,
            remedy: 'Please double-check your password. If needed, reset the user password in Supabase or run supabase-setup.sql.'
          });
          return;
        }

        steps.push({
          step: 'Password Hash Verification',
          status: 'PASSED',
          details: {
            passwordMatches: true,
            hashAlgorithm: 'bcrypt'
          }
        });
      } catch (bcryptErr: any) {
        steps.push({
          step: 'Password Hash Verification',
          status: 'FAILED',
          details: {
            error: bcryptErr?.message,
            stack: bcryptErr?.stack?.split('\n').slice(0, 2)
          }
        });

        res.json({
          success: false,
          failureReason: 'BCRYPT_ERROR',
          specificMessage: `Bcrypt comparison threw an error: ${bcryptErr?.message}`,
          supabaseClientError,
          steps,
          remedy: 'The stored password hash might be corrupted. Re-hash the password with standard bcrypt.'
        });
        return;
      }
    } else {
      steps.push({
        step: 'Password Hash Verification',
        status: 'SKIPPED',
        details: 'No password provided in diagnostic request payload.'
      });
    }

    // Step 8: Student Profile Probe
    if (foundUser.role === 'STUDENT') {
      try {
        const studentResult = await db.select().from(students).where(eq(students.userId, foundUser.id)).limit(1);
        if (studentResult.length > 0) {
          const formatted = await syncAndFormatStudent(studentResult[0]);
          steps.push({
            step: 'Student Profile Record Check',
            status: 'PASSED',
            details: {
              studentId: formatted.id,
              coins: formatted.coins,
              accessDaysRemaining: formatted.accessDaysRemaining,
              isApproved: formatted.isApproved,
              status: formatted.status,
              isExpired: formatted.isExpired
            }
          });
        } else {
          steps.push({
            step: 'Student Profile Record Check',
            status: 'WARNING',
            details: 'No linked student record found in students table. System will auto-generate one on login.'
          });
        }
      } catch (studentErr: any) {
        steps.push({
          step: 'Student Profile Record Check',
          status: 'WARNING',
          details: { error: studentErr?.message }
        });
      }
    }

    // Step 9: JWT Signing Probe
    try {
      const testToken = jwt.sign({ id: foundUser.id, role: foundUser.role }, JWT_SECRET, { expiresIn: '1h' });
      steps.push({
        step: 'JWT Session Token Generation',
        status: 'PASSED',
        details: {
          tokenGenerated: true,
          tokenLength: testToken.length
        }
      });
    } catch (jwtErr: any) {
      steps.push({
        step: 'JWT Session Token Generation',
        status: 'FAILED',
        details: { error: jwtErr?.message }
      });
      res.json({
        success: false,
        failureReason: 'JWT_SIGNING_ERROR',
        specificMessage: `JWT signing failed: ${jwtErr?.message}`,
        supabaseClientError,
        steps,
        remedy: 'Verify JWT_SECRET environment variable is configured.'
      });
      return;
    }

    // All steps passed!
    res.json({
      success: true,
      diagnosticSummary: 'All authentication checks passed without error.',
      authenticatedUser: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        status: foundUser.status
      },
      supabaseClientError: null,
      steps
    });
  } catch (err: any) {
    res.status(200).json({
      success: false,
      failureReason: 'DIAGNOSTIC_EXCEPTION',
      specificMessage: err?.message || 'An unexpected exception occurred during diagnostic probe',
      errorDetails: {
        message: err?.message,
        name: err?.name,
        code: err?.code,
        stack: err?.stack?.split('\n').slice(0, 3)
      },
      steps
    });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (user.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user[0].status === 'SUSPENDED') {
      res.status(403).json({ error: 'Your account has been SUSPENDED by administration.' });
      return;
    }
    if (user[0].status === 'BANNED') {
      res.status(403).json({ error: 'Your account has been BANNED from Medcore Academy.' });
      return;
    }

    let studentRecord = undefined;
    if (user[0].role === 'STUDENT') {
      const result = await db.select().from(students).where(eq(students.userId, userId)).limit(1);
      if (result.length > 0) {
        studentRecord = await syncAndFormatStudent(result[0]);
      }
    }

    res.json({
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        secondaryEmail: user[0].secondaryEmail,
        role: user[0].role,
        status: user[0].status || 'ACTIVE',
        studentId: studentRecord?.id,
        profilePhoto: user[0].profilePhoto
      },
      studentData: studentRecord ? { ...studentRecord, status: user[0].status || studentRecord.status || 'ACTIVE' } : undefined
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export const authRouter = router;
