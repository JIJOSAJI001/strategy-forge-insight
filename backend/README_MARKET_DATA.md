# 🚀 Hybrid Historical Market Data + Backtesting System

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

A production-ready backend system for managing historical market data and executing backtests on trading strategies. Built with **FastAPI**, **MongoDB**, and **Yahoo Finance** integration.

### What's Included

✅ **MongoDB Caching Layer** - Fast, reliable market data storage  
✅ **Yahoo Finance Integration** - Dynamic data fetching with rate limiting  
✅ **Role-Based Access Control** - Admin and Retail user permissions  
✅ **Comprehensive Backtesting** - Advanced metrics and equity curves  
✅ **Activity Logging** - Track all admin operations  
✅ **Optimized Indexes** - Fast queries on large datasets  

---

## ✨ Features

### For Admins
- 📊 **Manage Market Data Cache**
  - List all cached symbols with metadata
  - Sync data from Yahoo Finance
  - Delete outdated or incorrect data
  - View cache statistics and health

- 📝 **Activity Logging**
  - Track all admin operations
  - View audit logs with filtering
  - Monitor system usage

### For Retail Users
- 🧪 **Run Backtests**
  - Execute backtests on owned or public strategies
  - Get comprehensive performance metrics
  - View equity curves with drawdown analysis
  - Track backtest history

- 📈 **Performance Metrics**
  - Total return, CAGR, Sharpe ratio
  - Maximum drawdown, Calmar ratio
  - Win rate, trade statistics
  - Volatility analysis

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- MongoDB running locally or remotely
- Firebase project configured

### 1. Install Dependencies

```powershell
cd Backend
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=strategy_forge
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

### 3. Setup Database Indexes

```powershell
python scripts/setup_indexes.py
```

### 4. Create Admin User

```javascript
// In MongoDB shell or Compass
use strategy_forge

db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } },
  { upsert: true }
)
```

### 5. Start Server

```powershell
uvicorn main:app --reload --port 8000
```

### 6. Access API Documentation

Open browser: http://localhost:8000/docs

---

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React/Vue)                   │
│                                                         │
│  Admin Dashboard        │        Retail Dashboard      │
│  - Manage cache         │        - Create strategies   │
│  - Sync data            │        - Run backtests       │
│  - View logs            │        - View results        │
└────────────────┬────────┴────────────┬──────────────────┘
                 │                     │
                 │ Firebase Auth       │
                 │                     │
┌────────────────▼─────────────────────▼──────────────────┐
│              FastAPI Backend (main.py)                  │
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │ Admin Endpoints  │      │ Retail Endpoints │       │
│  │ - market_data    │      │ - backtest       │       │
│  │ - activity_logs  │      │ - history        │       │
│  └────────┬─────────┘      └─────────┬────────┘       │
│           │                          │                 │
│  ┌────────▼──────────────────────────▼────────┐       │
│  │         Market Data Service                │       │
│  │  - Caching logic                           │       │
│  │  - Data merging                            │       │
│  │  - Rate limiting                           │       │
│  └────────┬───────────────────────────────────┘       │
└───────────┼───────────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼────────┐  ┌───▼──────────┐
│  MongoDB   │  │ Yahoo Finance│
│  - Cache   │  │  API         │
│  - Logs    │  │              │
│  - Results │  │              │
└────────────┘  └──────────────┘
```

### Database Collections

1. **market_data_cache** - Historical OHLCV data
2. **admin_activity_log** - Admin operation audit trail
3. **backtests** - Backtest execution results
4. **strategies** - User-created trading strategies
5. **users** - User profiles and roles
6. **historical_data** - Legacy data storage

### File Structure

```
Backend/
├── api/
│   ├── admin_market_data.py    # Admin endpoints
│   ├── retail_backtest.py      # Retail endpoints
│   ├── strategy.py             # Strategy management
│   ├── data.py                 # Data access
│   └── users.py                # User management
├── services/
│   ├── market_data_service.py  # Core business logic
│   └── data_manager.py         # Data retrieval
├── models/
│   └── market_data.py          # Pydantic models
├── db/
│   └── mongo.py                # MongoDB connection
├── scripts/
│   ├── setup_indexes.py        # Index creation
│   └── test_api.py             # API testing
├── main.py                     # FastAPI app
├── auth_mongodb.py             # Authentication
├── requirements.txt            # Dependencies
├── MARKET_DATA_BACKEND.md      # Full documentation
├── QUICKSTART.md               # Quick start guide
└── IMPLEMENTATION_SUMMARY.md   # Implementation details
```

---

## 📚 API Documentation

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/market-data` | List cached market data |
| POST | `/api/admin/market-data/sync` | Sync data from Yahoo Finance |
| DELETE | `/api/admin/market-data` | Delete cached data |
| GET | `/api/admin/market-data/stats` | Get cache statistics |
| GET | `/api/admin/market-data/activity-logs` | View admin activity logs |

### Retail Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/retail/backtest/run` | Run backtest on strategy |
| GET | `/api/retail/backtest/history` | Get backtest history |
| GET | `/api/retail/backtest/{id}` | Get backtest details |
| DELETE | `/api/retail/backtest/{id}` | Delete backtest result |

### Example: Sync Market Data

**Request:**
```bash
POST /api/admin/market-data/sync
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "symbol": "NIFTY",
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

### Example: Run Backtest

**Request:**
```bash
POST /api/retail/backtest/run
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "strategy_id": "67890abcdef1234567890",
  "symbol": "NIFTY",
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
  "symbol": "NIFTY",
  "timeframe": "1d",
  "metrics": {
    "total_return": 15.5,
    "sharpe_ratio": 1.25,
    "max_drawdown": -8.5,
    "win_rate": 55.2,
    "cagr": 14.2
  },
  "execution_time_ms": 1250.5,
  "data_source": "cache"
}
```

---

## 🧪 Testing

### Automated Testing

```powershell
# Run test suite
python scripts/test_api.py
```

### Manual Testing

1. **Access Swagger UI:** http://localhost:8000/docs
2. **Get Firebase Token:** Login via frontend
3. **Test Admin Endpoints:** Use admin token
4. **Test Retail Endpoints:** Use user token

### Test Coverage

✅ Health check  
✅ Admin authentication  
✅ Market data sync  
✅ Cache management  
✅ Backtest execution  
✅ History retrieval  
✅ Error handling  

---

## 🚢 Deployment

### Production Checklist

- [ ] Set production MongoDB URI
- [ ] Configure Firebase for production
- [ ] Set up environment variables
- [ ] Run index setup script
- [ ] Create admin users
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backups

### Docker Deployment (Optional)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🔧 Troubleshooting

### Common Issues

#### Server won't start
```
Error: MONGODB_URI environment variable is not set
```
**Solution:** Create/update `.env` file with MongoDB connection string

#### Authentication fails
```
Error: Invalid or expired token
```
**Solution:** 
- Verify Firebase credentials
- Check token expiration
- Ensure user exists in Firebase Auth

#### Data sync fails
```
Error: Failed to fetch data from Yahoo Finance
```
**Solution:**
- Check internet connection
- Verify symbol format (e.g., `INFY.NS`)
- Wait and retry (rate limiting)

#### Backtest fails
```
Error: Strategy not found or access denied
```
**Solution:**
- Verify strategy ID
- Check strategy ownership
- Ensure strategy is public if not owned

### Debug Mode

Enable detailed logging:

```python
# In main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## 📊 Performance

### Benchmarks

| Operation | Avg Time | Notes |
|-----------|----------|-------|
| Health check | <10ms | No DB query |
| List cached data | <50ms | 100+ symbols |
| Sync 1 year data | 2-5s | Yahoo API dependent |
| Run backtest | 100-500ms | 250 data points |
| Get history | <100ms | Paginated |

### Optimization Tips

1. **Pre-cache popular symbols** for faster backtests
2. **Use pagination** on list endpoints
3. **Batch sync operations** during off-peak hours
4. **Monitor MongoDB indexes** for query performance
5. **Set up caching layers** (Redis) for high traffic

---

## 📖 Documentation

- **Full API Guide:** [MARKET_DATA_BACKEND.md](MARKET_DATA_BACKEND.md)
- **Quick Start:** [QUICKSTART.md](QUICKSTART.md)
- **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- **Interactive API Docs:** http://localhost:8000/docs

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Implement changes
3. Run tests
4. Update documentation
5. Submit pull request

### Code Style

- Follow PEP 8
- Use type hints
- Add docstrings
- Write tests

---

## 📝 License

© 2025 Strategy Forge. All rights reserved.

---

## 🎉 Success!

Your backend is now ready to:
- ✅ Cache market data efficiently
- ✅ Fetch live data from Yahoo Finance
- ✅ Execute comprehensive backtests
- ✅ Manage user roles and permissions
- ✅ Track admin activities
- ✅ Scale to thousands of users

**Need Help?**
- Check the `/docs` endpoint
- Review documentation files
- Run test suite
- Check MongoDB indexes

**Happy Backtesting! 🚀**
