from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.dependencies import get_current_user
from app.models import Transaction, User
from app.schemas import TransactionCreate, TransactionOut

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("", response_model=list[TransactionOut])
def list_transactions(
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Transaction).where(Transaction.user_id == user.id)
    if month:
        year, mon = map(int, month.split("-"))
        start = datetime(year, mon, 1, tzinfo=timezone.utc)
        end = datetime(year + (mon == 12), 1 if mon == 12 else mon + 1, 1, tzinfo=timezone.utc)
        stmt = stmt.where(Transaction.transaction_date >= start, Transaction.transaction_date < end)
    return list(db.scalars(stmt.order_by(Transaction.transaction_date.desc(), Transaction.id.desc())))


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    transaction_date = datetime.combine(payload.transaction_date or date.today(), datetime.min.time(), tzinfo=timezone.utc)
    transaction = Transaction(
        user_id=user.id,
        category=payload.category,
        direction=payload.direction,
        amount=payload.amount,
        description=payload.description.strip(),
        transaction_date=transaction_date,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=204)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    transaction = db.scalar(select(Transaction).where(Transaction.id == transaction_id, Transaction.user_id == user.id))
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(transaction)
    db.commit()
