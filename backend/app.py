from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import sqlite3
from sqlite3 import Row
from typing import Union, Optional
from datetime import datetime, timedelta
import asyncio
import httpx
import os

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
DB_PATH = os.getenv("DB_DIR", os.path.join(os.path.dirname(__file__), "subscriptions.db"))
DB_LOCK = asyncio.Lock()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Models
class UserConfiguration(BaseModel):
    currency: str
    show_currency_symbol: bool = Field(alias="showCurrencySymbol")

    # Custom configuration for alias usage
    class Config:
        allow_population_by_field_name = True  # Allow population using the original field name

class Subscription(BaseModel):
    id: Optional[int] = None
    name: str
    amount: Union[float, str]  # Accept both float and string
    due_date: str = Field(alias="dueDate")  # Map dueDate to due_date
    icon: Optional[str] = None
    color: Optional[str] = None
    account: Optional[str] = None
    autopay: bool = False
    interval_value: int = 1
    interval_unit: str
    notify: bool = False
    currency: str = "default"

    # Validator to ensure `amount` is converted to a float
    @validator("amount", pre=True, always=True)
    def convert_amount(cls, value):
        try:
            return float(value)  # Convert string to float
        except ValueError:
            raise ValueError(f"Invalid amount: {value}. Must be a number.")

    # Custom configuration for alias usage
    class Config:
        allow_population_by_field_name = True  # Allow population using the original field name

class NtfySettings(BaseModel):
    topic: str
    domain: Optional[str] = "https://ntfy.sh"

# Helper function to compute next due dates
def compute_next_due_dates(sub):
    now = datetime.now()
    due_date = datetime.fromisoformat(sub["due_date"])
    next_due_date = due_date
    due_dates = []
    one_month_later = now + timedelta(days=30)

    while next_due_date <= one_month_later:
        if next_due_date >= now:
            due_dates.append(next_due_date)
        interval = sub["interval_value"] or 1
        interval_unit = sub["interval_unit"] or "months"

        if interval_unit == "days":
            next_due_date += timedelta(days=interval)
        elif interval_unit == "weeks":
            next_due_date += timedelta(weeks=interval)
        elif interval_unit == "months":
            next_due_date = next_due_date.replace(month=(next_due_date.month % 12) + interval)
        elif interval_unit == "years":
            next_due_date = next_due_date.replace(year=next_due_date.year + interval)
        else:
            break

    return due_dates

# Routes

# Get user configuration
@app.get("/api/user-configuration")
async def get_user_configuration():
    async with DB_LOCK:
        conn = get_db_connection()
        cursor = conn.execute("SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1")
        result = cursor.fetchone()
        conn.close()

    if not result:
        return {"currency": "USD", "showCurrencySymbol": True}
    
    return {
        "currency": result["currency"],
        "showCurrencySymbol": bool(result["show_currency_symbol"]),
    }

# Update user configuration
@app.post("/api/user-configuration")
async def update_user_configuration(config: UserConfiguration):
    async with DB_LOCK:
        conn = get_db_connection()
        cursor = conn.execute("SELECT id FROM user_configuration LIMIT 1")
        existing = cursor.fetchone()

        if existing:
            conn.execute(
                "UPDATE user_configuration SET currency = ?, show_currency_symbol = ? WHERE id = ?",
                (config.currency, int(config.show_currency_symbol), existing["id"]),
            )
        else:
            conn.execute(
                "INSERT INTO user_configuration (currency, show_currency_symbol) VALUES (?, ?)",
                (config.currency, int(config.show_currency_symbol)),
            )
        conn.commit()
        conn.close()
    return {"message": "User configuration updated successfully"}

# Get subscriptions
@app.get("/api/subscriptions")
async def get_subscriptions():
    async with DB_LOCK:
        conn = get_db_connection()
        subscriptions = conn.execute("SELECT * FROM subscriptions").fetchall()
        user_config = conn.execute("SELECT currency, show_currency_symbol FROM user_configuration LIMIT 1").fetchone()
        conn.close()

    default_currency = user_config["currency"] if user_config else "USD"
    show_currency_symbol = bool(user_config["show_currency_symbol"]) if user_config else True

    result = [
        {
            **dict(sub),
            "currency": sub["currency"] if sub["currency"] != "default" else default_currency,
            "showCurrencySymbol": show_currency_symbol,
        }
        for sub in subscriptions
    ]

    return result

# Add subscription
@app.post("/api/subscriptions")
async def add_subscription(sub: Subscription):
    async with DB_LOCK:
        conn = get_db_connection()
        cursor = conn.execute(
            """
            INSERT INTO subscriptions
            (name, amount, due_date, icon, color, account, autopay, interval_value, interval_unit, notify, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                sub.name, sub.amount, sub.due_date, sub.icon, sub.color,
                sub.account, int(sub.autopay), sub.interval_value, sub.interval_unit,
                int(sub.notify), sub.currency or "default",
            ),
        )
        conn.commit()
        new_id = cursor.lastrowid
        subscription = conn.execute("SELECT * FROM subscriptions WHERE id = ?", (new_id,)).fetchone()
        conn.close()

    return dict(subscription)

# Update subscription
@app.put("/api/subscriptions/{id}")
async def update_subscription(id: int, sub: Subscription):
    async with DB_LOCK:
        conn = get_db_connection()
        conn.execute(
            """
            UPDATE subscriptions SET
            name = ?, amount = ?, due_date = ?, icon = ?, color = ?, account = ?, 
            autopay = ?, interval_value = ?, interval_unit = ?, notify = ?, currency = ?
            WHERE id = ?
            """,
            (
                sub.name, sub.amount, sub.due_date, sub.icon, sub.color,
                sub.account, int(sub.autopay), sub.interval_value, sub.interval_unit,
                int(sub.notify), sub.currency or "default", id,
            ),
        )
        conn.commit()
        updated_subscription = conn.execute("SELECT * FROM subscriptions WHERE id = ?", (id,)).fetchone()
        conn.close()

    if not updated_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return dict(updated_subscription)

# Delete subscription
@app.delete("/api/subscriptions/{id}")
async def delete_subscription(id: int):
    async with DB_LOCK:
        conn = get_db_connection()
        result = conn.execute("DELETE FROM subscriptions WHERE id = ?", (id,))
        conn.commit()
        conn.close()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription deleted successfully"}

# Get NTFY settings
@app.get("/api/ntfy-settings")
async def get_ntfy_settings():
    async with DB_LOCK:
        conn = get_db_connection()
        result = conn.execute("SELECT topic, domain FROM ntfy_settings LIMIT 1").fetchone()
        conn.close()

    return {
        "topic": result["topic"] if result else "",
        "domain": result["domain"] if result else "https://ntfy.sh",
    }

# Update NTFY settings
@app.post("/api/ntfy-settings")
async def update_ntfy_settings(settings: NtfySettings):
    async with DB_LOCK:
        conn = get_db_connection()
        conn.execute("DELETE FROM ntfy_settings")
        conn.execute("INSERT INTO ntfy_settings (topic, domain) VALUES (?, ?)", (settings.topic, settings.domain))
        conn.commit()
        conn.close()

    return {"message": "NTFY settings saved successfully"}

# Table initialization
def initialize_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create subscriptions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            amount REAL NOT NULL,
            due_date TEXT NOT NULL,
            icon TEXT,
            color TEXT,
            account TEXT,
            autopay INTEGER DEFAULT 0,
            interval_value INTEGER DEFAULT 1,
            interval_unit TEXT CHECK (interval_unit IN ('days', 'weeks', 'months', 'years')),
            notify INTEGER DEFAULT 0,
            currency VARCHAR(10) DEFAULT 'default'
        )
    """)

    # Create user_configuration table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_configuration (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            currency TEXT DEFAULT 'USD',
            show_currency_symbol INTEGER DEFAULT 1
        )
    """)

    # Create ntfy_settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ntfy_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT NOT NULL,
            domain TEXT DEFAULT 'https://ntfy.sh'
        )
    """)

    conn.commit()
    conn.close()

# Run the scheduled notification task
@app.on_event("startup")
async def start_scheduler():
    # Initialize the database
    initialize_db()

    async def notification_task():
        while True:
            async with DB_LOCK:
                conn = get_db_connection()
                subscriptions = conn.execute("SELECT * FROM subscriptions WHERE notify = 1").fetchall()
                conn.close()

            now = datetime.now()
            tomorrow = now + timedelta(days=1)

            async with httpx.AsyncClient() as client:
                for sub in subscriptions:
                    due_dates = compute_next_due_dates(dict(sub))
                    for due_date in due_dates:
                        if now <= due_date < tomorrow:
                            topic, domain = sub["topic"], sub.get("domain", "https://ntfy.sh")
                            message = f"Subscription due: {sub['name']} - Amount: {sub['amount']} - Due Date: {due_date.strftime('%Y-%m-%d')}"
                            await client.post(f"{domain}/{topic}", data=message)

            await asyncio.sleep(24 * 60 * 60)

    asyncio.create_task(notification_task())
