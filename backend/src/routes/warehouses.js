const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, requireRole } = require('../middleware/auth');

// ── GET /warehouses ────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*,
             COUNT(DISTINCT l.id) AS location_count
      FROM warehouses w
      LEFT JOIN locations l ON l.warehouse_id = w.id
      GROUP BY w.id
      ORDER BY w.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /warehouses/:id ────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const wh = await pool.query('SELECT * FROM warehouses WHERE id = $1', [req.params.id]);
    if (!wh.rows.length) return res.status(404).json({ error: 'Warehouse not found' });

    const locations = await pool.query(
      'SELECT * FROM locations WHERE warehouse_id = $1 ORDER BY name',
      [req.params.id]
    );
    res.json({ ...wh.rows[0], locations: locations.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /warehouses ───────────────────────────────────────
router.post('/', authenticate, requireRole('manager'), async (req, res) => {
  const { name, address } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create warehouse
    const whResult = await client.query(
      'INSERT INTO warehouses (name, address) VALUES ($1,$2) RETURNING *',
      [name, address]
    );
    const warehouse = whResult.rows[0];

    // Auto-create a default location for every new warehouse
    await client.query(
      'INSERT INTO locations (warehouse_id, name) VALUES ($1,$2)',
      [warehouse.id, 'Default Location']
    );

    await client.query('COMMIT');
    res.status(201).json(warehouse);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally { client.release(); }
});

// ── PATCH /warehouses/:id ──────────────────────────────────
router.patch('/:id', authenticate, requireRole('manager'), async (req, res) => {
  const { name, address } = req.body;
  try {
    const result = await pool.query(
      `UPDATE warehouses SET
         name    = COALESCE($1, name),
         address = COALESCE($2, address)
       WHERE id = $3 RETURNING *`,
      [name, address, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Warehouse not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /warehouses/:id/locations ─────────────────────────
router.get('/:id/locations', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM locations WHERE warehouse_id = $1 ORDER BY name',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /warehouses/:id/locations ────────────────────────
router.post('/:id/locations', authenticate, requireRole('manager'), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    // Verify warehouse exists
    const wh = await pool.query('SELECT id FROM warehouses WHERE id = $1', [req.params.id]);
    if (!wh.rows.length) return res.status(404).json({ error: 'Warehouse not found' });

    const result = await pool.query(
      'INSERT INTO locations (warehouse_id, name) VALUES ($1,$2) RETURNING *',
      [req.params.id, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PATCH /warehouses/:id/locations/:locId ─────────────────
router.patch('/:id/locations/:locId', authenticate, requireRole('manager'), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  try {
    const result = await pool.query(
      'UPDATE locations SET name = $1 WHERE id = $2 AND warehouse_id = $3 RETURNING *',
      [name, req.params.locId, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Location not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /warehouses/:id/locations/:locId ────────────────
router.delete('/:id/locations/:locId', authenticate, requireRole('manager'), async (req, res) => {
  try {
    // Prevent deletion if stock exists at this location
    const stockCheck = await pool.query(
      'SELECT SUM(quantity) AS total FROM stock_levels WHERE location_id = $1',
      [req.params.locId]
    );
    const total = parseInt(stockCheck.rows[0]?.total) || 0;
    if (total > 0) {
      return res.status(400).json({
        error: `Cannot delete location — it still has ${total} units of stock. Transfer stock out first.`,
      });
    }

    await pool.query(
      'DELETE FROM locations WHERE id = $1 AND warehouse_id = $2',
      [req.params.locId, req.params.id]
    );
    res.json({ message: 'Location deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
