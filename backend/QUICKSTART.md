# Quick Start Guide - Market Data Backend

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies (1 min)

```powershell
cd d:\strategy-forge-insight\Backend
pip install -r requirements.txt
```

### Step 2: Setup MongoDB Indexes (30 seconds)

```powershell
python scripts/setup_indexes.py
```

**Expected Output:**
```
🚀 MongoDB Index Setup
====================================================
🔗 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Setting up indexes for market_data_cache...
  ✅ Created unique index: symbol + timeframe
  ✅ Created index: last_updated
  ...

✅ All indexes created successfully!
```

### Step 3: Create Admin User (30 seconds)

**Option A: Using MongoDB Compass or Shell**

```javascript
// Connect to your MongoDB and run:
use strategy_forge

db.users.updateOne(
  { email: "your-admin-email@example.com" },
  { 
    $set: { 
      role: "admin",
      displayName: "Admin User"
    } 
  },
  { upsert: true }
)
```

**Option B: Using Python Script**

Create `scripts/create_admin.py`:

```python
import asyncio
import os
from dotenv import load_dotenv
from db.mongo import MongoDB

load_dotenv()

async def create_admin():
    await MongoDB.connect_to_mongo()
    users = MongoDB.get_collection("users")
    
    admin_email = input("Enter admin email: ")
    
    await users.update_one(
        {"email": admin_email},
        {
            "$set": {
                "role": "admin",
                "displayName": "Admin User"
            }
        },
        upsert=True
    )
    
    print(f"✅ Admin user created/updated: {admin_email}")
    await MongoDB.close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_admin())
```

Then run:
```powershell
python scripts/create_admin.py
```

### Step 4: Start the Server (10 seconds)

```powershell
uvicorn main:app --reload --port 8000
```

**Expected Output:**
```
✅ MongoDB connected
✅ Firebase initialized

============================================================
🚀 Strategy Forge API Started Successfully!
============================================================

📋 Available API Routes:
  Admin Routes:
    GET    /api/admin/market-data         - List cached market data
    POST   /api/admin/market-data/sync    - Sync market data from Yahoo
    DELETE /api/admin/market-data         - Delete cached data
    ...
============================================================
```

### Step 5: Test the API (2 minutes)

**Open your browser to:**
```
http://localhost:8000/docs
```

You'll see the interactive Swagger documentation with all endpoints!

---

## 📝 First API Calls

### 1. Get Firebase Token

First, log in via your frontend to get a Firebase authentication token. The token will be in the format:
```
Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

### 2. Test Admin Endpoint - List Market Data

```powershell
curl -X GET "http://localhost:8000/api/admin/market-data" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response (first time):**
```json
[]
```
(Empty because no data is cached yet!)

### 3. Sync Your First Market Data

```powershell
curl -X POST "http://localhost:8000/api/admin/market-data/sync" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "symbol": "NIFTY",
    "timeframe": "1d",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Successfully synced data for NIFTY",
  "symbol": "NIFTY",
  "timeframe": "1d",
  "records_fetched": 250,
  "records_merged": 250,
  "date_range": {
    "start": "2024-01-01T00:00:00",
    "end": "2024-12-31T00:00:00"
  },
  "source": "yahoo",
  "sync_timestamp": "2025-10-15T10:30:00Z"
}
```

### 4. Verify Data is Cached

```powershell
curl -X GET "http://localhost:8000/api/admin/market-data" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response:**
```json
[
  {
    "symbol": "NIFTY",
    "timeframe": "1d",
    "last_updated": "2025-10-15T10:30:00Z",
    "record_count": 250,
    "source": "yahoo",
    "date_range": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-12-31T00:00:00Z"
    }
  }
]
```

### 5. Run a Backtest (Retail User)

First, you need a strategy ID. Create one via the frontend or use an existing one.

```powershell
curl -X POST "http://localhost:8000/api/retail/backtest/run" `
  -H "Authorization: Bearer YOUR_USER_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "strategy_id": "YOUR_STRATEGY_ID",
    "symbol": "NIFTY",
    "timeframe": "1d",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'
```

**Expected Response:**
```json
{
  "backtest_id": "67890abcdef1234567890",
  "strategy_id": "YOUR_STRATEGY_ID",
  "strategy_name": "My Strategy",
  "symbol": "NIFTY",
  "timeframe": "1d",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "data_points": 250,
  "metrics": {
    "total_return": 15.5,
    "sharpe_ratio": 1.25,
    "max_drawdown": -8.5,
    "win_rate": 55.2,
    "total_trades": 120,
    "cagr": 14.2
  },
  "execution_time_ms": 1250.5,
  "data_source": "cache"
}
```

---

## 🎯 Common Symbols to Cache

Here are some popular Indian market symbols you might want to cache:

```json
[
  { "symbol": "NIFTY", "yahoo_symbol": "^NSEI" },
  { "symbol": "BANKNIFTY", "yahoo_symbol": "^NSEBANK" },
  { "symbol": "SENSEX", "yahoo_symbol": "^BSESN" },
  { "symbol": "INFY.NS", "yahoo_symbol": "INFY.NS" },
  { "symbol": "TCS.NS", "yahoo_symbol": "TCS.NS" },
  { "symbol": "RELIANCE.NS", "yahoo_symbol": "RELIANCE.NS" },
  { "symbol": "HDFCBANK.NS", "yahoo_symbol": "HDFCBANK.NS" },
  { "symbol": "ICICIBANK.NS", "yahoo_symbol": "ICICIBANK.NS" }
]
```

### Batch Sync Script

Create `scripts/batch_sync.py`:

```python
import asyncio
import requests
import json
from datetime import datetime, timedelta

# Admin token
ADMIN_TOKEN = "YOUR_ADMIN_TOKEN"
BASE_URL = "http://localhost:8000"

SYMBOLS = [
    "NIFTY",
    "BANKNIFTY",
    "INFY.NS",
    "TCS.NS",
    "RELIANCE.NS"
]

async def sync_symbol(symbol):
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
    
    payload = {
        "symbol": symbol,
        "timeframe": "1d",
        "start_date": start_date,
        "end_date": end_date
    }
    
    headers = {
        "Authorization": f"Bearer {ADMIN_TOKEN}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/admin/market-data/sync",
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ {symbol}: {result['records_fetched']} records")
    else:
        print(f"❌ {symbol}: {response.text}")

async def main():
    print("🚀 Batch syncing market data...")
    for symbol in SYMBOLS:
        await sync_symbol(symbol)
        await asyncio.sleep(1)  # Rate limiting
    print("✅ Batch sync complete!")

if __name__ == "__main__":
    asyncio.run(main())
```

Run it:
```powershell
python scripts/batch_sync.py
```

---

## 🔍 Monitoring & Health Checks

### Check Server Health

```powershell
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy"
}
```

### Get Market Data Statistics

```powershell
curl -X GET "http://localhost:8000/api/admin/market-data/stats" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### View Recent Admin Activity

```powershell
curl -X GET "http://localhost:8000/api/admin/market-data/activity-logs?limit=10" `
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🐛 Troubleshooting

### Issue: "MONGODB_URI environment variable is not set"

**Solution:** Create/update `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=strategy_forge
```

### Issue: "Invalid or expired token"

**Solution:** 
1. Ensure Firebase is properly initialized
2. Verify `GOOGLE_APPLICATION_CREDENTIALS` points to valid JSON
3. Check that user exists in Firebase Auth

### Issue: "Failed to fetch data from Yahoo Finance"

**Solution:**
1. Check internet connection
2. Verify symbol format (e.g., `INFY.NS` for NSE stocks)
3. Check Yahoo Finance rate limits
4. Try again with `force_refresh: true`

### Issue: "Strategy not found or access denied"

**Solution:**
1. Verify strategy exists in MongoDB
2. Check strategy ownership (`user_id` field)
3. Ensure strategy is public (`is_public: true`) if not owned by user

---

## 📚 Next Steps

1. **Connect Frontend** - Integrate React/Vue frontend with these APIs
2. **Create Strategies** - Use the drag-drop builder to create strategies
3. **Run Backtests** - Test strategies on historical data
4. **Monitor Performance** - Track backtest results and metrics
5. **Optimize** - Use admin tools to pre-cache popular symbols

---

## 🎉 You're Ready!

Your backend is now fully functional with:
- ✅ Market data caching
- ✅ Yahoo Finance integration
- ✅ Role-based access control
- ✅ Comprehensive backtesting
- ✅ Activity logging
- ✅ Optimized indexes

**Happy backtesting! 🚀**
