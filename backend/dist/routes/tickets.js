"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all tickets
router.get('/', async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: {
                category: true,
                author: { select: { id: true, name: true, email: true } },
                assignedTo: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(tickets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});
// Get tickets assigned to a specific technician
router.get('/assigned/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tickets = await prisma.ticket.findMany({
            where: { assignedToId: id },
            include: { category: true, author: { select: { name: true } } }
        });
        res.json(tickets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch assigned tickets' });
    }
});
// Create a new ticket
router.post('/', async (req, res) => {
    try {
        const { title, description, categoryId, priority, location, device, authorId } = req.body;
        const newTicket = await prisma.ticket.create({
            data: {
                title,
                description,
                categoryId,
                priority: priority || 'LOW',
                location,
                device,
                authorId
            }
        });
        res.status(201).json(newTicket);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create ticket', details: String(error) });
    }
});
// Update a ticket (Status, Assignment)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, assignedToId, priority } = req.body;
        const updatedTicket = await prisma.ticket.update({
            where: { id },
            data: { status, assignedToId, priority },
        });
        res.json(updatedTicket);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update ticket' });
    }
});
exports.default = router;
