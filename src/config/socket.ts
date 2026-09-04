import { Server } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import app from '../app';

const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: [process.env.FRONTEND_URL as string, 'http://localhost:5173'],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('No autenticado'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    socket.data.userId = payload.userId;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;

  socket.join(`user:${userId}`);

  console.log(`Usuario ${userId} conectado por socket`);

  socket.on('disconnect', () => {
    console.log(`Usuario ${userId} desconectado`);
  });
});

export { httpServer };