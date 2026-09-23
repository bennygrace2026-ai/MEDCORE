import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc, and } from 'drizzle-orm';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { db } from '../../db/index.js';
import { topics, quizzes, questions, courses, students, enrollments, systemSettings, quizAttempts, studentStudySessions } from '../../db/schema.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

async function getQuizCoinCost(): Promise<number> {
  try {
    const settings = await db.select().from(systemSettings).where(eq(systemSettings.id, 'global_settings')).limit(1);
    if (settings.length > 0 && typeof settings[0].quizCoinCost === 'number') {
      return settings[0].quizCoinCost;
    }
  } catch (err) {
    console.error('Error reading quizCoinCost from settings:', err);
  }
  return 30;
}

// Get all quizzes with course & topic metadata and question count
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const allQuizzes = await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));

    let userEnrolledCourseIds = new Set<string>();
    let isPaidOrApproved = false;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      isPaidOrApproved = true;
    } else {
      const studentRecord = await db.select().from(students).where(eq(students.userId, userId!)).limit(1);
      if (studentRecord.length > 0) {
        const s = studentRecord[0];
        if (s.isApproved || (s.coins && s.coins > 0)) {
          isPaidOrApproved = true;
        }
      }
      const myEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId!));
      userEnrolledCourseIds = new Set(myEnrollments.map(e => e.courseId));
    }
    
    const enriched = await Promise.all(allQuizzes.map(async (quiz) => {
      const topicResult = await db.select().from(topics).where(eq(topics.id, quiz.topicId)).limit(1);
      const topic = topicResult[0] || null;
      let course = null;
      if (topic) {
        const courseResult = await db.select().from(courses).where(eq(courses.id, topic.courseId)).limit(1);
        course = courseResult[0] || null;
      }
      const qList = await db.select().from(questions).where(eq(questions.quizId, quiz.id));
      const isEnrolled = role === 'ADMIN' || role === 'SUPER_ADMIN' || (course ? userEnrolledCourseIds.has(course.id) : false);

      return {
        ...quiz,
        topicTitle: topic?.title || 'General Medical Topic',
        courseId: topic?.courseId || null,
        courseTitle: course?.title || 'Core Medical Sciences',
        courseCode: course?.code || '',
        questionCount: qList.length,
        isEnrolled,
        isPaidOrApproved,
        trialQuestionLimit: 10
      };
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Fetch quizzes error:', error);
    res.status(500).json({ error: 'Server error fetching quizzes' });
  }
});

// Get single quiz with its questions (enforces enrollment & 10-question trial limit)
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const id = String(req.params.id);

    const quizResult = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    if (!quizResult.length) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    const quiz = quizResult[0];
    const qList = await db.select().from(questions).where(eq(questions.quizId, id));
    
    const topicResult = await db.select().from(topics).where(eq(topics.id, quiz.topicId)).limit(1);
    const topic = topicResult[0] || null;
    let course = null;
    if (topic) {
      const courseResult = await db.select().from(courses).where(eq(courses.id, topic.courseId)).limit(1);
      course = courseResult[0] || null;
    }

    // Role check & enrollment verification
    let isPaidOrApproved = false;
    let isEnrolled = false;

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      isPaidOrApproved = true;
      isEnrolled = true;
    } else {
      const studentRecord = await db.select().from(students).where(eq(students.userId, userId!)).limit(1);
      if (studentRecord.length > 0) {
        const s = studentRecord[0];
        if (s.isApproved || (s.coins && s.coins > 0)) {
          isPaidOrApproved = true;
        }
      }

      if (course) {
        const enrolled = await db
          .select()
          .from(enrollments)
          .where(and(eq(enrollments.userId, userId!), eq(enrollments.courseId, course.id)))
          .limit(1);
        if (enrolled.length > 0) {
          isEnrolled = true;
        }
      }

      // If student is not enrolled, deny access with instruction to register course
      if (!isEnrolled) {
        return res.status(403).json({
          error: 'NOT_ENROLLED',
          message: 'You must register for this course first to access its quizzes.',
          courseId: course?.id,
          courseTitle: course?.title
        });
      }
    }

    // Question delivery:
    // If Paid or Admin-Approved: Deliver ALL questions (full bank)
    // If Free Trial: Deliver strictly max 10 questions per course
    const allowedQuestions = isPaidOrApproved ? qList : qList.slice(0, 10);
    const isTrial = !isPaidOrApproved;

    let studentCoins = 0;
    if (role === 'STUDENT') {
      const sRec = await db.select().from(students).where(eq(students.userId, userId!)).limit(1);
      if (sRec.length > 0) studentCoins = sRec[0].coins || 0;
    }

    const quizCoinCost = await getQuizCoinCost();

    res.json({
      ...quiz,
      topicTitle: topic?.title || 'General Medical Topic',
      courseTitle: course?.title || 'Core Medical Sciences',
      courseCode: course?.code || '',
      questions: allowedQuestions,
      totalQuestionsInBank: qList.length,
      isTrial,
      trialQuestionLimit: 10,
      isPaidOrApproved,
      coinsCostPerQuiz: quizCoinCost,
      studentCoins,
      message: isTrial 
        ? 'Free Trial Mode: Limited to 10 questions for this course. Buy more coins to unlock all questions!'
        : 'Full Access Mode: Complete question bank unlocked.'
    });
  } catch (error) {
    console.error('Fetch quiz detail error:', error);
    res.status(500).json({ error: 'Server error fetching quiz detail' });
  }
});

// Submit quiz answers: Deducts dynamic quiz coin cost per quiz answered
router.post('/:id/submit', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const quizId = String(req.params.id);

    if (role === 'STUDENT') {
      const studentRecord = await db.select().from(students).where(eq(students.userId, userId!)).limit(1);
      if (!studentRecord.length) {
        return res.status(404).json({ error: 'Student record not found' });
      }

      const s = studentRecord[0];
      const isPaidOrApproved = Boolean(s.isApproved || (s.coins && s.coins > 0));

      const settingsList = await db.select().from(systemSettings).where(eq(systemSettings.id, 'global_settings')).limit(1);
      const allowTrialSubmissions = settingsList.length > 0 ? settingsList[0].allowTrialSubmissions : true;

      // If they are on a free trial (not paid or approved)
      if (!isPaidOrApproved) {
        // First check if trial submissions are toggled OFF
        if (!allowTrialSubmissions) {
          return res.status(403).json({
            error: 'TRIAL_SUBMISSIONS_DISABLED',
            message: 'Free trial quiz submissions are currently disabled by the administrator. Please purchase coins to unlock full access and submit quizzes.'
          });
        }

        // Count existing attempts
        const userAttempts = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId!));
        const attemptCount = userAttempts.length;

        if (attemptCount < 3) {
          // Allow submitting for FREE!
          try {
            const score = typeof req.body.score === 'number' ? req.body.score : 0;
            const totalQ = typeof req.body.totalQuestions === 'number' ? req.body.totalQuestions : 10;
            const timeSpent = typeof req.body.timeSpentSeconds === 'number' ? req.body.timeSpentSeconds : 900;
            
            await db.insert(quizAttempts).values({
              id: uuidv4(),
              userId: userId!,
              quizId,
              score,
              maxScore: totalQ,
              timeSpentSeconds: timeSpent,
              completedAt: new Date()
            });

            // Also record a learning session (e.g. 15-20 min study time per quiz)
            const estMinutes = Math.max(5, Math.ceil(timeSpent / 60));
            await db.insert(studentStudySessions).values({
              id: uuidv4(),
              userId: userId!,
              minutes: estMinutes,
              activityTitle: `Completed Quiz: ${quizId}`,
              createdAt: new Date()
            });
          } catch (logErr) {
            console.warn('Could not record quiz attempt log:', logErr);
          }

          return res.json({
            success: true,
            coinsDeducted: 0,
            remainingCoins: s.coins || 0,
            isTrialSubmission: true,
            trialAttemptsCount: attemptCount + 1,
            message: `Free trial submission successful (${attemptCount + 1} of 3 free attempts used).`
          });
        }
      }

      // If they have completed 3 or more attempts, or are paid/approved:
      const currentCoins = s.coins || 0;
      const quizCost = await getQuizCoinCost();

      if (currentCoins < quizCost) {
        return res.status(403).json({
          error: 'INSUFFICIENT_COINS',
          message: isPaidOrApproved
            ? `Answering this quiz requires ${quizCost} coins, but your balance is ${currentCoins} coins. Please purchase coins to proceed.`
            : `Your 3 free trial submissions have been used. Answering more quizzes requires ${quizCost} coins, but your balance is ${currentCoins} coins. Please purchase coins to proceed.`,
          requiredCoins: quizCost,
          currentCoins: currentCoins
        });
      }

      const newCoins = Math.max(0, currentCoins - quizCost);
      await db.update(students).set({ coins: newCoins }).where(eq(students.id, s.id));

      // Record quiz attempt
      try {
        const score = typeof req.body.score === 'number' ? req.body.score : 0;
        const totalQ = typeof req.body.totalQuestions === 'number' ? req.body.totalQuestions : 10;
        const timeSpent = typeof req.body.timeSpentSeconds === 'number' ? req.body.timeSpentSeconds : 900;
        
        await db.insert(quizAttempts).values({
          id: uuidv4(),
          userId: userId!,
          quizId,
          score,
          maxScore: totalQ,
          timeSpentSeconds: timeSpent,
          completedAt: new Date()
        });

        // Also record a learning session (e.g. 15-20 min study time per quiz)
        const estMinutes = Math.max(5, Math.ceil(timeSpent / 60));
        await db.insert(studentStudySessions).values({
          id: uuidv4(),
          userId: userId!,
          minutes: estMinutes,
          activityTitle: `Completed Quiz: ${quizId}`,
          createdAt: new Date()
        });
      } catch (logErr) {
        console.warn('Could not record quiz attempt log:', logErr);
      }

      return res.json({
        success: true,
        coinsDeducted: quizCost,
        remainingCoins: newCoins,
        message: `${quizCost} coins deducted for answering this quiz.`
      });
    }

    res.json({
      success: true,
      coinsDeducted: 0,
      message: 'Admin/Super Admin test submission (no coins deducted).'
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Server error processing quiz completion' });
  }
});

// Delete quiz and its questions
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    const id = String(req.params.id);
    await db.delete(questions).where(eq(questions.quizId, id));
    await db.delete(quizzes).where(eq(quizzes.id, id));
    res.json({ success: true, message: 'Quiz deleted successfully', id });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ error: 'Server error deleting quiz' });
  }
});

// Bulk create quiz and questions (Admin/Super Admin only)
router.post('/bulk', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { courseId, topicTitle, quizTitle, questions: quizQuestions } = req.body;

    if (!courseId || !topicTitle || !quizTitle || !quizQuestions || !Array.isArray(quizQuestions)) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    // 1. Create Topic
    const topicId = uuidv4();
    await db.insert(topics).values({
      id: topicId,
      courseId,
      title: topicTitle,
      createdAt: new Date(),
    });

    // 2. Create Quiz
    const quizId = uuidv4();
    await db.insert(quizzes).values({
      id: quizId,
      topicId,
      title: quizTitle,
      createdAt: new Date(),
    });

    // 3. Create Questions
    const questionsToInsert = quizQuestions.map((q, index) => ({
      id: uuidv4(),
      quizId,
      text: q.Question || q.text,
      optionA: String(q.OptionA || q.optionA),
      optionB: String(q.OptionB || q.optionB),
      optionC: String(q.OptionC || q.optionC),
      optionD: String(q.OptionD || q.optionD),
      correctAnswer: String(q.Answer || q.correctAnswer).toUpperCase(),
      explanation: q.Explanation || q.explanation || null,
      imageUrl: q.ImageUrl || q.imageUrl || null,
      orderIndex: index,
    }));

    // Chunk inserts if too large, but for now assuming typical quiz size < 200
    if (questionsToInsert.length > 0) {
      await db.insert(questions).values(questionsToInsert);
    }

    res.status(201).json({ success: true, quizId, topicId, count: questionsToInsert.length });
  } catch (error) {
    console.error('Create bulk quiz error:', error);
    res.status(500).json({ error: 'Server error creating quiz' });
  }
});

// Ensure upload directory exists for question images
const questionUploadDir = path.join(process.cwd(), 'uploads', 'questions');
if (!fs.existsSync(questionUploadDir)) {
  fs.mkdirSync(questionUploadDir, { recursive: true });
}

// Multer storage for question images
const qStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, questionUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `question-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const qUpload = multer({
  storage: qStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Update single question
router.put('/questions/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const id = String(req.params.id);
    const { text, optionA, optionB, optionC, optionD, correctAnswer, explanation, imageUrl } = req.body;

    await db.update(questions)
      .set({
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation,
        imageUrl
      })
      .where(eq(questions.id, id));

    res.json({ success: true, message: 'Question updated successfully' });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Server error updating question' });
  }
});

// Delete single question
router.delete('/questions/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const id = String(req.params.id);

    // Verify question exists
    const q = await db.select().from(questions).where(eq(questions.id, id)).limit(1);
    if (!q.length) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await db.delete(questions).where(eq(questions.id, id));

    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Server error deleting question' });
  }
});

// Restore or re-seed the official Axial Skeleton Quiz (Admin / Super Admin)
router.post('/restore-axial-skeleton', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const { seedOrRestoreAxialSkeletonQuiz } = await import('../services/seedAxialSkeleton.js');
    const result = await seedOrRestoreAxialSkeletonQuiz();
    res.json(result);
  } catch (error: any) {
    console.error('Restore axial skeleton quiz error:', error);
    res.status(500).json({ error: error?.message || 'Server error restoring Axial Skeleton quiz' });
  }
});

// Delete quiz (Admin / Super Admin)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin or Super Admin access required' });
    }

    const id = String(req.params.id);

    // Verify quiz exists
    const existingQuiz = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    if (!existingQuiz.length) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Delete associated student attempts first to maintain relational integrity
    await db.delete(quizAttempts).where(eq(quizAttempts.quizId, id));

    // Delete all questions associated with this quiz
    await db.delete(questions).where(eq(questions.quizId, id));

    // Delete the quiz record
    await db.delete(quizzes).where(eq(quizzes.id, id));

    res.json({ success: true, message: 'Quiz and all associated questions deleted successfully', id });
  } catch (error: any) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ error: error?.message || 'Server error deleting quiz' });
  }
});

// Update quiz metadata
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const id = String(req.params.id);
    const { title, timeLimit, timeLimitMinutes, topicTitle } = req.body;
    const finalTimeLimit = timeLimitMinutes || timeLimit;

    // Update quiz title and time limit
    await db.update(quizzes)
      .set({
        title,
        timeLimitMinutes: finalTimeLimit ? Number(finalTimeLimit) : undefined,
      })
      .where(eq(quizzes.id, id));

    // If topic title is provided, update the associated topic
    if (topicTitle) {
      const quiz = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
      if (quiz.length > 0 && quiz[0].topicId) {
        await db.update(topics)
          .set({ title: topicTitle })
          .where(eq(topics.id, quiz[0].topicId));
      }
    }

    res.json({ success: true, message: 'Quiz updated successfully' });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ error: 'Server error updating quiz' });
  }
});

// Upload question image
router.post('/questions/:id/upload-image', authenticateToken, qUpload.single('image'), async (req: AuthRequest, res) => {
  try {
    const role = req.user?.role;
    if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const id = String(req.params.id);
    const fileUrl = `/uploads/questions/${req.file.filename}`;

    // Update the question record with the new image URL
    await db.update(questions).set({ imageUrl: fileUrl }).where(eq(questions.id, id));

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error: any) {
    console.error('Question image upload error:', error);
    res.status(500).json({ error: error?.message || 'Server error uploading image' });
  }
});

export default router;
