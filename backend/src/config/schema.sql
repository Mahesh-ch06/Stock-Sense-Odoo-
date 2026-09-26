-- StockSense Database Schema
-- Run this file to initialize the database: psql -d stocksense -f schema.sql

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('manager', 'staff')),
  phone       VARCHAR(20),
  otp_code    VARCHAR(6),
  otp_expires_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- WAREHOUSES & LOCATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS warehouses (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id           SERIAL PRIMARY KEY,
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  name         VARCHAR(100) NOT NULL,  -- e.g. "Rack A", "Zone B"
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CATEGORIES & PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  sku            VARCHAR(100) UNIQUE NOT NULL,
  name           VARCHAR(200) NOT NULL,
  category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'unit',
  unit_cost      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reorder_point  INTEGER NOT NULL DEFAULT 0,
  reorder_qty    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- STOCK LEVELS (cache) + STOCK LEDGER (source of truth)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_levels (
  product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id  INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, location_id)
);

CREATE TABLE IF NOT EXISTS stock_ledger (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  delta       INTEGER NOT NULL,           -- positive = stock in, negative = stock out
  type        VARCHAR(20) NOT NULL CHECK (type IN ('receipt', 'delivery', 'transfer', 'adjustment')),
  ref_doc_id  INTEGER,                    -- FK to receipt/delivery/transfer/adjustment id
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- RECEIPTS (incoming)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS receipts (
  id           SERIAL PRIMARY KEY,
  supplier     VARCHAR(200) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','waiting','ready','done','canceled','backorder')),
  warehouse_id INTEGER REFERENCES warehouses(id),
  created_by   INTEGER REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipt_lines (
  id           SERIAL PRIMARY KEY,
  receipt_id   INTEGER NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products(id),
  qty_expected INTEGER NOT NULL DEFAULT 0,
  qty_received INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────
-- DELIVERY ORDERS (outgoing)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_orders (
  id              SERIAL PRIMARY KEY,
  reference       VARCHAR(200),             -- e.g. sales order ref
  status          VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','picking','packing','ready','done','canceled','backorder')),
  warehouse_id    INTEGER REFERENCES warehouses(id),
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_lines (
  id           SERIAL PRIMARY KEY,
  delivery_id  INTEGER NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  product_id   INTEGER NOT NULL REFERENCES products(id),
  qty          INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────
-- INTERNAL TRANSFERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfers (
  id               SERIAL PRIMARY KEY,
  from_location_id INTEGER NOT NULL REFERENCES locations(id),
  to_location_id   INTEGER NOT NULL REFERENCES locations(id),
  status           VARCHAR(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','ready','done','canceled')),
  created_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transfer_lines (
  id          SERIAL PRIMARY KEY,
  transfer_id INTEGER NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id),
  qty         INTEGER NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────
-- STOCK ADJUSTMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adjustments (
  id                 SERIAL PRIMARY KEY,
  product_id         INTEGER NOT NULL REFERENCES products(id),
  location_id        INTEGER NOT NULL REFERENCES locations(id),
  counted_qty        INTEGER NOT NULL,
  system_qty_at_time INTEGER NOT NULL,
  created_by         INTEGER REFERENCES users(id),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- INDEXES for common queries
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_location ON stock_ledger(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_type ON stock_ledger(type);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_created_at ON stock_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON delivery_orders(status);
