import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

// Create Express app
const app = express();

// Database configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
const pool = new Pool(poolConfig);

// Allowed origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'https://frontend-p7zph3jty-andriis-projects-ae2f998e.vercel.app',
].filter(Boolean) as string[];

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stock stats endpoint
app.get('/api/data/:companyId/stock-stats', async (req, res) => {
  try {
    const { companyId } = req.params;

    const result = await pool.query(`
      WITH stock_totals AS (
        SELECT 
          _id,
          price,
          cost,
          (SELECT COALESCE(SUM(value::numeric), 0) FROM jsonb_each_text(stock)) as total_qty
        FROM products
        WHERE _client = $1 AND stock IS NOT NULL AND (deleted = false OR deleted IS NULL)
      )
      SELECT 
        COUNT(*)::int as products_count,
        COALESCE(ROUND(SUM(total_qty)), 0)::numeric as total_quantity,
        COALESCE(ROUND(SUM(price * total_qty), 2), 0)::numeric as retail_value,
        COALESCE(ROUND(SUM(cost * total_qty), 2), 0)::numeric as cost_value,
        COUNT(*) FILTER (WHERE cost = 0 OR cost IS NULL)::int as zero_cost_count,
        COUNT(*) FILTER (WHERE total_qty < 0)::int as negative_stock_count
      FROM stock_totals
    `, [companyId]);

    const stats = result.rows[0];

    res.json({
      status: true,
      data: {
        totalQuantity: parseFloat(stats.total_quantity) || 0,
        retailValue: parseFloat(stats.retail_value) || 0,
        costValue: parseFloat(stats.cost_value) || 0,
        zeroCostCount: parseInt(stats.zero_cost_count) || 0,
        negativeStockCount: parseInt(stats.negative_stock_count) || 0,
        expiredCount: 0,
        productsCount: parseInt(stats.products_count) || 0,
      },
    });
  } catch (error) {
    console.error('Stock stats error:', error);
    res.status(500).json({ status: false, error: 'Failed to get stock stats' });
  }
});

// Filtered products endpoint
app.get('/api/data/:companyId/catalog/filtered', async (req, res) => {
  try {
    const { companyId } = req.params;
    const filter = req.query.filter as string;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 1000;

    let query = '';
    switch (filter) {
      case 'zero_cost':
        query = `
          SELECT p.*, 
            (SELECT COALESCE(SUM(value::numeric), 0) FROM jsonb_each_text(p.stock)) as total_qty
          FROM products p
          WHERE p._client = $1 AND (p.deleted = false OR p.deleted IS NULL) AND (p.cost = 0 OR p.cost IS NULL)
          ORDER BY p.name
          OFFSET $2 LIMIT $3
        `;
        break;
      case 'negative_stock':
        query = `
          WITH stock_calc AS (
            SELECT p.*, 
              (SELECT COALESCE(SUM(value::numeric), 0) FROM jsonb_each_text(p.stock)) as total_qty
            FROM products p
            WHERE p._client = $1 AND (p.deleted = false OR p.deleted IS NULL) AND p.stock IS NOT NULL
          )
          SELECT * FROM stock_calc WHERE total_qty < 0
          ORDER BY name
          OFFSET $2 LIMIT $3
        `;
        break;
      case 'expired':
        query = `
          SELECT p.*, 
            (SELECT COALESCE(SUM(value::numeric), 0) FROM jsonb_each_text(p.stock)) as total_qty
          FROM products p
          WHERE p._client = $1 AND (p.deleted = false OR p.deleted IS NULL) AND p.expiry_date IS NOT NULL AND p.expiry_date < NOW()
          ORDER BY p.name
          OFFSET $2 LIMIT $3
        `;
        break;
      default:
        return res.status(400).json({ status: false, error: 'Invalid filter' });
    }

    const result = await pool.query(query, [companyId, offset, limit]);

    res.json({
      status: true,
      error: null,
      objects: result.rows.length,
      total: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Filtered products error:', error);
    res.status(500).json({ status: false, error: 'Failed to fetch filtered products' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ status: false, error: 'Route not found' });
});

export default app;
