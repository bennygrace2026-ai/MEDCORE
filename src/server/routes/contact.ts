import { Router } from 'express';
import { db } from '../../db/index.js';
import { frontendSettings } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get the Super Admin's contact email
    const settings = await db.select().from(frontendSettings).where(eq(frontendSettings.id, 'default')).limit(1);
    const targetEmail = settings[0]?.contactEmail || 'admin@medcore.com';

    console.log(`[CONTACT FORM] To: ${targetEmail}`);
    console.log(`[CONTACT FORM] From: ${name} (${email})`);
    console.log(`[CONTACT FORM] Subject: ${subject}`);
    console.log(`[CONTACT FORM] Message: ${message}`);

    // In a production environment, you would use a service like SendGrid, Resend, or AWS SES here.
    // For now, we simulate the success.
    
    res.json({ success: true, message: 'Message sent successfully to administrator' });
  } catch (error: any) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export { router as contactRouter };
