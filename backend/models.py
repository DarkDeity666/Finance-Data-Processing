from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

class RoleEnum(str, Enum):
    ADMIN = "ADMIN"
    ANALYST = "ANALYST"
    VIEWER = "VIEWER"

class StatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class RecordType(str, Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: RoleEnum = RoleEnum.VIEWER
    status: StatusEnum = StatusEnum.ACTIVE

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[RoleEnum] = None
    status: Optional[StatusEnum] = None
    password: Optional[str] = Field(None, min_length=6)

class UserRead(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: RoleEnum
    status: StatusEnum
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class RecordCreate(BaseModel):
    amount: float = Field(..., gt=0)
    type: RecordType
    category: str = Field(..., min_length=2, max_length=100)
    date: date
    description: Optional[str] = None

class RecordUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[RecordType] = None
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    date: Optional[date] = None
    description: Optional[str] = None

class RecordRead(BaseModel):
    id: str
    amount: float
    type: RecordType
    category: str
    date: date
    description: Optional[str] = None
    created_by: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginatedRecords(BaseModel):
    items: List[RecordRead]
    total: int
    page: int
    size: int
    pages: int

class CategoryTotal(BaseModel):
    category: str
    total: float

class MonthlyTrend(BaseModel):
    month: str
    income: float
    expense: float

class DashboardSummary(BaseModel):
    total_income: float
    total_expense: float
    net_balance: float
    category_expenses: List[CategoryTotal]
    category_incomes: List[CategoryTotal]
    monthly_trends: List[MonthlyTrend]
    recent_activity: List[Dict[str, Any]]
