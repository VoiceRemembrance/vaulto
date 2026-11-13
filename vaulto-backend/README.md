# Vaulto Backend

FastAPI backend for the Vaulto personal-finance tracker.

## Requirements
- Python 3.11 or newer
- pip

## Setup (Windows PowerShell)

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

If PowerShell blocks activation, run this once in the current terminal:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Open:
- API root: http://127.0.0.1:8000/
- Interactive API docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

The starter uses SQLite locally to avoid requiring a local database installation.
For deployment, use PostgreSQL and set `DATABASE_URL` to your hosted PostgreSQL connection string.

## Main endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/guest`
- `GET /api/auth/me`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/configuration`
- `PUT /api/categories/{category_id}`
- `PATCH /api/categories/{category_id}/archive`
- `PATCH /api/categories/{category_id}/restore`
- `GET /api/categories/archived`
- `GET /api/transactions`
- `POST /api/transactions`
- `DELETE /api/transactions/{transaction_id}`
- `GET /api/dashboard/summary?month=YYYY-MM`
- `GET /api/analytics/monthly?month=YYYY-MM`

For protected endpoints, click **Authorize** in `/docs` and enter:
`Bearer YOUR_ACCESS_TOKEN`

## Transaction model
Income uses the special `income` category. Every other transaction submits a `category_id` from the authenticated user's active categories. Categories have a type (`expense` or `contribution`); amounts must be positive and a removal subtracts from that category's net monthly amount. Category names are snapshots on newly recorded transactions, so renaming does not change those transaction labels.

## Database schema updates
Startup runs the versioned additive migration `001_dynamic_categories` before serving requests. It adds stable category references and transaction name/type snapshots, backfills category IDs where an existing category key provides an unambiguous match, and copies legacy allocation values into missing category records. It preserves transaction rows and leaves the old `user_settings` table untouched for data retention; the application no longer models or reads its fixed fields. New accounts create their own categories in Settings. The migration does not fabricate historical monthly configurations. A `category_month_snapshots` record is captured for the current month as categories are used or changed; snapshots for completed months are immutable. If no historical snapshot exists, monthly analytics reports that configuration as unavailable instead of using today's settings.

`Base.metadata.create_all` remains in place for newly added tables. Existing user settings and transaction data are retained; the legacy settings API remains for compatibility, while category management uses `/api/categories`.

## Important
This is an initial development backend. Before public launch, add database migrations (Alembic), rate limiting, email verification/password reset if needed, stronger production secret management, and automated tests. Do not commit `.env` or real credentials.
