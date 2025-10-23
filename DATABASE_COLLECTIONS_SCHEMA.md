# DATABASE COLLECTIONS SCHEMA

## Database Information
- **Database Name:** strategy_forge
- **Database Type:** MongoDB (NoSQL)
- **Connection:** MongoDB Atlas (Cloud)

---

## 1. TABLE DESIGN: TBL_users_login

**Collection Name:** `users`

**Primary Key:** `_id` (MongoDB ObjectId)

**Foreign Key:** `firebaseUid` references Firebase Authentication

| No. | Field Name | Datatype (Size) | Key Constraint | Description of the Field |
|-----|------------|-----------------|----------------|--------------------------|
| 1 | `_id` | ObjectId | PRIMARY KEY | Unique MongoDB document identifier |
| 2 | `firebaseUid` | String | UNIQUE, INDEXED | Firebase authentication user ID (unique identifier) |
| 3 | `uid` | String | INDEXED | User ID (backward compatibility with firebaseUid) |
| 4 | `email` | String | INDEXED | User's email address |
| 5 | `displayName` | String | - | User's display name |
| 6 | `role` | String (enum) | - | User role: "admin" or "retail" (default: "retail") |
| 7 | `createdAt` | ISODate String | - | Account creation timestamp (ISO 8601 format) |
| 8 | `lastLogin` | ISODate String | - | Last login timestamp (ISO 8601 format) |

**Indexes:**
- `firebaseUid`: Unique index for fast Firebase user lookup
- `uid`: Unique index for backward compatibility
- `email`: Index for email-based queries

---

## 2. TABLE DESIGN: TBL_strategies

**Collection Name:** `strategies`

**Primary Key:** `_id` (MongoDB ObjectId)

**Foreign Key:** `author` references `users.uid`

| No. | Field Name | Datatype (Size) | Key Constraint | Description of the Field |
|-----|------------|-----------------|----------------|--------------------------|
| 1 | `_id` | ObjectId | PRIMARY KEY | Unique strategy identifier |
| 2 | `title` | String | - | Strategy title/display name |
| 3 | `name` | String | - | Strategy internal name |
| 4 | `description` | String (Text) | - | Detailed strategy description |
| 5 | `author` | String | FOREIGN KEY, INDEXED | User ID of strategy creator (references users.uid) |
| 6 | `userId` | String | - | User ID (alternate reference) |
| 7 | `visibility` | String (enum) | INDEXED | "public" or "private" |
| 8 | `isPublic` | Boolean | - | Public visibility flag |
| 9 | `performance` | Float | - | Strategy performance percentage |
| 10 | `sharpe` | Float | - | Sharpe ratio metric |
| 11 | `drawdown` | Float | - | Maximum drawdown percentage |
| 12 | `winrate` | Float | - | Win rate percentage |
| 13 | `tags` | Array[String] | - | Strategy tags/categories |
| 14 | `category` | String | - | Strategy category |
| 15 | `difficulty` | String | - | Difficulty level (e.g., "beginner", "advanced") |
| 16 | `downloads` | Integer | - | Number of downloads/uses |
| 17 | `rating` | Float | - | User rating (0-5 scale) |
| 18 | `status` | String | - | Strategy status (e.g., "active", "draft") |
| 19 | `createdAt` | ISODate String | INDEXED | Strategy creation timestamp |
| 20 | `updatedAt` | ISODate String | - | Last update timestamp |
| 21 | `lastUpdated` | ISODate String | - | Alternate last update field |

**Indexes:**
- `author`: Index for finding strategies by author
- `visibility`: Index for filtering public/private strategies
- `(author, visibility)`: Compound index for user-specific filtered queries
- `(author, createdAt)`: Compound index for sorting user strategies by date

---

## 3. TABLE DESIGN: TBL_drag_drop_strategies

**Collection Name:** `drag_drop_strategies`

**Primary Key:** `_id` (MongoDB ObjectId)

**Foreign Key:** `ownerId` references `users.uid`

| No. | Field Name | Datatype (Size) | Key Constraint | Description of the Field |
|-----|------------|-----------------|----------------|--------------------------|
| 1 | `_id` | ObjectId | PRIMARY KEY | Unique strategy identifier |
| 2 | `name` | String | - | Strategy name |
| 3 | `description` | String (Text) | - | Strategy description |
| 4 | `ownerId` | String | FOREIGN KEY, INDEXED | User ID of strategy owner (references users.uid) |
| 5 | `visibility` | String (enum) | INDEXED | "public" or "private" |
| 6 | `timeframe` | String | - | Trading timeframe (e.g., "1d", "1h", "15m") |
| 7 | `conditions` | Array[Object] | - | Array of strategy conditions with parameters and logic |
| 8 | `conditions[].id` | String | - | Condition unique identifier |
| 9 | `conditions[].parameters` | Array[Object] | - | Condition parameters (indicators, actions) |
| 10 | `conditions[].logic` | String | - | Logic operator: "AND" or "OR" |
| 11 | `riskManagement` | Object | - | Risk management settings |
| 12 | `riskManagement.stopLoss` | Float | - | Stop loss percentage |
| 13 | `riskManagement.takeProfit` | Float | - | Take profit percentage |
| 14 | `riskManagement.positionSize` | Float | - | Position size percentage |
| 15 | `riskManagement.maxPositions` | Integer | - | Maximum concurrent positions |
| 16 | `riskManagement.riskPerTrade` | Float | - | Risk per trade percentage |
| 17 | `createdAt` | ISODate String | INDEXED | Strategy creation timestamp |
| 18 | `updatedAt` | ISODate String | - | Last update timestamp |

**Indexes:**
- `ownerId`: Index for finding strategies by owner
- `visibility`: Index for filtering public/private strategies
- `(ownerId, visibility)`: Compound index for user-specific filtered queries
- `(ownerId, createdAt)`: Compound index for sorting user strategies by date

---

## 4. TABLE DESIGN: TBL_backtests

**Collection Name:** `backtests`

**Primary Key:** `_id` (MongoDB ObjectId)

**Foreign Key:** `user_id` references `users.uid`

| No. | Field Name | Datatype (Size) | Key Constraint | Description of the Field |
|-----|------------|-----------------|----------------|--------------------------|
| 1 | `_id` | ObjectId | PRIMARY KEY | Unique backtest identifier |
| 2 | `user_id` | String | FOREIGN KEY, INDEXED | User ID who ran the backtest (references users.uid) |
| 3 | `strategy_id` | String | - | Associated strategy ID (if applicable) |
| 4 | `symbol` | String | - | Trading symbol (e.g., "AAPL", "BTC/USD") |
| 5 | `timeframe` | String | - | Data timeframe (e.g., "1d", "1h") |
| 6 | `start_date` | ISODate String | - | Backtest start date |
| 7 | `end_date` | ISODate String | - | Backtest end date |
| 8 | `rows` | Integer | - | Number of data rows processed |
| 9 | `metrics` | Object | - | Performance metrics object |
| 10 | `metrics.pnl` | Float | - | Profit and Loss |
| 11 | `metrics.sharpe` | Float | INDEXED | Sharpe ratio |
| 12 | `metrics.max_drawdown` | Float | - | Maximum drawdown |
| 13 | `metrics.winrate` | Float | - | Win rate percentage |
| 14 | `metrics.total_return` | Float | INDEXED | Total return percentage |
| 15 | `equity_curve` | Array[Object] | - | Equity curve data points |
| 16 | `equity_curve[].date` | ISODate String | - | Data point date |
| 17 | `equity_curve[].equity` | Float | - | Equity value at date |
| 18 | `conditions` | Object | - | Market conditions analysis |
| 19 | `conditions.best` | Object | - | Best performing periods |
| 20 | `conditions.risks` | Object | - | Worst performing periods |
| 21 | `conditions.neutral` | Object | - | Neutral performing periods |
| 22 | `strategy` | Object | - | Strategy metadata |
| 23 | `strategy.name` | String | - | Strategy name |
| 24 | `strategy.source` | String | - | Strategy source ("pine_script", "builder") |
| 25 | `strategy.file_name` | String | - | Strategy file name |
| 26 | `simulation_context` | Object | - | Simulation parameters |
| 27 | `trading_activity` | Array[Object] | - | List of trades executed |
| 28 | `performance_metrics` | Object | - | Additional performance metrics |
| 29 | `trading_statistics` | Object | - | Trading statistics |
| 30 | `risk_analysis` | Object | - | Risk analysis data |
| 31 | `conditions_analysis` | Object | - | Conditions analysis |
| 32 | `metadata` | Object | - | Additional metadata |
| 33 | `created_at` | ISODate String | INDEXED | Backtest creation timestamp |
| 34 | `updated_at` | ISODate String | - | Last update timestamp |

**Indexes:**
- `user_id`: Index for finding backtests by user
- `(user_id, created_at)`: Compound index for sorting user backtests by date
- `(user_id, metrics.total_return)`: Compound index for finding best performing backtests

---

## 5. TABLE DESIGN: TBL_historical_data

**Collection Name:** `historical_data`

**Primary Key:** `_id` (MongoDB ObjectId)

**Compound Key:** `(symbol, timeframe)` - Unique combination

| No. | Field Name | Datatype (Size) | Key Constraint | Description of the Field |
|-----|------------|-----------------|----------------|--------------------------|
| 1 | `_id` | ObjectId | PRIMARY KEY | Unique document identifier |
| 2 | `symbol` | String | COMPOUND KEY | Trading symbol (e.g., "AAPL", "BTC/USD") |
| 3 | `timeframe` | String | COMPOUND KEY | Data timeframe (e.g., "1d", "1h", "15m") |
| 4 | `data` | Array[Object] | - | Historical price data array |
| 5 | `data[].date` | ISODate | - | Timestamp for data point |
| 6 | `data[].open` | Float | - | Opening price |
| 7 | `data[].high` | Float | - | Highest price |
| 8 | `data[].low` | Float | - | Lowest price |
| 9 | `data[].close` | Float | - | Closing price |
| 10 | `data[].volume` | Float | - | Trading volume |
| 11 | `last_updated` | ISODate String | - | Last data update timestamp |
| 12 | `data_source` | String | - | Data source (e.g., "yfinance", "binance") |
| 13 | `metadata` | Object | - | Additional metadata about the dataset |

**Indexes:**
- `(symbol, timeframe)`: Compound unique index for fast lookups

---

## 6. TABLE DESIGN: TBL_market_data_cache

**Collection Name:** `market_data_cache`

**Primary Key:** `_id` (MongoDB ObjectId)

**Compound Key:** `(symbol, timeframe)` - Unique combination for caching

| No. | Field Name | Datatype (Size) | Key Constraint | Description of the Field |
|-----|------------|-----------------|----------------|--------------------------|
| 1 | `_id` | ObjectId | PRIMARY KEY | Unique document identifier |
| 2 | `symbol` | String | COMPOUND UNIQUE KEY, INDEXED | Trading symbol (e.g., "RELIANCE.NS", "^NSEI", "NIFTY") |
| 3 | `timeframe` | String (enum) | COMPOUND UNIQUE KEY, INDEXED | Data interval: "1d", "1h", "30m", "15m" |
| 4 | `last_updated` | ISODate | INDEXED | Last cache update timestamp (for freshness checks) |
| 5 | `source` | String | INDEXED | Data source: "yahoo", "mock", "manual" (default: "yahoo") |
| 6 | `record_count` | Integer | - | Number of OHLCV records in data array (auto-calculated) |
| 7 | `data` | Array[Object] | - | Array of OHLCV (Open, High, Low, Close, Volume) records |
| 8 | `data[].timestamp` | ISODate | INDEXED | Timestamp for data point (indexed for range queries) |
| 9 | `data[].open` | Float | - | Opening price |
| 10 | `data[].high` | Float | - | Highest price in period |
| 11 | `data[].low` | Float | - | Lowest price in period |
| 12 | `data[].close` | Float | - | Closing price |
| 13 | `data[].volume` | Float | - | Trading volume |

**Indexes:**
- `(symbol, timeframe)`: Compound unique index for fast cache lookups (prevents duplicates)
- `last_updated`: Index for checking data freshness
- `source`: Index for filtering by data source
- `data.timestamp`: Index on array elements for efficient date range queries

**Purpose:**
- Admin-managed market data cache for backtesting
- Fetches data from Yahoo Finance with rate limiting
- Supports merging and incremental updates
- Prevents duplicate data with unique compound key

---

## 7. TABLE DESIGN: TBL_admin_activity_log

**Collection Name:** `admin_activity_log`

**Primary Key:** `_id` (MongoDB ObjectId)

| No. | Field Name | Datatype (Size) | Key Constraint | Description of the Field |
|-----|------------|-----------------|----------------|--------------------------|
| 1 | `_id` | ObjectId | PRIMARY KEY | Unique log entry identifier |
| 2 | `action` | String (enum) | INDEXED | Action performed: "sync", "delete", "create", "update" |
| 3 | `target` | String (enum) | INDEXED | Target resource: "market_data", "strategy", "user" |
| 4 | `details` | Object | - | Action-specific details (flexible JSON structure) |
| 5 | `details.symbol` | String | - | Symbol affected (for market_data actions) |
| 6 | `details.timeframe` | String | - | Timeframe affected (for market_data actions) |
| 7 | `details.records_count` | Integer | - | Number of records processed |
| 8 | `details.date_range` | Object | - | Date range for sync operations |
| 9 | `admin_uid` | String | INDEXED | User ID of admin who performed action (references users.uid) |
| 10 | `admin_email` | String | - | Email of admin user |
| 11 | `timestamp` | ISODate | INDEXED | When the action was performed (descending order) |
| 12 | `ip_address` | String | - | IP address of admin user (for security audit) |
| 13 | `user_agent` | String | - | Browser/client user agent string |

**Indexes:**
- `timestamp`: Descending index for recent activity queries
- `admin_uid`: Index for per-admin activity tracking
- `(action, target)`: Compound index for filtered queries (e.g., all "sync" actions on "market_data")

**Purpose:**
- Audit trail for admin operations
- Track who synced/deleted market data
- Security and compliance logging
- Activity monitoring and reporting

---

## Relationships Diagram

```
users (1) ----< (many) strategies [author → uid]
users (1) ----< (many) drag_drop_strategies [ownerId → uid]
users (1) ----< (many) backtests [user_id → uid]
users (1) ----< (many) admin_activity_log [admin_uid → uid] (admin users only)
strategies (1) ----< (0..many) backtests [strategy_id → _id]
drag_drop_strategies (1) ----< (0..many) backtests [strategy_id → _id]
market_data_cache (1) ----< (many) backtests [symbol+timeframe reference]
historical_data (1) ----< (many) backtests [symbol+timeframe reference]
```

---

## Collection Summary Table

| Collection Name | Primary Purpose | Key Relationships | Admin Access |
|----------------|-----------------|-------------------|--------------|
| `users` | User authentication & profiles | Referenced by all user-owned collections | All users |
| `strategies` | Simple/code-based strategies | Owned by users, used in backtests | Retail + Admin |
| `drag_drop_strategies` | Visual strategy builder strategies | Owned by users, used in backtests | Retail + Admin |
| `backtests` | Backtest execution results | References users, strategies, market data | Retail + Admin |
| `historical_data` | Legacy market data cache | Used by backtesting engine | System |
| `market_data_cache` | Admin-managed market data cache | Used by admin-initiated backtests | Admin only |
| `admin_activity_log` | Admin action audit trail | References admin users | Admin only |

---

## Database Optimization Features

### Indexes Created:
1. **Users Collection:**
   - Unique index on `firebaseUid` (Firebase authentication)
   - Unique index on `uid` (backward compatibility)
   - Index on `email` (search optimization)

2. **Strategies Collection:**
   - Index on `author` (find by creator)
   - Index on `visibility` (public/private filter)
   - Compound index on `(author, visibility)` (user-specific queries)
   - Compound index on `(author, createdAt)` (sorting by date)

3. **Drag-Drop Strategies Collection:**
   - Index on `ownerId` (find by owner)
   - Index on `visibility` (public/private filter)
   - Compound index on `(ownerId, visibility)` (user-specific queries)
   - Compound index on `(ownerId, createdAt)` (sorting by date)

4. **Backtests Collection:**
   - Index on `user_id` (find by user)
   - Compound index on `(user_id, created_at)` (recent backtests)
   - Compound index on `(user_id, metrics.total_return)` (best performance)

5. **Market Data Cache Collection:**
   - Compound unique index on `(symbol, timeframe)` (prevent duplicates)
   - Index on `last_updated` (freshness checks)
   - Index on `source` (filter by data source)
   - Index on `data.timestamp` (date range queries within arrays)

6. **Admin Activity Log Collection:**
   - Index on `timestamp` (recent activity, descending)
   - Index on `admin_uid` (per-admin tracking)
   - Compound index on `(action, target)` (filtered audit queries)

### Performance Benefits:
- 10-100x faster queries on large collections
- Efficient sorting and filtering operations
- Optimized user-specific data retrieval
- Fast authentication lookups

---

## Connection Configuration

### Environment Variables:
```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
DATABASE_NAME=strategy_forge
```

### Connection Pool:
- Async connection using Motor (AsyncIOMotorClient)
- Automatic connection management
- Ping test on connection verification

---

## Data Flow

1. **User Authentication:**
   - Firebase verifies token → User data stored/updated in `users` collection

2. **Strategy Creation:**
   - User creates strategy → Stored in `strategies` or `drag_drop_strategies`
   - Author/owner references user's `uid`

3. **Market Data Management (Admin Only):**
   - Admin syncs data from Yahoo Finance → Stored in `market_data_cache`
   - Rate limiting and deduplication applied
   - Activity logged in `admin_activity_log`
   - Supports incremental updates and force refresh

4. **Backtesting:**
   - User runs backtest → Historical data fetched from `historical_data` or `market_data_cache`
   - Results stored in `backtests` with user_id reference
   - Performance metrics calculated and stored

5. **Data Retrieval:**
   - Visibility rules applied: public strategies visible to all
   - Private strategies only visible to owner
   - Indexes ensure fast query performance

6. **Admin Activity Audit:**
   - All admin actions logged with timestamp, IP, and user agent
   - Activity logs support filtering by action type and target
   - Provides compliance and security audit trail

---

## Special Features

### Symbol Mapping (market_data_cache):
- Automatic conversion of common Indian indices:
  - `NIFTY` → `^NSEI`
  - `BANKNIFTY` → `^NSEBANK`
  - `SENSEX` → `^BSESN`

### Timeframe Support:
- **1d** (1 day) - Daily data
- **1h** (1 hour) - Hourly data
- **30m** (30 minutes) - 30-minute intervals
- **15m** (15 minutes) - 15-minute intervals

### Rate Limiting:
- 0.5 second delay between Yahoo Finance API requests
- Prevents API throttling and ensures reliable data fetching

### Data Deduplication:
- Compound unique indexes prevent duplicate entries
- Merge logic combines new data with existing cache
- Timestamp-based conflict resolution

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Database Type:** MongoDB (NoSQL Document Database)  
**Total Collections:** 7
