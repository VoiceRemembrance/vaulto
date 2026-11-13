from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User, UserCategory
from app.routers.categories import save_configuration
from app.schemas import CategoryConfiguration, CategoryOut

router = APIRouter(prefix="/api/settings", tags=["Settings compatibility"])


@router.get("", response_model=list[CategoryOut])
def read_settings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    categories = db.scalars(
        select(UserCategory).where(UserCategory.user_id == user.id)
        .order_by(UserCategory.sort_order, UserCategory.id)
    ).all()
    return [
        {
            "id": item.id,
            "name": item.name,
            "percentage": item.percentage,
            "category_type": item.category_type,
            "active": item.is_active,
            "sort_order": item.sort_order,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
        }
        for item in categories if item.is_active
    ]


@router.put("", response_model=list[CategoryOut])
def update_settings(
    payload: CategoryConfiguration,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return save_configuration(payload, db, user)
