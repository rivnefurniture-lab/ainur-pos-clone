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
 * GET /data/:companyId/accounts
 * Get all financial accounts
 */
router.get('/:companyId/accounts', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const result = await database_1.default.query(`
      SELECT *
      FROM accounts
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
        console.error('Accounts fetch error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to fetch accounts',
        });
    }
});
/**
 * POST /data/:companyId/accounts
 * Create new account
 */
router.post('/:companyId/accounts', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { name, type, include, use_terminal, bank_details } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const _id = generateObjectId();
        const now = Math.floor(Date.now() / 1000);
        const result = await database_1.default.query(`
      INSERT INTO accounts (_id, _client, _user, _app, name, type, include, use_terminal, bank_details, created, updated, created_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
            _id, companyId, req.session.userId, 'WAPP',
            name, type, include !== false, use_terminal || false,
            JSON.stringify(bank_details || []),
            now, now, now * 1000
        ]);
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Account create error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to create account',
        });
    }
});
/**
 * PUT /data/:companyId/accounts/:accountId
 * Update account
 */
router.put('/:companyId/accounts/:accountId', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId, accountId } = req.params;
        const { name, type, include, use_terminal, balance, deleted } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const now = Math.floor(Date.now() / 1000);
        const result = await database_1.default.query(`
      UPDATE accounts 
      SET name = COALESCE($3, name),
          type = COALESCE($4, type),
          include = COALESCE($5, include),
          use_terminal = COALESCE($6, use_terminal),
          balance = COALESCE($7, balance),
          deleted = COALESCE($8, deleted),
          updated = $9
      WHERE _id = $1 AND _client = $2
      RETURNING *
    `, [
            accountId, companyId, name, type, include, use_terminal,
            balance ? JSON.stringify(balance) : null, deleted, now
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                status: false,
                error: 'Account not found',
            });
        }
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Account update error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to update account',
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
//# sourceMappingURL=accounts.js.map