from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import Boolean, CheckConstraint, DateTime, Float, ForeignKey, Numeric, String, UniqueConstraint, text
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
    settings: Mapped["UserSettings | None"] = relationship(
        back_populates="user", cascade="all, delete-orphan", uselist=False
    )
    categories: Mapped[list["UserCategory"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserSettings(Base):
    __tablename__ = "user_settings"
    __table_args__ = (
        CheckConstraint("expense_percentage >= 0 AND expense_percentage <= 100", name="ck_user_settings_expense_range"),
        CheckConstraint("savings_percentage >= 0 AND savings_percentage <= 100", name="ck_user_settings_savings_range"),
        CheckConstraint("investment_percentage >= 0 AND investment_percentage <= 100", name="ck_user_settings_investment_range"),
        CheckConstraint("emergency_percentage >= 0 AND emergency_percentage <= 100", name="ck_user_settings_emergency_range"),
        CheckConstraint(
            "expense_percentage + savings_percentage + investment_percentage + emergency_percentage = 100",
            name="ck_user_settings_percentages_total",
        ),
        CheckConstraint(
            "length(trim(expense_name)) > 0 AND length(trim(savings_name)) > 0 "
            "AND length(trim(investment_name)) > 0 AND length(trim(emergency_name)) > 0",
            name="ck_user_settings_category_names_nonempty",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True)
    expense_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=5, server_default=text("5"))
    savings_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=25, server_default=text("25"))
    investment_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=25, server_default=text("25"))
    emergency_percentage: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=45, server_default=text("45"))
    expense_name: Mapped[str] = mapped_column(String(40), default="Guilt-free Expense", server_default=text("'Guilt-free Expense'"))
    savings_name: Mapped[str] = mapped_column(String(40), default="Savings", server_default=text("'Savings'"))
    investment_name: Mapped[str] = mapped_column(String(40), default="Investments", server_default=text("'Investments'"))
    emergency_name: Mapped[str] = mapped_column(String(40), default="Emergency Fund", server_default=text("'Emergency Fund'"))

    user: Mapped[User] = relationship(back_populates="settings")


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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user: Mapped[User] = relationship(back_populates="categories")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    category: Mapped[str] = mapped_column(String(20), index=True)
    direction: Mapped[str] = mapped_column(String(10))
    amount: Mapped[float] = mapped_column(Float)
    description: Mapped[str] = mapped_column(String(200), default="")
    transaction_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    user: Mapped[User] = relationship(back_populates="transactions")
