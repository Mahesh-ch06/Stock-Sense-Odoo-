const cron = require('node-cron');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

// ─────────────────────────────────────────────────────────
// Email transporter (shared instance)
// ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─────────────────────────────────────────────────────────
// Query: fetch low-stock and out-of-stock products
// ─────────────────────────────────────────────────────────
async function getLowStockProducts() {
  const result = await pool.query(`
    SELECT
      p.id,
      p.sku,
      p.name,
      p.reorder_point,
      p.reorder_qty,
      l.name        AS location_name,
      w.name        AS warehouse_name,
      sl.quantity   AS current_qty,
      CASE
        WHEN sl.quantity = 0 THEN 'out_of_stock'
        ELSE 'low_stock'
      END AS alert_type
    FROM products p
    JOIN stock_levels sl ON sl.product_id = p.id
    JOIN locations    l  ON l.id = sl.location_id
    JOIN warehouses   w  ON w.id = l.warehouse_id
    WHERE sl.quantity <= p.reorder_point
    ORDER BY sl.quantity ASC, p.name ASC
  `);
  return result.rows;
}

// ─────────────────────────────────────────────────────────
// Build and send alert email
// ─────────────────────────────────────────────────────────
async function sendAlertEmail(products) {
  const outOfStock = products.filter(p => p.alert_type === 'out_of_stock');
  const lowStock   = products.filter(p => p.alert_type === 'low_stock');

  const formatRows = (items) =>
    items.map(p => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a">${p.sku}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a">${p.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a">${p.warehouse_name} / ${p.location_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;text-align:center;color:${p.current_qty === 0 ? '#ff4d4d' : '#f59e0b'};font-weight:bold">${p.current_qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;text-align:center">${p.reorder_point}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;text-align:center">${p.reorder_qty}</td>
      </tr>
    `).join('');

  const tableHeader = `
    <tr style="background:#1a1a1a;color:#aaa;font-size:12px;text-transform:uppercase">
      <th style="padding:8px 12px;text-align:left">SKU</th>
      <th style="padding:8px 12px;text-align:left">Product</th>
      <th style="padding:8px 12px;text-align:left">Location</th>
      <th style="padding:8px 12px;text-align:center">Current Qty</th>
      <th style="padding:8px 12px;text-align:center">Reorder Point</th>
      <th style="padding:8px 12px;text-align:center">Reorder Qty</th>
    </tr>
  `;

  const html = `
    <div style="font-family:sans-serif;background:#111;color:#eee;padding:32px;max-width:720px;margin:auto;border-radius:8px">
      <div style="display:flex;align-items:center;margin-bottom:24px">
        <span style="font-size:24px;font-weight:700;color:#fff">StockSense</span>
        <span style="margin-left:12px;background:#e11d48;color:#fff;padding:3px 10px;border-radius:999px;font-size:12px">Stock Alert</span>
      </div>

      <p style="color:#aaa;margin-bottom:24px">
        The following products require attention as of <strong style="color:#fff">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</strong>.
      </p>

      ${outOfStock.length ? `
        <div style="margin-bottom:24px">
          <div style="color:#ff4d4d;font-weight:600;font-size:15px;margin-bottom:10px">🚫 Out of Stock (${outOfStock.length})</div>
          <table style="width:100%;border-collapse:collapse;background:#161616;border-radius:6px;overflow:hidden">
            ${tableHeader}
            ${formatRows(outOfStock)}
          </table>
        </div>
      ` : ''}

      ${lowStock.length ? `
        <div style="margin-bottom:24px">
          <div style="color:#f59e0b;font-weight:600;font-size:15px;margin-bottom:10px">⚠️ Low Stock (${lowStock.length})</div>
          <table style="width:100%;border-collapse:collapse;background:#161616;border-radius:6px;overflow:hidden">
            ${tableHeader}
            ${formatRows(lowStock)}
          </table>
        </div>
      ` : ''}

      <p style="color:#555;font-size:12px;margin-top:32px">
        This alert is sent automatically every 30 minutes by StockSense. Log in to take action.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"StockSense Alerts" <${process.env.EMAIL_USER}>`,
    to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
    subject: `⚠️ StockSense Alert — ${outOfStock.length} out of stock, ${lowStock.length} low stock`,
    html,
  });
}

// ─────────────────────────────────────────────────────────
// Core alert runner — query + log + email
// ─────────────────────────────────────────────────────────
async function runLowStockCheck() {
  try {
    const products = await getLowStockProducts();

    if (!products.length) {
      console.log(`[alert-cron] ✅ ${new Date().toISOString()} — All stock levels healthy`);
      return;
    }

    const outCount = products.filter(p => p.alert_type === 'out_of_stock').length;
    const lowCount = products.filter(p => p.alert_type === 'low_stock').length;

    console.log(`[alert-cron] ⚠️  ${new Date().toISOString()} — ${outCount} out-of-stock, ${lowCount} low-stock`);
    products.forEach(p =>
      console.log(`  ${p.alert_type === 'out_of_stock' ? '🚫' : '⚠️ '} [${p.sku}] ${p.name} — qty: ${p.current_qty} (reorder at: ${p.reorder_point}) @ ${p.warehouse_name}`)
    );

    // Send email only if EMAIL_USER is configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendAlertEmail(products);
      console.log(`[alert-cron] 📧 Alert email sent to ${process.env.ALERT_EMAIL || process.env.EMAIL_USER}`);
    } else {
      console.log(`[alert-cron] ℹ️  EMAIL_USER/EMAIL_PASS not set — skipping email, logged above`);
    }
  } catch (err) {
    console.error('[alert-cron] ❌ Error running stock check:', err.message);
  }
}

// ─────────────────────────────────────────────────────────
// Schedule: every 30 minutes
// Change to '*/5 * * * *' for every 5 min in dev/testing
// ─────────────────────────────────────────────────────────
function startAlertCron() {
  const schedule = process.env.ALERT_CRON_SCHEDULE || '*/30 * * * *';

  cron.schedule(schedule, runLowStockCheck, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log(`[alert-cron] 🕐 Low-stock alert cron scheduled: "${schedule}"`);

  // Run once immediately on startup so you see results right away
  runLowStockCheck();
}

module.exports = { startAlertCron, runLowStockCheck };
