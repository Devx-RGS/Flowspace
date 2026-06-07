import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import boardRoutes from './routes/board.routes.js';
import columnRoutes from './routes/column.routes.js';
import cardRoutes from './routes/card.routes.js';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  socket.on('join-board', (boardId) => {
    socket.join(boardId);
    console.log(`User joined board room: ${boardId}`);
  });

  socket.on('board-updated', (boardId) => {
    // Broadcast to everyone else in the room
    socket.to(boardId).emit('board-updated');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Flowspace API is running 🚀' });
});

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Flowspace server running on port ${PORT}`);
  });
};

startServer();
