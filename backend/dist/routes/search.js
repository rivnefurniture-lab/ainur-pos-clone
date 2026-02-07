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
 * POST /search/docs/:companyId/:offset/:limit
 * Search documents with filters
 */
router.post('/docs/:companyId/:offset/:limit', auth_1.isAuthenticated, async (req, res) => {
    try {
        const companyId = req.params.companyId;
        const offset = req.params.offset;
        const limit = req.params.limit;
        const { type, store, from_date, to_date, search } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        let query = 'SELECT * FROM documents WHERE _client = $1';
        const params = [companyId];
        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }
        if (store) {
            params.push(store);
            query += ` AND store = $${params.length}`;
        }
        if (from_date) {
            params.push(from_date);
            query += ` AND date >= $${params.length}`;
        }
        if (to_date) {
            params.push(to_date);
            query += ` AND date <= $${params.length}`;
        }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (number::text LIKE $${params.length} OR products::text ILIKE $${params.length})`;
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await database_1.default.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);
        // Add pagination
        query += ` ORDER BY date DESC NULLS LAST OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(parseInt(offset) || 0, parseInt(limit) || 1000);
        const result = await database_1.default.query(query, params);
        res.json({
            status: true,
            error: null,
            objects: result.rows.length,
            total,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Document search error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to search documents',
        });
    }
});
/**
 * POST /search/money/:companyId/:offset/:limit
 * Search money movements with filters
 */
router.post('/money/:companyId/:offset/:limit', auth_1.isAuthenticated, async (req, res) => {
    try {
        const companyId = req.params.companyId;
        const offset = req.params.offset;
        const limit = req.params.limit;
        const { type, account, from_date, to_date } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        let query = 'SELECT * FROM money_movements WHERE _client = $1';
        const params = [companyId];
        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }
        if (account) {
            params.push(account);
            query += ` AND account = $${params.length}`;
        }
        if (from_date) {
            params.push(from_date);
            query += ` AND date >= $${params.length}`;
        }
        if (to_date) {
            params.push(to_date);
            query += ` AND date <= $${params.length}`;
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await database_1.default.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);
        // Add pagination
        query += ` ORDER BY date DESC NULLS LAST OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(parseInt(offset) || 0, parseInt(limit) || 1000);
        const result = await database_1.default.query(query, params);
        res.json({
            status: true,
            error: null,
            objects: result.rows.length,
            total,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Money search error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to search money movements',
        });
    }
});
/**
 * POST /search/catalog/:companyId/:offset/:limit
 * Search products with filters
 */
router.post('/catalog/:companyId/:offset/:limit', auth_1.isAuthenticated, async (req, res) => {
    try {
        const companyId = req.params.companyId;
        const offset = req.params.offset;
        const limit = req.params.limit;
        const { search, category, store, in_stock } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        let query = 'SELECT * FROM products WHERE _client = $1 AND deleted = false';
        const params = [companyId];
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length} OR barcode ILIKE $${params.length})`;
        }
        if (category) {
            params.push(`%"${category}"%`);
            query += ` AND categories::text ILIKE $${params.length}`;
        }
        if (in_stock === true) {
            query += ` AND total_stock > 0`;
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await database_1.default.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);
        // Add pagination
        query += ` ORDER BY name OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(parseInt(offset) || 0, parseInt(limit) || 1000);
        const result = await database_1.default.query(query, params);
        res.json({
            status: true,
            error: null,
            objects: result.rows.length,
            total,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Catalog search error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to search products',
        });
    }
});
/**
 * POST /search/clients/:companyId/:offset/:limit
 * Search customers with filters
 */
router.post('/clients/:companyId/:offset/:limit', auth_1.isAuthenticated, async (req, res) => {
    try {
        const companyId = req.params.companyId;
        const offset = req.params.offset;
        const limit = req.params.limit;
        const { search, type } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        let query = 'SELECT * FROM customers WHERE _client = $1 AND deleted = false';
        const params = [companyId];
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $${params.length} OR phones::text ILIKE $${params.length} OR emails::text ILIKE $${params.length})`;
        }
        if (type) {
            params.push(type);
            query += ` AND type = $${params.length}`;
        }
        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await database_1.default.query(countQuery, params);
        const total = parseInt(countResult.rows[0].total);
        // Add pagination
        query += ` ORDER BY name OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(parseInt(offset) || 0, parseInt(limit) || 1000);
        const result = await database_1.default.query(query, params);
        res.json({
            status: true,
            error: null,
            objects: result.rows.length,
            total,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Clients search error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to search customers',
        });
    }
});
exports.default = router;
//# sourceMappingURL=search.js.map