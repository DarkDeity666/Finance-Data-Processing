import random
from datetime import datetime, timezone, timedelta
from db import db
from auth import get_password_hash

def seed_db():
    db.users.delete_many({})
    db.financial_records.delete_many({})

    now = datetime.now(timezone.utc)
    users = [
        {
            "name": "Admin User",
            "email": "admin@example.com",
            "password": get_password_hash("password123"),
            "role": "ADMIN",
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now
        },
        {
            "name": "Analyst User",
            "email": "analyst@example.com",
            "password": get_password_hash("password123"),
            "role": "ANALYST",
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now
        },
        {
            "name": "Viewer User",
            "email": "viewer@example.com",
            "password": get_password_hash("password123"),
            "role": "VIEWER",
            "status": "ACTIVE",
            "created_at": now,
            "updated_at": now
        }
    ]
    result = db.users.insert_many(users)
    user_ids = result.inserted_ids

    records = []
    admin_id = str(user_ids[0])
    
    categories = {
        "INCOME": ["Product Sales", "Consulting", "Subscriptions", "Investments"],
        "EXPENSE": ["Server Costs", "Marketing", "Salaries", "Office Supplies", "Travel"]
    }
    
    for i in range(150):
        record_type = random.choices(["INCOME", "EXPENSE"], weights=[0.4, 0.6])[0]
        category = random.choice(categories[record_type])
        amount = round(random.uniform(100, 5000), 2)
        days_ago = random.randint(0, 180)
        record_date = now - timedelta(days=days_ago)
        
        records.append({
            "amount": amount,
            "type": record_type,
            "category": category,
            "date": record_date,
            "description": f"Sample {record_type.lower()} for {category}",
            "created_by": admin_id,
            "is_deleted": False,
            "created_at": record_date,
            "updated_at": record_date
        })
        
    db.financial_records.insert_many(records)

if __name__ == "__main__":
    seed_db()
