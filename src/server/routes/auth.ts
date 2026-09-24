import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { users, students, systemSettings } from '../../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { syncAndFormatStudent } from '../utils/studentAccess.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only-2026';

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
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
