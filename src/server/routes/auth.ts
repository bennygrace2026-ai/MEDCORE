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
  // Simple ID generation for now: MCA-2026-XXXXX
  const allStudents = await db.select().from(students);
  const count = allStudents.length + 1;
  const paddedCount = count.toString().padStart(5, '0');
  return `MCA-2026-${paddedCount}`;
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, country, state, institution, department, level } = req.body;

    if (!name || !email || !password) {
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

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      res.status(400).json({ error: 'Email already in use. Please sign in or use a different email.' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userId = crypto.randomUUID();
    
    // Create user
    await db.insert(users).values({
      id: userId,
      email,
      password: hashedPassword,
      name,
      phone,
      country,
      state,
      role: 'STUDENT',
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
      institution,
      department,
      level,
      coins: 0,
      accessDaysRemaining: defaultDays,
      accessExpiryDate: expiryDate,
      streak: 0,
      isApproved: false,
    });

    const studentRecord = await syncAndFormatStudent({
      id: studentId,
      userId: userId,
      institution,
      department,
      level,
      coins: 0,
      accessDaysRemaining: defaultDays,
      accessExpiryDate: expiryDate,
      streak: 0,
      isApproved: false,
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
        name,
        email,
        phone,
        country,
        state,
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

    let user = await db.select().from(users).where(
      or(
        eq(users.email, email.trim().toLowerCase()),
        eq(users.secondaryEmail, email.trim().toLowerCase()),
        eq(users.email, email.trim()),
        eq(users.secondaryEmail, email.trim())
      )
    ).limit(1);

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

    // Strict role separation
    if (expectedRole && user[0].role !== expectedRole) {
      if (user[0].role === 'ADMIN') {
        res.status(403).json({ error: 'This account is an Administrator. Please use the Admin Login portal at /admin/login.' });
        return;
      }
      if (user[0].role === 'SUPER_ADMIN') {
        res.status(403).json({ error: 'This account is a Super Administrator. Please use the Super Admin Login portal at /super-admin/login.' });
        return;
      }
      res.status(403).json({ error: `Access Denied: This login portal is strictly for ${expectedRole} accounts.` });
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
