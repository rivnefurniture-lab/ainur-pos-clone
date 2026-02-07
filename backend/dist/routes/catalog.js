"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /data/:companyId/catalog
 * Get products with pagination
 */
router.get('/:companyId/catalog', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 1000;
        // Verify company access
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const productsResult = await database_1.default.query(`
      SELECT *
      FROM products
      WHERE _client = $1
      ORDER BY updated DESC NULLS LAST
      OFFSET $2 LIMIT $3
    `, [companyId, offset, limit]);
        // Get total count
        const countResult = await database_1.default.query('SELECT COUNT(*) as total FROM products WHERE _client = $1', [companyId]);
        const total = parseInt(countResult.rows[0].total);
        const objects = productsResult.rows.length;
        res.json({
            status: true,
            error: null,
            objects,
            total,
            data: productsResult.rows,
        });
    }
    catch (error) {
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
router.get('/:companyId/catalog/categories', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const result = await database_1.default.query('SELECT name FROM categories WHERE _client = $1 ORDER BY name', [companyId]);
        const categories = result.rows.map(row => row.name);
        res.json({
            status: true,
            error: null,
            objects: categories.length,
            total: categories.length,
            data: categories,
        });
    }
    catch (error) {
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
router.post('/:companyId/catalog', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, sku, code, barcode, price, cost, type, categories, unit, description, tax_free, free_price, is_weighed } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        // Generate a MongoDB-style ObjectId
        const _id = generateObjectId();
        const now = Math.floor(Date.now() / 1000);
        const result = await database_1.default.query(`
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
    }
    catch (error) {
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
router.put('/:companyId/catalog/:productId', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId, productId } = req.params;
        const { name, sku, code, barcode, price, cost, type, categories, unit, description, deleted, tax_free, free_price, is_weighed, stock, total_stock } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const now = Math.floor(Date.now() / 1000);
        const result = await database_1.default.query(`
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
    }
    catch (error) {
        console.error('Product update error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to update product',
        });
    }
});
// Helper function to generate MongoDB-style ObjectId
function generateObjectId() {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const machineId = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const processId = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
    const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return timestamp + machineId + processId + counter;
}
exports.default = router;
//# sourceMappingURL=catalog.js.map