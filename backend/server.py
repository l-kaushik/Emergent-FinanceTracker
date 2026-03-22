from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import resend
import asyncio
from weasyprint import HTML
from io import BytesIO
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production-123456789')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
security = HTTPBearer()

# Resend Email Setup
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class AccountCreate(BaseModel):
    name: str
    type: str  # savings, checking, credit, investment
    initial_balance: float = 0.0
    currency: str = "USD"

class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str
    balance: float
    currency: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionCreate(BaseModel):
    account_id: str
    type: str  # income, expense, transfer
    category: str
    amount: float
    description: Optional[str] = None
    date: Optional[datetime] = None

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    account_id: str
    type: str
    category: str
    amount: float
    description: Optional[str] = None
    date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RecurringTransactionCreate(BaseModel):
    account_id: str
    type: str  # income, expense
    category: str
    amount: float
    description: Optional[str] = None
    frequency: str  # daily, weekly, monthly, yearly, custom
    custom_days: Optional[int] = None  # for custom frequency
    start_date: datetime
    end_date: Optional[datetime] = None

class RecurringTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    account_id: str
    type: str
    category: str
    amount: float
    description: Optional[str] = None
    frequency: str
    custom_days: Optional[int] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    last_executed: Optional[datetime] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReportRequest(BaseModel):
    month: int  # 1-12
    year: int
    delivery_method: str  # email, pdf, in-app

class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

# ============ AUTHENTICATION ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user_doc is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(email=user_data.email, name=user_data.name)
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token({"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    access_token = create_access_token({"sub": user.id})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ ACCOUNT ENDPOINTS ============

@api_router.post("/accounts", response_model=Account)
async def create_account(account_data: AccountCreate, current_user: User = Depends(get_current_user)):
    account = Account(user_id=current_user.id, name=account_data.name, type=account_data.type, 
                     balance=account_data.initial_balance, currency=account_data.currency)
    account_dict = account.model_dump()
    account_dict['created_at'] = account_dict['created_at'].isoformat()
    await db.accounts.insert_one(account_dict)
    return account

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(current_user: User = Depends(get_current_user)):
    accounts = await db.accounts.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for acc in accounts:
        if isinstance(acc.get('created_at'), str):
            acc['created_at'] = datetime.fromisoformat(acc['created_at'])
    return accounts

@api_router.get("/accounts/{account_id}", response_model=Account)
async def get_account(account_id: str, current_user: User = Depends(get_current_user)):
    account = await db.accounts.find_one({"id": account_id, "user_id": current_user.id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    if isinstance(account.get('created_at'), str):
        account['created_at'] = datetime.fromisoformat(account['created_at'])
    return Account(**account)

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, current_user: User = Depends(get_current_user)):
    result = await db.accounts.delete_one({"id": account_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    await db.transactions.delete_many({"account_id": account_id})
    return {"message": "Account deleted successfully"}

# ============ TRANSACTION ENDPOINTS ============

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(tx_data: TransactionCreate, current_user: User = Depends(get_current_user)):
    account = await db.accounts.find_one({"id": tx_data.account_id, "user_id": current_user.id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    transaction = Transaction(
        user_id=current_user.id,
        account_id=tx_data.account_id,
        type=tx_data.type,
        category=tx_data.category,
        amount=tx_data.amount,
        description=tx_data.description,
        date=tx_data.date or datetime.now(timezone.utc)
    )
    
    # Update account balance
    balance_change = transaction.amount if transaction.type == "income" else -transaction.amount
    await db.accounts.update_one(
        {"id": tx_data.account_id},
        {"$set": {"balance": account['balance'] + balance_change}}
    )
    
    tx_dict = transaction.model_dump()
    tx_dict['date'] = tx_dict['date'].isoformat()
    tx_dict['created_at'] = tx_dict['created_at'].isoformat()
    await db.transactions.insert_one(tx_dict)
    
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(account_id: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {"user_id": current_user.id}
    if account_id:
        query["account_id"] = account_id
    
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    for tx in transactions:
        if isinstance(tx.get('date'), str):
            tx['date'] = datetime.fromisoformat(tx['date'])
        if isinstance(tx.get('created_at'), str):
            tx['created_at'] = datetime.fromisoformat(tx['created_at'])
    return transactions

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: User = Depends(get_current_user)):
    tx = await db.transactions.find_one({"id": transaction_id, "user_id": current_user.id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Reverse balance change
    balance_change = -tx['amount'] if tx['type'] == "income" else tx['amount']
    await db.accounts.update_one(
        {"id": tx['account_id']},
        {"$inc": {"balance": balance_change}}
    )
    
    await db.transactions.delete_one({"id": transaction_id})
    return {"message": "Transaction deleted successfully"}

# ============ RECURRING TRANSACTION ENDPOINTS ============

@api_router.post("/recurring-transactions", response_model=RecurringTransaction)
async def create_recurring_transaction(rt_data: RecurringTransactionCreate, current_user: User = Depends(get_current_user)):
    account = await db.accounts.find_one({"id": rt_data.account_id, "user_id": current_user.id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    recurring_tx = RecurringTransaction(
        user_id=current_user.id,
        account_id=rt_data.account_id,
        type=rt_data.type,
        category=rt_data.category,
        amount=rt_data.amount,
        description=rt_data.description,
        frequency=rt_data.frequency,
        custom_days=rt_data.custom_days,
        start_date=rt_data.start_date,
        end_date=rt_data.end_date
    )
    
    rt_dict = recurring_tx.model_dump()
    rt_dict['start_date'] = rt_dict['start_date'].isoformat()
    if rt_dict['end_date']:
        rt_dict['end_date'] = rt_dict['end_date'].isoformat()
    rt_dict['created_at'] = rt_dict['created_at'].isoformat()
    await db.recurring_transactions.insert_one(rt_dict)
    
    return recurring_tx

@api_router.get("/recurring-transactions", response_model=List[RecurringTransaction])
async def get_recurring_transactions(current_user: User = Depends(get_current_user)):
    recurring_txs = await db.recurring_transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    for rt in recurring_txs:
        if isinstance(rt.get('start_date'), str):
            rt['start_date'] = datetime.fromisoformat(rt['start_date'])
        if rt.get('end_date') and isinstance(rt['end_date'], str):
            rt['end_date'] = datetime.fromisoformat(rt['end_date'])
        if rt.get('last_executed') and isinstance(rt['last_executed'], str):
            rt['last_executed'] = datetime.fromisoformat(rt['last_executed'])
        if isinstance(rt.get('created_at'), str):
            rt['created_at'] = datetime.fromisoformat(rt['created_at'])
    return recurring_txs

@api_router.delete("/recurring-transactions/{recurring_id}")
async def delete_recurring_transaction(recurring_id: str, current_user: User = Depends(get_current_user)):
    result = await db.recurring_transactions.delete_one({"id": recurring_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recurring transaction not found")
    return {"message": "Recurring transaction deleted successfully"}

@api_router.post("/recurring-transactions/execute")
async def execute_recurring_transactions(current_user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    recurring_txs = await db.recurring_transactions.find(
        {"user_id": current_user.id, "is_active": True}, {"_id": 0}
    ).to_list(1000)
    
    executed_count = 0
    for rt in recurring_txs:
        if isinstance(rt.get('start_date'), str):
            rt['start_date'] = datetime.fromisoformat(rt['start_date'])
        if rt.get('end_date') and isinstance(rt['end_date'], str):
            rt['end_date'] = datetime.fromisoformat(rt['end_date'])
        if rt.get('last_executed') and isinstance(rt['last_executed'], str):
            rt['last_executed'] = datetime.fromisoformat(rt['last_executed'])
        
        if rt.get('end_date') and now > rt['end_date']:
            continue
        
        if now < rt['start_date']:
            continue
        
        should_execute = False
        if not rt.get('last_executed'):
            should_execute = True
        else:
            days_since_last = (now - rt['last_executed']).days
            freq_map = {"daily": 1, "weekly": 7, "monthly": 30, "yearly": 365}
            required_days = freq_map.get(rt['frequency'], rt.get('custom_days', 30))
            if days_since_last >= required_days:
                should_execute = True
        
        if should_execute:
            tx_data = TransactionCreate(
                account_id=rt['account_id'],
                type=rt['type'],
                category=rt['category'],
                amount=rt['amount'],
                description=rt.get('description', f"Recurring: {rt['category']}"),
                date=now
            )
            await create_transaction(tx_data, current_user)
            await db.recurring_transactions.update_one(
                {"id": rt['id']},
                {"$set": {"last_executed": now.isoformat()}}
            )
            executed_count += 1
    
    return {"message": f"Executed {executed_count} recurring transactions"}

# ============ DASHBOARD ENDPOINTS ============

@api_router.get("/dashboard/summary")
async def get_dashboard_summary(current_user: User = Depends(get_current_user)):
    accounts = await db.accounts.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    total_balance = sum(acc['balance'] for acc in accounts)
    
    now = datetime.now(timezone.utc)
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    
    for tx in transactions:
        if isinstance(tx.get('date'), str):
            tx['date'] = datetime.fromisoformat(tx['date'])
    
    month_transactions = [tx for tx in transactions if tx['date'] >= start_of_month]
    
    total_income = sum(tx['amount'] for tx in month_transactions if tx['type'] == 'income')
    total_expenses = sum(tx['amount'] for tx in month_transactions if tx['type'] == 'expense')
    
    # Recent transactions
    recent_transactions = sorted(transactions, key=lambda x: x['date'], reverse=True)[:10]
    
    # Category breakdown
    category_breakdown = {}
    for tx in month_transactions:
        cat = tx['category']
        if cat not in category_breakdown:
            category_breakdown[cat] = {"income": 0, "expense": 0}
        if tx['type'] == 'income':
            category_breakdown[cat]['income'] += tx['amount']
        elif tx['type'] == 'expense':
            category_breakdown[cat]['expense'] += tx['amount']
    
    return {
        "total_balance": total_balance,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": total_income - total_expenses,
        "accounts_count": len(accounts),
        "recent_transactions": recent_transactions,
        "category_breakdown": category_breakdown
    }

# ============ REPORT ENDPOINTS ============

def generate_report_html(user: User, month: int, year: int, data: dict) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; }}
            h1 {{ color: #0F172A; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th, td {{ border: 1px solid #E2E8F0; padding: 12px; text-align: left; }}
            th {{ background-color: #0F172A; color: white; }}
            .summary {{ background-color: #F8FAFC; padding: 20px; margin: 20px 0; }}
            .income {{ color: #10B981; font-weight: bold; }}
            .expense {{ color: #F43F5E; font-weight: bold; }}
        </style>
    </head>
    <body>
        <h1>Financial Report - {year}/{month:02d}</h1>
        <p>Generated for: {user.name} ({user.email})</p>
        
        <div class="summary">
            <h2>Summary</h2>
            <p><strong>Total Income:</strong> <span class="income">${data['total_income']:.2f}</span></p>
            <p><strong>Total Expenses:</strong> <span class="expense">${data['total_expenses']:.2f}</span></p>
            <p><strong>Net Savings:</strong> ${data['net_savings']:.2f}</p>
            <p><strong>Total Balance:</strong> ${data['total_balance']:.2f}</p>
        </div>
        
        <h2>Transactions</h2>
        <table>
            <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
            </tr>
            {''.join(f'''<tr>
                <td>{tx['date'].strftime('%Y-%m-%d')}</td>
                <td>{tx['category']}</td>
                <td>{tx.get('description', '-')}</td>
                <td>{tx['type']}</td>
                <td class="{tx['type']}">${tx['amount']:.2f}</td>
            </tr>''' for tx in data['transactions'])}
        </table>
    </body>
    </html>
    """

@api_router.post("/reports/generate")
async def generate_report(report_req: ReportRequest, current_user: User = Depends(get_current_user)):
    start_date = datetime(report_req.year, report_req.month, 1, tzinfo=timezone.utc)
    if report_req.month == 12:
        end_date = datetime(report_req.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(report_req.year, report_req.month + 1, 1, tzinfo=timezone.utc)
    
    transactions = await db.transactions.find({"user_id": current_user.id}, {"_id": 0}).to_list(10000)
    
    for tx in transactions:
        if isinstance(tx.get('date'), str):
            tx['date'] = datetime.fromisoformat(tx['date'])
    
    month_transactions = [tx for tx in transactions if start_date <= tx['date'] < end_date]
    
    total_income = sum(tx['amount'] for tx in month_transactions if tx['type'] == 'income')
    total_expenses = sum(tx['amount'] for tx in month_transactions if tx['type'] == 'expense')
    
    accounts = await db.accounts.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    total_balance = sum(acc['balance'] for acc in accounts)
    
    report_data = {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": total_income - total_expenses,
        "total_balance": total_balance,
        "transactions": month_transactions
    }
    
    html_content = generate_report_html(current_user, report_req.month, report_req.year, report_data)
    
    if report_req.delivery_method == "pdf":
        pdf_bytes = HTML(string=html_content).write_pdf()
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        return {"pdf_data": pdf_base64, "message": "PDF report generated"}
    
    elif report_req.delivery_method == "email":
        if not resend.api_key:
            raise HTTPException(status_code=500, detail="Email service not configured")
        
        params = {
            "from": SENDER_EMAIL,
            "to": [current_user.email],
            "subject": f"Financial Report - {report_req.year}/{report_req.month:02d}",
            "html": html_content
        }
        
        try:
            email = await asyncio.to_thread(resend.Emails.send, params)
            return {"message": f"Report sent to {current_user.email}", "email_id": email.get('id')}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
    
    else:  # in-app
        return {"html_content": html_content, "data": report_data, "message": "Report generated"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
