# Hybrid Historical Market Data + Backtesting System

## Overview

This backend system provides a comprehensive solution for caching historical market data and executing backtests. It supports both **Admin** and **Retail** user roles with distinct capabilities.

### Key Features

- ✅ **MongoDB Caching Layer** - Fast, reliable market data storage
- ✅ **Yahoo Finance Integration** - Dynamic data fetching with rate limiting
- ✅ **Hybrid Data Flow** - Cache-first strategy with fallback to live fetch
- ✅ **Role-Based Access Control** - Admin and Retail user permissions
- ✅ **Comprehensive Backtesting** - Advanced metrics and equity curves
- ✅ **Activity Logging** - Track all admin operations
- ✅ **Optimized Indexes** - Fast queries on large datasets

---

## Architecture

### Collections

#### 1. `market_data_cache`
Stores historical OHLCV data for various symbols and timeframes.

```json
{
  "symbol": "RELIANCE.NS",
  "timeframe": "15m",
  "last_updated": "2025-10-15T00:00:00Z",
  "source": "yahoo",
  "record_count": 1500,
  "data": [
    {
      "timestamp": "2025-10-01T09:15:00Z",
      "open": 2500.50,
      "high": 2510.75,
      "low": 2498.25,
      "close": 2505.00,
      "volume": 125000
    }
  ]
}
```

**Indexes:**
- `symbol + timeframe` (unique)
- `last_updated`
- `source`
- `data.timestamp`

#### 2. `admin_activity_log`
Tracks all admin operations for audit purposes.

```json
{
  "action": "sync",
  "target": "market_data",
  "details": {
    "symbol": "NIFTY",
    "timeframe": "1d",
    "records_fetched": 500
  },
  "admin_uid": "firebase_uid",
  "admin_email": "admin@example.com",
  "timestamp": "2025-10-15T10:30:00Z",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

**Indexes:**
- `timestamp`
- `admin_uid`
- `action + target`

#### 3. `backtests`
Stores backtest results for retail users.

```json
{
  "strategy_id": "strategy_object_id",
  "user_id": "firebase_uid",
  "symbol": "INFY.NS",
  "timeframe": "1d",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "metrics": {
    "total_return": 15.5,
    "sharpe_ratio": 1.25,
    "max_drawdown": -8.5
  },
  "created_at": "2025-10-15T10:00:00Z"
}
```

**Indexes:**
- `user_id`
- `user_id + created_at`
- `user_id + strategy_id`
- `user_id + symbol`

---

## API Endpoints

### Admin Endpoints (Requires `admin` role)

#### **GET** `/api/admin/market-data`
List all cached market data with metadata.

**Response:**
```json
[
  {
    "symbol": "NIFTY",
    "timeframe": "1d",
    "last_updated": "2025-10-15T00:00:00Z",
    "record_count": 2500,
    "source": "yahoo",
    "date_range": {
      "start": "2015-01-01T00:00:00Z",
      "end": "2025-10-14T00:00:00Z"
    }
  }
]
```

---

#### **POST** `/api/admin/market-data/sync`
Sync market data from Yahoo Finance and update cache.

**Request:**
```json
{
  "symbol": "RELIANCE.NS",
  "timeframe": "1d",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "force_refresh": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully synced data for RELIANCE.NS",
  "symbol": "RELIANCE.NS",
  "timeframe": "1d",
  "records_fetched": 250,
  "records_merged": 250,
  "date_range": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-12-31T00:00:00Z"
  },
  "source": "yahoo",
  "sync_timestamp": "2025-10-15T10:30:00Z"
}
```

**Logic:**
1. Check if `symbol + timeframe` exists in cache
2. Fetch data from Yahoo Finance for specified date range
3. Merge new data with existing (no duplicates, prefer newer data)
4. Update `last_updated` timestamp
5. Log activity in `admin_activity_log`

**Parameters:**
- `symbol` - Stock ticker (e.g., `RELIANCE.NS`, `^NSEI`, `NIFTY`)
- `timeframe` - Data interval: `1d`, `1h`, `30m`, `15m`
- `start_date` - Start date in `YYYY-MM-DD` format
- `end_date` - End date in `YYYY-MM-DD` format
- `force_refresh` - If `true`, replace all existing data

---

#### **DELETE** `/api/admin/market-data`
Delete cached market data for a symbol.

**Request:**
```json
{
  "symbol": "TCS.NS",
  "timeframe": "1d"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Deleted 1 record(s)",
  "symbol": "TCS.NS",
  "timeframe": "1d",
  "deleted_count": 1
}
```

**Note:** If `timeframe` is not provided, all timeframes for the symbol are deleted.

---

#### **GET** `/api/admin/market-data/stats`
Get statistics about cached market data.

**Response:**
```json
{
  "total_symbols": 25,
  "total_records": 50000,
  "total_cache_entries": 50,
  "by_timeframe": {
    "1d": {
      "symbol_count": 25,
      "record_count": 40000
    },
    "1h": {
      "symbol_count": 10,
      "record_count": 10000
    }
  },
  "recent_updates": [
    {
      "symbol": "NIFTY",
      "timeframe": "1d",
      "last_updated": "2025-10-15T10:00:00Z",
      "record_count": 2500
    }
  ]
}
```

---

#### **GET** `/api/admin/market-data/activity-logs`
Get admin activity logs with optional filtering.

**Query Parameters:**
- `limit` - Max results (default: 100)
- `skip` - Pagination offset (default: 0)
- `action` - Filter by action: `sync`, `delete`, `create`, `update`
- `target` - Filter by target: `market_data`, `strategy`, `user`

**Response:**
```json
{
  "logs": [
    {
      "action": "sync",
      "target": "market_data",
      "details": {
        "symbol": "NIFTY",
        "records_fetched": 500
      },
      "admin_uid": "admin_firebase_uid",
      "admin_email": "admin@example.com",
      "timestamp": "2025-10-15T10:30:00Z"
    }
  ],
  "count": 1,
  "limit": 100,
  "skip": 0
}
```

---

### Retail Endpoints (Requires authentication)

#### **POST** `/api/retail/backtest/run`
Run a backtest on a strategy with market data.

**Request:**
```json
{
  "strategy_id": "67890abcdef1234567890",
  "symbol": "INFY.NS",
  "timeframe": "1d",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

**Response:**
```json
{
  "backtest_id": "backtest_id_12345",
  "strategy_id": "67890abcdef1234567890",
  "strategy_name": "My Strategy",
  "symbol": "INFY.NS",
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
    "winning_trades": 66,
    "losing_trades": 54,
    "avg_win": 2.5,
    "avg_loss": -1.8,
    "cagr": 14.2,
    "volatility": 18.5,
    "calmar_ratio": 1.67
  },
  "equity_curve": [
    {
      "date": "2024-01-01T00:00:00Z",
      "equity": 1.0,
      "drawdown": 0.0
    },
    {
      "date": "2024-01-02T00:00:00Z",
      "equity": 1.015,
      "drawdown": 0.0
    }
  ],
  "execution_time_ms": 1250.5,
  "created_at": "2025-10-15T10:00:00Z",
  "data_source": "cache"
}
```

**Logic:**
1. Validate strategy ownership or public access
2. Fetch market data from cache or Yahoo Finance
3. Apply strategy logic (currently simplified to buy-and-hold)
4. Calculate comprehensive metrics
5. Generate equity curve with drawdown
6. Store result in `backtests` collection
7. Return detailed results

**Validation:**
- User must own the strategy OR strategy must be public
- Date range must be valid
- Symbol must exist

---

#### **GET** `/api/retail/backtest/history`
Get backtest history for authenticated user.

**Query Parameters:**
- `strategy_id` - Filter by strategy (optional)
- `symbol` - Filter by symbol (optional)
- `limit` - Results per page (1-100, default: 10)
- `skip` - Pagination offset (default: 0)

**Response:**
```json
{
  "backtests": [
    {
      "backtest_id": "backtest_id_12345",
      "strategy_id": "67890abcdef1234567890",
      "strategy_name": "My Strategy",
      "symbol": "INFY.NS",
      "created_at": "2025-10-15T10:00:00Z"
    }
  ],
  "count": 1,
  "total": 50,
  "limit": 10,
  "skip": 0
}
```

---

#### **GET** `/api/retail/backtest/{backtest_id}`
Get detailed results of a specific backtest.

**Response:**
Same as POST `/api/retail/backtest/run` response.

---

#### **DELETE** `/api/retail/backtest/{backtest_id}`
Delete a backtest result (user must own it).

**Response:**
```json
{
  "success": true,
  "message": "Backtest deleted successfully",
  "backtest_id": "backtest_id_12345"
}
```

---

## Data Flow

### Admin Workflow

```
┌──────────────────────────────────────────────────────┐
│ Admin Dashboard                                      │
│ - View cached symbols                                │
│ - Sync new data                                      │
│ - Delete outdated data                               │
│ - Monitor activity logs                              │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ Admin API Endpoints                                  │
│ - Authentication (require_role("admin"))             │
│ - Market data operations                             │
│ - Activity logging                                   │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ Market Data Service                                  │
│ - Rate limiting (0.5s delay)                         │
│ - Retry logic (3 attempts)                           │
│ - Data merging (no duplicates)                       │
│ - Symbol normalization                               │
└────────────────┬─────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
┌─────────────────┐  ┌────────────────┐
│ Yahoo Finance   │  │ MongoDB Cache  │
│ API             │  │ market_data_   │
│                 │  │ cache          │
└─────────────────┘  └────────────────┘
```

### Retail User Workflow

```
┌──────────────────────────────────────────────────────┐
│ Retail Dashboard                                     │
│ - Create/edit strategies                             │
│ - Run backtests                                      │
│ - View results                                       │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ Retail Backtest API                                  │
│ - Authentication (verify_firebase_token)             │
│ - Strategy ownership validation                      │
│ - Backtest execution                                 │
└────────────────┬─────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────┐
│ Data Manager Service                                 │
│ - Check cache first                                  │
│ - Fall back to Yahoo Finance if needed               │
│ - Return standardized DataFrame                      │
└────────────────┬─────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         ▼                ▼
┌─────────────────┐  ┌────────────────┐
│ MongoDB Cache   │  │ Yahoo Finance  │
│ historical_data │  │ API            │
└─────────────────┘  └────────────────┘
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create/update `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=strategy_forge
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

### 3. Setup MongoDB Indexes

Run the index setup script to create optimized indexes:

```bash
python scripts/setup_indexes.py
```

This will create indexes for:
- `market_data_cache`
- `admin_activity_log`
- `strategies`
- `backtests`
- `users`
- `historical_data`

### 4. Create Admin User

Use MongoDB to manually set a user's role to `admin`:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### 5. Start the API Server

```bash
uvicorn main:app --reload --port 8000
```

The server will start with comprehensive route information displayed.

---

## Performance Optimizations

### 1. **MongoDB Indexes**
- Compound indexes for frequently queried fields
- Unique constraints to prevent duplicates
- Descending indexes for timestamp sorting

### 2. **Rate Limiting**
- 0.5 second delay between Yahoo Finance requests
- Prevents API throttling
- Reduces server load

### 3. **Caching Strategy**
- Cache-first approach
- Merge new data with existing (no duplicates)
- Configurable freshness thresholds

### 4. **Data Merging**
- Efficient DataFrame operations
- Remove duplicates based on timestamp
- Prefer newer data on conflicts

### 5. **Batch Operations**
- Support for bulk data fetching
- Pagination on list endpoints
- Limit query results to prevent timeouts

---

## Security Features

### 1. **Role-Based Access Control (RBAC)**
- Admin endpoints require `admin` role
- Retail endpoints require authentication
- Strategy ownership validation

### 2. **Firebase Authentication**
- Token verification on every request
- User session management
- Automatic user creation/update

### 3. **Activity Logging**
- Track all admin operations
- Store IP address and user agent
- Audit trail for compliance

### 4. **Input Validation**
- Pydantic models for request validation
- Date format validation
- Symbol normalization

---

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "detail": "Missing Authorization: Bearer token"
}
```

#### 403 Forbidden
```json
{
  "detail": "Forbidden"
}
```

#### 404 Not Found
```json
{
  "detail": "Strategy not found"
}
```

#### 500 Internal Server Error
```json
{
  "detail": "Backtest execution failed: <error_message>"
}
```

---

## Testing

### Test Admin Endpoints

```bash
# List cached data
curl -X GET "http://localhost:8000/api/admin/market-data" \
  -H "Authorization: Bearer <admin_token>"

# Sync market data
curl -X POST "http://localhost:8000/api/admin/market-data/sync" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "NIFTY",
    "timeframe": "1d",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'

# Get statistics
curl -X GET "http://localhost:8000/api/admin/market-data/stats" \
  -H "Authorization: Bearer <admin_token>"
```

### Test Retail Endpoints

```bash
# Run backtest
curl -X POST "http://localhost:8000/api/retail/backtest/run" \
  -H "Authorization: Bearer <user_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_id": "67890abcdef1234567890",
    "symbol": "INFY.NS",
    "timeframe": "1d",
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'

# Get backtest history
curl -X GET "http://localhost:8000/api/retail/backtest/history?limit=10" \
  -H "Authorization: Bearer <user_token>"
```

---

## Monitoring & Maintenance

### 1. Monitor Cache Size

```javascript
// MongoDB shell
db.market_data_cache.aggregate([
  {
    $group: {
      _id: null,
      total_records: { $sum: "$record_count" },
      total_entries: { $sum: 1 }
    }
  }
])
```

### 2. Check Activity Logs

```javascript
// Recent admin activities
db.admin_activity_log.find().sort({ timestamp: -1 }).limit(10)
```

### 3. Monitor Backtest Usage

```javascript
// Backtests per user
db.backtests.aggregate([
  {
    $group: {
      _id: "$user_id",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])
```

---

## Future Enhancements

### Planned Features

1. **Advanced Strategy Execution**
   - PineScript interpreter
   - Custom indicators
   - Entry/exit signals

2. **Real-Time Data**
   - WebSocket support
   - Live market data streaming
   - Real-time backtest updates

3. **Performance Analytics**
   - Monte Carlo simulations
   - Walk-forward analysis
   - Optimization reports

4. **Multi-Asset Support**
   - Crypto, Forex, Commodities
   - Portfolio backtesting
   - Cross-asset correlations

5. **Distributed Caching**
   - Redis integration
   - Multi-region support
   - CDN caching

---

## Support

For issues or questions:
- Check the API documentation at `/docs`
- Review error logs in terminal
- Check MongoDB connection status
- Verify Firebase credentials

---

## License

© 2025 Strategy Forge. All rights reserved.
