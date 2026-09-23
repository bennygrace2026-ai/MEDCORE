import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../db/index.js';
import { chatMessages, friendRequests, users, students, classroomChannels } from '../../db/schema.js';
import { eq, or, and, desc, asc, ne } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB for voice notes and images
});

// Default initial channels are now empty as per request to remove system-created ones
export const INITIAL_CHANNELS = [];

// Flag to ensure initial seed/cleanup happens once at startup
let hasSeededChannels = false;

// Helper to seed initial channels and cleanup non-admin ones
async function getOrSeedChannels() {
  if (!hasSeededChannels) {
    hasSeededChannels = true;
    // Remove any legacy "Academy System" channels not created by an actual admin user
    await db.delete(classroomChannels).where(eq(classroomChannels.createdByName, 'Academy System'));
    // Also remove any where createdBy is null just in case
    await db.delete(classroomChannels).where(eq(classroomChannels.createdBy, null as any));
  }
  
  const existing = await db.select().from(classroomChannels).orderBy(asc(classroomChannels.createdAt));
  return existing;
}

// 1. Get channels list
router.get('/channels', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const channels = await getOrSeedChannels();
    res.json({
      channels: channels.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category,
        isClass: true,
        createdBy: c.createdBy,
        createdByName: c.createdByName
      })),
      user: {
        id: req.user?.id,
        name: req.user?.name,
        role: req.user?.role,
      }
    });
  } catch (err) {
    console.error('Fetch channels error:', err);
    res.status(500).json({ error: 'Failed to fetch classroom channels' });
  }
});

// 1b. Create new channel (Admin / Super Admin only)
router.post('/channels', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user?.role;
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only Instructors and Admins can create classroom channels' });
    }

    const { name, description, category = 'Classroom' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const channelId = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `class-${Date.now()}`;

    // Check if ID already exists
    const exists = await db.select().from(classroomChannels).where(eq(classroomChannels.id, channelId)).limit(1);
    const finalId = exists.length > 0 ? `${channelId}-${Date.now().toString().slice(-4)}` : channelId;

    const newChan = {
      id: finalId,
      name: name.trim(),
      description: description?.trim() || 'Classroom study and clinical discussions',
      category: category.trim() || 'Classroom',
      createdBy: req.user?.id || null,
      createdByName: req.user?.name || 'Administrator',
      createdAt: new Date(),
    };

    await db.insert(classroomChannels).values(newChan);

    res.status(201).json({
      success: true,
      channel: {
        ...newChan,
        isClass: true
      },
      message: 'Classroom channel created successfully'
    });
  } catch (err) {
    console.error('Create channel error:', err);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// 1c. Delete channel (Admin / Super Admin or Channel Creator)
router.delete('/channels/:channelId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    const channelId = String(req.params.channelId || '').trim();
    
    if (!channelId) {
      return res.status(400).json({ error: 'Channel ID is required' });
    }

    // Check if channel exists
    const channel = await db.select().from(classroomChannels).where(
      or(
        eq(classroomChannels.id, channelId),
        eq(classroomChannels.name, channelId)
      )
    ).limit(1);
    
    const isOwner = channel.length > 0 && channel[0].createdBy && channel[0].createdBy === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Forbidden: Only Administrators or the channel creator can delete this classroom channel' });
    }

    const targetId = channel.length > 0 ? channel[0].id : channelId;

    // Delete messages associated with this channel
    await db.delete(chatMessages).where(
      or(
        eq(chatMessages.channelId, targetId),
        eq(chatMessages.channelId, channelId)
      )
    );

    // Delete channel from classroomChannels
    await db.delete(classroomChannels).where(
      or(
        eq(classroomChannels.id, targetId),
        eq(classroomChannels.id, channelId)
      )
    );

    res.json({ success: true, message: 'Classroom channel deleted successfully' });
  } catch (err) {
    console.error('[DELETE CHANNEL] Internal error:', err);
    res.status(500).json({ error: 'Failed to delete channel' });
  }
});

// 1d. Get registered students approved by admin for live class group call
router.get('/approved-class-attendees', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only return registered students who are APPROVED by admin (isApproved === 1 or true)
    const approvedStudents = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        avatar: users.profilePhoto,
        email: users.email,
        studentId: students.id,
        institution: students.institution,
        department: students.department,
        level: students.level,
        isApproved: students.isApproved,
      })
      .from(users)
      .innerJoin(students, eq(users.id, students.userId))
      .where(and(eq(users.role, 'STUDENT'), eq(students.isApproved, true)));

    // Also get active instructor/admin accounts so they appear as faculty in the call
    const instructors = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        avatar: users.profilePhoto,
        email: users.email,
      })
      .from(users)
      .where(or(eq(users.role, 'ADMIN'), eq(users.role, 'SUPER_ADMIN')));

    res.json({
      approvedStudents: approvedStudents.map(s => ({
        id: s.id,
        name: s.name,
        role: 'STUDENT',
        studentId: s.studentId,
        institution: s.institution,
        department: s.department,
        level: s.level,
        avatar: s.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(s.name)}`
      })),
      instructors: instructors.map(i => ({
        id: i.id,
        name: i.name,
        role: i.role,
        avatar: i.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(i.name)}`
      }))
    });
  } catch (err) {
    console.error('Fetch approved attendees error:', err);
    res.status(500).json({ error: 'Failed to fetch registered approved students' });
  }
});


// 2. Upload image or voice note
router.post('/upload', authenticateToken, upload.single('media'), (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }
    const mediaUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      mediaUrl,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Chat upload error:', error);
    res.status(500).json({ error: 'Failed to upload chat media' });
  }
});

// 3. Get messages for channel or DM
router.get('/messages/:channelId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const channelId = req.params.channelId as string;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // If channel is direct message (format: dm_userId1_userId2)
    if (channelId.startsWith('dm_')) {
      const parts = channelId.replace('dm_', '').split('_');
      if (!parts.includes(userId) && req.user?.role === 'STUDENT') {
        return res.status(403).json({ error: 'Forbidden: You are not a participant in this private chat' });
      }
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.channelId, channelId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(200);

    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// 3b. Clear messages in a channel or direct message chat
router.delete('/messages/:channelId/clear', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const channelId = String(req.params.channelId || '').trim();
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!channelId) return res.status(400).json({ error: 'Channel ID is required' });

    // Case 1: Direct Messages between individual students/users
    if (channelId.startsWith('dm_') || channelId.includes('--')) {
      const parts = channelId.replace('dm_', '').split(/[-_]+/);
      if (!parts.includes(userId) && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Forbidden: You can only clear your own direct message chat history' });
      }

      await db.delete(chatMessages).where(eq(chatMessages.channelId, channelId));
      return res.json({ success: true, message: 'Direct chat conversation cleared successfully' });
    }

    // Case 2: Community Classroom Channel Chat
    const channel = await db.select().from(classroomChannels).where(
      or(
        eq(classroomChannels.id, channelId),
        eq(classroomChannels.name, channelId)
      )
    ).limit(1);

    const isOwner = channel.length > 0 && channel[0].createdBy && channel[0].createdBy === userId;
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        error: 'Forbidden: Only Instructors and Admins have permission to clear community classroom channels.'
      });
    }

    const targetId = channel.length > 0 ? channel[0].id : channelId;
    await db.delete(chatMessages).where(
      or(
        eq(chatMessages.channelId, targetId),
        eq(chatMessages.channelId, channelId)
      )
    );
    res.json({ success: true, message: 'Classroom chat messages cleared successfully' });
  } catch (error) {
    console.error('Clear chat error:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

// 4. Send new message
router.post('/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      channelId,
      encryptedContent,
      iv,
      messageType = 'TEXT',
      mediaUrl,
      audioDuration,
      isPinned = false,
      recipientId
    } = req.body;

    if (!channelId || !encryptedContent) {
      return res.status(400).json({ error: 'Channel ID and content are required' });
    }

    // Restrict announcements to Admin / Super Admin
    if (channelId === 'announcements' && req.user?.role === 'STUDENT') {
      return res.status(403).json({ error: 'Only Instructors and Administrators can post to Official Announcements' });
    }

    // Get sender's current avatar
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const senderAvatar = userRecord[0]?.profilePhoto || null;
    const senderName = req.user?.name || userRecord[0]?.name || 'User';
    const senderRole = req.user?.role || 'STUDENT';

    const newMsg = {
      id: uuidv4(),
      channelId,
      senderId: userId,
      senderName,
      senderRole,
      senderAvatar,
      recipientId: recipientId || null,
      encryptedContent,
      iv: iv || null,
      messageType, // 'TEXT' | 'IMAGE' | 'VOICE_NOTE' | 'CLASS_ANNOUNCEMENT'
      mediaUrl: mediaUrl || null,
      audioDuration: audioDuration ? Number(audioDuration) : null,
      isPinned: Boolean(isPinned),
      createdAt: new Date(),
    };

    await db.insert(chatMessages).values(newMsg);

    res.status(201).json({
      success: true,
      message: newMsg
    });
  } catch (error) {
    console.error('Post message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 5. Fellow Students Directory
router.get('/students', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    // Get all students
    const allStudents = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        profilePhoto: users.profilePhoto,
        role: users.role,
        studentId: students.id,
        institution: students.institution,
        department: students.department,
        level: students.level,
        status: students.status,
      })
      .from(users)
      .innerJoin(students, eq(users.id, students.userId));

    // Get all friendships for current user
    const relationships = await db
      .select()
      .from(friendRequests)
      .where(
        or(
          eq(friendRequests.requesterId, currentUserId),
          eq(friendRequests.recipientId, currentUserId)
        )
      );

    // Map friendship status for each student
    const result = allStudents
      .filter((s) => s.id !== currentUserId)
      .map((student) => {
        const rel = relationships.find(
          (r) =>
            (r.requesterId === currentUserId && r.recipientId === student.id) ||
            (r.recipientId === currentUserId && r.requesterId === student.id)
        );

        let friendshipStatus: 'NONE' | 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' = 'NONE';
        let requestId = null;

        if (rel) {
          requestId = rel.id;
          if (rel.status === 'ACCEPTED') {
            friendshipStatus = 'FRIEND';
          } else if (rel.status === 'PENDING') {
            if (rel.requesterId === currentUserId) {
              friendshipStatus = 'REQUEST_SENT';
            } else {
              friendshipStatus = 'REQUEST_RECEIVED';
            }
          }
        }

        // Generate consistent DM channel ID: dm_minId_maxId
        const dmChannelId = `dm_${[currentUserId, student.id].sort().join('_')}`;

        return {
          ...student,
          friendshipStatus,
          requestId,
          dmChannelId,
        };
      });

    res.json(result);
  } catch (error) {
    console.error('Fetch fellow students error:', error);
    res.status(500).json({ error: 'Failed to fetch fellow students' });
  }
});

// 6. Get Friends & Pending Requests for current user
router.get('/friends', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

    // Fetch all requests involving current user
    const allRequests = await db
      .select()
      .from(friendRequests)
      .where(
        or(
          eq(friendRequests.requesterId, currentUserId),
          eq(friendRequests.recipientId, currentUserId)
        )
      );

    const userIdsToFetch = new Set<string>();
    allRequests.forEach(r => {
      userIdsToFetch.add(r.requesterId);
      userIdsToFetch.add(r.recipientId);
    });
    userIdsToFetch.delete(currentUserId);

    let usersMap: Record<string, any> = {};
    if (userIdsToFetch.size > 0) {
      const relatedUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          profilePhoto: users.profilePhoto,
          role: users.role,
          studentId: students.id,
          department: students.department,
          institution: students.institution,
          level: students.level,
        })
        .from(users)
        .leftJoin(students, eq(users.id, students.userId));

      relatedUsers.forEach(u => {
        usersMap[u.id] = u;
      });
    }

    const acceptedFriends = [];
    const incomingRequests = [];
    const outgoingRequests = [];

    for (const r of allRequests) {
      const otherUserId = r.requesterId === currentUserId ? r.recipientId : r.requesterId;
      const otherUser = usersMap[otherUserId] || { id: otherUserId, name: 'Unknown User' };
      const dmChannelId = `dm_${[currentUserId, otherUserId].sort().join('_')}`;

      const item = {
        requestId: r.id,
        user: otherUser,
        status: r.status,
        createdAt: r.createdAt,
        dmChannelId
      };

      if (r.status === 'ACCEPTED') {
        acceptedFriends.push(item);
      } else if (r.status === 'PENDING') {
        if (r.recipientId === currentUserId) {
          incomingRequests.push(item);
        } else {
          outgoingRequests.push(item);
        }
      }
    }

    res.json({
      friends: acceptedFriends,
      incomingRequests,
      outgoingRequests
    });
  } catch (error) {
    console.error('Fetch friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// 7. Send Friend Request
router.post('/friends/request', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const requesterId = req.user?.id;
    const { recipientId } = req.body;

    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
    if (!recipientId) return res.status(400).json({ error: 'Recipient ID is required' });
    if (requesterId === recipientId) return res.status(400).json({ error: 'Cannot add yourself as a friend' });

    // Check if relation already exists
    const existing = await db
      .select()
      .from(friendRequests)
      .where(
        or(
          and(eq(friendRequests.requesterId, requesterId), eq(friendRequests.recipientId, recipientId)),
          and(eq(friendRequests.requesterId, recipientId), eq(friendRequests.recipientId, requesterId))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      const rel = existing[0];
      if (rel.status === 'ACCEPTED') {
        return res.status(400).json({ error: 'You are already friends' });
      }
      if (rel.status === 'PENDING') {
        return res.status(400).json({ error: 'A friend request is already pending between you' });
      }
      // If was rejected, update to PENDING again
      await db
        .update(friendRequests)
        .set({ requesterId, recipientId, status: 'PENDING', updatedAt: new Date() })
        .where(eq(friendRequests.id, rel.id));
      return res.json({ success: true, message: 'Friend request sent!' });
    }

    const newReq = {
      id: uuidv4(),
      requesterId,
      recipientId,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.insert(friendRequests).values(newReq);
    res.json({ success: true, message: 'Friend request sent successfully!' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// 8. Accept or Reject Friend Request
router.post('/friends/respond', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { requestId, action } = req.body; // action: 'ACCEPT' | 'REJECT'

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!requestId || !action) return res.status(400).json({ error: 'Request ID and action required' });

    const reqRecord = await db
      .select()
      .from(friendRequests)
      .where(eq(friendRequests.id, requestId))
      .limit(1);

    if (!reqRecord.length) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    const item = reqRecord[0];
    if (item.recipientId !== userId) {
      return res.status(403).json({ error: 'Only the recipient can respond to this request' });
    }

    if (action === 'ACCEPT') {
      await db
        .update(friendRequests)
        .set({ status: 'ACCEPTED', updatedAt: new Date() })
        .where(eq(friendRequests.id, requestId));
      return res.json({ success: true, message: 'Friend request accepted! You can now chat securely.' });
    } else {
      await db
        .delete(friendRequests)
        .where(eq(friendRequests.id, requestId));
      return res.json({ success: true, message: 'Friend request rejected.' });
    }
  } catch (error) {
    console.error('Respond friend request error:', error);
    res.status(500).json({ error: 'Failed to process response' });
  }
});

// 9. Remove Friend
router.delete('/friends/:requestId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const requestId = req.params.requestId as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db
      .delete(friendRequests)
      .where(
        and(
          eq(friendRequests.id, requestId),
          or(eq(friendRequests.requesterId, userId), eq(friendRequests.recipientId, userId))
        )
      );

    res.json({ success: true, message: 'Friend removed successfully.' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

export const chatRouter = router;
