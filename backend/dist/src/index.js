"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const client_1 = require("@prisma/client");
const tickets_1 = __importDefault(require("./routes/tickets"));
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const categories_1 = __importDefault(require("./routes/categories"));
const messages_1 = __importDefault(require("./routes/messages"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app); // Wrap Express with http server for Socket.io
const prisma = new client_1.PrismaClient();
const port = process.env.PORT || 5000;
// Initialize Socket.io
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});
// Middleware
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/tickets', tickets_1.default);
app.use('/api/users', users_1.default);
app.use('/api/messages', messages_1.default);
// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'OK', database: 'Connected', realtime: 'Socket.io Active' });
    }
    catch (error) {
        res.status(503).json({ status: 'ERROR', database: 'Disconnected' });
    }
});
// === Socket.io Real-time Chat Logic ===
io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);
    // Join a ticket-specific room
    socket.on('join_ticket', (ticketId) => {
        socket.join(`ticket:${ticketId}`);
        console.log(`[Socket.io] Client ${socket.id} joined room ticket:${ticketId}`);
    });
    // Handle incoming chat message
    socket.on('send_message', async (data) => {
        try {
            // Persist message to PostgreSQL
            const saved = await prisma.message.create({
                data: {
                    text: data.text,
                    ticketId: data.ticketId,
                    senderId: data.senderId,
                },
                include: {
                    sender: { select: { id: true, name: true, role: true } },
                },
            });
            // Broadcast to everyone in the ticket room (including sender)
            io.to(`ticket:${data.ticketId}`).emit('receive_message', {
                id: saved.id,
                text: saved.text,
                createdAt: saved.createdAt,
                isSystem: saved.isSystem,
                sender: saved.sender,
            });
        }
        catch (error) {
            console.error('[Socket.io] Failed to save message:', error);
            socket.emit('message_error', { error: 'Failed to send message' });
        }
    });
    socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
});
// Start server
server.listen(port, () => {
    console.log(`🚀 Server + Socket.io running on port ${port}`);
});
