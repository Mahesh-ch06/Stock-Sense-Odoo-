const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /dashboard/kpis?warehouse_id=
router.get('/kpis', authenticate, async (req, res) => {
  const { warehouse_id } = req.query;
  try {
    const warehouseFilter = warehouse_id ? 'AND w.id = $1' : '';
    const params = warehouse_id ? [warehouse_id] : [];

    // Total products
    const totalProducts = await pool.query('SELECT COUNT(*) FROM products');

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

    res.json({
      total_products: parseInt(totalProducts.rows[0].count),
      low_stock: parseInt(lowStock.rows[0].count),
      out_of_stock: parseInt(outOfStock.rows[0].count),
      pending_receipts: parseInt(pendingReceipts.rows[0].count),
      pending_deliveries: parseInt(pendingDeliveries.rows[0].count),
      pending_transfers: parseInt(pendingTransfers.rows[0].count),
      backorders: parseInt(backorders.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
