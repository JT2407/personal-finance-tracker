# Personal Finance Tracker (Backend)

A local, experimental finance tracker backend built with **Node.js**, **Express**, and
**JSON-file persistence** — no external databases, no payment walls, and strictly no UI.

## Features

- **REST API** over HTTP with a consistent response envelope.
- **Accounts** (checking / savings / credit / cash) with running balances.
- **Categories** (income / expense / transfer) with optional parent hierarchies.
- **Transactions** — income, expense and transfers that automatically update account balances.
- **Budgets** with `spent` derived live from the transaction ledger.
- **Reports** — overview, monthly, category breakdown and budget-vs-actual.
- **Atomic, crash-safe JSON persistence** (temp-file + rename) with a serialised write queue.
- Fully **modular**: new features dock in via a service + controller + router mount.

## Requirements

- Node.js v18+ (v24 recommended). No other runtime dependencies beyond `express`.

## Setup

```bash
npm install
```

## Run the server

```bash
npm start
# listening on http://127.0.0.1:3000
```

## Seed demo data (optional)

```bash
npm run seed
```

Or set `SEED_ON_BOOT=true` to seed automatically on startup. Seeding is idempotent
(no-op when accounts already exist).

## Run the tests

```bash
npm test
```

## Configuration

Environment variables:

| Variable      | Default            | Purpose                                |
| ------------- | ------------------ | -------------------------------------- |
| `PORT`        | `3000`             | HTTP listen port                       |
| `HOST`        | `127.0.0.1`        | Bind host                              |
| `DATA_DIR`    | `./data`           | Where the JSON files live              |
| `SEED_ON_BOOT`| `false`            | `"true"` seeds demo data at boot       |

## Response envelope

Every endpoint returns `{ success, data }` on success or
`{ success: false, error: { code, message, details? } }` on failure.

## API Reference

- `GET /api/health` — liveness
- `GET /api/accounts` — list (`?activeOnly=true`)
- `GET /api/accounts/:id`
- `POST /api/accounts` — `{ name, type?, currency?, initialBalance?, isActive? }`
- `PUT /api/accounts/:id`
- `DELETE /api/accounts/:id` (soft-deactivates if the account has transactions)

- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories` — `{ name, type?, description?, parentId?, isActive? }`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id` (blocked while referenced)

- `GET /api/transactions` — filters `?accountId=&categoryId=&type=&dateFrom=&dateTo=`
- `GET /api/transactions/:id`
- `POST /api/transactions`
  - income/expense: `{ type, accountId, amount, categoryId?, description?, date? }`
  - transfer: `{ type: 'transfer', fromAccountId, toAccountId, amount, description?, date? }`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

- `GET /api/budgets`
- `GET /api/budgets/:id`
- `POST /api/budgets` — `{ categoryId, limit, period?, month? }`
- `PUT /api/budgets/:id`
- `DELETE /api/budgets/:id`

- `GET /api/reports/overview`
- `GET /api/reports/monthly?month=YYYY-MM`
- `GET /api/reports/categories?from=YYYY-MM-DD&to=YYYY-MM-DD`
- `GET /api/reports/budget-vs-actual?month=YYYY-MM`

## Money & ledger rules

- Amounts are stored as **strictly positive** numbers; sign is implied by `type`.
- Balances update automatically when a transaction is created, updated or deleted.
- Transfers require two distinct, active accounts with the **same currency**.
- Deleting an account with transactions soft-deactivates it instead of hard-deleting.
- Floating-point drift is avoided by rounding money to two decimal places.

## Project layout

```
app.js                  # bootstrap (load store, seed, start server, graceful shutdown)
src/
  config.js             # central configuration
  errors.js             # AppError hierarchy + factory
  core/
    express-app.js      # middleware pipeline + route mounting
    response.js         # response envelope helpers
  middleware/           # logger, async-handler, error-handler
  models/               # validation + document builders (account/category/transaction/budget)
  services/             # business logic + invariants
  controllers/          # Express routers
  storage/
    storage.js          # atomic JSON store (cache, write queue, flush)
    schemas.js          # collection registry
    seed.js / seed-data.js
  utils/                # id, validate, json, date
test/                   # node:test suites
data/                   # runtime JSON (gitignored)
```
