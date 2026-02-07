import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { isAuthenticated, getCompanyId } from '../middleware/auth';

const router = Router();

/**
 * GET /data/:companyId/clients
 * Get customers with pagination
 */
router.get('/:companyId/clients', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const offset = parseInt(req.query.offset as string) || 0;
    const limit = parseInt(req.query.limit as string) || 1000;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const customersResult = await pool.query(`
      SELECT *
      FROM customers
      WHERE _client = $1
      ORDER BY name
      OFFSET $2 LIMIT $3
    `, [companyId, offset, limit]);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM customers WHERE _client = $1',
      [companyId]
    );

    const total = parseInt(countResult.rows[0].total);

    res.json({
      status: true,
      error: null,
      objects: customersResult.rows.length,
      total,
      data: customersResult.rows,
    });
  } catch (error) {
    console.error('Customers fetch error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch customers',
    });
  }
});

/**
 * GET /data/:companyId/clients/:clientId
 * Get single customer
 */
router.get('/:companyId/clients/:clientId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { companyId, clientId } = req.params;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM customers WHERE _id = $1 AND _client = $2',
      [clientId, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: false,
        error: 'Customer not found',
      });
    }

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Customer fetch error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to fetch customer',
    });
  }
});

/**
 * POST /data/:companyId/clients
 * Create new customer
 */
router.post('/:companyId/clients', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { 
      name, type, sex, description, address, phones, emails,
      discount, discount_card, loyalty_type, cashback_rate
    } = req.body;
    
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const _id = generateObjectId();
    const now = Math.floor(Date.now() / 1000);

    const result = await pool.query(`
      INSERT INTO customers (
        _id, _client, _user, _app, name, type, sex, description, address,
        phones, emails, discount, discount_card, loyalty_type, cashback_rate,
        created, updated, created_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      _id, companyId, req.session.userId, 'WAPP',
      name, type || 'person', sex, description,
      address ? JSON.stringify(address) : null,
      JSON.stringify(phones || []), JSON.stringify(emails || []),
      discount || 0, discount_card, loyalty_type, cashback_rate || 0,
      now, now, now * 1000
    ]);

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Customer create error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to create customer',
    });
  }
});

/**
 * PUT /data/:companyId/clients/:clientId
 * Update customer
 */
router.put('/:companyId/clients/:clientId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { companyId, clientId } = req.params;
    const { 
      name, type, sex, description, address, phones, emails,
      discount, discount_card, loyalty_type, cashback_rate, deleted
    } = req.body;
    
    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    const now = Math.floor(Date.now() / 1000);

    const result = await pool.query(`
      UPDATE customers 
      SET name = COALESCE($3, name),
          type = COALESCE($4, type),
          sex = COALESCE($5, sex),
          description = COALESCE($6, description),
          address = COALESCE($7, address),
          phones = COALESCE($8, phones),
          emails = COALESCE($9, emails),
          discount = COALESCE($10, discount),
          discount_card = COALESCE($11, discount_card),
          loyalty_type = COALESCE($12, loyalty_type),
          cashback_rate = COALESCE($13, cashback_rate),
          deleted = COALESCE($14, deleted),
          updated = $15
      WHERE _id = $1 AND _client = $2
      RETURNING *
    `, [
      clientId, companyId, name, type, sex, description,
      address ? JSON.stringify(address) : null,
      phones ? JSON.stringify(phones) : null,
      emails ? JSON.stringify(emails) : null,
      discount, discount_card, loyalty_type, cashback_rate, deleted, now
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: false,
        error: 'Customer not found',
      });
    }

    res.json({
      status: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Customer update error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to update customer',
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
