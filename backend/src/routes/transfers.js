const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// ── GET /transfers ─────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT t.*,
           fl.name AS from_location_name, tl.name AS to_location_name,
           u.name AS created_by_name
    FROM transfers t
    JOIN locations fl ON fl.id = t.from_location_id
    JOIN locations tl ON tl.id = t.to_location_id
    LEFT JOIN users u ON u.id = t.created_by
    WHERE 1=1
  `;
  const params = [];
  if (status) { params.push(status); query += ` AND t.status = $${params.length}`; }
  query += ' ORDER BY t.created_at DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /transfers/:id ─────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const transfer = await pool.query(
      `SELECT t.*, fl.name AS from_location_name, tl.name AS to_location_name
       FROM transfers t
       JOIN locations fl ON fl.id = t.from_location_id
       JOIN locations tl ON tl.id = t.to_location_id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!transfer.rows.length) return res.status(404).json({ error: 'Transfer not found' });

    const lines = await pool.query(
      `SELECT trl.*, p.name AS product_name, p.sku,
              COALESCE(sl.quantity, 0) AS available_qty
       FROM transfer_lines trl
       JOIN products p ON p.id = trl.product_id
       LEFT JOIN stock_levels sl ON sl.product_id = trl.product_id
         AND sl.location_id = $2
       WHERE trl.transfer_id = $1`,
      [req.params.id, transfer.rows[0].from_location_id]
    );
    res.json({ ...transfer.rows[0], lines: lines.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /transfers ────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const { from_location_id, to_location_id, lines = [] } = req.body;
  if (!from_location_id || !to_location_id)
    return res.status(400).json({ error: 'from_location_id and to_location_id are required' });
  if (from_location_id === to_location_id)
    return res.status(400).json({ error: 'Source and destination locations must be different' });
  if (!lines.length)
    return res.status(400).json({ error: 'At least one line item is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO transfers (from_location_id, to_location_id, created_by)
       VALUES ($1,$2,$3) RETURNING *`,
      [from_location_id, to_location_id, req.user.id]
    );
    const transfer = result.rows[0];

    for (const line of lines) {
      await client.query(
        `INSERT INTO transfer_lines (transfer_id, product_id, qty) VALUES ($1,$2,$3)`,
        [transfer.id, line.product_id, line.qty]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(transfer);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

// ── POST /transfers/:id/validate ───────────────────────────
// CRITICAL PATH — two-sided atomic stock move, no net change in total inventory
router.post('/:id/validate', authenticate, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const transferRes = await client.query(
      'SELECT * FROM transfers WHERE id = $1 FOR UPDATE',
      [req.params.id]
    );
    const transfer = transferRes.rows[0];
    if (!transfer) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transfer not found' });
    }
    if (transfer.status === 'done') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Transfer already validated' });
    }
    if (transfer.status === 'canceled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot validate a canceled transfer' });
    }

    const lines = await client.query(
      'SELECT * FROM transfer_lines WHERE transfer_id = $1',
      [transfer.id]
    );

    for (const line of lines.rows) {
      // Lock source stock row and check availability
      const sourceStock = await client.query(
        `SELECT quantity FROM stock_levels
         WHERE product_id = $1 AND location_id = $2 FOR UPDATE`,
        [line.product_id, transfer.from_location_id]
      );
      const available = sourceStock.rows[0]?.quantity ?? 0;
      if (available < line.qty) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for product ${line.product_id} at source: need ${line.qty}, have ${available}`,
        });
      }

      // ── Deduct from source ──────────────────────────────
      await client.query(
        `INSERT INTO stock_ledger (product_id, location_id, delta, type, ref_doc_id, created_by)
         VALUES ($1,$2,$3,'transfer',$4,$5)`,
        [line.product_id, transfer.from_location_id, -line.qty, transfer.id, req.user.id]
      );
      await client.query(
        `UPDATE stock_levels SET quantity = quantity - $1
         WHERE product_id = $2 AND location_id = $3`,
        [line.qty, line.product_id, transfer.from_location_id]
      );

      // ── Add to destination ──────────────────────────────
      await client.query(
        `INSERT INTO stock_ledger (product_id, location_id, delta, type, ref_doc_id, created_by)
         VALUES ($1,$2,$3,'transfer',$4,$5)`,
        [line.product_id, transfer.to_location_id, line.qty, transfer.id, req.user.id]
      );
      await client.query(
        `INSERT INTO stock_levels (product_id, location_id, quantity) VALUES ($1,$2,$3)
         ON CONFLICT (product_id, location_id) DO UPDATE
         SET quantity = stock_levels.quantity + $3`,
        [line.product_id, transfer.to_location_id, line.qty]
      );
    }

    // Mark transfer done
    await client.query(
      `UPDATE transfers SET status = 'done', updated_at = NOW() WHERE id = $1`,
      [transfer.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Transfer validated', status: 'done' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

module.exports = router;
