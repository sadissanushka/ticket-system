import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/messages/:ticketId — Load chat history for a ticket
router.get('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const messages = await prisma.message.findMany({
      where: { ticketId },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

export default router;
