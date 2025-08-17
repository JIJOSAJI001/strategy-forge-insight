# Database Management Guide

## 📊 MongoDB Atlas Setup

Your MongoDB Atlas cluster is connected at:
- **Cluster**: `cluster0.verow7n.mongodb.net`
- **Database**: `strategy_forge`
- **Collection**: `strategies`

## 🛠️ Database Management Commands

### 1. Add Sample Data
```bash
cd Backend
python scripts/add_sample_data.py
```

### 2. View Database Contents
```bash
cd Backend
python scripts/view_database.py
```

### 3. Delete All Strategies
```bash
cd Backend
python scripts/view_database.py delete
```

### 4. Test API Endpoints
```bash
cd Backend
python test_api.py
```

## 📋 Database Schema

Each strategy document contains:
```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string",
  "performance": "number (percentage)",
  "sharpe": "number",
  "drawdown": "number (percentage)",
  "winrate": "number (percentage)",
  "tags": ["string array"],
  "downloads": "number",
  "rating": "number (1-5)",
  "category": "string (optional)",
  "difficulty": "string (optional)",
  "author": "string (optional)",
  "lastUpdated": "string (optional)",
  "status": "string (optional)"
}
```

## 🔄 Data Flow

### Backend → Frontend Flow:
1. **MongoDB Atlas** stores strategy data
2. **FastAPI Backend** (`main.py`) serves data via REST API
3. **React Frontend** (`StrategyLibrary.tsx`) fetches and displays data

### API Endpoints:
- `GET /api/strategies` - Returns all strategies
- `GET /api/strategies/{id}` - Returns specific strategy
- `GET /health` - Health check

## 🎯 How to Add New Strategies

### Method 1: Using MongoDB Atlas Dashboard
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to your cluster
3. Click "Browse Collections"
4. Select `strategy_forge` database → `strategies` collection
5. Click "Insert Document" and add JSON data

### Method 2: Using Python Script
Create a new script or modify `add_sample_data.py`:

```python
new_strategy = {
    "title": "Your Strategy Name",
    "description": "Strategy description",
    "performance": 25.0,
    "sharpe": 2.5,
    "drawdown": -10.0,
    "winrate": 65.0,
    "tags": ["Your", "Tags"],
    "downloads": 100,
    "rating": 4.5,
    "category": "Your Category",
    "difficulty": "Beginner",
    "author": "Your Name"
}
```

### Method 3: Using API (Future Enhancement)
Add POST endpoint to create new strategies via API.

## 🖥️ Frontend Display

The React frontend automatically:
1. **Fetches data** from `http://localhost:8000/api/strategies`
2. **Displays strategies** in grid/list view
3. **Filters and sorts** data client-side
4. **Shows loading states** while fetching
5. **Handles errors** gracefully

## 🔧 Troubleshooting

### Backend Issues:
- **Connection Error**: Check MongoDB URI in `.env`
- **Import Error**: Run `pip install -r requirements.txt`
- **Port Conflict**: Change port in `main.py`

### Frontend Issues:
- **CORS Error**: Backend CORS is configured for `localhost:5173`
- **No Data**: Check if backend is running on port 8000
- **Loading Forever**: Check browser console for errors

### Database Issues:
- **No Data**: Run `python scripts/add_sample_data.py`
- **Wrong Data**: Use `python scripts/view_database.py delete` then re-add

## 📈 Current Sample Data

Your database contains 8 sample strategies:
1. **RSI Mean Reversion** - Mean Reversion (Beginner)
2. **Bollinger Band Breakout** - Momentum (Intermediate)
3. **MACD Trend Following** - Trend Following (Advanced)
4. **Pairs Trading Arbitrage** - Arbitrage (Expert)
5. **Volatility Breakout** - Volatility (Intermediate)
6. **AI Sentiment Strategy** - AI/ML (Expert)
7. **Golden Cross Strategy** - Trend Following (Beginner)
8. **Fibonacci Retracement** - Mean Reversion (Advanced)

## 🚀 Next Steps

1. **Start your React frontend** and visit the Strategy Library
2. **Add real strategy data** to MongoDB Atlas
3. **Customize the UI** to match your needs
4. **Add more API endpoints** (POST, PUT, DELETE)
5. **Implement user authentication** and personal strategies

## 🔗 Useful Links

- **MongoDB Atlas**: https://cloud.mongodb.com
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs 