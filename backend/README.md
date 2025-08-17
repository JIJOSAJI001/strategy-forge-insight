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