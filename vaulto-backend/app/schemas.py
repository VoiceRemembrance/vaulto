from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class CategoryConfig(BaseModel):
    id: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=1, max_length=80)
    percentage: Decimal = Field(ge=0, le=100, max_digits=5, decimal_places=2)
    active: bool = True

    @field_validator("id", "name")
    @classmethod
    def normalize_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Category identifiers and names cannot be empty")
        return normalized


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    is_guest: bool
    model_config = ConfigDict(from_attributes=True)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TransactionCreate(BaseModel):
    category: str
    direction: str = "add"
    amount: float = Field(gt=0, le=1000000000)
    description: str = Field(default="", max_length=200)
    transaction_date: date | None = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, value):
        allowed = {"income", "expense", "savings", "investment", "emergency"}
        if value not in allowed:
            raise ValueError(f"category must be one of: {', '.join(sorted(allowed))}")
        return value

    @field_validator("direction")
    @classmethod
    def validate_direction(cls, value):
        if value not in {"add", "remove"}:
            raise ValueError("direction must be 'add' or 'remove'")
        return value


class TransactionOut(BaseModel):
    id: int
    category: str
    direction: str
    amount: float
    description: str
    transaction_date: datetime
    model_config = ConfigDict(from_attributes=True)


class MonthlySummary(BaseModel):
    month: str
    income: float
    expense: float
    savings: float
    investment: float
    emergency: float
    allocation_targets: dict[str, float]


class MonthlyAnalytics(BaseModel):
    months: list[dict[str, float | str]]


class UserSettingsUpdate(BaseModel):
    expense_percentage: Decimal | None = Field(default=None, ge=0, le=100, max_digits=5, decimal_places=2)
    savings_percentage: Decimal | None = Field(default=None, ge=0, le=100, max_digits=5, decimal_places=2)
    investment_percentage: Decimal | None = Field(default=None, ge=0, le=100, max_digits=5, decimal_places=2)
    emergency_percentage: Decimal | None = Field(default=None, ge=0, le=100, max_digits=5, decimal_places=2)
    expense_name: str | None = Field(default=None, min_length=1, max_length=40)
    savings_name: str | None = Field(default=None, min_length=1, max_length=40)
    investment_name: str | None = Field(default=None, min_length=1, max_length=40)
    emergency_name: str | None = Field(default=None, min_length=1, max_length=40)
    categories: list[CategoryConfig] | None = None

    model_config = ConfigDict(extra="forbid")

    @field_validator("expense_name", "savings_name", "investment_name", "emergency_name")
    @classmethod
    def strip_category_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Category names cannot be empty")
        return value

    @model_validator(mode="after")
    def validate_percentage_total(self):
        if self.categories is not None:
            categories = [item for item in self.categories if item.active]
            total = sum((item.percentage for item in categories), Decimal("0"))
            if total != Decimal("100"):
                raise ValueError(f"Allocation percentages must total exactly 100% (received {total}%)")
            return self
        values = [
            self.expense_percentage,
            self.savings_percentage,
            self.investment_percentage,
            self.emergency_percentage,
        ]
        if any(value is None for value in values):
            return self
        total = sum(values, Decimal("0"))
        if total != Decimal("100"):
            raise ValueError(f"Allocation percentages must total exactly 100% (received {total}%)")
        return self


class UserSettingsOut(BaseModel):
    expense_percentage: Decimal | None = None
    savings_percentage: Decimal | None = None
    investment_percentage: Decimal | None = None
    emergency_percentage: Decimal | None = None
    expense_name: str | None = None
    savings_name: str | None = None
    investment_name: str | None = None
    emergency_name: str | None = None
    categories: list[CategoryConfig] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True, extra="forbid")
