"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const tickets_1 = __importDefault(require("./routes/tickets"));
const users_1 = __importDefault(require("./routes/users"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express_1.default.json());
// Routes
app.use('/api/tickets', tickets_1.default);
app.use('/api/users', users_1.default);
// Basic Health Check Endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Quick db connectivity check
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'OK', database: 'Connected', message: 'Help Desk API is running securely.' });
    }
    catch (error) {
        console.error('Database connection failed', error);
        res.status(503).json({ status: 'ERROR', database: 'Disconnected', error: String(error) });
    }
});
// Start Server
app.listen(port, () => {
    console.log(`Server started on port ${port} 🚀`);
});
//# sourceMappingURL=index.js.map