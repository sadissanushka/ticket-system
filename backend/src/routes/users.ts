import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get all users (Admin only)
router.get('/', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get users by specific Role (Admin/Technician only)
router.get('/role/:role', authenticate, authorize(['ADMIN', 'TECHNICIAN']), async (req: AuthRequest, res: Response) => {
  try {
    const roleParam = typeof req.params.role === 'string' ? req.params.role : '';
    const uppercaseRole = roleParam.toUpperCase() as any;

    const users = await prisma.user.findMany({
      where: { role: uppercaseRole },
      select: { id: true, name: true, email: true, department: true }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users by role' });
  }
});

// Get a single user details (Self or Admin)
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const userId = id as string;
    
    if (req.user!.role !== 'ADMIN' && req.user!.id !== userId) {
      return res.status(403).json({ error: 'Access denied to other user profile' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, department: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profiles' });
  }
});

// Update user profile (Self only)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const userId = id as string;

    if (req.user!.id !== userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name },
      select: { id: true, name: true, email: true, role: true, department: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Update user password (Self only)
router.put('/:id/password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const userId = id as string;

    if (req.user!.id !== userId) {
      return res.status(403).json({ error: 'You can only change your own password' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Delete user account (Admin or Self)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const userId = id as string;

    if (req.user!.role !== 'ADMIN' && req.user!.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete tickets created by this user
    await prisma.ticket.deleteMany({
      where: { authorId: userId }
    });

    // Unassign tickets assigned to this user
    await prisma.ticket.updateMany({
      where: { assignedToId: userId },
      data: { assignedToId: null }
    });
    
    // Delete messages sent by this user
    await prisma.message.deleteMany({
      where: { senderId: userId }
    });

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Update user notifications (Self only)
router.put('/:id/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { notifyTickets, notifySystem } = req.body;

    const userId = id as string;

    if (req.user!.id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { notifyTickets, notifySystem },
      select: { id: true, notifyTickets: true, notifySystem: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
