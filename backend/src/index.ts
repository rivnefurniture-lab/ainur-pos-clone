import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import dotenv from 'dotenv';

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

const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 3001;

// Middleware - allow everything
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.set('io', io);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database health check
app.get('/health/db', async (_req: Request, res: Response) => {
  try {
    const pool = (await import('./config/database')).default;
    const result = await pool.query('SELECT 1 as ok');
    res.json({ status: 'ok', database: 'connected', result: result.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(503).json({ status: 'error', database: 'disconnected', error: msg });
  }
});

// Setup database schema (run once for fresh Postgres)
app.post('/admin/setup-db', async (_req: Request, res: Response) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const pool = (await import('./config/database')).default;
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
    res.json({ status: 'ok', message: 'Schema applied successfully' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Setup DB error:', err);
    res.status(500).json({ status: 'error', error: msg });
  }
});

// Seed default store if empty
app.post('/admin/seed-store', async (_req: Request, res: Response) => {
  try {
    const pool = (await import('./config/database')).default;
    const check = await pool.query('SELECT COUNT(*) FROM stores');
    if (parseInt(check.rows[0].count) > 0) {
      return res.json({ status: 'ok', message: 'Stores already exist' });
    }
    const now = Math.floor(Date.now() / 1000);
    await pool.query(`
      INSERT INTO stores (_id, _client, _user, _app, name, type, created, updated, created_ms) VALUES 
      ('58c872aa3ce7d5fc688b49be', '58c872aa3ce7d5fc688b49bd', '58c872aa3ce7d5fc688b49bc', 'WAPP', 'Головний магазин', 'store', $1, $1, $2)
    `, [now, now * 1000]);
    res.json({ status: 'ok', message: 'Default store created' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ status: 'error', error: msg });
  }
});

// API Routes
app.use('/auth', authRoutes);
app.use('/proxy', proxyRoutes);

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

