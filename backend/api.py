from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordRequestForm
from typing import List, Optional, Literal
from datetime import datetime, timezone, date, timedelta
from bson import ObjectId
import re
from dateutil.relativedelta import relativedelta

from db import get_db
from auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_user, require_roles
)
from models import (
    UserCreate, UserRead, UserUpdate, Token,
    RoleEnum, RecordType, RecordCreate, RecordUpdate,
    RecordRead, PaginatedRecords, DashboardSummary
)

router = APIRouter()

@router.post("/auth/login", response_model=Token, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)):
    user = db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if user.get("status") == "INACTIVE":
        raise HTTPException(status_code=400, detail="Account is inactive")
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, expires_delta=timedelta(minutes=60 * 24)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/auth/register", response_model=UserRead, tags=["Auth"])
def register(user_in: UserCreate, db=Depends(get_db)):
    if db.users.find_one({"email": user_in.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_dict = user_in.model_dump(exclude={"password"})
    user_dict["password"] = get_password_hash(user_in.password)
    user_dict["created_at"] = datetime.now(timezone.utc)
    user_dict["updated_at"] = datetime.now(timezone.utc)
    result = db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return user_dict

@router.get("/auth/me", response_model=UserRead, tags=["Auth"])
def read_current_user(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/users", response_model=List[UserRead], tags=["Users"])
def get_users(db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN]))):
    users = []
    for u in db.users.find():
        u["id"] = str(u["_id"])
        users.append(u)
    return users

@router.post("/users", response_model=UserRead, tags=["Users"])
def create_user(user_in: UserCreate, db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN]))):
    if db.users.find_one({"email": user_in.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_dict = user_in.model_dump(exclude={"password"})
    user_dict["password"] = get_password_hash(user_in.password)
    user_dict["created_at"] = datetime.now(timezone.utc)
    user_dict["updated_at"] = datetime.now(timezone.utc)
    result = db.users.insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    return user_dict

@router.put("/users/{user_id}", response_model=UserRead, tags=["Users"])
def update_user(user_id: str, user_in: UserUpdate, db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN]))):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    update_data = user_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    result["id"] = str(result["_id"])
    return result

@router.delete("/users/{user_id}", tags=["Users"])
def delete_user(user_id: str, db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN]))):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")
    if str(current_user["_id"]) == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    result = db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted"}

@router.post("/records", response_model=RecordRead, tags=["Financial Records"])
def create_record(record_in: RecordCreate, db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN]))):
    record_dict = record_in.model_dump()
    record_dict["date"] = datetime.combine(record_dict["date"], datetime.min.time())
    record_dict["created_by"] = str(current_user["_id"])
    record_dict["is_deleted"] = False
    record_dict["created_at"] = datetime.now(timezone.utc)
    record_dict["updated_at"] = datetime.now(timezone.utc)
    result = db.financial_records.insert_one(record_dict)
    record_dict["id"] = str(result.inserted_id)
    record_dict["date"] = record_dict["date"].date()
    return record_dict

@router.get("/records", response_model=PaginatedRecords, tags=["Financial Records"])
def get_records(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    type: Optional[RecordType] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = Query("date", pattern="^(date|amount|category|type|created_at)$"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("desc"),
    db=Depends(get_db),
    current_user=Depends(require_roles([RoleEnum.ADMIN, RoleEnum.ANALYST])),
):
    query = {"is_deleted": False}
    if type:
        query["type"] = type.value
    if category:
        query["category"] = {"$regex": re.compile(category, re.IGNORECASE)}
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = datetime.combine(start_date, datetime.min.time())
        if end_date:
            date_query["$lte"] = datetime.combine(end_date, datetime.max.time())
        query["date"] = date_query
    if search:
        search_regex = re.compile(search, re.IGNORECASE)
        query["$or"] = [
            {"description": {"$regex": search_regex}},
            {"category": {"$regex": search_regex}},
        ]
    sort_direction = -1 if sort_order == "desc" else 1
    skip = (page - 1) * size
    cursor = (
        db.financial_records.find(query)
        .sort(sort_by, sort_direction)
        .skip(skip)
        .limit(size)
    )
    total = db.financial_records.count_documents(query)
    items = []
    for r in cursor:
        r["id"] = str(r["_id"])
        r["date"] = r["date"].date()
        items.append(r)
    pages = (total + size - 1) // size
    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}

@router.get("/records/{record_id}", response_model=RecordRead, tags=["Financial Records"])
def get_record(record_id: str, db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN, RoleEnum.ANALYST]))):
    if not ObjectId.is_valid(record_id):
        raise HTTPException(status_code=400, detail="Invalid record ID")
    record = db.financial_records.find_one({"_id": ObjectId(record_id), "is_deleted": False})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record["id"] = str(record["_id"])
    record["date"] = record["date"].date()
    return record

@router.put("/records/{record_id}", response_model=RecordRead, tags=["Financial Records"])
def update_record(record_id: str, record_in: RecordUpdate, db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN]))):
    if not ObjectId.is_valid(record_id):
        raise HTTPException(status_code=400, detail="Invalid record ID")
    update_data = record_in.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    if "date" in update_data:
        update_data["date"] = datetime.combine(update_data["date"], datetime.min.time())
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = db.financial_records.find_one_and_update(
        {"_id": ObjectId(record_id), "is_deleted": False},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Record not found")
    result["id"] = str(result["_id"])
    result["date"] = result["date"].date()
    return result

@router.delete("/records/{record_id}", tags=["Financial Records"])
def delete_record(record_id: str, db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN]))):
    if not ObjectId.is_valid(record_id):
        raise HTTPException(status_code=400, detail="Invalid record ID")
    result = db.financial_records.find_one_and_update(
        {"_id": ObjectId(record_id), "is_deleted": False},
        {"$set": {"is_deleted": True, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"message": "Record deleted"}

@router.get("/dashboard/summary", response_model=DashboardSummary, tags=["Dashboard"])
def get_dashboard_summary(db=Depends(get_db), current_user=Depends(require_roles([RoleEnum.ADMIN, RoleEnum.ANALYST, RoleEnum.VIEWER]))):
    base_match = {"is_deleted": False}

    totals = list(db.financial_records.aggregate([
        {"$match": base_match},
        {"$group": {"_id": "$type", "total": {"$sum": "$amount"}}},
    ]))
    total_income = sum(t["total"] for t in totals if t["_id"] == "INCOME")
    total_expense = sum(t["total"] for t in totals if t["_id"] == "EXPENSE")
    net_balance = total_income - total_expense

    categories = list(db.financial_records.aggregate([
        {"$match": base_match},
        {"$group": {"_id": {"type": "$type", "category": "$category"}, "total": {"$sum": "$amount"}}},
        {"$sort": {"total": -1}},
    ]))
    category_incomes = [{"category": c["_id"]["category"], "total": c["total"]} for c in categories if c["_id"]["type"] == "INCOME"]
    category_expenses = [{"category": c["_id"]["category"], "total": c["total"]} for c in categories if c["_id"]["type"] == "EXPENSE"]

    six_months_ago = datetime.now() - relativedelta(months=5)
    six_months_ago_start = datetime(six_months_ago.year, six_months_ago.month, 1)

    monthly_data = list(db.financial_records.aggregate([
        {"$match": {**base_match, "date": {"$gte": six_months_ago_start}}},
        {"$group": {"_id": {"month": {"$dateToString": {"format": "%Y-%m", "date": "$date"}}, "type": "$type"}, "total": {"$sum": "$amount"}}},
        {"$sort": {"_id.month": 1}},
    ]))

    trends: dict = {}
    for entry in monthly_data:
        m = entry["_id"]["month"]
        t = entry["_id"]["type"]
        if m not in trends:
            trends[m] = {"month": m, "income": 0.0, "expense": 0.0}
        if t == "INCOME":
            trends[m]["income"] = entry["total"]
        else:
            trends[m]["expense"] = entry["total"]
    monthly_trends = sorted(trends.values(), key=lambda x: x["month"])

    recent_records = list(db.financial_records.find(base_match).sort("date", -1).limit(10))
    recent_activity = []
    for r in recent_records:
        r["id"] = str(r["_id"])
        r["date"] = str(r["date"].date())
        del r["_id"]
        recent_activity.append(r)

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "net_balance": net_balance,
        "category_incomes": category_incomes,
        "category_expenses": category_expenses,
        "monthly_trends": monthly_trends,
        "recent_activity": recent_activity,
    }
