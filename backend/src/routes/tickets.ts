import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get My Tickets (Always filtered by authorId)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.user!;
    
    const tickets = await prisma.ticket.findMany({
      where: { authorId: id },
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Get All Unassigned Tickets
router.get('/unassigned', authenticate, authorize(['ADMIN', 'TECHNICIAN']), async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { 
        assignedToId: null,
        status: 'OPEN'
      },
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unassigned tickets' });
  }
});

// Get All Tickets (Admin/Technician overview)
router.get('/all', authenticate, authorize(['ADMIN', 'TECHNICIAN']), async (req: AuthRequest, res: Response) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch global tickets' });
  }
});

// Get a single ticket by ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = id as string;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true } },
        attachments: true,
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Authorization: Admin, Technician, Author, or Assigned User
    const isAdmin = req.user!.role === 'ADMIN';
    const isTechnician = req.user!.role === 'TECHNICIAN';
    const isAuthor = ticket.authorId === req.user!.id;
    const isAssigned = ticket.assignedToId === req.user!.id;

    if (!isAdmin && !isTechnician && !isAuthor && !isAssigned) {
      return res.status(403).json({ error: 'Access denied to this ticket' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Get tickets assigned to a specific technician
router.get('/assigned/:id', authenticate, authorize(['ADMIN', 'TECHNICIAN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Prevent technicians from seeing each other's private assigned queues unless they are admins
    if (req.user!.role === 'TECHNICIAN' && req.user!.id !== id) {
      return res.status(403).json({ error: 'Access denied to other technicians queue' });
    }

    const tickets = await prisma.ticket.findMany({
      where: { assignedToId: id as string },
      include: { 
        category: true, 
        author: { select: { id: true, name: true, email: true } } 
      }
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assigned tickets' });
  }
});

// Create a new ticket
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, categoryId, priority, location, device, attachments } = req.body;
    const authorId = req.user!.id; // Use authenticated ID
    
    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        categoryId,
        priority: priority || 'LOW',
        location,
        device,
        authorId,
        attachments: {
          create: attachments?.map((a: any) => ({
            name: a.name,
            size: a.size,
            type: a.type,
            url: a.url
          })) || []
        }
      },
      include: {
        attachments: true
      }
    });

    // Notify Admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', notifyTickets: true } });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin: { id: string }) => ({
          userId: admin.id,
          message: `New ticket created: ${title}`,
          ticketId: newTicket.id
        }))
      });
    }

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket', details: String(error) });
  }
});

// Update a ticket (Status, Assignment)
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assignedToId, priority } = req.body;
    const ticketId = id as string;

    const existingTicket = await prisma.ticket.findUnique({ 
      where: { id: ticketId }, 
      include: { author: true } 
    });
    
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Authorization check: 
    // Students can't update status or assignment 
    if (req.user!.role === 'STUDENT' && (status || assignedToId)) {
      return res.status(403).json({ error: 'Students cannot update ticket status or assignment' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        status, 
        assignedToId, 
        priority,
        // Allow updating details
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        device: req.body.device,
        categoryId: req.body.categoryId,
      },
    });

    // Notify Tech on new assignment
    if (assignedToId && existingTicket.assignedToId !== assignedToId) {
      const tech = await prisma.user.findUnique({ where: { id: assignedToId as string } });
      if (tech?.notifyTickets) {
        await prisma.notification.create({
          data: {
            userId: tech.id,
            message: `You were assigned to ticket: ${existingTicket.title}`,
            ticketId: ticketId
          }
        });
      }
    }
    
    // Notify Student on status change
    if (status && existingTicket.status !== status && (existingTicket as any).author?.notifyTickets) {
      await prisma.notification.create({
        data: {
          userId: existingTicket.authorId,
          message: `Your ticket status changed to ${status}`,
          ticketId: ticketId
        }
      });
    }

    res.json(updatedTicket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket' });
  }
});

// Delete a ticket
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticketId = id as string;

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Authorization: Only Admins can delete any ticket.
    // Authors can delete their own ticket ONLY if it is still OPEN.
    const isAdmin = req.user!.role === 'ADMIN';
    const isAuthor = ticket.authorId === req.user!.id;
    const isDeletableByAuthor = isAuthor && ticket.status === 'OPEN';

    if (!isAdmin && !isDeletableByAuthor) {
      return res.status(403).json({ error: 'Access denied to delete this ticket' });
    }

    await prisma.ticket.delete({ where: { id: ticketId } });

    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

export default router;
