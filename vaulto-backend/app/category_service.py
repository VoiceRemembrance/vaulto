from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import CategoryMonthSnapshot, Transaction, UserCategory


def current_month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def ensure_month_snapshot(db: Session, user_id: int, month: str) -> list[CategoryMonthSnapshot]:
    records = db.scalars(
        select(CategoryMonthSnapshot)
        .where(CategoryMonthSnapshot.user_id == user_id, CategoryMonthSnapshot.month == month)
        .order_by(CategoryMonthSnapshot.category_id)
    ).all()
    if records:
        return records
    if month < current_month_key():
        return []

    categories = db.scalars(
        select(UserCategory).where(UserCategory.user_id == user_id, UserCategory.is_active.is_(True))
        .order_by(UserCategory.sort_order, UserCategory.id)
    ).all()
    if not categories:
        return []

    records = [
        CategoryMonthSnapshot(
            user_id=user_id,
            category_id=category.id,
            month=month,
            name=category.name,
            percentage=category.percentage,
            category_type=category.category_type,
        )
        for category in categories
    ]
    db.add_all(records)
    try:
        db.commit()
        return records
    except IntegrityError:
        db.rollback()
        return db.scalars(
            select(CategoryMonthSnapshot)
            .where(CategoryMonthSnapshot.user_id == user_id, CategoryMonthSnapshot.month == month)
            .order_by(CategoryMonthSnapshot.category_id)
        ).all()


def replace_upcoming_snapshots(db: Session, user_id: int) -> None:
    month = current_month_key()
    db.flush()
    db.execute(delete(CategoryMonthSnapshot).where(
        CategoryMonthSnapshot.user_id == user_id,
        CategoryMonthSnapshot.month >= month,
    ))
    categories = db.scalars(
        select(UserCategory).where(UserCategory.user_id == user_id, UserCategory.is_active.is_(True))
        .order_by(UserCategory.sort_order, UserCategory.id)
    ).all()
    db.add_all([
        CategoryMonthSnapshot(
            user_id=user_id,
            category_id=category.id,
            month=month,
            name=category.name,
            percentage=category.percentage,
            category_type=category.category_type,
        )
        for category in categories
    ])


def transaction_totals(db: Session, user_id: int, month: str) -> tuple[float, dict[int, float]]:
    year, number = map(int, month.split("-"))
    start = datetime(year, number, 1, tzinfo=timezone.utc)
    end = datetime(year + (number == 12), 1 if number == 12 else number + 1, 1, tzinfo=timezone.utc)
    rows = db.scalars(
        select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= start,
            Transaction.transaction_date < end,
        )
    ).all()
    income = 0.0
    categories: dict[int, float] = {}
    for row in rows:
        amount = row.amount if row.direction == "add" else -row.amount
        if row.category == "income" and row.category_id is None:
            income += amount
        elif row.category_id is not None:
            categories[row.category_id] = categories.get(row.category_id, 0.0) + amount
    return max(0.0, income), categories


def monthly_report(db: Session, user_id: int, month: str) -> dict:
    snapshots = ensure_month_snapshot(db, user_id, month)
    income, actuals = transaction_totals(db, user_id, month)
    categories = []
    targets = {}
    expense_variance = 0.0
    has_expense_category = False

    for snapshot in snapshots:
        target = round(income * float(snapshot.percentage) / 100, 2)
        actual = round(actuals.get(snapshot.category_id, 0.0), 2)
        difference = round(target - actual, 2) if snapshot.category_type == "expense" else round(actual - target, 2)
        if snapshot.category_type == "expense":
            expense_variance += difference
            has_expense_category = True
        categories.append({
            "id": snapshot.category_id,
            "name": snapshot.name,
            "percentage": float(snapshot.percentage),
            "category_type": snapshot.category_type,
            "allocated_amount": target,
            "actual_amount": actual,
            "variance_amount": difference,
            "status": (
                "balanced" if difference == 0 else
                "surplus" if difference > 0 else
                "deficit"
            ) if snapshot.category_type == "expense" else (
                "balanced" if difference == 0 else
                "above_target" if difference > 0 else
                "underfunded"
            ),
        })
        targets[str(snapshot.category_id)] = target

    return {
        "month": month,
        "income": round(income, 2),
        "categories": categories,
        "historical_configuration_available": bool(snapshots),
        "expense_variance": round(expense_variance, 2) if has_expense_category else None,
        "expense_status": (
            "balanced" if expense_variance == 0 else "surplus" if expense_variance > 0 else "deficit"
        ) if has_expense_category else None,
        "allocation_targets": targets,
    }


def category_for_user(db: Session, user_id: int, category_id: int, active_only: bool = True) -> UserCategory:
    stmt = select(UserCategory).where(UserCategory.id == category_id, UserCategory.user_id == user_id)
    if active_only:
        stmt = stmt.where(UserCategory.is_active.is_(True))
    category = db.scalar(stmt)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found or unavailable")
    return category


def category_response(category: UserCategory) -> dict:
    return {
        "id": category.id,
        "name": category.name,
        "percentage": category.percentage,
        "category_type": category.category_type,
        "active": category.is_active,
        "sort_order": category.sort_order,
        "created_at": category.created_at,
        "updated_at": category.updated_at,
    }


def validate_total(categories: list[UserCategory]) -> None:
    active = [category for category in categories if category.is_active]
    if not active:
        raise HTTPException(status_code=400, detail="At least one category must remain active")
    total = sum((Decimal(category.percentage) for category in active), Decimal("0"))
    if total != Decimal("100"):
        raise HTTPException(status_code=400, detail="Active allocation percentages must total exactly 100%")
