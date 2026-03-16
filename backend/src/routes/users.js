"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Get users by specific Role (e.g. to list active Technicians)
router.get('/role/:role', async (req, res) => {
    try {
        const { role } = req.params;
        // Map string param to Prisma enum
        const uppercaseRole = role.toUpperCase();
        const users = await prisma.user.findMany({
            where: { role: uppercaseRole },
            select: { id: true, name: true, email: true, department: true }
        });
        res.json(users);
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user profiles' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map