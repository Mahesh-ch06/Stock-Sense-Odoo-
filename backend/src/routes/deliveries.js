const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /deliveries
router.get('/', authenticate, async (req, res) => {
  const { status, warehouse_id } = req.query;
  let query = `SELECT d.*, u.name AS created_by_name FROM delivery_orders d
               LEFT JOIN users u ON u.id = d.created_by WHERE 1=1`;
  const params = [];
  if (status) { params.push(status); query += ` AND d.status = $${params.length}`; }
  if (warehouse_id) { params.push(warehouse_id); query += ` AND d.warehouse_id = $${params.length}`; }
  query += ' ORDER BY d.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// GET /deliveries/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const delivery = await pool.query('SELECT * FROM delivery_orders WHERE id = $1', [req.params.id]);
    if (!delivery.rows.length) return res.status(404).json({ error: 'Delivery not found' });
    const lines = await pool.query(
      `SELECT dl.*, p.name AS product_name, p.sku,
              COALESCE(sl.quantity, 0) AS available_qty
       FROM delivery_lines dl
       JOIN products p ON p.id = dl.product_id
       LEFT JOIN stock_levels sl ON sl.product_id = dl.product_id
       WHERE dl.delivery_id = $1`,
      [req.params.id]
    );
    res.json({ ...delivery.rows[0], lines: lines.rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /deliveries
router.post('/', authenticate, async (req, res) => {
  const { reference, warehouse_id, lines = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO delivery_orders (reference, warehouse_id, created_by) VALUES ($1,$2,$3) RETURNING *`,
      [reference, warehouse_id, req.user.id]
    );
    const delivery = result.rows[0];
    for (const line of lines) {
      await client.query(
        `INSERT INTO delivery_lines (delivery_id, product_id, qty) VALUES ($1,$2,$3)`,
        [delivery.id, line.product_id, line.qty]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(delivery);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

// PATCH /deliveries/:id/status — advance through picking → packing → ready
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const allowed = ['draft', 'picking', 'packing', 'ready', 'canceled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  try {
    const result = await pool.query(
      'UPDATE delivery_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Delivery not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// POST /deliveries/:id/validate — CRITICAL PATH
router.post('/:id/validate', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const deliveryRes = await client.query(
      'SELECT * FROM delivery_orders WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    const delivery = deliveryRes.rows[0];
    if (!delivery) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Delivery not found' }); }
    if (delivery.status === 'done') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Already validated' }); }

    const lines = await client.query(
      'SELECT * FROM delivery_lines WHERE delivery_id = $1',
      [delivery.id]
    );

    // Get default location for warehouse
    const locRes = await client.query(
      'SELECT id FROM locations WHERE warehouse_id = $1 LIMIT 1',
      [delivery.warehouse_id]
    );
    const location_id = locRes.rows[0]?.id;
    if (!location_id) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'No location found for warehouse' }); }

    for (const line of lines.rows) {
      // Lock the stock row and check availability
      const stockRes = await client.query(
        'SELECT quantity FROM stock_levels WHERE product_id = $1 AND location_id = $2 FOR UPDATE',
        [line.product_id, location_id]
      );
      const available = stockRes.rows[0]?.quantity ?? 0;
      if (available < line.qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for product ${line.product_id}: need ${line.qty}, have ${available}`,
        });
      }

      // Write negative ledger entry
      await client.query(
        `INSERT INTO stock_ledger (product_id, location_id, delta, type, ref_doc_id, created_by)
         VALUES ($1,$2,$3,'delivery',$4,$5)`,
        [line.product_id, location_id, -line.qty, delivery.id, req.user.id]
      );

      // Decrease stock
      await client.query(
        'UPDATE stock_levels SET quantity = quantity - $1 WHERE product_id = $2 AND location_id = $3',
        [line.qty, line.product_id, location_id]
      );
    }

    await client.query(
      'UPDATE delivery_orders SET status = $1, updated_at = NOW() WHERE id = $2',
      ['done', delivery.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Delivery validated', status: 'done' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

module.exports = router;
