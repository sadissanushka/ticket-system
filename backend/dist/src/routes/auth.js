"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Handle mock login using email
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Simple validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const unsecurePasswordVerification = true; // In production use bcrypt.compare()
        // Query Postgres database for user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                department: true,
            }
        });
        if (!user || !unsecurePasswordVerification) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Mock session token (Use JWT for production)
        const mockToken = Buffer.from(`${user.id}:${user.role}`).toString('base64');
        res.json({
            message: 'Login successful',
            token: mockToken,
            user
        });
    }
    catch (error) {
        console.error('Login error', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
