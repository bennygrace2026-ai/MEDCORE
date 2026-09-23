import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../../db/index.js';
import { courses, students, enrollments, users, topics, quizzes, questions, courseCompletions, studentStudySessions } from '../../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Ensure upload directory exists for course thumbnails
const courseUploadDir = path.join(process.cwd(), 'uploads', 'courses');
if (!fs.existsSync(courseUploadDir)) {
  fs.mkdirSync(courseUploadDir, { recursive: true });
}

// Multer storage for course thumbnails
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, courseUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `course-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails'));
    }
  }
});

// Ensure upload directory exists for course PDF notes
const coursePdfUploadDir = path.join(process.cwd(), 'uploads', 'courses', 'notes');
if (!fs.existsSync(coursePdfUploadDir)) {
  fs.mkdirSync(coursePdfUploadDir, { recursive: true });
}

// Multer storage for course PDF notes
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, coursePdfUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `note-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: 35 * 1024 * 1024 }, // 35MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents (.pdf) are allowed'));
    }
  }
});

// Upload course PDF note document
router.post('/upload-pdf', authenticateToken, (req, res, next) => {
  pdfUpload.single('pdf')(req, res, (err) => {
    if (err) {
      console.error('Course PDF upload multer error:', err);
      return res.status(400).json({ error: err.message || 'Error uploading PDF note document' });
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const fileUrl = `/uploads/courses/notes/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size
    });
  } catch (error: any) {
    console.error('Course PDF upload error:', error);
    res.status(500).json({ error: error?.message || 'Server error uploading PDF' });
  }
});

// Get public courses (Only published ones created by admin)
router.get('/public', async (req, res) => {
  try {
    const publishedCourses = await db.select().from(courses).where(eq(courses.isPublished, true));
    res.json(publishedCourses);
  } catch (error) {
    console.error('Fetch public courses error:', error);
    res.status(500).json({ error: 'Server error fetching public courses' });
  }
});

// Get all courses (with user enrollment status, author info, and access details)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    
    // Fetch courses with author information
    const rawCoursesWithAuthor = await db
      .select({
        id: courses.id,
        title: courses.title,
        code: courses.code,
        description: courses.description,
        thumbnail: courses.thumbnail,
        pdfUrl: courses.pdfUrl,
        pdfName: courses.pdfName,
        pdfSize: courses.pdfSize,
        noteTitle: courses.noteTitle,
        noteContent: courses.noteContent,
        isPublished: courses.isPublished,
        isProtected: courses.isProtected,
        authorId: courses.authorId,
        createdAt: courses.createdAt,
        authorName: users.name,
        authorRole: users.role,
        authorEmail: users.email
      })
      .from(courses)
      .leftJoin(users, eq(courses.authorId, users.id));

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const enrichedForAdmins = rawCoursesWithAuthor.map(c => ({
        ...c,
        isEnrolled: true,
        creatorRole: c.authorRole || 'ADMIN',
        creatorName: c.authorName || 'Academy Faculty'
      }));

      return res.json({
        courses: enrichedForAdmins,
        isPaidOrApproved: true,
        enrolledCount: enrichedForAdmins.length,
        trialLimit: 3
      });
    }

    // Check student status
    let isPaidOrApproved = false;
    let studentCoins = 0;
    const studentRecord = await db.select().from(students).where(eq(students.userId, userId!)).limit(1);
    if (studentRecord.length > 0) {
      const s = studentRecord[0];
      studentCoins = s.coins || 0;
      if (s.isApproved || studentCoins > 0) {
        isPaidOrApproved = true;
      }
    }

    // Get current user's enrollments
    const userEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId!));
    const enrolledCourseIds = new Set(userEnrollments.map(e => e.courseId));

    const enrichedCourses = rawCoursesWithAuthor.map(c => ({
      ...c,
      isEnrolled: enrolledCourseIds.has(c.id)
    }));

    res.json({
      courses: enrichedCourses,
      isPaidOrApproved,
      coins: studentCoins,
      enrolledCount: userEnrollments.length,
      trialLimit: 3
    });
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({ error: 'Server error fetching courses' });
  }
});

// Get courses enrolled by the current user
router.get('/my-courses', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      const all = await db.select().from(courses);
      return res.json(all);
    }

    const userEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId!));
    const courseIds = userEnrollments.map(e => e.courseId);

    if (courseIds.length === 0) {
      return res.json([]);
    }

    const allCourses = await db.select().from(courses);
    const myEnrolledCourses = allCourses.filter(c => courseIds.includes(c.id));
    res.json(myEnrolledCourses);
  } catch (error) {
    console.error('Fetch my courses error:', error);
    res.status(500).json({ error: 'Server error fetching enrolled courses' });
  }
});

// Get completed course IDs for the logged in student
router.get('/completions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const completed = await db.select().from(courseCompletions).where(eq(courseCompletions.userId, userId!));
    res.json(completed.map(c => c.courseId));
  } catch (error) {
    console.error('Fetch completed courses error:', error);
    res.status(500).json({ error: 'Server error fetching completed courses' });
  }
});

// Toggle course completion for student
router.post('/:id/toggle-complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const courseId = String(req.params.id);

    const existing = await db
      .select()
      .from(courseCompletions)
      .where(and(eq(courseCompletions.userId, userId!), eq(courseCompletions.courseId, courseId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(courseCompletions).where(eq(courseCompletions.id, existing[0].id));
      return res.json({ completed: false, courseId, message: 'Course marked as in progress.' });
    } else {
      await db.insert(courseCompletions).values({
        id: uuidv4(),
        userId: userId!,
        courseId,
        completedAt: new Date()
      });

      // Also log 60 minutes study time for completing a full course
      try {
        await db.insert(studentStudySessions).values({
          id: uuidv4(),
          userId: userId!,
          minutes: 60,
          activityTitle: `Completed Course Curriculum: ${courseId}`,
          courseId,
          createdAt: new Date()
        });
      } catch {}

      return res.json({ completed: true, courseId, message: 'Congratulations! Course marked as completed.' });
    }
  } catch (error) {
    console.error('Toggle course completion error:', error);
    res.status(500).json({ error: 'Server error updating course completion' });
  }
});

// Register / Enroll in a course
router.post('/:id/enroll', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const courseId = String(req.params.id);

    // Verify course exists
    const courseExists = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
    if (courseExists.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existing = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId!), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (existing.length > 0) {
      return res.json({ success: true, message: 'Already enrolled in this course', courseId });
    }

    // Check paid / admin-approved status
    let isPaidOrApproved = false;
    if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') {
      isPaidOrApproved = true;
    } else {
      const studentRecord = await db.select().from(students).where(eq(students.userId, userId!)).limit(1);
      if (studentRecord.length > 0) {
        const s = studentRecord[0];
        if (s.isApproved || (s.coins && s.coins > 0)) {
          isPaidOrApproved = true;
        }
      }
    }

    // If on Free Trial, enforce strictly: MAXIMUM 3 COURSES!
    if (!isPaidOrApproved) {
      const currentEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId!));
      if (currentEnrollments.length >= 3) {
        return res.status(403).json({
          error: 'TRIAL_COURSE_LIMIT_REACHED',
          message: 'Free trial limit reached: You can only register and access a maximum of 3 courses on the free trial. Please buy more coins to unlock all courses!',
          trialLimit: 3,
          currentCount: currentEnrollments.length
        });
      }
    }

    // Enroll student
    const newEnrollment = {
      id: uuidv4(),
      userId: userId!,
      courseId,
      enrolledAt: new Date()
    };
    await db.insert(enrollments).values(newEnrollment);

    res.json({
      success: true,
      message: 'Successfully registered for course',
      courseId,
      isPaidOrApproved
    });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Server error enrolling in course' });
  }
});


// Upload course thumbnail
router.post('/upload-thumbnail', authenticateToken, (req, res, next) => {
  console.log('Thumbnail upload request received');
  upload.single('thumbnail')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return next(err);
    }
    next();
  });
}, async (req: AuthRequest, res) => {
  try {
    console.log('Thumbnail upload processing', req.file ? 'File present' : 'No file');
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const fileUrl = `/uploads/courses/${req.file.filename}`;
    res.json({
      url: fileUrl,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error: any) {
    console.error('Course thumbnail upload error:', error);
    res.status(500).json({ error: error?.message || 'Server error uploading thumbnail' });
  }
});

// Create a new course
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { title, code, description, thumbnail, pdfUrl, pdfName, pdfSize, noteTitle, noteContent, isProtected, isPublished } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Course title is required' });
    }

    const newCourse = {
      id: uuidv4(),
      title: title.trim(),
      code: (code || '').trim(),
      description: (description || '').trim(),
      thumbnail: thumbnail || null,
      pdfUrl: pdfUrl || null,
      pdfName: pdfName || null,
      pdfSize: typeof pdfSize === 'number' ? pdfSize : null,
      noteTitle: noteTitle ? noteTitle.trim() : null,
      noteContent: noteContent || null,
      isProtected: typeof isProtected === 'boolean' ? isProtected : true,
      isPublished: typeof isPublished === 'boolean' ? isPublished : false,
      authorId: req.user.id,
      createdAt: new Date()
    };

    await db.insert(courses).values(newCourse);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Server error creating course' });
  }
});

// Toggle Anti-Download & Anti-Copy protection
router.patch('/:id/toggle-protection', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const id = String(req.params.id);
    const existing = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!existing.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const currentProtection = existing[0].isProtected;
    const newProtection = typeof req.body.isProtected === 'boolean' ? req.body.isProtected : !currentProtection;

    await db.update(courses).set({ isProtected: newProtection }).where(eq(courses.id, id));

    res.json({
      id,
      isProtected: newProtection,
      message: newProtection ? 'Anti-download and copy protection enabled' : 'Anti-download and copy protection disabled'
    });
  } catch (error) {
    console.error('Toggle protection error:', error);
    res.status(500).json({ error: 'Server error updating protection status' });
  }
});

// Toggle publish status
router.patch('/:id/toggle-publish', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const id = String(req.params.id);
    const existing = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!existing.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const newPublish = !existing[0].isPublished;
    await db.update(courses).set({ isPublished: newPublish }).where(eq(courses.id, id));

    res.json({ id, isPublished: newPublish });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: 'Server error updating publish status' });
  }
});

// Get single course details (for student reader or instructor preview)
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = String(req.params.id);
    const existing = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
    if (!existing.length) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(existing[0]);
  } catch (error) {
    console.error('Fetch single course error:', error);
    res.status(500).json({ error: 'Server error fetching course details' });
  }
});

// Update course details
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const id = String(req.params.id);
    const { title, code, description, isProtected, thumbnail, pdfUrl, pdfName, pdfSize, noteTitle, noteContent } = req.body;

    const updatePayload: Record<string, any> = {
      title,
      code,
      description,
      isProtected,
      thumbnail,
    };

    if (pdfUrl !== undefined) updatePayload.pdfUrl = pdfUrl;
    if (pdfName !== undefined) updatePayload.pdfName = pdfName;
    if (pdfSize !== undefined) updatePayload.pdfSize = pdfSize;
    if (noteTitle !== undefined) updatePayload.noteTitle = noteTitle;
    if (noteContent !== undefined) updatePayload.noteContent = noteContent;

    await db.update(courses)
      .set(updatePayload)
      .where(eq(courses.id, id));

    res.json({ success: true, message: 'Course updated successfully' });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Server error updating course' });
  }
});

// Delete course (Accessible by both ADMIN and SUPER_ADMIN)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin or Super Admin access required' });
    }

    const id = String(req.params.id);
    
    // Ensure dependent topics, quizzes, questions and enrollments are cleaned up safely
    const courseTopics = await db.select().from(topics).where(eq(topics.courseId, id));
    for (const topic of courseTopics) {
      const topicQuizzes = await db.select().from(quizzes).where(eq(quizzes.topicId, topic.id));
      for (const quiz of topicQuizzes) {
        await db.delete(questions).where(eq(questions.quizId, quiz.id));
      }
      await db.delete(quizzes).where(eq(quizzes.topicId, topic.id));
    }
    await db.delete(topics).where(eq(topics.courseId, id));
    await db.delete(enrollments).where(eq(enrollments.courseId, id));
    
    // Delete the course
    await db.delete(courses).where(eq(courses.id, id));
    res.json({ message: 'Course deleted successfully', id });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Server error deleting course' });
  }
});

export const coursesRouter = router;
