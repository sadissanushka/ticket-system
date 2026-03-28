import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get all notifications for the authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // limit to 50
    });

    res.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark a single notification as read
router.put('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notificationId = id as string;
    const userId = req.user!.id;

    // Ensure the notification belongs to the user
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to mark notification as read', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark ALL notifications as read for the authenticated user
router.put('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Failed to mark all notifications as read', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
