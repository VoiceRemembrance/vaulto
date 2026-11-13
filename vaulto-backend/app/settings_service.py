from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import UserCategory, UserSettings

DEFAULT_CATEGORIES = [
    {"key": "expense", "name": "Guilt-free Expense", "percentage": Decimal("5")},
    {"key": "savings", "name": "Savings", "percentage": Decimal("25")},
    {"key": "investment", "name": "Investments", "percentage": Decimal("25")},
    {"key": "emergency", "name": "Emergency Fund", "percentage": Decimal("45")},
]


def get_or_create_user_settings(db: Session, user_id: int) -> UserSettings:
    try:
        settings = db.scalar(select(UserSettings).where(UserSettings.user_id == user_id))
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load user settings",
        )
    if settings is not None:
        return settings

    settings = UserSettings(user_id=user_id)
    db.add(settings)
    try:
        db.commit()
        db.refresh(settings)
        ensure_default_categories(db, user_id)
        return settings
    except IntegrityError:
        db.rollback()
        settings = db.scalar(select(UserSettings).where(UserSettings.user_id == user_id))
        if settings is not None:
            ensure_default_categories(db, user_id)
            return settings
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create user settings",
        )
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load user settings",
        )


def ensure_default_categories(db: Session, user_id: int) -> list[UserCategory]:
    existing = db.scalars(
        select(UserCategory).where(UserCategory.user_id == user_id).order_by(UserCategory.sort_order, UserCategory.id)
    ).all()
    if existing:
        return existing
    categories = []
    for index, entry in enumerate(DEFAULT_CATEGORIES):
        category = UserCategory(
            user_id=user_id,
            category_key=entry["key"],
            name=entry["name"],
            percentage=entry["percentage"],
            is_active=True,
            sort_order=index,
        )
        db.add(category)
        categories.append(category)
    db.commit()
    return categories


def get_user_categories(db: Session, user_id: int) -> list[dict]:
    categories = db.scalars(
        select(UserCategory).where(UserCategory.user_id == user_id).order_by(UserCategory.sort_order, UserCategory.id)
    ).all()
    if not categories:
        categories = ensure_default_categories(db, user_id)
    return [
        {"id": item.category_key, "name": item.name, "percentage": float(item.percentage), "active": item.is_active}
        for item in categories
    ]
