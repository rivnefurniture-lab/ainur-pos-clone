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
 * GET /shift/:companyId/current
 * Get current open shift
 */
router.get('/:companyId/current', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const result = await database_1.default.query(`
      SELECT *
      FROM shifts
      WHERE _client = $1 AND _user = $2 AND status = 'open'
      ORDER BY opened_at DESC
      LIMIT 1
    `, [companyId, req.session.userId]);
        if (result.rows.length === 0) {
            return res.json({
                status: true,
                data: null,
            });
        }
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Current shift fetch error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to fetch current shift',
        });
    }
});
/**
 * GET /shift/:companyId/history
 * Get shift history
 */
router.get('/:companyId/history', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const offset = parseInt(req.query.offset) || 0;
        const limit = parseInt(req.query.limit) || 50;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const result = await database_1.default.query(`
      SELECT *
      FROM shifts
      WHERE _client = $1
      ORDER BY opened_at DESC
      OFFSET $2 LIMIT $3
    `, [companyId, offset, limit]);
        const countResult = await database_1.default.query('SELECT COUNT(*) as total FROM shifts WHERE _client = $1', [companyId]);
        const total = parseInt(countResult.rows[0].total);
        res.json({
            status: true,
            objects: result.rows.length,
            total,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Shift history fetch error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to fetch shift history',
        });
    }
});
/**
 * POST /shift/:companyId/open
 * Open new shift
 */
router.post('/:companyId/open', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { store, register, opening_balance } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        // Check if there's already an open shift
        const existingShift = await database_1.default.query(`
      SELECT * FROM shifts
      WHERE _client = $1 AND _user = $2 AND status = 'open'
    `, [companyId, req.session.userId]);
        if (existingShift.rows.length > 0) {
            return res.status(400).json({
                status: false,
                error: 'A shift is already open',
                data: existingShift.rows[0],
            });
        }
        const _id = generateObjectId();
        const now = Math.floor(Date.now() / 1000);
        // Get next shift number
        const numberResult = await database_1.default.query('SELECT COALESCE(MAX(number), 0) + 1 as next_number FROM shifts WHERE _client = $1', [companyId]);
        const number = numberResult.rows[0].next_number;
        const result = await database_1.default.query(`
      INSERT INTO shifts (
        _id, _client, _user, _store, _register, _app,
        number, status, opened_at, opening_balance,
        created, updated, created_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
            _id, companyId, req.session.userId, store, register, 'WAPP',
            number, 'open', now, opening_balance || 0,
            now, now, now * 1000
        ]);
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Shift open error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to open shift',
        });
    }
});
/**
 * POST /shift/:companyId/close
 * Close current shift
 */
router.post('/:companyId/close', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { closing_balance, notes } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const now = Math.floor(Date.now() / 1000);
        // Find and close the open shift
        const result = await database_1.default.query(`
      UPDATE shifts 
      SET status = 'closed',
          closed_at = $3,
          closing_balance = COALESCE($4, closing_balance),
          notes = COALESCE($5, notes),
          updated = $3
      WHERE _client = $1 AND _user = $2 AND status = 'open'
      RETURNING *
    `, [companyId, req.session.userId, now, closing_balance, notes]);
        if (result.rows.length === 0) {
            return res.status(400).json({
                status: false,
                error: 'No open shift found',
            });
        }
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Shift close error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to close shift',
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
//# sourceMappingURL=shifts.js.map