from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.category_service import monthly_report
from app.db import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import MonthlySummary

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=MonthlySummary)
def summary(
    month: str = Query(default_factory=lambda: datetime.now().strftime("%Y-%m"), pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return monthly_report(db, user.id, month)
