const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// ── GET /adjustments ───────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { product_id, location_id } = req.query;
  let query = `
    SELECT a.*, p.name AS product_name, p.sku,
           l.name AS location_name, u.name AS created_by_name
    FROM adjustments a
    JOIN products p ON p.id = a.product_id
    JOIN locations l ON l.id = a.location_id
    LEFT JOIN users u ON u.id = a.created_by
    WHERE 1=1
  `;
  const params = [];
  if (product_id) { params.push(product_id); query += ` AND a.product_id = $${params.length}`; }
  if (location_id) { params.push(location_id); query += ` AND a.location_id = $${params.length}`; }
  query += ' ORDER BY a.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /adjustments ──────────────────────────────────────
// Atomic: reconcile counted_qty vs system qty → ledger write + stock_levels update
router.post('/', authenticate, async (req, res) => {
  const { product_id, location_id, counted_qty } = req.body;
  if (product_id == null || location_id == null || counted_qty == null)
    return res.status(400).json({ error: 'product_id, location_id and counted_qty are required' });
  if (counted_qty < 0)
    return res.status(400).json({ error: 'counted_qty cannot be negative' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock the current stock row
    const stockRes = await client.query(
      `SELECT quantity FROM stock_levels
       WHERE product_id = $1 AND location_id = $2 FOR UPDATE`,
      [product_id, location_id]
    );
    const system_qty = stockRes.rows[0]?.quantity ?? 0;
    const delta = counted_qty - system_qty;

    // If no difference, nothing to do
    if (delta === 0) {
      await client.query('ROLLBACK');
      return res.json({ message: 'No adjustment needed — counts match', delta: 0 });
    }

    // Write ledger entry
    await client.query(
      `INSERT INTO stock_ledger (product_id, location_id, delta, type, created_by)
       VALUES ($1,$2,$3,'adjustment',$4)`,
      [product_id, location_id, delta, req.user.id]
    );

    // Upsert stock_levels
    await client.query(
      `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (product_id, location_id) DO UPDATE
       SET quantity = $3`,
      [product_id, location_id, counted_qty]
    );

    // Save adjustment record for audit trail
    const result = await client.query(
      `INSERT INTO adjustments (product_id, location_id, counted_qty, system_qty_at_time, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [product_id, location_id, counted_qty, system_qty, req.user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({
      adjustment: result.rows[0],
      delta,
      previous_qty: system_qty,
      new_qty: counted_qty,
      message: `Stock adjusted by ${delta > 0 ? '+' : ''}${delta}`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

module.exports = router;
