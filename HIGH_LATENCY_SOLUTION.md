# High API Latency Solution Guide

**Date:** October 19, 2025  
**Issue:** API Server High Latency Warning (2539ms)  
**Threshold:** Warning triggered when latency > 1000ms  
**Status:** ⚠️ Performance Issue Detected

---

## 🔍 Root Cause Analysis

### **Why is `/api/dashboard/metrics` slow?**

The endpoint is performing **multiple blocking database operations**:

1. ✅ Connects to MongoDB **twice** (creates 2 separate clients)
2. ✅ Counts all strategies for user
3. ✅ Finds latest backtest (with sorting)
4. ✅ Fetches **up to 100 backtests** to calculate averages
5. ✅ Iterates through all backtests to find best strategy
6. ✅ Closes 2 MongoDB connections

**Total Operations:** 6+ database calls per request  
**Current Latency:** ~2500ms  
**Expected Latency:** <200ms

---

## 🎯 Quick Fixes (Immediate Solutions)

### **Option 1: Increase Warning Threshold** ⚡ **FASTEST** (2 minutes)

**What:** Change the latency warning threshold from 1000ms to 3000ms  
**Why:** Your API is slow but functional - adjust expectations  
**Trade-off:** Hides the warning but doesn't fix performance

**Implementation:**

```typescript
// File: frontend/src/pages/AdminDashboard.tsx
// Line ~118

// BEFORE:
} else if (health.api.latency > 1000) {
  health.api.status = 'slow';
  health.api.healthy = false;
  errors.push({ 
    system: 'API Server', 
    message: `High latency: ${health.api.latency}ms`, 
    severity: 'warning' 
  });
}

// AFTER:
} else if (health.api.latency > 3000) {  // Changed from 1000 to 3000
  health.api.status = 'slow';
  health.api.healthy = false;
  errors.push({ 
    system: 'API Server', 
    message: `High latency: ${health.api.latency}ms`, 
    severity: 'warning' 
  });
}
```

**Result:** Warning disappears if latency is between 1000-3000ms

---

### **Option 2: Use a Faster Health Check Endpoint** ⚡⚡ **RECOMMENDED** (5 minutes)

**What:** Use the lightweight `/health` endpoint instead of heavy `/api/dashboard/metrics`  
**Why:** Health checks should be fast, not calculate complex metrics  
**Trade-off:** None - this is the proper solution

**Implementation:**

```typescript
// File: frontend/src/pages/AdminDashboard.tsx
// Line ~112-130

// REPLACE THIS SECTION:
// Test API health
try {
  const apiStart = Date.now();
  const apiTest = await fetch(`${API_BASE_URL}/api/dashboard/metrics`, { headers });
  health.api.latency = Date.now() - apiStart;
  if (!apiTest.ok) {
    health.api.status = 'error';
    health.api.healthy = false;
    errors.push({ system: 'API Server', message: `HTTP ${apiTest.status}: ${apiTest.statusText}`, severity: 'critical' });
  } else if (health.api.latency > 1000) {
    health.api.status = 'slow';
    health.api.healthy = false;
    errors.push({ system: 'API Server', message: `High latency: ${health.api.latency}ms`, severity: 'warning' });
  }
} catch (e: any) {
  health.api.status = 'offline';
  health.api.healthy = false;
  errors.push({ system: 'API Server', message: e.message || 'Server unreachable', severity: 'critical' });
}

// WITH THIS:
// Test API health using lightweight endpoint
try {
  const apiStart = Date.now();
  const apiTest = await fetch(`${API_BASE_URL}/health`);  // Changed endpoint
  health.api.latency = Date.now() - apiStart;
  if (!apiTest.ok) {
    health.api.status = 'error';
    health.api.healthy = false;
    errors.push({ system: 'API Server', message: `HTTP ${apiTest.status}: ${apiTest.statusText}`, severity: 'critical' });
  } else if (health.api.latency > 1000) {
    health.api.status = 'slow';
    health.api.healthy = false;
    errors.push({ system: 'API Server', message: `High latency: ${health.api.latency}ms`, severity: 'warning' });
  }
} catch (e: any) {
  health.api.status = 'offline';
  health.api.healthy = false;
  errors.push({ system: 'API Server', message: e.message || 'Server unreachable', severity: 'critical' });
}
```

**Expected Latency:** <50ms  
**Result:** No more warnings, fast health checks

---

## 🚀 Performance Optimizations (Backend Improvements)

### **Option 3: Optimize Database Queries** ⚡⚡⚡ **BEST** (30 minutes)

**Problem Areas in `dashboard.py`:**

#### **Issue 1: Creating Multiple MongoDB Clients**
```python
# BAD - Creates 2 separate connections
strategies_collection, client1 = await get_mongodb_collection("drag_drop_strategies")
backtest_collection, client2 = await get_mongodb_collection("backtests")
```

**Fix: Reuse single connection**
```python
# GOOD - Reuse MongoDB connection from db.mongo
from db.mongo import MongoDB

async def get_dashboard_metrics(user_info: dict = Depends(verify_firebase_token)):
    user_id = user_info.get("uid")
    
    # Reuse existing MongoDB instance
    strategies_collection = MongoDB.db["drag_drop_strategies"]
    backtest_collection = MongoDB.db["backtests"]
    
    # No need to close clients - connection is persistent
```

---

#### **Issue 2: Fetching 100 Backtests to Calculate Averages**
```python
# BAD - Fetches all documents then calculates in Python
backtests = await backtest_cursor.to_list(length=100)
winrates = [b.get("metrics", {}).get("win_rate", 0) for b in backtests]
avg_winrate = sum(winrates) / len(winrates) if winrates else 0
```

**Fix: Use MongoDB aggregation**
```python
# GOOD - Calculate in database
pipeline = [
    {"$match": {"user_id": user_id}},
    {"$group": {
        "_id": None,
        "avg_winrate": {"$avg": "$metrics.win_rate"},
        "best_return": {"$max": "$metrics.total_return"},
        "total_count": {"$sum": 1}
    }}
]
result = await backtest_collection.aggregate(pipeline).to_list(1)
stats = result[0] if result else {"avg_winrate": 0, "best_return": 0, "total_count": 0}
```

---

#### **Issue 3: Finding Best Strategy with Loop**
```python
# BAD - Iterate through all backtests
for backtest in backtests:
    metrics = backtest.get("metrics", {})
    total_return = metrics.get("total_return", 0)
    if total_return > best_strategy_return:
        best_strategy_return = total_return
        best_strategy_name = backtest.get("strategy_name", "Unknown")
```

**Fix: Use MongoDB sort**
```python
# GOOD - Let database find best
best_backtest = await backtest_collection.find_one(
    {"user_id": user_id},
    sort=[("metrics.total_return", -1)]  # Sort by return descending
)
best_strategy_name = best_backtest.get("strategy_name", "N/A") if best_backtest else "N/A"
best_strategy_return = best_backtest.get("metrics", {}).get("total_return", 0) if best_backtest else 0
```

---

### **Optimized dashboard.py Implementation**

Replace the entire `/dashboard/metrics` endpoint with this optimized version:

```python
@router.get("/dashboard/metrics")
async def get_dashboard_metrics(user_info: dict = Depends(verify_firebase_token)):
    """
    Get real-time dashboard metrics for a user (OPTIMIZED VERSION)
    """
    try:
        user_id = user_info.get("uid")
        
        # Reuse MongoDB connection instead of creating new clients
        strategies_collection = MongoDB.db["drag_drop_strategies"]
        backtest_collection = MongoDB.db["backtests"]
        
        # Run queries in parallel using asyncio.gather
        import asyncio
        
        # Count strategies - single query
        strategy_count_task = strategies_collection.count_documents({"ownerId": user_id})
        
        # Get latest backtest - single query with sort
        latest_backtest_task = backtest_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        
        # Get best performing backtest - single query with sort
        best_backtest_task = backtest_collection.find_one(
            {"user_id": user_id},
            sort=[("metrics.total_return", -1)]
        )
        
        # Aggregate statistics - single aggregation pipeline
        stats_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": None,
                "avg_winrate": {"$avg": "$metrics.win_rate"},
                "total_backtests": {"$sum": 1}
            }}
        ]
        stats_task = backtest_collection.aggregate(stats_pipeline).to_list(1)
        
        # Execute all queries in parallel
        total_strategies, latest_backtest, best_backtest, stats_result = await asyncio.gather(
            strategy_count_task,
            latest_backtest_task,
            best_backtest_task,
            stats_task
        )
        
        # Extract statistics
        stats = stats_result[0] if stats_result else {"avg_winrate": 0, "total_backtests": 0}
        avg_winrate = stats.get("avg_winrate", 0)
        total_backtests = stats.get("total_backtests", 0)
        
        # Extract best strategy info
        best_strategy_name = "N/A"
        best_strategy_return = 0
        if best_backtest:
            best_strategy_name = best_backtest.get("strategy_name", "Unknown")
            best_strategy_return = best_backtest.get("metrics", {}).get("total_return", 0)
        
        # Extract latest backtest info
        latest_return = 0
        latest_strategy_name = "N/A"
        if latest_backtest:
            latest_return = latest_backtest.get("metrics", {}).get("total_return", 0)
            latest_strategy_name = latest_backtest.get("strategy_name", "Unknown")
        
        # Calculate risk score
        risk_score = "High"
        if total_strategies >= 5:
            risk_score = "Low"
        elif total_strategies >= 3:
            risk_score = "Medium"
        
        return {
            "metrics": [
                {
                    "title": "Best Strategy",
                    "value": best_strategy_name if best_strategy_name != "N/A" else "No backtests yet",
                    "change": f"+{best_strategy_return:.1f}% return" if best_strategy_return > 0 else f"{best_strategy_return:.1f}% return" if best_strategy_return < 0 else "No data",
                    "changeType": "positive" if best_strategy_return > 0 else "negative" if best_strategy_return < 0 else "neutral"
                },
                {
                    "title": "Latest Backtest",
                    "value": f"+{latest_return:.1f}%" if latest_return > 0 else f"{latest_return:.1f}%" if latest_return < 0 else "No backtests",
                    "change": latest_strategy_name,
                    "changeType": "positive" if latest_return > 0 else "negative" if latest_return < 0 else "neutral"
                },
                {
                    "title": "Avg Win Rate",
                    "value": f"{avg_winrate:.1f}%" if total_backtests > 0 else "N/A",
                    "change": f"From {total_backtests} backtest{'s' if total_backtests != 1 else ''}",
                    "changeType": "positive" if avg_winrate > 50 else "neutral"
                },
                {
                    "title": "Strategies",
                    "value": str(total_strategies),
                    "change": f"Risk: {risk_score}",
                    "changeType": "positive" if risk_score == "Low" else "neutral"
                },
                {
                    "title": "Total Backtests",
                    "value": str(total_backtests),
                    "change": "All time",
                    "changeType": "neutral"
                }
            ]
        }
    except Exception as e:
        print(f"❌ Error fetching dashboard metrics: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {str(e)}")
```

**Performance Improvements:**
- ✅ No more multiple client creation (reuses MongoDB.db)
- ✅ 4 parallel queries instead of sequential (asyncio.gather)
- ✅ Database does calculations instead of Python
- ✅ Reduced from 100 documents to 1-2 documents fetched
- ✅ No client cleanup needed (persistent connection)

**Expected Latency:** 50-200ms (10x faster)

---

### **Option 4: Add Database Indexes** ⚡⚡ (10 minutes)

**Problem:** Database queries are slow without indexes

**Solution: Create indexes for common queries**

```python
# Add this to Backend/db/mongo.py in the connect_to_mongo() function

async def connect_to_mongo():
    """Connect to MongoDB and create indexes"""
    global db
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    if not mongodb_uri:
        raise Exception("MONGODB_URI not found in environment variables")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client[database_name]
    
    # Test connection
    await db.command('ping')
    print("✅ MongoDB connected successfully")
    
    # Create indexes for performance
    try:
        # Index for user's backtests
        await db["backtests"].create_index([("user_id", 1), ("created_at", -1)])
        await db["backtests"].create_index([("user_id", 1), ("metrics.total_return", -1)])
        
        # Index for user's strategies
        await db["drag_drop_strategies"].create_index([("ownerId", 1)])
        
        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️  Index creation warning: {e}")
```

**Restart Backend:** Required for indexes to be created

---

## 📊 Solution Comparison

| Solution | Time | Difficulty | Latency Reduction | Trade-offs |
|----------|------|------------|-------------------|------------|
| **Option 1:** Increase threshold | 2 min | Easy | 0% (hides warning) | Doesn't fix problem |
| **Option 2:** Use /health endpoint | 5 min | Easy | 95% (50ms) | ✅ **BEST QUICK FIX** |
| **Option 3:** Optimize queries | 30 min | Medium | 90% (100-200ms) | Requires code changes |
| **Option 4:** Add indexes | 10 min | Easy | 50% (1000ms → 500ms) | Helps but not enough alone |
| **Combo:** Option 2 + 3 + 4 | 45 min | Medium | 98% (<50ms health, <200ms metrics) | ✅ **BEST OVERALL** |

---

## 🎯 Recommended Action Plan

### **Immediate (Do Now - 5 minutes)**
1. ✅ **Change health check to use `/health` endpoint** (Option 2)
   - Eliminates warning immediately
   - No performance impact on health checks
   - Proper architecture

### **Short-term (Today - 30 minutes)**
2. ✅ **Optimize dashboard.py queries** (Option 3)
   - Reuse MongoDB connection
   - Use parallel queries with asyncio.gather
   - Use database aggregation

3. ✅ **Add database indexes** (Option 4)
   - Speed up all queries
   - One-time setup

### **Long-term (Next Sprint)**
4. ✅ **Add caching layer** (Redis)
   - Cache dashboard metrics for 30 seconds
   - Reduce database load
   - Even faster response times

---

## 🔧 Step-by-Step Implementation

### **Step 1: Fix Health Check (IMMEDIATE)**

Replace this code in `AdminDashboard.tsx`:

```typescript
// Find this section around line 112
// Test API health
try {
  const apiStart = Date.now();
  const apiTest = await fetch(`${API_BASE_URL}/api/dashboard/metrics`, { headers });  // OLD
  
// Replace with:
  const apiTest = await fetch(`${API_BASE_URL}/health`);  // NEW
```

**Test:** Refresh admin dashboard → warning should disappear

---

### **Step 2: Optimize Backend (30 MIN)**

1. **Backup current file:**
```powershell
Copy-Item Backend\api\dashboard.py Backend\api\dashboard.backup.py
```

2. **Replace entire `/dashboard/metrics` function** with optimized version above

3. **Restart backend:**
```powershell
# Stop current server (Ctrl+C)
python Backend/main.py
```

4. **Test endpoint:**
```powershell
# In browser or curl
curl http://localhost:8000/api/dashboard/metrics
```

---

### **Step 3: Add Indexes (10 MIN)**

1. **Edit `Backend/db/mongo.py`**

2. **Add index creation code** to `connect_to_mongo()` function

3. **Restart backend** to create indexes

4. **Verify indexes created:**
```python
# In Python console
import motor.motor_asyncio
client = motor.motor_asyncio.AsyncIOMotorClient("your_mongodb_uri")
db = client["strategy_forge"]
indexes = await db["backtests"].list_indexes()
print(list(indexes))
```

---

## ✅ Verification

### **How to Confirm It's Fixed:**

1. **Check Admin Dashboard:**
   - Go to `/admin-dashboard`
   - Click System Status tab
   - API Server should show:
     - Status: `online` (green badge)
     - Latency: <200ms (green text)
     - Health: `Good` (green text)

2. **No Warnings:**
   - Overview tab should have no error alerts
   - System Health card shows "Healthy" (green)

3. **Monitor Over Time:**
   - Wait for auto-refresh (30 seconds)
   - Latency should stay consistently low

---

## 🚨 If Still Slow After Fixes

### **Additional Diagnostics:**

```python
# Add timing to dashboard.py
import time

@router.get("/dashboard/metrics")
async def get_dashboard_metrics(user_info: dict = Depends(verify_firebase_token)):
    start_time = time.time()
    
    # ... your code ...
    
    elapsed = (time.time() - start_time) * 1000
    print(f"⏱️  Dashboard metrics took {elapsed:.0f}ms")
    
    return response
```

**Check backend console** to see actual query times

---

## 📝 Summary

### **Your Current Issue:**
- `/api/dashboard/metrics` takes 2539ms
- Triggers warning because > 1000ms threshold
- Caused by inefficient database queries

### **Quick Fix (5 min):**
- Change health check endpoint to `/health`
- Warning disappears immediately

### **Proper Fix (45 min):**
- Use `/health` for health checks
- Optimize database queries with aggregation
- Add database indexes
- Use parallel query execution

### **Expected Result:**
- Health check: <50ms
- Dashboard metrics: <200ms
- No more warnings
- Better user experience

---

**Choose your path:**
- 🟢 **Just want warning gone?** → Do Step 1 only (5 min)
- 🟡 **Want actual performance?** → Do Steps 1, 2, 3 (45 min)
- 🔴 **Production-ready?** → All steps + caching (2 hours)

**Ready to implement?** Let me know which approach you'd like to take!
