import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { getCompanyId } from '../middleware/auth';

const router = Router();

/**
 * GET /data/:companyId/catalog
 * Get products with pagination
 */
router.get('/:companyId/catalog', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 1000;

    // Verify company access
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const productsResult = await pool.query(`
      SELECT *
      FROM products
      WHERE _client = $1
      ORDER BY updated DESC NULLS LAST
      OFFSET $2 LIMIT $3
    `, [companyId, offset, limit]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE _client = $1',
      [companyId]
    );

    const total = parseInt(countResult.rows[0].total);
    const objects = productsResult.rows.length;

    res.json({
      status: true,
      error: null,
      objects,
      total,
      data: productsResult.rows,
    });
  } catch (error) {
    console.error('Catalog fetch error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch products',
    });
  }
});

/**
 * GET /data/:companyId/catalog/categories
 * Get all categories
 */
router.get('/:companyId/catalog/categories', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT name FROM categories WHERE _client = $1 ORDER BY name',
      [companyId]
    );

    const categories = result.rows.map(row => row.name);

    res.json({
      status: true,
      error: null,
      objects: categories.length,
      total: categories.length,
      data: categories,
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch categories',
    });
  }
});

/**
 * POST /data/:companyId/catalog
 * Create new product
 */
router.post('/:companyId/catalog', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { 
      name, sku, code, barcode, price, cost, type, categories,
      unit, description, tax_free, free_price, is_weighed
    } = req.body;
    
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    // Generate a MongoDB-style ObjectId
    const _id = generateObjectId();
    const now = Math.floor(Date.now() / 1000);

    const result = await pool.query(`
      INSERT INTO products (
        _id, _client, _user, _app, name, sku, code, barcode, 
        price, cost, type, categories, unit, description,
        tax_free, free_price, is_weighed, created, updated, created_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *
    `, [
      _id, companyId, req.session.userId, 'WAPP',
      name, sku, code, barcode,
      price || 0, cost || 0, type || 'inventory',
      JSON.stringify(categories || []),
      unit, description,
      tax_free || false, free_price || false, is_weighed || false,
      now, now, now * 1000
    ]);

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Product create error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to create product',
    });
  }
});

/**
 * PUT /data/:companyId/catalog/:productId
 * Update product
 */
router.put('/:companyId/catalog/:productId', async (req: Request, res: Response) => {
  try {
    const { companyId, productId } = req.params;
    const { 
      name, sku, code, barcode, price, cost, type, categories,
      unit, description, deleted, tax_free, free_price, is_weighed,
      stock, total_stock
    } = req.body;
    
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await pool.query(`
      UPDATE products 
      SET name = COALESCE($3, name),
          sku = COALESCE($4, sku),
          code = COALESCE($5, code),
          barcode = COALESCE($6, barcode),
          price = COALESCE($7, price),
          cost = COALESCE($8, cost),
          type = COALESCE($9, type),
          categories = COALESCE($10, categories),
          unit = COALESCE($11, unit),
          description = COALESCE($12, description),
          deleted = COALESCE($13, deleted),
          tax_free = COALESCE($14, tax_free),
          free_price = COALESCE($15, free_price),
          is_weighed = COALESCE($16, is_weighed),
          stock = COALESCE($17, stock),
          total_stock = COALESCE($18, total_stock),
          updated = $19
      WHERE _id = $1 AND _client = $2
      RETURNING *
    `, [
      productId, companyId, name, sku, code, barcode,
      price, cost, type, 
      categories ? JSON.stringify(categories) : null,
      unit, description, deleted, tax_free, free_price, is_weighed,
      stock ? JSON.stringify(stock) : null, total_stock, now
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: false,
        error: 'Product not found',
      });
    }

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to update product',
    });
  }
});

/**
 * GET /data/:companyId/stock-stats
 * Get stock statistics for all products
 */
router.get('/:companyId/stock-stats', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    // Verify company access
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    // Get stock statistics
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
    
    // Try to get expired count if the column exists
    let expiredCount = 0;
    try {
      const expiredResult = await pool.query(`
        SELECT COUNT(*)::int as expired_count
        FROM products
        WHERE _client = $1 AND (deleted = false OR deleted IS NULL) AND expiry_date IS NOT NULL AND expiry_date < NOW()
      `, [companyId]);
      expiredCount = parseInt(expiredResult.rows[0]?.expired_count) || 0;
    } catch (e) {
      // Column doesn't exist, that's okay
    }

    const stats = result.rows[0];

    res.json({
      status: true,
      data: {
        totalQuantity: parseFloat(stats.total_quantity) || 0,
        retailValue: parseFloat(stats.retail_value) || 0,
        costValue: parseFloat(stats.cost_value) || 0,
        zeroCostCount: parseInt(stats.zero_cost_count) || 0,
        negativeStockCount: parseInt(stats.negative_stock_count) || 0,
        expiredCount: expiredCount,
        productsCount: parseInt(stats.products_count) || 0,
      },
    });
  } catch (error) {
    console.error('Stock stats error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to get stock stats',
    });
  }
});

/**
 * GET /data/:companyId/catalog/filtered
 * Get filtered products (zero cost, negative stock, expired)
 */
router.get('/:companyId/catalog/filtered', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const filter = req.query.filter as string;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 1000;

    // Verify company access
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    let whereClause = '';
    let query = '';
    
    switch (filter) {
      case 'zero_cost':
        // Products with cost = 0 or null
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
        // Products with total stock < 0
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
        // Products with expired shelf life
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

    // Get count for this filter
    let countQuery = '';
    switch (filter) {
      case 'zero_cost':
        countQuery = `
          SELECT COUNT(*) as total FROM products 
          WHERE _client = $1 AND (deleted = false OR deleted IS NULL) AND (cost = 0 OR cost IS NULL)
        `;
        break;
      case 'negative_stock':
        countQuery = `
          SELECT COUNT(*) as total FROM (
            SELECT (SELECT COALESCE(SUM(value::numeric), 0) FROM jsonb_each_text(stock)) as total_qty
            FROM products
            WHERE _client = $1 AND (deleted = false OR deleted IS NULL) AND stock IS NOT NULL
          ) sq WHERE total_qty < 0
        `;
        break;
      case 'expired':
        countQuery = `
          SELECT COUNT(*) as total FROM products 
          WHERE _client = $1 AND (deleted = false OR deleted IS NULL) AND expiry_date IS NOT NULL AND expiry_date < NOW()
        `;
        break;
    }

    const countResult = await pool.query(countQuery, [companyId]);
    const total = parseInt(countResult.rows[0].total) || 0;

    res.json({
      status: true,
      error: null,
      objects: result.rows.length,
      total,
      data: result.rows,
    });
  } catch (error) {
    console.error('Filtered products error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch filtered products',
    });
  }
});

// Helper function to generate MongoDB-style ObjectId
function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
}

export default router;
