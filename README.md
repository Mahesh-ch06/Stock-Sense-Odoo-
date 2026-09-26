# StockSense — Modern Warehouse & Inventory Management System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An enterprise-grade inventory and warehouse management system designed after Odoo's double-entry inventory principles. **StockSense** guarantees transactional consistency, complete traceability, concurrency safety, and real-time stock ledger auditing.

---

## 🌟 Key Features & Capabilities

- **Double-Entry Stock Ledger**: Every inventory adjustment, receipt, delivery, and internal transfer produces an immutable record in `stock_ledger` with signed deltas. Stock is never arbitrarily overwritten.
- **Pessimistic Row-Locking Concurrency**: Validating operations locks rows (`SELECT ... FOR UPDATE`) inside atomic database transactions (`BEGIN` ... `COMMIT`), preventing race conditions, double-allocations, and negative stock.
- **Comprehensive Warehouse & Location Hierarchy**: Manage multiple storage facilities, zones, aisles, and bins with validation rules preventing accidental deletion of occupied locations.
- **Cycle Count Adjustments**: Perform physical stock audits with real-time discrepancy calculation, variance tracking, and automated ledger balancing.
- **Automated Low-Stock Alerts**: A scheduled cron job (`node-cron`) inspects warehouse stock against `reorder_point` thresholds and dispatches HTML email notifications via `nodemailer`.
- **Full Operational Workflows**:
  - **Receipts**: Inbound supplier orders with staged line validation (`draft` → `ready` → `done`).
  - **Deliveries**: Outbound customer dispatches with automated stock availability checks.
  - **Internal Transfers**: Stock relocations between warehouses and specific bins.
  - **Catalog Management**: Product SKUs, categories, units of measure, costs, and dynamic on-hand stock aggregations.
- **Modern Dark UI**: Built with React, React Router, Vite, and custom CSS design system featuring animated metrics, responsive tables, and instant modal interactions.

---

## 🏗️ Architecture & Tech Stack

```
Stock-Sense-Odoo/
├── backend/
│   ├── src/
│   │   ├── config/db.js           # PostgreSQL connection pool (pg)
│   │   ├── middleware/auth.js     # JWT authentication & role-based access control
│   │   ├── jobs/alertCron.js      # Low-stock alert scheduler & email notifier
│   │   ├── routes/                # Express API route handlers
│   │   │   ├── auth.js            # Signup, login, password reset OTP
│   │   │   ├── products.js        # Product catalog & stock queries
│   │   │   ├── warehouses.js      # Warehouse & location management
│   │   │   ├── receipts.js        # Inbound receipt documents & validation
│   │   │   ├── deliveries.js      # Outbound delivery dispatches & validation
│   │   │   ├── transfers.js       # Internal stock transfers & validation
│   │   │   ├── adjustments.js     # Physical stock cycle count reconciliations
│   │   │   ├── ledger.js          # Immutable stock ledger audit log
│   │   │   └── dashboard.js       # KPI metrics & quick stats
│   │   └── app.js                 # Express server bootstrap
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api.js                 # Axios client with auth interceptor
│   │   ├── components/            # Layout, Sidebar, PrivateRoute, StatusBadge
│   │   ├── pages/                 # React views (Dashboard, Products, Receipts,
│   │   │                          #   Deliveries, Transfers, Adjustments, Warehouses,
│   │   │                          #   Ledger, Login, Signup, ForgotPassword)
│   │   ├── App.jsx                # Router configuration
│   │   └── index.css              # Custom dark-theme design tokens & utilities
│   └── package.json
└── system_design.md               # Core database architecture & schema design
```

---

## 🗄️ Database Schema Overview

PostgreSQL 18 database with 14 normalized tables and indexes:

| Table | Description |
|---|---|
| `users` | User credentials, roles (`admin`, `manager`, `staff`), and contact info |
| `warehouses` | Facilities and storage hubs |
| `locations` | Specific zones, aisles, and bin locations within warehouses |
| `categories` | Product classification tree |
| `products` | SKU, name, unit cost, unit of measure, reorder thresholds |
| `stock_levels` | Current cached on-hand quantities per `(product_id, location_id)` |
| `stock_ledger` | Immutable log of all stock movements with signed deltas |
| `receipts` & `receipt_lines` | Inbound vendor shipments |
| `deliveries` & `delivery_lines` | Outbound customer shipments |
| `transfers` & `transfer_lines` | Internal relocations between locations |
| `adjustments` | Cycle count physical reconciliation audit records |
| `password_resets` | OTP verification for secure password recovery |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** (v14+)
- **Git**

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
```

Ensure your `.env` contains:
```ini
PORT=5000
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/stocksense
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
ALERT_EMAIL=manager@yourcompany.com
ALERT_CRON_SCHEDULE="*/30 * * * *"
```

Start the backend:
```bash
npm run dev
# Running on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 📡 API Reference

### Authentication
- `POST /auth/signup` — Register staff / manager account
- `POST /auth/login` — Authenticate and receive JWT
- `POST /auth/forgot-password` — Generate & send reset OTP
- `POST /auth/reset-password` — Verify OTP and reset password

### Inventory & Stock
- `GET /products` — List catalog with aggregated on-hand quantities
- `POST /products` — Create new SKU
- `PATCH /products/:id` — Update SKU details
- `DELETE /products/:id` — Remove SKU
- `GET /ledger` — Query immutable movement history

### Warehouses & Locations
- `GET /warehouses` — List warehouses with location counts
- `POST /warehouses` — Create warehouse (auto-provisions default location)
- `PATCH /warehouses/:id` — Update warehouse info
- `GET /warehouses/:id/locations` — List locations in warehouse
- `POST /warehouses/:id/locations` — Add storage bin/location
- `DELETE /warehouses/:id/locations/:locId` — Delete location (prevents deletion if stock > 0)

### Operations
- `GET /receipts` & `POST /receipts` — Inbound orders
- `POST /receipts/:id/validate` — Atomic receipt validation (writes ledger, increments stock)
- `GET /deliveries` & `POST /deliveries` — Outbound dispatches
- `POST /deliveries/:id/validate` — Atomic delivery validation (checks stock, decrements stock)
- `GET /transfers` & `POST /transfers` — Internal transfers
- `POST /transfers/:id/validate` — Relocate inventory atomically between locations
- `GET /adjustments` & `POST /adjustments` — Physical count reconciliation with delta tracking

---

## 🤝 Contributing & Git Workflow

This project adheres strictly to trunk-based feature branching:
```
feature/branch  ──(PR/Merge)──>  dev  ──(Reviewed)──>  main
```
See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License
This project is licensed under the MIT License.
