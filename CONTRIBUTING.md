# StockSense — Contribution Guidelines

## ⚡ Core Rule: Commit Every Hour
Every team member must:
- ✅ Commit their own code **at least once every 1 hour**
- ✅ Use **meaningful commit messages** (see format below)
- ✅ Push their changes to the remote repository
- ✅ Ensure the **latest working code is always on `main`**

> Individual commits are used to track each member's contribution. Committing infrequently or with vague messages will make your work invisible.

---

## 🌿 Branching Strategy

```
main                    ← always deployable, always working
└── dev                 ← integration branch (merge here first)
    ├── feat/auth       ← feature branches (one per feature/task)
    ├── feat/receipts
    ├── feat/dashboard
    ├── fix/ledger-query
    └── ...
```

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code only. Merge from `dev` after review. |
| `dev` | Working integration branch. All features merge here first. |
| `feat/<name>` | Your personal feature branch. Branch off `dev`. |
| `fix/<name>` | Bug fix branches. Branch off `dev`. |

### Starting a new task
```bash
git checkout dev
git pull origin dev
git checkout -b feat/your-feature-name
```

### Finishing a task
```bash
git add .
git commit -m "feat(receipts): add validate endpoint with row locking"
git push origin feat/your-feature-name
# Then open a Pull Request → dev
```

---

## 📝 Commit Message Format

Use this format for every commit:

```
<type>(<scope>): <short description>
```

### Types
| Type | When to use |
|------|------------|
| `feat` | Adding a new feature |
| `fix` | Fixing a bug |
| `schema` | Database migration / model change |
| `api` | New or updated API endpoint |
| `ui` | Frontend screen or component |
| `refactor` | Code restructure (no behavior change) |
| `docs` | Documentation only |
| `chore` | Config, deps, tooling |

### Scopes (StockSense-specific)
`auth` · `dashboard` · `products` · `warehouses` · `receipts` · `deliveries` · `transfers` · `adjustments` · `ledger` · `alerts` · `db`

### Examples
```bash
# Good ✅
git commit -m "feat(receipts): add POST /receipts with optional inline lines"
git commit -m "schema(db): add unit_cost column to products table"
git commit -m "fix(deliveries): prevent negative stock on concurrent validate"
git commit -m "ui(dashboard): render KPI cards with low-stock badge"
git commit -m "api(ledger): add warehouse_id and type filters to GET /ledger"
git commit -m "feat(auth): implement OTP request and verify flow"

# Bad ❌
git commit -m "update"
git commit -m "fix"
git commit -m "changes"
git commit -m "wip"
git commit -m "asdfgh"
```

---

## 🔄 Daily Workflow

```bash
# Start of session — sync with team
git checkout dev
git pull origin dev
git checkout feat/your-branch
git merge dev          # bring in latest team changes

# Every ~1 hour — commit your progress
git add .
git commit -m "feat(receipts): implement receipt list with status filter"
git push origin feat/your-branch

# When your task is complete — open a PR to dev
# Get at least one teammate to review before merging
```

---

## 🚫 Rules

1. **Never force-push to `main` or `dev`**
2. **Never commit directly to `main`** — always go through a PR
3. **Don't commit broken code** — if your branch is WIP, at least make sure it compiles/runs
4. **One feature per branch** — don't mix unrelated changes
5. **Pull before you push** — always sync with the remote first to avoid conflicts

---

## 🗂️ What Counts as "Your Contribution"

Contributions are tracked by **Git commit author**. Make sure your Git identity is set correctly:

```bash
git config --global user.name "Your Full Name"
git config --global user.email "your@email.com"

# Verify
git config --list | grep user
```

If your commits show the wrong name, your work won't be credited to you.
