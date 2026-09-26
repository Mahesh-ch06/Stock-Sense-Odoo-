const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// ── GET /receipts ──────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { status, warehouse_id } = req.query;
  let query = `SELECT r.*, u.name AS created_by_name FROM receipts r
               LEFT JOIN users u ON u.id = r.created_by WHERE 1=1`;
  const params = [];

  if (status) { params.push(status); query += ` AND r.status = $${params.length}`; }
  if (warehouse_id) { params.push(warehouse_id); query += ` AND r.warehouse_id = $${params.length}`; }
  query += ' ORDER BY r.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── GET /receipts/:id ──────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const receipt = await pool.query('SELECT * FROM receipts WHERE id = $1', [req.params.id]);
    if (!receipt.rows.length) return res.status(404).json({ error: 'Receipt not found' });
    const lines = await pool.query(
      `SELECT rl.*, p.name AS product_name, p.sku FROM receipt_lines rl
       JOIN products p ON p.id = rl.product_id WHERE rl.receipt_id = $1`,
      [req.params.id]
    );
    res.json({ ...receipt.rows[0], lines: lines.rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── POST /receipts ─────────────────────────────────────────
// Accepts optional inline lines: { supplier, warehouse_id, lines: [{product_id, qty_expected}] }
router.post('/', authenticate, async (req, res) => {
  const { supplier, warehouse_id, lines = [] } = req.body;
  if (!supplier) return res.status(400).json({ error: 'supplier is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO receipts (supplier, warehouse_id, created_by) VALUES ($1,$2,$3) RETURNING *`,
      [supplier, warehouse_id, req.user.id]
    );
    const receipt = result.rows[0];

    if (lines.length) {
      for (const line of lines) {
        await client.query(
          `INSERT INTO receipt_lines (receipt_id, product_id, qty_expected) VALUES ($1,$2,$3)`,
          [receipt.id, line.product_id, line.qty_expected]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json(receipt);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

// ── PATCH /receipts/:id/lines ──────────────────────────────
router.patch('/:id/lines', authenticate, async (req, res) => {
  const { lines } = req.body; // [{ product_id, qty_expected }]
  if (!lines?.length) return res.status(400).json({ error: 'lines array is required' });

  try {
    for (const line of lines) {
      await pool.query(
        `INSERT INTO receipt_lines (receipt_id, product_id, qty_expected)
         VALUES ($1,$2,$3)
         ON CONFLICT DO NOTHING`,
        [req.params.id, line.product_id, line.qty_expected]
      );
    }
    res.json({ message: 'Lines updated' });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ── POST /receipts/:id/validate ────────────────────────────
// CRITICAL PATH — atomic transaction with row-level locking
router.post('/:id/validate', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const receiptRes = await client.query(
      'SELECT * FROM receipts WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    const receipt = receiptRes.rows[0];
    if (!receipt) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Receipt not found' }); }
    if (receipt.status === 'done') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Already validated' }); }

    const lines = await client.query(
      'SELECT * FROM receipt_lines WHERE receipt_id = $1',
      [receipt.id]
    );

    let isBackorder = false;
    for (const line of lines.rows) {
      const qty = line.qty_received > 0 ? line.qty_received : line.qty_expected;
      if (qty < line.qty_expected) isBackorder = true;
      if (qty <= 0) continue;

      // Default location: first location of the warehouse
      const locRes = await client.query(
        'SELECT id FROM locations WHERE warehouse_id = $1 LIMIT 1',
        [receipt.warehouse_id]
      );
      const location_id = locRes.rows[0]?.id;
      if (!location_id) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'No location found for warehouse' }); }

      // Write ledger entry
      await client.query(
        `INSERT INTO stock_ledger (product_id, location_id, delta, type, ref_doc_id, created_by)
         VALUES ($1,$2,$3,'receipt',$4,$5)`,
        [line.product_id, location_id, qty, receipt.id, req.user.id]
      );

      // Update stock_levels (upsert)
      await client.query(
        `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES ($1,$2,$3)
         ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = stock_levels.quantity + $3`,
        [line.product_id, location_id, qty]
      );
    }

    const newStatus = isBackorder ? 'backorder' : 'done';
    await client.query(
      'UPDATE receipts SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, receipt.id]
    );

    await client.query('COMMIT');
    res.json({ message: `Receipt ${newStatus}`, status: newStatus });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

module.exports = router;
