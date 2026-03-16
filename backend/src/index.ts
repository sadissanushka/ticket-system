import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

import ticketRoutes from './routes/tickets';
import userRoutes from './routes/users';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import messageRoutes from './routes/messages';

dotenv.config();

const app = express();
const server = http.createServer(app);  // Wrap Express with http server for Socket.io
const prisma = new PrismaClient();
const port = process.env.PORT || 5000;

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'OK', database: 'Connected', realtime: 'Socket.io Active' });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', database: 'Disconnected' });
  }
});

// === Socket.io Real-time Chat Logic ===
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Join a ticket-specific room
  socket.on('join_ticket', (ticketId: string) => {
    socket.join(`ticket:${ticketId}`);
    console.log(`[Socket.io] Client ${socket.id} joined room ticket:${ticketId}`);
  });

  // Handle incoming chat message
  socket.on('send_message', async (data: {
    ticketId: string;
    text: string;
    senderId: string;
    senderName: string;
  }) => {
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
    } catch (error) {
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
