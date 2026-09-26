# 🖥️ StockSense — Frontend Task Assignment

> **Assigned to:** _(teammate name)_
> **Branch:** `feat/ui-frontend`
> **Base branch:** `dev`
> **Stack:** React (Vite) + React Router + Axios

---

## 📋 Before You Start

### 1. Clone & setup
```bash
git clone https://github.com/Mahesh-ch06/Stock-Sense-Odoo-.git
cd Stock-Sense-Odoo-
git checkout dev
git pull origin dev
git checkout -b feat/ui-frontend
git push -u origin feat/ui-frontend
```

### 2. Install & run frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

### 3. Set up the API base URL
Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5000
```

Use in code:
```js
const API = import.meta.env.VITE_API_URL;
```

---

## 🗂️ Screens to Build

Build these screens in order — each maps to a backend API that's already working.

---

### 1. 🔐 Auth Screens
**Files:** `src/pages/Login.jsx`, `src/pages/Signup.jsx`, `src/pages/ForgotPassword.jsx`

| Screen | API Call |
|--------|---------|
| Login | `POST /auth/login` → save token to localStorage |
| Signup | `POST /auth/signup` |
| Forgot Password | `POST /auth/otp/request` → `POST /auth/otp/verify` |

**Notes:**
- After login, store `token` and `user` in localStorage
- All other pages need the token in headers: `Authorization: Bearer <token>`
- Redirect to `/dashboard` after successful login

---

### 2. 📊 Dashboard
**File:** `src/pages/Dashboard.jsx`

**API:** `GET /dashboard/kpis`

**KPI cards to show:**
- Total Products
- Low Stock (yellow badge)
- Out of Stock (red badge)
- Pending Receipts
- Pending Deliveries
- Pending Transfers
- Backorders

**Notes:**
- Match the wireframe layout — cards with counts and status badges
- Add a warehouse filter dropdown at the top (`?warehouse_id=`)

---

### 3. 📦 Products
**Files:** `src/pages/Products.jsx`

**APIs:**
- `GET /products?search=&category=` — list with search bar
- `POST /products` — add product form
- `PATCH /products/:id` — edit
- `DELETE /products/:id` — delete

**Table columns:** SKU, Name, Category, Unit, Unit Cost, On-Hand Stock, Reorder Point

---

### 4. 📥 Receipts
**Files:** `src/pages/Receipts.jsx`, `src/pages/ReceiptDetail.jsx`

**APIs:**
- `GET /receipts` — list (filter by status)
- `GET /receipts/:id` — detail with lines
- `POST /receipts` — create with inline lines
- `POST /receipts/:id/validate` — validate button

**Notes:**
- Validate button → disable immediately on click → show loading → show result
- Show error clearly if validation fails (e.g. "No location found")
- Status badge colors: `draft`=gray, `waiting`=blue, `ready`=orange, `done`=green, `backorder`=yellow, `canceled`=red

---

### 5. 🚚 Deliveries
**Files:** `src/pages/Deliveries.jsx`, `src/pages/DeliveryDetail.jsx`

**APIs:**
- `GET /deliveries` — list
- `GET /deliveries/:id` — detail with lines + available stock shown per line
- `POST /deliveries` — create
- `PATCH /deliveries/:id/status` — advance status (picking → packing → ready)
- `POST /deliveries/:id/validate` — final validate

**Notes:**
- Show the multi-step status flow visually (e.g. a stepper: Draft → Picking → Packing → Ready → Done)
- Show available stock next to each line's requested qty — warn if insufficient

---

### 6. 🔄 Transfers
**Files:** `src/pages/Transfers.jsx`, `src/pages/TransferDetail.jsx`

**APIs:**
- `GET /transfers` — list
- `GET /transfers/:id` — detail
- `POST /transfers` — create (select from_location and to_location)
- `POST /transfers/:id/validate` — validate

---

### 7. 📋 Move History (Ledger)
**File:** `src/pages/Ledger.jsx`

**API:** `GET /ledger?product_id=&location_id=&warehouse_id=&type=&from=&to=`

**Filters to expose:**
- Product (search)
- Type (receipt / delivery / transfer / adjustment) — dropdown
- Date range (from / to)

**Table columns:** Date, Product, SKU, Location, Delta (+/-), Type, Done By

---

## 🎨 Design Notes (from wireframe)

- **Dark mode** — dark background, red/accent highlights
- **Odoo-inspired layout** — sidebar nav + top bar + content area
- Status badges must be **color-coded** (see Receipts notes above)
- Tables should have **search + filter** at top
- Validate button should be **prominent** and have a loading/disabled state

---

## 🌿 Git Workflow — Your Rules

```bash
# Start
git checkout dev && git pull origin dev
git checkout feat/ui-frontend

# Every 30 min or after each screen is done:
git add .
git commit -m "ui(dashboard): build KPI cards with status badges"
git push origin feat/ui-frontend

# When all screens done → open PR to dev
```

**Commit message format:** `ui(<screen>): <what you did>`

Examples:
```
ui(auth): add login and signup screens
ui(dashboard): render KPI cards
ui(receipts): add receipt list with status filter
ui(deliveries): implement validate flow with stepper
```

---

## 🔌 API Quick Reference

Base URL: `http://localhost:5000`

All requests (except auth) need header:
```
Authorization: Bearer <token>
```

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /auth/login`, `/signup`, `/otp/request`, `/otp/verify` |
| Dashboard | `GET /dashboard/kpis` |
| Products | `GET/POST /products`, `PATCH/DELETE /products/:id` |
| Receipts | `GET/POST /receipts`, `GET /receipts/:id`, `POST /receipts/:id/validate` |
| Deliveries | `GET/POST /deliveries`, `PATCH /deliveries/:id/status`, `POST /deliveries/:id/validate` |
| Transfers | `GET/POST /transfers`, `POST /transfers/:id/validate` |
| Ledger | `GET /ledger?filters...` |

---

## ✅ Done when

- [ ] All 7 screens built and wired to the API
- [ ] Auth flow works (login → dashboard redirect)
- [ ] Validate buttons work correctly and handle errors
- [ ] Basic responsive layout
- [ ] PR opened to `dev`
