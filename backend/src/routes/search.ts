import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { isAuthenticated, getCompanyId } from '../middleware/auth';

const router = Router();

/**
 * POST /search/docs/:companyId/:offset/:limit
 * Search documents with filters
 */
router.post('/docs/:companyId/:offset/:limit', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = req.params.companyId as string;
    const offset = req.params.offset as string;
    const limit = req.params.limit as string;
    const { type, types, store, stores, from_date, to_date, from, to, search } = req.body;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    let query = 'SELECT * FROM documents WHERE _client = $1';
    const params: any[] = [companyId];

    // Handle single type or array of types
    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    } else if (types && Array.isArray(types) && types.length > 0) {
      const placeholders = types.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...types);
      query += ` AND type IN (${placeholders})`;
    }

    // Handle single store or array of stores
    if (store) {
      params.push(store);
      query += ` AND store = $${params.length}`;
    } else if (stores && Array.isArray(stores) && stores.length > 0) {
      const placeholders = stores.map((_, i) => `$${params.length + i + 1}`).join(', ');
      params.push(...stores);
      query += ` AND store IN (${placeholders})`;
    }
    // When "all stores" is selected, don't filter by store at all (show ALL stores like Ainur)

    // Handle date filters (support both from/to and from_date/to_date)
    const fromDate = from || from_date;
    const toDate = to || to_date;
    
    if (fromDate) {
      params.push(fromDate);
      query += ` AND date >= $${params.length}`;
    }

    if (toDate) {
      params.push(toDate);
      query += ` AND date <= $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (number::text LIKE $${params.length} OR products::text ILIKE $${params.length})`;
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    query += ` ORDER BY date DESC NULLS LAST OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
    params.push(parseInt(offset) || 0, parseInt(limit) || 1000);

    const result = await pool.query(query, params);

    // Get all product IDs from documents to lookup costs and details
    const productIds = new Set<string>();
    const storeIds = new Set<string>();
    const customerIds = new Set<string>();
    
    result.rows.forEach(row => {
      const products = row.products || [];
      products.forEach((item: any) => {
        if (item._id) productIds.add(item._id);
      });
      if (row.store) storeIds.add(row.store);
      if (row.to_store) storeIds.add(row.to_store);
      if (row.customer) customerIds.add(row.customer);
    });

    // Lookup product details from catalog
    let productDetails: Record<string, any> = {};
    if (productIds.size > 0) {
      const productIdsArray = Array.from(productIds);
      const placeholders = productIdsArray.map((_, i) => `$${i + 1}`).join(', ');
      const productQuery = `SELECT _id, name, cost, price, barcode, sku FROM products WHERE _id IN (${placeholders})`;
      const productResult = await pool.query(productQuery, productIdsArray);
      productResult.rows.forEach(row => {
        productDetails[row._id] = {
          name: row.name,
          cost: parseFloat(row.cost) || 0,
          price: parseFloat(row.price) || 0,
          barcode: row.barcode,
          sku: row.sku,
        };
      });
    }

    // Lookup store names
    let storeNames: Record<string, string> = {};
    if (storeIds.size > 0) {
      const storeIdsArray = Array.from(storeIds);
      const placeholders = storeIdsArray.map((_, i) => `$${i + 1}`).join(', ');
      const storeQuery = `SELECT _id, name FROM stores WHERE _id IN (${placeholders})`;
      const storeResult = await pool.query(storeQuery, storeIdsArray);
      storeResult.rows.forEach(row => {
        storeNames[row._id] = row.name;
      });
    }

    // Lookup customer names
    let customerNames: Record<string, string> = {};
    if (customerIds.size > 0) {
      const customerIdsArray = Array.from(customerIds);
      const placeholders = customerIdsArray.map((_, i) => `$${i + 1}`).join(', ');
      const customerQuery = `SELECT _id, name FROM customers WHERE _id IN (${placeholders})`;
      const customerResult = await pool.query(customerQuery, customerIdsArray);
      customerResult.rows.forEach(row => {
        customerNames[row._id] = row.name;
      });
    }

    // Map database fields to API fields and calculate cost
    const mappedData = result.rows.map(row => {
      const products = row.products || [];
      let costTotal = 0;
      
      // Calculate cost for sales AND return_sales documents
      if (row.type === 'sales' || row.type === 'return_sales') {
        products.forEach((item: any) => {
          const productCost = productDetails[item._id]?.cost || 0;
          const qty = Math.abs(item.qty || 0);
          costTotal += productCost * qty;
        });
      }

      // Enhance product items with full details from embedded product data
      const enhancedProducts = products.map((item: any) => ({
        ...item,
        name: item.product?.name || item.name || productDetails[item._id]?.name || 'Невідомий товар',
        barcode: item.product?.barcode || item.barcode || productDetails[item._id]?.barcode || '',
        sku: item.product?.sku || item.sku || productDetails[item._id]?.sku || '',
        price: item.price || productDetails[item._id]?.price || 0,
        cost: productDetails[item._id]?.cost || 0,
      }));

      // Extract store/customer info from embedded from/to objects
      const fromData = row.from || {};
      const toData = row.to || {};
      const infoUser = row.info?.user || {};

      // Get store name from embedded data or lookup
      const storeName = fromData.name || storeNames[row.store] || '';
      
      // Get customer/target store name from embedded data
      let customerName = 'Роздрібний покупець';
      let targetStoreName = '';
      if (toData.type === 'clients') {
        customerName = toData.name || customerNames[row.customer] || 'Роздрібний покупець';
      } else if (toData.type === 'stores') {
        targetStoreName = toData.name || storeNames[row.to_store] || '';
      }

      // Calculate discount info
      const total = parseFloat(row.sum) || 0;
      const discountPercent = row.discount_percent || 0;
      const discountAmount = parseFloat(row.discount_sum) || 0;

      return {
        ...row,
        total,
        cost_total: costTotal,
        date: parseInt(row.date) || 0,
        _store: row.store || fromData._id,
        store_name: storeName,
        _target: row.to_store || (toData.type === 'stores' ? toData._id : null),
        target_store_name: targetStoreName,
        _customer: row.customer || (toData.type === 'clients' ? toData._id : null),
        customer_name: customerName,
        _user: row._user,
        author_name: infoUser.name || 'Невідомий',
        items: enhancedProducts,
        discount: discountAmount,
        discount_percent: discountPercent,
      };
    });

    res.json({
      status: true,
      error: null,
      objects: result.rows.length,
      total,
      data: mappedData,
    });
  } catch (error) {
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
router.post('/money/:companyId/:offset/:limit', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = req.params.companyId as string;
    const offset = req.params.offset as string;
    const limit = req.params.limit as string;
    const { type, account, from_date, to_date } = req.body;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    let query = 'SELECT * FROM money_movements WHERE _client = $1';
    const params: any[] = [companyId];

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
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    query += ` ORDER BY date DESC NULLS LAST OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
    params.push(parseInt(offset) || 0, parseInt(limit) || 1000);

    const result = await pool.query(query, params);

    res.json({
      status: true,
      error: null,
      objects: result.rows.length,
      total,
      data: result.rows,
    });
  } catch (error) {
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
router.post('/catalog/:companyId/:offset/:limit', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = req.params.companyId as string;
    const offset = req.params.offset as string;
    const limit = req.params.limit as string;
    const { search, category, store, in_stock } = req.body;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    let query = 'SELECT * FROM products WHERE _client = $1 AND deleted = false';
    const params: any[] = [companyId];

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
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    query += ` ORDER BY name OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
    params.push(parseInt(offset) || 0, parseInt(limit) || 1000);

    const result = await pool.query(query, params);

    res.json({
      status: true,
      error: null,
      objects: result.rows.length,
      total,
      data: result.rows,
    });
  } catch (error) {
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
router.post('/clients/:companyId/:offset/:limit', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const companyId = req.params.companyId as string;
    const offset = req.params.offset as string;
    const limit = req.params.limit as string;
    const { search, type } = req.body;

    const userCompanyId = getCompanyId(req);
    if (companyId !== userCompanyId) {
      return res.status(403).json({ status: false, error: 'Access denied' });
    }

    let query = 'SELECT * FROM customers WHERE _client = $1 AND deleted = false';
    const params: any[] = [companyId];

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
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    query += ` ORDER BY name OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
    params.push(parseInt(offset) || 0, parseInt(limit) || 1000);

    const result = await pool.query(query, params);

    res.json({
      status: true,
      error: null,
      objects: result.rows.length,
      total,
      data: result.rows,
    });
  } catch (error) {
    console.error('Clients search error:', error);
    res.status(500).json({
      status: false,
      error: 'Failed to search customers',
    });
  }
});

export default router;
