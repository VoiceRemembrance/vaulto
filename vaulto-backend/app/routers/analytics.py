from collections import defaultdict
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.dependencies import get_current_user
from app.models import Transaction, User

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/monthly")
def monthly_analytics(
    months: int = Query(default=6, ge=1, le=24),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    rows = db.scalars(select(Transaction).where(Transaction.user_id == user.id)).all()
    buckets = defaultdict(lambda: {"expense": 0.0, "savings": 0.0, "investment": 0.0})
    for row in rows:
        key = row.transaction_date.strftime("%Y-%m")
        if row.category in buckets[key]:
            sign = 1 if row.direction == "add" else -1
            buckets[key][row.category] += sign * row.amount

    current = datetime.now(timezone.utc)
    keys = []
    year, month = current.year, current.month
    for _ in range(months):
        keys.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            month, year = 12, year - 1
    keys.reverse()
    return {"months": [
        {"month": key, **{name: round(buckets[key][name], 2) for name in ("expense", "savings", "investment")}}
        for key in keys
    ]}
