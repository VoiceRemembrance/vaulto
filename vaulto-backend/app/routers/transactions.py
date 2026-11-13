from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.category_service import category_for_user, ensure_month_snapshot
from app.db import get_db
from app.dependencies import get_current_user
from app.models import Transaction, User, UserCategory
from app.schemas import TransactionCreate, TransactionOut

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


def _transaction_response(transaction: Transaction) -> dict:
    category = transaction.user_category
    category_name = transaction.category_name_snapshot or (
        category.name if category is not None else "Income" if transaction.category == "income" else transaction.category
    )
    category_type = transaction.category_type_snapshot or (
        category.category_type if category is not None else "income" if transaction.category == "income" else "expense"
    )
    return {
        "id": transaction.id,
        "category": transaction.category,
        "category_id": transaction.category_id,
        "category_name": category_name,
        "category_type": category_type,
        "direction": transaction.direction,
        "amount": transaction.amount,
        "description": transaction.description,
        "transaction_date": transaction.transaction_date,
    }


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
    rows = db.scalars(stmt.order_by(Transaction.transaction_date.desc(), Transaction.id.desc())).all()
    return [_transaction_response(transaction) for transaction in rows]


@router.post("", response_model=TransactionOut, status_code=201)
def create_transaction(
    payload: TransactionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    transaction_date = datetime.combine(payload.transaction_date or date.today(), datetime.min.time(), tzinfo=timezone.utc)
    if payload.category == "income":
        category_id = None
        category_name = "Income"
        category_type = "income"
        category_key = "income"
    elif payload.category_id is not None:
        category = category_for_user(db, user.id, payload.category_id)
        category_id = category.id
        category_name = category.name
        category_type = category.category_type
        category_key = "expense" if category.category_type == "expense" else "savings"
    else:
        category = db.scalar(select(UserCategory).where(
            UserCategory.user_id == user.id,
            UserCategory.category_key == payload.category,
            UserCategory.is_active.is_(True),
        ))
        if category is None:
            raise HTTPException(status_code=404, detail="Category not found or unavailable")
        category_id = category.id
        category_name = category.name
        category_type = category.category_type
        category_key = payload.category

    ensure_month_snapshot(db, user.id, transaction_date.strftime("%Y-%m"))

    transaction = Transaction(
        user_id=user.id,
        category=category_key,
        category_id=category_id,
        category_name_snapshot=category_name,
        category_type_snapshot=category_type,
        direction=payload.direction,
        amount=payload.amount,
        description=payload.description.strip(),
        transaction_date=transaction_date,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return _transaction_response(transaction)


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
