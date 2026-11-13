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
- `GET /api/transactions`
- `POST /api/transactions`
- `DELETE /api/transactions/{transaction_id}`
- `GET /api/dashboard/summary?month=YYYY-MM`
- `GET /api/analytics/monthly?months=6`

For protected endpoints, click **Authorize** in `/docs` and enter:
`Bearer YOUR_ACCESS_TOKEN`

## Transaction model
Categories: `income`, `expense`, `savings`, `investment`, `emergency`.
Directions: `add` and `remove`.
Amounts must be positive. A removal subtracts from that category's net total.
Settings customize the four allocation percentages and visible category names; transaction category keys remain unchanged.

## Database schema updates
This project does not currently configure Alembic. Startup uses SQLAlchemy `Base.metadata.create_all`, which creates missing tables but does not alter existing tables. The settings feature adds only the new `user_settings` table, with a unique user foreign key and database constraints; it does not recreate or overwrite existing financial tables or records. This additive change is compatible with the existing startup path on SQLite and PostgreSQL. For future changes to existing production tables, introduce and run versioned Alembic migrations rather than relying on `create_all`.

## Important
This is an initial development backend. Before public launch, add database migrations (Alembic), rate limiting, email verification/password reset if needed, stronger production secret management, and automated tests. Do not commit `.env` or real credentials.
