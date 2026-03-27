import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all users
router.get('/', async (req, res) => {
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

// Get users by specific Role (e.g. to list active Technicians)
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    // Map string param to Prisma enum
    const uppercaseRole = role.toUpperCase() as any;

    const users = await prisma.user.findMany({
      where: { role: uppercaseRole },
      select: { id: true, name: true, email: true, department: true }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users by role' });
  }
});

// Get a single user details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
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

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { name },
      select: { id: true, name: true, email: true, role: true, department: true }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Update user password
router.put('/:id/password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Unsecure check matching auth.ts
    // In production we would use bcrypt.compare()
    if (user.password !== currentPassword) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    await prisma.user.update({
      where: { id },
      data: { password: newPassword } // In production use bcrypt.hash()
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Delete user account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete tickets created by this user
    await prisma.ticket.deleteMany({
      where: { authorId: id }
    });

    // Unassign tickets assigned to this user
    await prisma.ticket.updateMany({
      where: { assignedToId: id },
      data: { assignedToId: null }
    });
    
    // Delete messages sent by this user
    await prisma.message.deleteMany({
      where: { senderId: id }
    });

    // Delete the user
    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
