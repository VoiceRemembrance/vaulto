from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


CategoryType = Literal["expense", "contribution"]


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    percentage: Decimal = Field(ge=0, le=100, max_digits=5, decimal_places=2)
    category_type: CategoryType = "expense"

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Category name cannot be empty")
        return value

class CategoryUpdate(CategoryCreate):
    pass


class CategoryConfigurationItem(CategoryCreate):
    id: int | None = None
    active: bool = True


class CategoryConfiguration(BaseModel):
    categories: list[CategoryConfigurationItem] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_configuration(self):
        active = [category for category in self.categories if category.active]
        if not active:
            raise ValueError("At least one category must remain active")
        if sum((item.percentage for item in active), Decimal("0")) != Decimal("100"):
            raise ValueError("Active allocation percentages must total exactly 100%")
        names = [item.name.casefold() for item in self.categories]
        if len(names) != len(set(names)):
            raise ValueError("Category names must be unique, ignoring case")
        ids = [category.id for category in self.categories if category.id is not None]
        if len(ids) != len(set(ids)):
            raise ValueError("A category may only appear once in the configuration")
        return self


class CategoryOut(BaseModel):
    id: int
    name: str
    percentage: Decimal
    category_type: str
    active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


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
    category_id: int | None = None
    category: str | None = Field(default=None, min_length=1, max_length=40)
    direction: str = "add"
    amount: float = Field(gt=0, le=1000000000)
    description: str = Field(default="", max_length=200)
    transaction_date: date | None = None

    @model_validator(mode="after")
    def validate_category_reference(self):
        if self.category_id is not None and self.category is not None:
            raise ValueError("Provide either category_id or category, not both")
        if self.category_id is None and self.category is None:
            raise ValueError("A category_id is required for category transactions")
        return self

    @field_validator("direction")
    @classmethod
    def validate_direction(cls, value):
        if value not in {"add", "remove"}:
            raise ValueError("direction must be 'add' or 'remove'")
        return value


class TransactionOut(BaseModel):
    id: int
    category: str
    category_id: int | None = None
    category_name: str
    category_type: str
    direction: str
    amount: float
    description: str
    transaction_date: datetime
    model_config = ConfigDict(from_attributes=True)


class MonthlySummary(BaseModel):
    month: str
    income: float
    categories: list[dict]
    historical_configuration_available: bool
    expense_variance: float | None = None
    expense_status: str | None = None
    allocation_targets: dict[str, float] = Field(default_factory=dict)
