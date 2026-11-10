from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user
from app.models import User, UserSettings
from app.schemas import UserSettingsOut, UserSettingsUpdate
from app.settings_service import get_or_create_user_settings

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=UserSettingsOut)
def read_settings(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_or_create_user_settings(db, user.id)


@router.put("", response_model=UserSettingsOut)
def update_settings(
    payload: UserSettingsUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    settings = get_or_create_user_settings(db, user.id)
    for field, value in payload.model_dump().items():
        setattr(settings, field, value)
    try:
        db.commit()
        db.refresh(settings)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save user settings",
        )
    return settings
