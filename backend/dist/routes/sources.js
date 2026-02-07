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
 * GET /data/:companyId/sources
 * Get all money sources (payment methods)
 */
router.get('/:companyId/sources', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const result = await database_1.default.query(`
      SELECT *
      FROM money_sources
      ORDER BY title
    `);
        res.json({
            status: true,
            error: null,
            objects: result.rows.length,
            total: result.rows.length,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Sources fetch error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to fetch money sources',
        });
    }
});
/**
 * POST /data/:companyId/sources
 * Create new money source
 */
router.post('/:companyId/sources', auth_1.isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const { title, type, country } = req.body;
        const userCompanyId = (0, auth_1.getCompanyId)(req);
        if (companyId !== userCompanyId) {
            return res.status(403).json({ status: false, error: 'Access denied' });
        }
        const _id = generateObjectId();
        const result = await database_1.default.query(`
      INSERT INTO money_sources (_id, id, title, type, country)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [_id, _id, title, type, country]);
        res.json({
            status: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Source create error:', error);
        res.status(500).json({
            status: false,
            error: 'Failed to create money source',
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
//# sourceMappingURL=sources.js.map