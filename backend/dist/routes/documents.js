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
 * GET /data/:companyId/docs
 * Get documents with pagination
 */
router.get('/:companyId/docs', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 100;
        const type = req.query.type;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        let query = `
      SELECT *
      FROM documents
      WHERE _client = $1
    `;
        const params = [companyId];
        if (type) {
            query += ` AND type = $${params.length + 1}`;
            params.push(type);
        }
        query += ` ORDER BY date DESC NULLS LAST OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(offset, limit);
        const result = await database_1.default.query(query, params);
        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM documents WHERE _client = $1';
        const countParams = [companyId];
        if (type) {
            countQuery += ' AND type = $2';
            countParams.push(type);
        }
        const countResult = await database_1.default.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].total);
        res.json({
            status: true,
            error: null,
            objects: result.rows.length,
            total,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Documents fetch error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to fetch documents',
        });
    }
});
/**
 * GET /data/:companyId/docs/:docId
 * Get single document
 */
router.get('/:companyId/docs/:docId', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId, docId } = req.params;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const result = await database_1.default.query('SELECT * FROM documents WHERE _id = $1 AND _client = $2', [docId, companyId]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: false,
                error: 'Document not found',
            });
        }
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Document fetch error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to fetch document',
        });
    }
});
/**
 * POST /data/:companyId/docs
 * Create new document (sale, purchase, movement, etc.)
 */
router.post('/:companyId/docs', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { type, from, to, products, payments, store, discount_percent, discount_sum, notes, comment } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const _id = generateObjectId();
        const now = Math.floor(Date.now() / 1000);
        // Calculate sum from products
        let sum = 0;
        if (products && Array.isArray(products)) {
            for (const product of products) {
                sum += (product.sum || product.price * Math.abs(product.qty || 1));
            }
        }
        // Calculate paid from payments
        let paid = 0;
        if (payments && Array.isArray(payments)) {
            for (const payment of payments) {
                paid += payment.sum || 0;
            }
        }
        // Get next document number
        const numberResult = await database_1.default.query('SELECT COALESCE(MAX(number), 0) + 1 as next_number FROM documents WHERE _client = $1', [companyId]);
        const number = numberResult.rows[0].next_number;
        const result = await database_1.default.query(`
      INSERT INTO documents (
        _id, _client, _user, _app, type, number, status, date, store,
        "from", "to", sum, paid, discount_percent, discount_sum,
        products, payments, notes, comment, created, updated, created_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `, [
            _id, companyId, req.session.userId, 'WAPP',
            type || 'sale', number, true, now, store,
            from ? JSON.stringify(from) : null,
            to ? JSON.stringify(to) : null,
            sum, paid, discount_percent || 0, discount_sum || 0,
            JSON.stringify(products || []), JSON.stringify(payments || []),
            notes, comment, now, now, now * 1000
        ]);
        // Update product stock if this is a sale or purchase
        if (products && Array.isArray(products) && store) {
            for (const item of products) {
                const productId = item._id || item.product?._id;
                const qty = item.qty || 0;
                if (productId) {
                    // Update stock JSON field
                    await database_1.default.query(`
            UPDATE products 
            SET stock = jsonb_set(
              COALESCE(stock, '{}'::jsonb),
              $3,
              (COALESCE((stock->>$4)::numeric, 0) + $5)::text::jsonb
            ),
            total_stock = total_stock + $5,
            updated = $6
            WHERE _id = $1 AND _client = $2
          `, [productId, companyId, `{${store}}`, store, qty, now]);
                }
            }
        }
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Document create error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to create document',
        });
    }
});
function generateObjectId() {
    const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
    const machineId = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    const processId = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
    const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    return timestamp + machineId + processId + counter;
}
exports.default = router;
//# sourceMappingURL=documents.js.map