from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User, UserCategory, UserSettings
from app.schemas import CategoryConfig, UserSettingsOut, UserSettingsUpdate
from app.settings_service import DEFAULT_CATEGORIES, ensure_default_categories, get_or_create_user_settings, get_user_categories

router = APIRouter(prefix="/api/settings", tags=["Settings"])


def _default_category_payload(settings: UserSettings) -> list[dict]:
    return [
        {
            "id": "expense",
            "name": settings.expense_name,
            "percentage": float(settings.expense_percentage),
            "active": True,
        },
        {
            "id": "savings",
            "name": settings.savings_name,
            "percentage": float(settings.savings_percentage),
            "active": True,
        },
        {
            "id": "investment",
            "name": settings.investment_name,
            "percentage": float(settings.investment_percentage),
            "active": True,
        },
        {
            "id": "emergency",
            "name": settings.emergency_name,
            "percentage": float(settings.emergency_percentage),
            "active": True,
        },
    ]


def _sync_default_category_rows(db: Session, user_id: int, settings: UserSettings, categories: list[dict]) -> None:
    entries_by_key = {
        item.category_key: item
        for item in db.scalars(select(UserCategory).where(UserCategory.user_id == user_id)).all()
    }
    ordered_keys = ["expense", "savings", "investment", "emergency"]
    for order, key in enumerate(ordered_keys):
        lookup = next((item for item in categories if item.get("id") == key), None)
        if lookup is None:
            lookup = {
                "id": key,
                "name": getattr(settings, f"{key}_name"),
                "percentage": float(getattr(settings, f"{key}_percentage")),
                "active": True,
            }

        record = entries_by_key.get(key)
        if record is None:
            record = UserCategory(user_id=user_id, category_key=key, sort_order=order)
            db.add(record)

        record.category_key = key
        record.name = lookup["name"]
        record.percentage = Decimal(str(lookup["percentage"]))
        record.is_active = bool(lookup.get("active", True))
        record.sort_order = order

    for record in list(entries_by_key.values()):
        if record.category_key not in ordered_keys:
            db.delete(record)


def _map_categories_to_response(settings: UserSettings, categories: list[dict]) -> UserSettingsOut:
    payload = UserSettingsOut(
        expense_percentage=settings.expense_percentage,
        savings_percentage=settings.savings_percentage,
        investment_percentage=settings.investment_percentage,
        emergency_percentage=settings.emergency_percentage,
        expense_name=settings.expense_name,
        savings_name=settings.savings_name,
        investment_name=settings.investment_name,
        emergency_name=settings.emergency_name,
        categories=[CategoryConfig(**item) for item in categories],
    )
    return payload


@router.get("", response_model=UserSettingsOut)
def read_settings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    settings = get_or_create_user_settings(db, user.id)
    categories = get_user_categories(db, user.id)
    return _map_categories_to_response(settings, categories)


@router.put("", response_model=UserSettingsOut)
def update_settings(
    payload: UserSettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    settings = get_or_create_user_settings(db, user.id)
    data = payload.model_dump(exclude_unset=True)

    if data.get("categories"):
        categories = data["categories"]
        active_categories = [item for item in categories if item.get("active")]
        if not active_categories:
            raise HTTPException(status_code=400, detail="At least one category must remain active")
        total = sum((Decimal(str(item["percentage"])) for item in active_categories), Decimal("0"))
        if total != Decimal("100"):
            raise HTTPException(status_code=400, detail="Allocation percentages must total exactly 100%")
        normalized_categories = [
            {
                "id": item["id"],
                "name": item["name"],
                "percentage": float(item["percentage"]),
                "active": bool(item.get("active", True)),
            }
            for item in categories
        ]
        source_categories = normalized_categories
    else:
        source_categories = [
            {
                "id": "expense",
                "name": data.get("expense_name", settings.expense_name),
                "percentage": float(data.get("expense_percentage", settings.expense_percentage)),
                "active": True,
            },
            {
                "id": "savings",
                "name": data.get("savings_name", settings.savings_name),
                "percentage": float(data.get("savings_percentage", settings.savings_percentage)),
                "active": True,
            },
            {
                "id": "investment",
                "name": data.get("investment_name", settings.investment_name),
                "percentage": float(data.get("investment_percentage", settings.investment_percentage)),
                "active": True,
            },
            {
                "id": "emergency",
                "name": data.get("emergency_name", settings.emergency_name),
                "percentage": float(data.get("emergency_percentage", settings.emergency_percentage)),
                "active": True,
            },
        ]

    for field, value in data.items():
        if value is None or field == "categories":
            continue
        setattr(settings, field, value)

    _sync_default_category_rows(db, user.id, settings, source_categories)

    try:
        db.commit()
        db.refresh(settings)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save user settings",
        )

    categories = get_user_categories(db, user.id)
    return _map_categories_to_response(settings, categories)
