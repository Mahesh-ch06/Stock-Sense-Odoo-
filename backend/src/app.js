const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ─── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────
app.use('/auth',      require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/products',  require('./routes/products'));
app.use('/receipts',  require('./routes/receipts'));
app.use('/deliveries',require('./routes/deliveries'));
app.use('/ledger',    require('./routes/ledger'));

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'StockSense API' }));

// ─── 404 handler ──────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ─── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 StockSense API running on port ${PORT}`));

module.exports = app;
