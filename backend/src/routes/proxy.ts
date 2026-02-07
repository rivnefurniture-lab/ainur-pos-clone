import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { getCompanyId } from '../middleware/auth';

const router = Router();

/**
 * Proxy endpoint - matches Ainur's /proxy?path={encoded_path}&timezone={tz}
 * This is the main API gateway that routes requests based on path parameter
 */
router.all('/', async (req: Request, res: Response) => {
  try {
    const { path: encodedPath, timezone } = req.query;
    
    if (!encodedPath || typeof encodedPath !== 'string') {
      return res.status(400).json({
        status: false,
        error: 'Path parameter is required',
      });
    }

    // Decode the path
    const decodedPath = decodeURIComponent(encodedPath);
    const sessionCompanyId = getCompanyId(req);

    // Parse query params from path
    const [pathWithoutQuery, queryString] = decodedPath.split('?');
    const pathParts = pathWithoutQuery.split('/').filter(Boolean);
    
    // Parse query params
    const queryParams: Record<string, string> = {};
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        queryParams[key] = value;
      });
    }

    if (pathParts.length < 2) {
      return res.status(400).json({
        status: false,
        error: 'Invalid path format',
      });
    }

    const action = pathParts[0]; // 'data', 'count', 'search'
    const companyId = pathParts[1];
    const resource = pathParts[2]; // 'catalog', 'clients', 'stores', etc.
    
    // Verify the company ID matches the session
    if (companyId !== sessionCompanyId) {
      return res.status(403).json({
        status: false,
        error: 'Access denied to this company',
      });
    }

    const offset = parseInt(queryParams.offset || '0');
    const limit = parseInt(queryParams.limit || '1000');

    // Route based on action and resource
    switch (action) {
      case 'data':
        return handleDataRequest(req, res, companyId, resource, pathParts, offset, limit);
      
      case 'count':
        return handleCountRequest(req, res, companyId, resource);
      
      case 'search':
        return handleSearchRequest(req, res, companyId, resource, pathParts);
      
      default:
        return res.status(404).json({
          status: false,
          error: 'Unknown action',
          details: action,
        });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      status: false,
      error: 'Proxy request failed',
    });
  }
});

async function handleDataRequest(
  req: Request, res: Response, 
  companyId: string, resource: string, 
  pathParts: string[], offset: number, limit: number
) {
  try {
    switch (resource) {
      case 'catalog': {
        // Check for categories sub-resource
        if (pathParts[3] === 'categories') {
          const result = await pool.query(
            'SELECT name FROM categories WHERE _client = $1 ORDER BY name',
            [companyId]
          );
          const categories = result.rows.map(r => r.name);
          return res.json({ status: true, error: null, objects: categories.length, total: categories.length, data: categories });
        }
        
        // Get products
        const result = await pool.query(
          'SELECT * FROM products WHERE _client = $1 ORDER BY updated DESC NULLS LAST OFFSET $2 LIMIT $3',
          [companyId, offset, limit]
        );
        const countResult = await pool.query('SELECT COUNT(*) as total FROM products WHERE _client = $1', [companyId]);
        return res.json({ status: true, error: null, objects: result.rows.length, total: parseInt(countResult.rows[0].total), data: result.rows });
      }
      
      case 'clients': {
        const result = await pool.query(
          'SELECT * FROM customers WHERE _client = $1 ORDER BY name OFFSET $2 LIMIT $3',
          [companyId, offset, limit]
        );
        const countResult = await pool.query('SELECT COUNT(*) as total FROM customers WHERE _client = $1', [companyId]);
        return res.json({ status: true, error: null, objects: result.rows.length, total: parseInt(countResult.rows[0].total), data: result.rows });
      }
      
      case 'stores': {
        const result = await pool.query('SELECT * FROM stores WHERE _client = $1 ORDER BY name', [companyId]);
        return res.json({ status: true, error: null, objects: result.rows.length, total: result.rows.length, data: result.rows });
      }
      
      case 'accounts': {
        const result = await pool.query('SELECT * FROM accounts WHERE _client = $1 ORDER BY name', [companyId]);
        return res.json({ status: true, error: null, objects: result.rows.length, total: result.rows.length, data: result.rows });
      }
      
      case 'suppliers': {
        const result = await pool.query('SELECT * FROM suppliers WHERE _client = $1 ORDER BY name', [companyId]);
        return res.json({ status: true, error: null, objects: result.rows.length, total: result.rows.length, data: result.rows });
      }
      
      case 'sources': {
        const result = await pool.query('SELECT * FROM money_sources ORDER BY title');
        return res.json({ status: true, error: null, objects: result.rows.length, total: result.rows.length, data: result.rows });
      }
      
      case 'registers': {
        const result = await pool.query('SELECT * FROM registers WHERE _client = $1 ORDER BY name', [companyId]);
        return res.json({ status: true, error: null, objects: result.rows.length, total: result.rows.length, data: result.rows });
      }
      
      default:
        return res.status(404).json({ status: false, error: 'Resource not found', details: resource });
    }
  } catch (error) {
    console.error('Data request error:', error);
    return res.status(500).json({ status: false, error: 'Failed to fetch data' });
  }
}

async function handleCountRequest(req: Request, res: Response, companyId: string, resource: string) {
  try {
    let table: string;
    switch (resource) {
      case 'catalog': table = 'products'; break;
      case 'clients': table = 'customers'; break;
      case 'stores': table = 'stores'; break;
      case 'accounts': table = 'accounts'; break;
      case 'suppliers': table = 'suppliers'; break;
      case 'docs': table = 'documents'; break;
      default:
        return res.status(404).json({ status: false, error: 'Resource not found' });
    }
    
    const result = await pool.query(`SELECT COUNT(*) as total FROM ${table} WHERE _client = $1`, [companyId]);
    return res.json({ status: true, error: null, data: { total: parseInt(result.rows[0].total) } });
  } catch (error) {
    console.error('Count request error:', error);
    return res.status(500).json({ status: false, error: 'Failed to get count' });
  }
}

async function handleSearchRequest(
  req: Request, res: Response, 
  companyId: string, resource: string, 
  pathParts: string[]
) {
  try {
    // Search path format: /search/{resource}/{companyId}/{offset}/{limit}
    const offset = parseInt(pathParts[3] || '0');
    const limit = parseInt(pathParts[4] || '1000');
    const body = req.body || {};
    
    switch (resource) {
      case 'docs': {
        let query = 'SELECT * FROM documents WHERE _client = $1';
        const params: any[] = [companyId];
        
        if (body.type) { params.push(body.type); query += ` AND type = $${params.length}`; }
        if (body.store) { params.push(body.store); query += ` AND store = $${params.length}`; }
        
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await pool.query(countQuery, params);
        
        query += ` ORDER BY date DESC NULLS LAST OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(offset, limit);
        
        const result = await pool.query(query, params);
        return res.json({ status: true, error: null, objects: result.rows.length, total: parseInt(countResult.rows[0].total), data: result.rows });
      }
      
      case 'money': {
        let query = 'SELECT * FROM money_movements WHERE _client = $1';
        const params: any[] = [companyId];
        
        if (body.type) { params.push(body.type); query += ` AND type = $${params.length}`; }
        if (body.account) { params.push(body.account); query += ` AND account = $${params.length}`; }
        
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await pool.query(countQuery, params);
        
        query += ` ORDER BY date DESC NULLS LAST OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(offset, limit);
        
        const result = await pool.query(query, params);
        return res.json({ status: true, error: null, objects: result.rows.length, total: parseInt(countResult.rows[0].total), data: result.rows });
      }
      
      case 'catalog': {
        let query = 'SELECT * FROM products WHERE _client = $1 AND deleted = false';
        const params: any[] = [companyId];
        
        if (body.search) {
          params.push(`%${body.search}%`);
          query += ` AND (name ILIKE $${params.length} OR sku ILIKE $${params.length} OR barcode ILIKE $${params.length})`;
        }
        
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await pool.query(countQuery, params);
        
        query += ` ORDER BY name OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(offset, limit);
        
        const result = await pool.query(query, params);
        return res.json({ status: true, error: null, objects: result.rows.length, total: parseInt(countResult.rows[0].total), data: result.rows });
      }
      
      case 'clients': {
        let query = 'SELECT * FROM customers WHERE _client = $1 AND deleted = false';
        const params: any[] = [companyId];
        
        if (body.search) {
          params.push(`%${body.search}%`);
          query += ` AND (name ILIKE $${params.length} OR phones::text ILIKE $${params.length})`;
        }
        
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
        const countResult = await pool.query(countQuery, params);
        
        query += ` ORDER BY name OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
        params.push(offset, limit);
        
        const result = await pool.query(query, params);
        return res.json({ status: true, error: null, objects: result.rows.length, total: parseInt(countResult.rows[0].total), data: result.rows });
      }
      
      default:
        return res.status(404).json({ status: false, error: 'Search resource not found', details: resource });
    }
  } catch (error) {
    console.error('Search request error:', error);
    return res.status(500).json({ status: false, error: 'Failed to search' });
  }
}

export default router;
