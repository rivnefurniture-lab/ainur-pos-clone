import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

import pool from './config/database';
import authRoutes from './routes/auth';
import proxyRoutes from './routes/proxy';
import catalogRoutes from './routes/catalog';
import clientsRoutes from './routes/clients';
import storesRoutes from './routes/stores';
import accountsRoutes from './routes/accounts';
import suppliersRoutes from './routes/suppliers';
import registersRoutes from './routes/registers';
import sourcesRoutes from './routes/sources';
import documentsRoutes from './routes/documents';
import shiftsRoutes from './routes/shifts';
import searchRoutes from './routes/search';

dotenv.config();

const app = express();
const httpServer = createServer(app);
// Allowed origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://ainur-pos-clone.vercel.app',
].filter(Boolean) as string[];

const io = new SocketServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all origins for now
  },
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration (using memory store for demo, PgSession for production)
// Note: Memory store is not production-ready but works for demo
app.use(session({
  name: 'connect.sid',
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year (matching Ainur)
    sameSite: 'lax',
  },
}));

// Make io available in routes
app.set('io', io);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (matching Ainur's structure)
app.use('/auth', authRoutes);
app.use('/proxy', proxyRoutes);  // Main proxy endpoint like Ainur

// Direct data routes
app.use('/data', catalogRoutes);
app.use('/data', clientsRoutes);
app.use('/data', storesRoutes);
app.use('/data', accountsRoutes);
app.use('/data', suppliersRoutes);
app.use('/data', registersRoutes);
app.use('/data', sourcesRoutes);
app.use('/data', documentsRoutes);

// Document and search routes
app.use('/docs', documentsRoutes);
app.use('/search', searchRoutes);
app.use('/shift', shiftsRoutes);

// Count endpoints
app.use('/count', catalogRoutes);
app.use('/count', clientsRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('AUTH', async (data) => {
    // Handle authentication via socket
    try {
      // Authentication logic here
      socket.emit('AUTH_FETCH_SUCCEEDED', { success: true });
    } catch (error) {
      socket.emit('AUTH_FETCH_FAILED', { error: 'Authentication failed' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: false,
    error: err.message || 'Internal server error',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: false,
    error: 404,
    details: 'Route not found',
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };
