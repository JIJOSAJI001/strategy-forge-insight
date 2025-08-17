from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
import motor.motor_asyncio
import os
from dotenv import load_dotenv
from bson import ObjectId

load_dotenv()

app = FastAPI(title="Simple Strategy API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:8080", 
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Simple Strategy API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/strategies")
async def get_strategies():
    """Fetch all strategies from MongoDB Atlas"""
    try:
        # Create a direct connection to MongoDB
        mongodb_uri = os.getenv("MONGODB_URI")
        database_name = os.getenv("DATABASE_NAME", "strategy_forge")
        
        if mongodb_uri is None or mongodb_uri == "":
            raise HTTPException(status_code=500, detail="MongoDB URI not configured")
        
        client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
        db = client[database_name]
        collection = db["strategies"]
        
        strategies = []
        async for strategy in collection.find():
            # Convert ObjectId to string for JSON serialization
            strategy["_id"] = str(strategy["_id"])
            strategies.append(strategy)
        
        client.close()
        return strategies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategies: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 