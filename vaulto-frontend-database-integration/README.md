# Vaulto frontend — database integration

This version connects the existing React UI to the Vaulto FastAPI backend. Authentication uses the existing JWT endpoints. Transactions, income adjustments, dashboard summary, and analytics data are retrieved from the authenticated account through the API.

## Setup
1. Keep the FastAPI backend running at `http://127.0.0.1:8000`.
2. In this frontend folder, run `npm install`.
3. Copy `.env.example` to `.env` if you need to override the API URL.
4. Run `npm run dev`.

The frontend expects these backend routes: `/api/auth/*`, `/api/transactions`, `/api/dashboard/summary`. The backend must allow the frontend origin in CORS.

Financial data is account-scoped on the backend. Existing browser demo/localStorage financial data is deliberately not imported, to avoid silently mixing demo records with real account data.
