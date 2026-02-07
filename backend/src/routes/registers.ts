import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { getCompanyId } from '../middleware/auth';

const router = Router();

/**
 * GET /data/:companyId/register (singular alias)
 * Alias for registers endpoint
 */
router.get('/:companyId/register', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT *
      FROM registers
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
    console.error('Registers fetch error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch registers',
    });
  }
});

/**
 * GET /data/:companyId/registers
 * Get all cash registers
 */
router.get('/:companyId/registers', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const result = await pool.query(`
      SELECT *
      FROM registers
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
    console.error('Registers fetch error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch registers',
    });
  }
});

/**
 * POST /data/:companyId/registers
 * Create new register
 */
router.post('/:companyId/registers', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { name, type, store, settings } = req.body;
    
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const _id = generateObjectId();
    const now = Math.floor(Date.now() / 1000);

    const result = await pool.query(`
      INSERT INTO registers (_id, _client, _user, _store, _app, name, type, settings, created, updated, created_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      _id, companyId, '58c872aa3ce7d5fc688b49bc', store, 'WAPP',
      name, type, JSON.stringify(settings || {}),
      now, now, now * 1000
    ]);

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Register create error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to create register',
    });
  }
});

/**
 * PUT /data/:companyId/registers/:registerId
 * Update register
 */
router.put('/:companyId/registers/:registerId', async (req: Request, res: Response) => {
  try {
    const { companyId, registerId } = req.params;
    const { name, type, store, settings, deleted } = req.body;
    
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await pool.query(`
      UPDATE registers 
      SET name = COALESCE($3, name),
          type = COALESCE($4, type),
          _store = COALESCE($5, _store),
          settings = COALESCE($6, settings),
          deleted = COALESCE($7, deleted),
          updated = $8
      WHERE _id = $1 AND _client = $2
      RETURNING *
    `, [registerId, companyId, name, type, store, settings ? JSON.stringify(settings) : null, deleted, now]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: false,
        error: 'Register not found',
      });
    }

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Register update error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to update register',
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
