const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /dashboard/kpis?warehouse_id=
router.get('/kpis', authenticate, async (req, res) => {
  const { warehouse_id } = req.query;
  try {
    const params = warehouse_id ? [warehouse_id] : [];

    // Total products
    const totalProducts = await pool.query('SELECT COUNT(*) FROM products');

    // Total Inventory Valuation ($) & Total Physical Units
    let valuationQuery = `
      SELECT
        COALESCE(SUM(sl.quantity * p.unit_cost), 0) AS total_valuation,
        COALESCE(SUM(sl.quantity), 0) AS total_units
      FROM stock_levels sl
      JOIN products p ON p.id = sl.product_id
      JOIN locations l ON l.id = sl.location_id
    `;
    if (warehouse_id) {
      valuationQuery += ' WHERE l.warehouse_id = $1';
    }
    const valuationRes = await pool.query(valuationQuery, params);

    // Low stock (quantity > 0 but <= reorder_point)
    const lowStock = await pool.query(`
      SELECT COUNT(DISTINCT p.id) FROM products p
      JOIN stock_levels sl ON sl.product_id = p.id
      WHERE sl.quantity > 0 AND sl.quantity <= p.reorder_point
    `);

    // Out of stock
    const outOfStock = await pool.query(`
      SELECT COUNT(DISTINCT p.id) FROM products p
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      WHERE COALESCE(sl.quantity, 0) = 0
    `);

    // Pending receipts
    const pendingReceipts = await pool.query(
      `SELECT COUNT(*) FROM receipts WHERE status IN ('draft','waiting','ready') ${warehouse_id ? 'AND warehouse_id = $1' : ''}`,
      params
    );

    // Pending deliveries
    const pendingDeliveries = await pool.query(
      `SELECT COUNT(*) FROM delivery_orders WHERE status IN ('draft','picking','packing','ready') ${warehouse_id ? 'AND warehouse_id = $1' : ''}`,
      params
    );

    // Pending transfers
    const pendingTransfers = await pool.query(
      `SELECT COUNT(*) FROM transfers WHERE status IN ('draft','ready')`
    );

    // Backorders
    const backorders = await pool.query(
      `SELECT COUNT(*) FROM (
        SELECT id FROM receipts WHERE status = 'backorder' ${warehouse_id ? 'AND warehouse_id = $1' : ''}
        UNION ALL
        SELECT id FROM delivery_orders WHERE status = 'backorder' ${warehouse_id ? 'AND warehouse_id = $1' : ''}
      ) bo`,
      params
    );

    // Critical stock items needing immediate replenishment
    let criticalQuery = `
      SELECT p.id, p.sku, p.name, p.unit_of_measure, p.unit_cost, p.reorder_point, p.reorder_qty,
             c.name AS category_name,
             COALESCE(SUM(sl.quantity), 0) AS current_stock
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN stock_levels sl ON sl.product_id = p.id
      LEFT JOIN locations l ON l.id = sl.location_id
      ${warehouse_id ? 'WHERE (l.warehouse_id = $1 OR l.warehouse_id IS NULL)' : ''}
      GROUP BY p.id, c.name
      HAVING COALESCE(SUM(sl.quantity), 0) <= p.reorder_point
      ORDER BY current_stock ASC, p.name ASC
      LIMIT 10
    `;
    const criticalRes = await pool.query(criticalQuery, params);

    // Recent activity feed from stock ledger
    let activityQuery = `
      SELECT sl.id, sl.delta, sl.type, sl.created_at,
             p.name AS product_name, p.sku,
             l.name AS location_name,
             u.name AS operator_name
      FROM stock_ledger sl
      JOIN products p ON p.id = sl.product_id
      JOIN locations l ON l.id = sl.location_id
      LEFT JOIN users u ON u.id = sl.created_by
      ${warehouse_id ? 'WHERE l.warehouse_id = $1' : ''}
      ORDER BY sl.created_at DESC
      LIMIT 6
    `;
    const activityRes = await pool.query(activityQuery, params);

    res.json({
      total_products: parseInt(totalProducts.rows[0].count, 10),
      total_valuation: parseFloat(valuationRes.rows[0].total_valuation || 0),
      total_units: parseInt(valuationRes.rows[0].total_units || 0, 10),
      low_stock: parseInt(lowStock.rows[0].count, 10),
      out_of_stock: parseInt(outOfStock.rows[0].count, 10),
      pending_receipts: parseInt(pendingReceipts.rows[0].count, 10),
      pending_deliveries: parseInt(pendingDeliveries.rows[0].count, 10),
      pending_transfers: parseInt(pendingTransfers.rows[0].count, 10),
      backorders: parseInt(backorders.rows[0].count, 10),
      critical_items: criticalRes.rows.map((row) => ({
        ...row,
        current_stock: parseInt(row.current_stock, 10),
        shortage: Math.max(0, row.reorder_point - parseInt(row.current_stock, 10)),
      })),
      recent_activity: activityRes.rows,
    });
  } catch (err) {
    console.error('Error fetching dashboard KPIs:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
