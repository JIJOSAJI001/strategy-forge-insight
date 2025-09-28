# Strategy Forge Backend

A FastAPI backend for the Strategy Forge application that connects to MongoDB Atlas.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment variables:**
   - Copy `env.example` to `.env`
   - Update the MongoDB URI with your actual MongoDB Atlas connection string
   - Update the database name if needed

3. **Run the application:**
   ```bash
   python main.py
   ```
   
   Or using uvicorn directly:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Health check
- `GET /api/strategies` - Get all strategies
- `GET /api/strategies/{strategy_id}` - Get a specific strategy

### Drag-Drop Strategies (legacy builder)

- `GET /api/strategies/drag-drop` - List drag-drop strategies
- `GET /api/strategies/drag-drop/{id}` - Get a drag-drop strategy
- `POST /api/strategies` - Create drag-drop strategy
- `PUT /api/strategies/{id}` - Update drag-drop strategy
- `POST /api/strategies/generate-pine-script` - Generate Pine Script from drag-drop strategy
- `POST /api/strategies/validate` - Validate drag-drop strategy

### JSON-first Strategy Definitions (Backtesting source of truth)

- `GET /api/strategies/defs` - List strategy definitions
- `GET /api/strategies/defs/{id}` - Get a strategy definition
- `POST /api/strategies/defs` - Create a strategy definition
- `PUT /api/strategies/defs/{id}` - Update a strategy definition
- `POST /api/strategies/defs/validate` - Validate a strategy definition

### Backtesting Data Management

- Place pre-downloaded OHLCV files in `Backend/data/` as CSV or Parquet. Supported names:
  - `{SYMBOL}.csv|parquet` or `{SYMBOL}_{TIMEFRAME}.csv|parquet` (e.g., `NIFTY.parquet`, `INFY_1d.csv`).
- Endpoints:
  - `GET /api/data/symbols` — list detected symbols from local data.
  - `POST /api/data/force-refresh?symbol=INFY&start_date=2020-01-01&end_date=2024-01-01&timeframe=1d` — refresh cache and return summary.
  - `POST /api/backtest/run` — body: `{ "symbol": "INFY", "start_date": "2020-01-01", "end_date": "2024-01-01", "timeframe": "1d" }`.

Mongo collection `historical_data` structure aligns with the platform schema and is populated automatically by fetches or local file loads.

## MongoDB Schema

The strategies collection should contain documents with the following structure:

```json
{
  "_id": "ObjectId",
  "title": "string",
  "description": "string", 
  "performance": "number",
  "sharpe": "number",
  "drawdown": "number",
  "winrate": "number",
  "tags": ["string"],
  "downloads": "number",
  "rating": "number",
  "category": "string (optional)",
  "difficulty": "string (optional)",
  "author": "string (optional)",
  "lastUpdated": "string (optional)",
  "status": "string (optional)"
}
```

## CORS Configuration

The backend is configured to allow requests from:
- `http://localhost:5173` (React dev server)
- `http://127.0.0.1:5173` (React dev server)

## Development

The backend uses:
- FastAPI for the web framework
- Motor for async MongoDB operations
- Pydantic for data validation
- Python-dotenv for environment variables 