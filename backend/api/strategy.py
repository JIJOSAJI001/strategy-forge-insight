from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
import os
import motor.motor_asyncio
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class StrategyBase(BaseModel):
    title: str
    description: str
    performance: float
    sharpe: float
    drawdown: float
    winrate: float
    tags: List[str]
    downloads: int
    rating: float
    category: Optional[str] = None
    difficulty: Optional[str] = None
    author: Optional[str] = None
    lastUpdated: Optional[str] = None
    status: Optional[str] = None

class StrategyResponse(StrategyBase):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {
            ObjectId: str
        }

@router.get("/strategies", response_model=List[StrategyResponse])
async def get_strategies():
    """
    Fetch all strategies from MongoDB Atlas
    """
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

@router.get("/strategies/{strategy_id}", response_model=StrategyResponse)
async def get_strategy(strategy_id: str):
    """
    Fetch a specific strategy by ID
    """
    try:
        collection = MongoDB.get_collection("strategies")
        strategy = await collection.find_one({"_id": ObjectId(strategy_id)})
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        strategy["_id"] = str(strategy["_id"])
        return strategy
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategy: {str(e)}") 