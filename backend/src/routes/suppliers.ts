import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { isAuthenticated, getCompanyId } from '../middleware/auth';

const router = Router();

/**
 * GET /data/:companyId/suppliers
 * Get all suppliers
 */
router.get('/:companyId/suppliers', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT *
      FROM suppliers
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
  } catch (error) {
    console.error('Suppliers fetch error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch suppliers',
    });
  }
});

/**
 * POST /data/:companyId/suppliers
 * Create new supplier
 */
router.post('/:companyId/suppliers', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { name, site, address, description, phones, emails, bank_details } = req.body;
    
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const _id = generateObjectId();
    const now = Math.floor(Date.now() / 1000);

    const result = await pool.query(`
      INSERT INTO suppliers (
        _id, _client, _user, _app, name, site, address, description,
        phones, emails, bank_details, created, updated, created_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      _id, companyId, req.session.userId, 'WAPP',
      name, site,
      address ? JSON.stringify(address) : null,
      description,
      JSON.stringify(phones || []), JSON.stringify(emails || []),
      JSON.stringify(bank_details || []),
      now, now, now * 1000
    ]);

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Supplier create error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to create supplier',
    });
  }
});

/**
 * PUT /data/:companyId/suppliers/:supplierId
 * Update supplier
 */
router.put('/:companyId/suppliers/:supplierId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { companyId, supplierId } = req.params;
    const { name, site, address, description, phones, emails, deleted } = req.body;
    
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await pool.query(`
      UPDATE suppliers 
      SET name = COALESCE($3, name),
          site = COALESCE($4, site),
          address = COALESCE($5, address),
          description = COALESCE($6, description),
          phones = COALESCE($7, phones),
          emails = COALESCE($8, emails),
          deleted = COALESCE($9, deleted),
          updated = $10
      WHERE _id = $1 AND _client = $2
      RETURNING *
    `, [
      supplierId, companyId, name, site,
      address ? JSON.stringify(address) : null,
      description,
      phones ? JSON.stringify(phones) : null,
      emails ? JSON.stringify(emails) : null,
      deleted, now
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: false,
        error: 'Supplier not found',
      });
    }

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Supplier update error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to update supplier',
    });
  }
});

function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65535).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
}

export default router;
