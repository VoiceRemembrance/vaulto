from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Numeric, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_guest: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    categories: Mapped[list["UserCategory"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserCategory(Base):
    __tablename__ = "user_categories"
    __table_args__ = (
        UniqueConstraint("user_id", "category_key", name="uq_user_category_key"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category_key: Mapped[str] = mapped_column(String(40), index=True)
    name: Mapped[str] = mapped_column(String(80))
    percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(default=0)
    category_type: Mapped[str] = mapped_column(String(20), default="expense", server_default=text("'expense'"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )
    user: Mapped[User] = relationship(back_populates="categories")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user_category")
    monthly_snapshots: Mapped[list["CategoryMonthSnapshot"]] = relationship(back_populates="category")


class CategoryMonthSnapshot(Base):
    __tablename__ = "category_month_snapshots"
    __table_args__ = (
        UniqueConstraint("user_id", "category_id", "month", name="uq_category_month_snapshot"),
        Index("ix_category_month_snapshots_user_month", "user_id", "month"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("user_categories.id", ondelete="CASCADE"), index=True)
    month: Mapped[str] = mapped_column(String(7), index=True)
    name: Mapped[str] = mapped_column(String(80))
    percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    category_type: Mapped[str] = mapped_column(String(20))
    category: Mapped[UserCategory] = relationship(back_populates="monthly_snapshots")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(40), index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("user_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    category_name_snapshot: Mapped[str | None] = mapped_column(String(80), nullable=True)
    category_type_snapshot: Mapped[str | None] = mapped_column(String(20), nullable=True)
    direction: Mapped[str] = mapped_column(String(10))
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(String(200), default="")
    transaction_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user: Mapped[User] = relationship(back_populates="transactions")
    user_category: Mapped[UserCategory | None] = relationship(back_populates="transactions")
