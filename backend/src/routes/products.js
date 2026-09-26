const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /products?category=&search=
router.get('/', authenticate, async (req, res) => {
  const { category, search } = req.query;
  let query = `
    SELECT p.*, c.name AS category_name,
           COALESCE(SUM(sl.quantity), 0) AS total_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN stock_levels sl ON sl.product_id = p.id
  `;
  const conditions = [];
  const params = [];

  if (category) {
    params.push(category);
    conditions.push(`c.name ILIKE $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`);
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' GROUP BY p.id, c.name ORDER BY p.name';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /products
router.post('/', authenticate, async (req, res) => {
  const { sku, name, category_id, unit_of_measure, unit_cost, reorder_point, reorder_qty } = req.body;
  if (!sku || !name) return res.status(400).json({ error: 'sku and name are required' });

  try {
    const result = await pool.query(
      `INSERT INTO products (sku, name, category_id, unit_of_measure, unit_cost, reorder_point, reorder_qty)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [sku, name, category_id, unit_of_measure || 'unit', unit_cost || 0, reorder_point || 0, reorder_qty || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'SKU already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /products/:id
router.patch('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, category_id, unit_of_measure, unit_cost, reorder_point, reorder_qty } = req.body;

  try {
    const result = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        category_id = COALESCE($2, category_id),
        unit_of_measure = COALESCE($3, unit_of_measure),
        unit_cost = COALESCE($4, unit_cost),
        reorder_point = COALESCE($5, reorder_point),
        reorder_qty = COALESCE($6, reorder_qty)
       WHERE id = $7 RETURNING *`,
      [name, category_id, unit_of_measure, unit_cost, reorder_point, reorder_qty, id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /products/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
