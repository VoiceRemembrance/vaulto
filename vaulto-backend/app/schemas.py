from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


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
