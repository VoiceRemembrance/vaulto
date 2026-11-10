from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.dependencies import get_current_user
from app.models import Transaction, User
from app.schemas import MonthlySummary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

RATES = {"expense": 0.05, "savings": 0.25, "investment": 0.25, "emergency": 0.45}


@router.get("/summary", response_model=MonthlySummary)
def summary(
    month: str = Query(default_factory=lambda: datetime.now().strftime("%Y-%m"), pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    year, mon = map(int, month.split("-"))
    start = datetime(year, mon, 1, tzinfo=timezone.utc)
    end = datetime(year + (mon == 12), 1 if mon == 12 else mon + 1, 1, tzinfo=timezone.utc)
    rows = db.scalars(select(Transaction).where(
        Transaction.user_id == user.id,
        Transaction.transaction_date >= start,
        Transaction.transaction_date < end,
    )).all()

    totals = {key: 0.0 for key in ["income", "expense", "savings", "investment", "emergency"]}
    for row in rows:
        sign = 1 if row.direction == "add" else -1
        totals[row.category] += sign * row.amount

    income = max(0.0, totals["income"])
    targets = {key: round(income * rate, 2) for key, rate in RATES.items()}
    return MonthlySummary(
        month=month,
        income=round(income, 2),
        expense=round(totals["expense"], 2),
        savings=round(totals["savings"], 2),
        investment=round(totals["investment"], 2),
        emergency=round(totals["emergency"], 2),
        allocation_targets=targets,
    )
