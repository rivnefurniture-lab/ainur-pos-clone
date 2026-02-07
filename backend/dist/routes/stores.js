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
 * GET /data/:companyId/stores
 * Get all stores/warehouses
 */
router.get('/:companyId/stores', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const result = await database_1.default.query(`
      SELECT *
      FROM stores
      WHERE _client = $1
      ORDER BY name
    `, [companyId]);
        res.json({
            status: true,
            error: null,
            objects: result.rows.length,
            total: result.rows.length,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Stores fetch error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to fetch stores',
        });
    }
});
/**
 * POST /data/:companyId/stores
 * Create new store
 */
router.post('/:companyId/stores', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, address, description, type } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const _id = generateObjectId();
        const now = Math.floor(Date.now() / 1000);
        const result = await database_1.default.query(`
      INSERT INTO stores (_id, _client, _user, _app, name, address, description, type, created, updated, created_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [_id, companyId, req.session.userId, 'WAPP', name, address, description, type || 'store', now, now, now * 1000]);
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Store create error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to create store',
        });
    }
});
/**
 * PUT /data/:companyId/stores/:storeId
 * Update store
 */
router.put('/:companyId/stores/:storeId', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId, storeId } = req.params;
        const { name, address, description, type, deleted, include } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const now = Math.floor(Date.now() / 1000);
        const result = await database_1.default.query(`
      UPDATE stores 
      SET name = COALESCE($3, name),
          address = COALESCE($4, address),
          description = COALESCE($5, description),
          type = COALESCE($6, type),
          deleted = COALESCE($7, deleted),
          include = COALESCE($8, include),
          updated = $9
      WHERE _id = $1 AND _client = $2
      RETURNING *
    `, [storeId, companyId, name, address, description, type, deleted, include, now]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: false,
                error: 'Store not found',
            });
        }
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Store update error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to update store',
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
//# sourceMappingURL=stores.js.map