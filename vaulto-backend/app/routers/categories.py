import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.category_service import (
    category_response,
    category_for_user,
    replace_upcoming_snapshots,
    validate_total,
)
from app.db import get_db
from app.dependencies import get_current_user
from app.models import User, UserCategory
from app.schemas import CategoryConfiguration, CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/api/categories", tags=["Categories"])


def _all_categories(db: Session, user_id: int) -> list[UserCategory]:
    return db.scalars(
        select(UserCategory).where(UserCategory.user_id == user_id)
        .order_by(UserCategory.sort_order, UserCategory.id)
    ).all()


def _save_or_conflict(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=409, detail="A category with this name already exists") from error


@router.get("", response_model=list[CategoryOut])
def list_categories(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return [category_response(item) for item in _all_categories(db, user.id) if item.is_active]


@router.get("/archived", response_model=list[CategoryOut])
def list_archived_categories(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return [category_response(item) for item in _all_categories(db, user.id) if not item.is_active]


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.scalar(select(User).where(User.id == user.id).with_for_update())
    categories = _all_categories(db, user.id)
    if any(item.name.casefold() == payload.name.casefold() for item in categories):
        raise HTTPException(status_code=409, detail="A category with this name already exists")
    active_total = sum((Decimal(item.percentage) for item in categories if item.is_active), Decimal("0"))
    if active_total + payload.percentage != Decimal("100"):
        raise HTTPException(status_code=400, detail="The new active allocation must leave the total at exactly 100%")
    category = UserCategory(
        user_id=user.id,
        category_key=uuid.uuid4().hex,
        name=payload.name,
        percentage=payload.percentage,
        category_type=payload.category_type,
        is_active=True,
        sort_order=len(categories),
    )
    db.add(category)
    replace_upcoming_snapshots(db, user.id)
    _save_or_conflict(db)
    db.refresh(category)
    return category_response(category)


@router.put("/configuration", response_model=list[CategoryOut])
def save_configuration(
    payload: CategoryConfiguration,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.scalar(select(User).where(User.id == user.id).with_for_update())
    existing = _all_categories(db, user.id)
    existing_by_id = {item.id: item for item in existing}
    incoming_ids = {item.id for item in payload.categories if item.id is not None}
    unknown_ids = incoming_ids - set(existing_by_id)
    if unknown_ids:
        raise HTTPException(status_code=404, detail="One or more categories were not found")
    if incoming_ids != set(existing_by_id):
        raise HTTPException(status_code=400, detail="Submit the complete category list to save changes")

    updated = []
    for order, item in enumerate(payload.categories):
        category = existing_by_id.get(item.id) if item.id is not None else UserCategory(
            user_id=user.id,
            category_key=uuid.uuid4().hex,
            sort_order=order,
        )
        category.name = item.name
        category.percentage = item.percentage
        category.category_type = item.category_type
        category.is_active = item.active
        category.sort_order = order
        category.updated_at = datetime.now(timezone.utc)
        db.add(category)
        updated.append(category)

    validate_total(updated)
    replace_upcoming_snapshots(db, user.id)
    _save_or_conflict(db)
    for item in updated:
        db.refresh(item)
    return [category_response(item) for item in updated]


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    db.scalar(select(User).where(User.id == user.id).with_for_update())
    category = category_for_user(db, user.id, category_id, active_only=False)
    categories = _all_categories(db, user.id)
    if any(item.id != category_id and item.name.casefold() == payload.name.casefold() for item in categories):
        raise HTTPException(status_code=409, detail="A category with this name already exists")
    category.name = payload.name
    category.percentage = payload.percentage
    category.category_type = payload.category_type
    category.updated_at = datetime.now(timezone.utc)
    validate_total(categories)
    replace_upcoming_snapshots(db, user.id)
    _save_or_conflict(db)
    db.refresh(category)
    return category_response(category)


def _change_archive_state(db: Session, user_id: int, category_id: int, archived: bool) -> dict:
    category = category_for_user(db, user_id, category_id, active_only=archived)
    if category.is_active == (not archived):
        raise HTTPException(status_code=409, detail="Category already has that status")
    category.is_active = not archived
    category.updated_at = datetime.now(timezone.utc)
    validate_total(_all_categories(db, user_id))
    replace_upcoming_snapshots(db, user_id)
    _save_or_conflict(db)
    db.refresh(category)
    return category_response(category)


@router.patch("/{category_id}/archive", response_model=CategoryOut)
def archive_category(
    category_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _change_archive_state(db, user.id, category_id, archived=True)


@router.patch("/{category_id}/restore", response_model=CategoryOut)
def restore_category(
    category_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return _change_archive_state(db, user.id, category_id, archived=False)
