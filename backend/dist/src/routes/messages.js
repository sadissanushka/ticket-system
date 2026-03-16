"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
exports.default = router;
