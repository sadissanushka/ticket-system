import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// GET /api/messages/:ticketId — Load chat history for a ticket
router.get('/:ticketId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.params;
    const ticketIdStr = ticketId as string;
    const { id: userId, role } = req.user!;

    // Check if user has permission to see messages for this ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketIdStr },
      select: { authorId: true, assignedToId: true }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (role !== 'ADMIN' && ticket.authorId !== userId && ticket.assignedToId !== userId) {
      return res.status(403).json({ error: 'Access denied: You are not a participant in this ticket' });
    }

    const messages = await prisma.message.findMany({
      where: { ticketId: ticketIdStr },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
