StockSense — System Design

Based on the PDF: a modular Inventory Management System (IMS) for Inventory Managers and Warehouse Staff, replacing manual/Excel tracking with real-time stock operations (Receipts, Deliveries, Internal Transfers, Adjustments) plus a KPI dashboard.

1. Requirements

Functional

Auth: signup/login, OTP-based password reset
Dashboard: KPIs (stock levels, low/out-of-stock, pending receipts/deliveries, scheduled transfers) + dynamic filters (doc type, status, warehouse, category)
Product management: CRUD, SKU/code, category, UoM, reorder rules, per-location stock
Receipts (incoming): supplier + products + quantities → validate → stock +
Delivery Orders (outgoing): pick → pack → validate → stock −
Internal Transfers: move stock between locations, no net change, logged
Stock Adjustments: reconcile counted vs. recorded, auto-log
Move History / Stock Ledger: append-only log of every stock-affecting event
Multi-warehouse support, low-stock alerts, SKU search/filters

Non-functional (assumed — worth confirming)

Small-to-mid scale: single business or a few warehouses, tens of concurrent users, not multi-tenant SaaS yet
Correctness of stock counts matters more than raw throughput — this is a ledger system, not a high-QPS system
Needs to run on modest infra/budget (likely a student/portfolio-to-production project)

Constraints (assumed from your stack history) — you've built ReceiptFlow and MeriSadak on React Native + Node.js, and Rewear on MERN. I'll default to a Node.js/Express + PostgreSQL + React (web) or React Native (mobile) stack, but the design below is stack-agnostic where it matters. Flag if StockSense should be web, mobile, or both.

2. High-Level Design
┌─────────────┐      ┌──────────────────┐      ┌───────────────┐
│  Client(s)  │◄────►│   API Gateway /   │◄────►│  PostgreSQL    │
│ Web / React │      │   Express API     │      │  (relational,  │
│ Native app  │      │   (REST, JWT auth)│      │  ledger-friendly)│
└─────────────┘      └─────────┬─────────┘      └───────────────┘
                                │
                       ┌────────┴────────┐
                       │  Background jobs │  (low-stock alerts,
                       │  (cron / queue)  │   OTP email/SMS)
                       └─────────────────┘

Why relational (Postgres) over MongoDB here: stock movements need atomic, consistent updates (receipt validate → stock+, delivery validate → stock−, transfer → two-sided location change) and the "Stock Ledger" is inherently a transaction log. Postgres gives you row-level locking and multi-statement transactions to prevent race conditions (e.g., two warehouse staff validating deliveries for the same SKU simultaneously). MongoDB can do this with multi-document transactions, but it's fighting the tool. This is the one place I'd push back on defaulting to Mongo even though your other projects use it.

3. Data Model (core tables)
users (id, name, email, password_hash, role: manager/staff, phone)
warehouses (id, name, address)
locations (id, warehouse_id, name/rack code) — for sub-warehouse granularity like "Rack A"
products (id, sku, name, category_id, unit_of_measure, reorder_point, reorder_qty, unit_cost) — unit_cost added for the Stock List view display
categories (id, name)
stock_levels (product_id, location_id, quantity) — the current-state cache, always derived from ledger
stock_ledger (id, product_id, location_id, delta, type: receipt/delivery/transfer/adjustment, ref_doc_id, created_by, created_at) — append-only, source of truth
receipts (id, supplier, status: draft/waiting/ready/done/canceled/backorder, created_by, warehouse_id) — backorder status covers partial receipt where qty_received < qty_expected
receipt_lines (receipt_id, product_id, qty_expected, qty_received)
delivery_orders (id, customer/sales_order_ref, status: draft/picking/packing/ready/done/canceled/backorder, warehouse_id) — multi-step flow: pick → pack → validate matches the UI flow shown in wireframe
delivery_lines (delivery_id, product_id, qty)
transfers (id, from_location_id, to_location_id, status)
transfer_lines (transfer_id, product_id, qty)
adjustments (id, product_id, location_id, counted_qty, system_qty_at_time, created_by)

Key design decision: stock_levels is a materialized/cached table, but stock_ledger is the real source of truth. Every operation (receipt validate, delivery validate, transfer, adjustment) writes a ledger row inside a DB transaction and updates stock_levels in the same transaction. This gives you both fast reads (dashboard KPIs) and an auditable trail, and lets you rebuild stock_levels from the ledger if it ever drifts.

4. API Contracts (representative)
POST   /auth/signup
POST   /auth/login
POST   /auth/otp/request
POST   /auth/otp/verify

GET    /dashboard/kpis?warehouse_id=
GET    /products?category=&search=
POST   /products
PATCH  /products/:id

# Warehouses & Locations (added — wireframe has warehouse settings modal)
GET    /warehouses
POST   /warehouses
PATCH  /warehouses/:id
GET    /warehouses/:id/locations
POST   /warehouses/:id/locations
PATCH  /warehouses/:id/locations/:locId

POST   /receipts                    # create draft; optionally accepts { supplier, warehouse_id, lines: [{product_id, qty_expected}] } in one call for simpler UX
PATCH  /receipts/:id/lines          # add/update products/qty on existing draft
POST   /receipts/:id/validate       # atomic: stock+, ledger write, status=done (or backorder if partial)

POST   /deliveries
PATCH  /deliveries/:id/status       # advance through picking → packing → ready
POST   /deliveries/:id/validate     # atomic: stock-, ledger write, status=done (or backorder if partial)

POST   /transfers
POST   /transfers/:id/validate      # atomic: two-sided stock move, ledger write

POST   /adjustments                 # atomic: reconcile, ledger write

GET    /ledger?product_id=&location_id=&warehouse_id=&type=receipt|delivery|transfer|adjustment&from=&to=
# type and warehouse_id filters added — required for Move History screen filters shown in wireframe

Every /validate endpoint is the critical path — each must run inside a single DB transaction: check current stock (for deliveries/transfers, prevent negative stock), write ledger entries, update stock_levels, update document status. If any step fails, roll back everything.

5. Deep Dive: the validate flow (this is where bugs live)

For a Delivery validate:

Begin transaction
Lock the relevant stock_levels rows (SELECT ... FOR UPDATE)
Check quantity >= qty_requested for each line — reject if insufficient stock
Insert stock_ledger rows (negative delta)
Update stock_levels
Update delivery_orders.status = 'done'
Commit

This row-locking is what prevents two staff members from both "validating" a delivery for the last 5 units of a SKU and ending up at −5 stock. It's the single most important correctness guarantee in the whole system.

6. Alerts & background work

Low-stock alerts don't need to be real-time-pushed — a scheduled job (every few minutes, or triggered right after any stock-decreasing ledger write) comparing stock_levels.quantity against products.reorder_point and firing a notification (email/in-app) is sufficient and much simpler than a pub/sub setup.

7. Trade-offs to revisit as it grows
Decision	Fine for now	Revisit when
Postgres single instance	✅	Multiple warehouses across regions need low-latency local writes → consider read replicas
Synchronous validate (no queue)	✅	High-volume receiving (100s/min) → move validation to a queue with idempotent workers
stock_levels as cache table	✅	Ledger grows huge → periodically snapshot/checkpoint instead of full replay
Single Express monolith	✅	Team grows or you need independent scaling of, say, the alerting job → split into services
8. What I'd want confirmed
Web app, mobile app, or both?
Single business/single warehouse to start, or multi-tenant from day one?
Any integration needs (e.g., accounting software, barcode scanners)?