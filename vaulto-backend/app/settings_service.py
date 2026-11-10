from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import UserSettings


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
        return settings
    except IntegrityError:
        db.rollback()
        settings = db.scalar(select(UserSettings).where(UserSettings.user_id == user_id))
        if settings is not None:
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
