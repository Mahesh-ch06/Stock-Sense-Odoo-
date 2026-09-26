const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /ledger?product_id=&location_id=&warehouse_id=&type=&from=&to=
router.get('/', authenticate, async (req, res) => {
  const { product_id, location_id, warehouse_id, type, from, to } = req.query;
  let query = `
    SELECT sl.*, p.name AS product_name, p.sku,
           l.name AS location_name, w.name AS warehouse_name,
           u.name AS created_by_name
    FROM stock_ledger sl
    JOIN products p ON p.id = sl.product_id
    JOIN locations l ON l.id = sl.location_id
    JOIN warehouses w ON w.id = l.warehouse_id
    LEFT JOIN users u ON u.id = sl.created_by
    WHERE 1=1
  `;
  const params = [];

  if (product_id) { params.push(product_id); query += ` AND sl.product_id = $${params.length}`; }
  if (location_id) { params.push(location_id); query += ` AND sl.location_id = $${params.length}`; }
  if (warehouse_id) { params.push(warehouse_id); query += ` AND w.id = $${params.length}`; }
  if (type) { params.push(type); query += ` AND sl.type = $${params.length}`; }
  if (from) { params.push(from); query += ` AND sl.created_at >= $${params.length}`; }
  if (to) { params.push(to); query += ` AND sl.created_at <= $${params.length}`; }

  query += ' ORDER BY sl.created_at DESC LIMIT 500';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
