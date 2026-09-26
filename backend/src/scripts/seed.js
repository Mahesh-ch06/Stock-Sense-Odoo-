/**
 * StockSense Automated Database Seeder
 * Populates realistic enterprise demo data across all tables:
 * - Users (manager & staff with hashed passwords)
 * - Warehouses & Locations
 * - Product Categories & Products (various stock levels: healthy, low-stock, out-of-stock)
 * - Initial Stock Levels & matching immutable Stock Ledger movements
 * - Inbound Receipts (various statuses: done, ready, waiting)
 * - Outbound Deliveries (various statuses: done, ready, picking)
 * - Internal Transfers & Stock Reconciliations
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/db');

async function seed() {
  const isFresh = process.argv.includes('--fresh');
  console.log(`\n🌱 Starting StockSense Database Seeding... ${isFresh ? '(--fresh mode: resetting data)' : ''}\n`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (isFresh) {
      console.log('🧹 Truncating existing transactional and master data...');
      await client.query(`
        TRUNCATE TABLE
          adjustments,
          transfer_lines,
          transfers,
          delivery_lines,
          delivery_orders,
          receipt_lines,
          receipts,
          stock_ledger,
          stock_levels,
          products,
          categories,
          locations,
          warehouses,
          users
        RESTART IDENTITY CASCADE;
      `);
    }

    // ─────────────────────────────────────────
    // 1. SEED USERS
    // ─────────────────────────────────────────
    console.log('👤 Seeding default users...');
    const passwordHash = await bcrypt.hash('StockSense2026!', 10);

    const usersData = [
      { name: 'Sarah Connor', email: 'manager@stocksense.com', role: 'manager', phone: '+1-555-0199' },
      { name: 'Dave Miller',  email: 'staff@stocksense.com',   role: 'staff',   phone: '+1-555-0144' },
      { name: 'Nikhil Admin', email: 'admin@stocksense.com',   role: 'manager', phone: '+1-555-0100' },
    ];

    const usersMap = {};
    for (const u of usersData) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           password_hash = EXCLUDED.password_hash
         RETURNING id, email, role;`,
        [u.name, u.email, passwordHash, u.role, u.phone]
      );
      usersMap[u.email] = res.rows[0];
    }
    const defaultManager = usersMap['manager@stocksense.com'] || usersMap[Object.keys(usersMap)[0]];
    const defaultStaff = usersMap['staff@stocksense.com'] || defaultManager;

    // ─────────────────────────────────────────
    // 2. SEED WAREHOUSES & LOCATIONS
    // ─────────────────────────────────────────
    console.log('🏢 Seeding warehouses and storage locations...');
    const warehousesData = [
      {
        name: 'Central Logistics Hub',
        address: '100 Industrial Parkway, Sector 4, Chicago, IL',
        locations: [
          'Rack A - High Velocity',
          'Rack B - Pallet Storage',
          'Bin C-10 - Small Parts',
          'Receiving Bay 1',
          'Dispatch Staging 1',
        ],
      },
      {
        name: 'West Coast Fulfillment',
        address: '75 Harbor Logistics Blvd, Pier 3, Oakland, CA',
        locations: [
          'Zone 1 - Bulk Storage',
          'Zone 2 - Cold Storage',
          'Packing Station 2',
        ],
      },
    ];

    const locationIds = [];
    let primaryLocationId = null;
    let secondaryLocationId = null;

    for (const wh of warehousesData) {
      // Find or insert warehouse
      let whRes = await client.query('SELECT id FROM warehouses WHERE name = $1', [wh.name]);
      let whId;
      if (whRes.rows.length === 0) {
        const insertWh = await client.query(
          'INSERT INTO warehouses (name, address) VALUES ($1, $2) RETURNING id',
          [wh.name, wh.address]
        );
        whId = insertWh.rows[0].id;
      } else {
        whId = whRes.rows[0].id;
      }

      for (const locName of wh.locations) {
        let locRes = await client.query(
          'SELECT id FROM locations WHERE warehouse_id = $1 AND name = $2',
          [whId, locName]
        );
        let locId;
        if (locRes.rows.length === 0) {
          const insertLoc = await client.query(
            'INSERT INTO locations (warehouse_id, name) VALUES ($1, $2) RETURNING id',
            [whId, locName]
          );
          locId = insertLoc.rows[0].id;
        } else {
          locId = locRes.rows[0].id;
        }
        locationIds.push(locId);
        if (!primaryLocationId) primaryLocationId = locId;
        else if (!secondaryLocationId) secondaryLocationId = locId;
      }
    }

    // ─────────────────────────────────────────
    // 3. SEED CATEGORIES
    // ─────────────────────────────────────────
    console.log('🏷️  Seeding product categories...');
    const categories = ['Electronics', 'Furniture', 'Raw Materials', 'Industrial Equipment', 'Packaging & Consumables'];
    const categoryMap = {};

    for (const catName of categories) {
      const res = await client.query(
        `INSERT INTO categories (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [catName]
      );
      categoryMap[catName] = res.rows[0].id;
    }

    // ─────────────────────────────────────────
    // 4. SEED PRODUCTS
    // ─────────────────────────────────────────
    console.log('📦 Seeding catalog products (healthy, low-stock & out-of-stock items)...');
    const productsData = [
      {
        sku: 'FURN-CHR-001',
        name: 'Ergonomic Mesh Office Chair',
        category: 'Furniture',
        unit: 'pcs',
        cost: 149.99,
        reorder_point: 10,
        reorder_qty: 25,
        target_qty: 45, // Healthy
      },
      {
        sku: 'FURN-DSK-002',
        name: 'Dual-Motor Standing Desk (140cm)',
        category: 'Furniture',
        unit: 'pcs',
        cost: 289.00,
        reorder_point: 8,
        reorder_qty: 15,
        target_qty: 4, // LOW STOCK (trigger alert)
      },
      {
        sku: 'ELEC-SCN-101',
        name: 'Wireless 2D Handheld Barcode Scanner',
        category: 'Electronics',
        unit: 'unit',
        cost: 65.50,
        reorder_point: 15,
        reorder_qty: 30,
        target_qty: 62, // Healthy
      },
      {
        sku: 'ELEC-BAT-088',
        name: 'Industrial Li-Ion Battery Pack 24V',
        category: 'Electronics',
        unit: 'unit',
        cost: 110.00,
        reorder_point: 12,
        reorder_qty: 20,
        target_qty: 0, // OUT OF STOCK (critical alert)
      },
      {
        sku: 'ELEC-PRN-202',
        name: 'Desktop Thermal Barcode Label Printer',
        category: 'Electronics',
        unit: 'unit',
        cost: 245.00,
        reorder_point: 5,
        reorder_qty: 10,
        target_qty: 18, // Healthy
      },
      {
        sku: 'IND-MOT-044',
        name: 'NEMA 23 High-Torque Stepper Motor',
        category: 'Industrial Equipment',
        unit: 'pcs',
        cost: 48.00,
        reorder_point: 20,
        reorder_qty: 40,
        target_qty: 8, // LOW STOCK (trigger alert)
      },
      {
        sku: 'IND-SNR-012',
        name: 'Optical Sensor Array 500mm',
        category: 'Industrial Equipment',
        unit: 'pcs',
        cost: 32.50,
        reorder_point: 10,
        reorder_qty: 25,
        target_qty: 35, // Healthy
      },
      {
        sku: 'RAW-ALU-2020',
        name: 'T-Slot Aluminum Profile 2020 (1 Meter)',
        category: 'Raw Materials',
        unit: 'bar',
        cost: 11.20,
        reorder_point: 50,
        reorder_qty: 100,
        target_qty: 120, // Healthy
      },
      {
        sku: 'PACK-LBL-500',
        name: 'Direct Thermal Shipping Labels (Roll of 500)',
        category: 'Packaging & Consumables',
        unit: 'roll',
        cost: 8.50,
        reorder_point: 40,
        reorder_qty: 100,
        target_qty: 220, // Healthy
      },
      {
        sku: 'PACK-BOX-100',
        name: 'Double-Wall Corrugated Shipping Box (Medium)',
        category: 'Packaging & Consumables',
        unit: 'box',
        cost: 2.15,
        reorder_point: 150,
        reorder_qty: 300,
        target_qty: 480, // Healthy
      },
    ];

    const seededProducts = [];

    for (const p of productsData) {
      const catId = categoryMap[p.category];
      const prodRes = await client.query(
        `INSERT INTO products (sku, name, category_id, unit_of_measure, unit_cost, reorder_point, reorder_qty)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (sku) DO UPDATE SET
           name = EXCLUDED.name,
           category_id = EXCLUDED.category_id,
           unit_of_measure = EXCLUDED.unit_of_measure,
           unit_cost = EXCLUDED.unit_cost,
           reorder_point = EXCLUDED.reorder_point,
           reorder_qty = EXCLUDED.reorder_qty
         RETURNING id, sku, name, reorder_point;`,
        [p.sku, p.name, catId, p.unit, p.cost, p.reorder_point, p.reorder_qty]
      );
      const product = prodRes.rows[0];
      seededProducts.push({ ...product, target_qty: p.target_qty });

      // ─────────────────────────────────────────
      // 5. SEED STOCK LEVELS & DOUBLE-ENTRY LEDGER
      // ─────────────────────────────────────────
      if (p.target_qty > 0) {
        await client.query(
          `INSERT INTO stock_levels (product_id, location_id, quantity)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id, location_id) DO UPDATE
           SET quantity = EXCLUDED.quantity;`,
          [product.id, primaryLocationId, p.target_qty]
        );

        // Immutable ledger record for initial stock count
        await client.query(
          `INSERT INTO stock_ledger (product_id, location_id, delta, type, created_by)
           VALUES ($1, $2, $3, 'receipt', $4);`,
          [product.id, primaryLocationId, p.target_qty, defaultManager.id]
        );
      }
    }

    // ─────────────────────────────────────────
    // 6. SEED REALISTIC WORKFLOW OPERATIONS
    // ─────────────────────────────────────────
    console.log('📋 Seeding receipts, deliveries, transfers, and cycle counts...');

    // Receipt 1 (Done)
    const rec1 = await client.query(
      `INSERT INTO receipts (supplier, status, warehouse_id, created_by)
       VALUES ('Global Logistics Supply Co', 'done', 1, $1) RETURNING id`,
      [defaultManager.id]
    );
    await client.query(
      `INSERT INTO receipt_lines (receipt_id, product_id, qty_expected, qty_received)
       VALUES ($1, $2, 45, 45), ($1, $3, 62, 62)`,
      [rec1.rows[0].id, seededProducts[0].id, seededProducts[2].id]
    );

    // Receipt 2 (Ready for validation)
    const rec2 = await client.query(
      `INSERT INTO receipts (supplier, status, warehouse_id, created_by)
       VALUES ('Apex Component Industries', 'ready', 1, $1) RETURNING id`,
      [defaultStaff.id]
    );
    await client.query(
      `INSERT INTO receipt_lines (receipt_id, product_id, qty_expected, qty_received)
       VALUES ($1, $2, 20, 0)`,
      [rec2.rows[0].id, seededProducts[3].id]
    );

    // Delivery 1 (Done)
    const del1 = await client.query(
      `INSERT INTO delivery_orders (reference, status, warehouse_id, created_by)
       VALUES ('SO-2026-9811 (Meridian Retail)', 'done', 1, $1) RETURNING id`,
      [defaultStaff.id]
    );
    await client.query(
      `INSERT INTO delivery_lines (delivery_id, product_id, qty)
       VALUES ($1, $2, 5), ($1, $3, 10)`,
      [del1.rows[0].id, seededProducts[0].id, seededProducts[4].id]
    );

    // Delivery 2 (Picking in progress)
    const del2 = await client.query(
      `INSERT INTO delivery_orders (reference, status, warehouse_id, created_by)
       VALUES ('SO-2026-9812 (Omni Tech Corp)', 'picking', 1, $1) RETURNING id`,
      [defaultStaff.id]
    );
    await client.query(
      `INSERT INTO delivery_lines (delivery_id, product_id, qty)
       VALUES ($1, $2, 12)`,
      [del2.rows[0].id, seededProducts[2].id]
    );

    // Internal Transfer (Done)
    if (primaryLocationId && secondaryLocationId) {
      const trf1 = await client.query(
        `INSERT INTO transfers (from_location_id, to_location_id, status, created_by)
         VALUES ($1, $2, 'done', $3) RETURNING id`,
        [primaryLocationId, secondaryLocationId, defaultStaff.id]
      );
      await client.query(
        `INSERT INTO transfer_lines (transfer_id, product_id, qty)
         VALUES ($1, $2, 10)`,
        [trf1.rows[0].id, seededProducts[4].id]
      );
    }

    // Physical Cycle-Count Adjustment
    await client.query(
      `INSERT INTO adjustments (product_id, location_id, counted_qty, system_qty_at_time, created_by)
       VALUES ($1, $2, 45, 43, $3);`,
      [seededProducts[0].id, primaryLocationId, defaultManager.id]
    );

    await client.query(
      `INSERT INTO stock_ledger (product_id, location_id, delta, type, created_by)
       VALUES ($1, $2, 2, 'adjustment', $3);`,
      [seededProducts[0].id, primaryLocationId, defaultManager.id]
    );

    await client.query('COMMIT');

    console.log('\n✅ Database Seeding Completed Successfully!\n');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('🔑 Demo User Accounts:');
    console.log('   - Manager : manager@stocksense.com  (Password: StockSense2026!)');
    console.log('   - Staff   : staff@stocksense.com    (Password: StockSense2026!)');
    console.log('   - Admin   : admin@stocksense.com    (Password: StockSense2026!)');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`📦 Seeded: 10 Products (${seededProducts.filter(p => p.target_qty <= p.reorder_point).length} at or below reorder threshold)`);
    console.log('🏢 Seeded: 2 Warehouses with 8 storage locations');
    console.log('📊 Seeded: Inbound receipts, delivery dispatches, transfers & ledger movements');
    console.log('─────────────────────────────────────────────────────────────\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
