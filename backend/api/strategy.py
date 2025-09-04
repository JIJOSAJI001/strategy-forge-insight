from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from bson import ObjectId
import os
import motor.motor_asyncio
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

router = APIRouter()

# Existing models for backward compatibility
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

# New models for drag-and-drop strategy builder
class Parameter(BaseModel):
    id: str
    type: str  # 'indicator', 'condition', 'action'
    name: str
    category: str
    description: str
    config: Dict[str, Any]

class StrategyCondition(BaseModel):
    id: str
    parameters: List[Parameter]
    logic: str  # 'AND' or 'OR'

class RiskManagement(BaseModel):
    stopLoss: float
    takeProfit: float
    positionSize: float
    maxPositions: int
    riskPerTrade: float

class DragDropStrategy(BaseModel):
    name: str
    description: str
    timeframe: str
    conditions: List[StrategyCondition]
    riskManagement: RiskManagement

class StrategyCreateRequest(BaseModel):
    strategy: DragDropStrategy
    userId: Optional[str] = None

class StrategySaveResponse(BaseModel):
    id: str
    name: str
    description: str
    timeframe: str
    conditions: List[StrategyCondition]
    riskManagement: RiskManagement
    createdAt: str
    updatedAt: str
    userId: str

class PineScriptResponse(BaseModel):
    code: str
    filename: str

class ValidationResponse(BaseModel):
    isValid: bool
    errors: List[str]

# MongoDB connection helper
async def get_mongodb_collection(collection_name: str):
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    if mongodb_uri is None or mongodb_uri == "":
        raise HTTPException(status_code=500, detail="MongoDB URI not configured")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client[database_name]
    return db[collection_name], client

# Existing endpoints for backward compatibility
@router.get("/strategies", response_model=List[StrategyResponse])
async def get_strategies():
    """
    Fetch all strategies from MongoDB Atlas
    """
    try:
        collection, client = await get_mongodb_collection("strategies")
        
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
        collection, client = await get_mongodb_collection("strategies")
        strategy = await collection.find_one({"_id": ObjectId(strategy_id)})
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        strategy["_id"] = str(strategy["_id"])
        client.close()
        return strategy
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategy: {str(e)}")

# New endpoints for drag-and-drop strategy builder
@router.post("/strategies", response_model=StrategySaveResponse)
async def save_strategy(request: StrategyCreateRequest):
    """
    Save a new drag-and-drop strategy
    """
    try:
        collection, client = await get_mongodb_collection("drag_drop_strategies")
        
        now = datetime.utcnow().isoformat()
        strategy_data = {
            "name": request.strategy.name,
            "description": request.strategy.description,
            "timeframe": request.strategy.timeframe,
            "conditions": [condition.dict() for condition in request.strategy.conditions],
            "riskManagement": request.strategy.riskManagement.dict(),
            "userId": request.userId or "anonymous",
            "createdAt": now,
            "updatedAt": now
        }
        
        result = await collection.insert_one(strategy_data)
        # Build response with 'id' instead of MongoDB's '_id'
        response_data = {
            "id": str(result.inserted_id),
            **{k: v for k, v in strategy_data.items() if k != "_id"}
        }
        
        client.close()
        return StrategySaveResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save strategy: {str(e)}")

@router.put("/strategies/{strategy_id}", response_model=StrategySaveResponse)
async def update_strategy(strategy_id: str, request: StrategyCreateRequest):
    """
    Update an existing drag-and-drop strategy
    """
    try:
        collection, client = await get_mongodb_collection("drag_drop_strategies")
        
        now = datetime.utcnow().isoformat()
        strategy_data = {
            "name": request.strategy.name,
            "description": request.strategy.description,
            "timeframe": request.strategy.timeframe,
            "conditions": [condition.dict() for condition in request.strategy.conditions],
            "riskManagement": request.strategy.riskManagement.dict(),
            "userId": request.userId or "anonymous",
            "updatedAt": now
        }
        
        result = await collection.update_one(
            {"_id": ObjectId(strategy_id)},
            {"$set": strategy_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        response_data = {
            "id": strategy_id,
            # We don't have the original createdAt here; a full implementation would fetch it first
            "createdAt": now,
            **strategy_data,
        }
        
        client.close()
        return StrategySaveResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update strategy: {str(e)}")

@router.get("/strategies/drag-drop/{strategy_id}", response_model=StrategySaveResponse)
async def get_drag_drop_strategy(strategy_id: str):
    """
    Fetch a specific drag-and-drop strategy by ID
    """
    try:
        collection, client = await get_mongodb_collection("drag_drop_strategies")
        strategy = await collection.find_one({"_id": ObjectId(strategy_id)})
        
        if not strategy:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        response_data = {
            "id": str(strategy["_id"]),
            "name": strategy["name"],
            "description": strategy["description"],
            "timeframe": strategy["timeframe"],
            "conditions": strategy["conditions"],
            "riskManagement": strategy["riskManagement"],
            "createdAt": strategy.get("createdAt", ""),
            "updatedAt": strategy.get("updatedAt", ""),
            "userId": strategy.get("userId", "")
        }
        client.close()
        return StrategySaveResponse(**response_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategy: {str(e)}")

@router.get("/strategies/drag-drop", response_model=List[StrategySaveResponse])
async def get_drag_drop_strategies():
    """
    Fetch all drag-and-drop strategies
    """
    try:
        collection, client = await get_mongodb_collection("drag_drop_strategies")
        
        strategies: List[StrategySaveResponse] = []
        async for strategy in collection.find():
            strategies.append(StrategySaveResponse(
                id=str(strategy["_id"]),
                name=strategy["name"],
                description=strategy["description"],
                timeframe=strategy["timeframe"],
                conditions=strategy["conditions"],
                riskManagement=strategy["riskManagement"],
                createdAt=strategy.get("createdAt", ""),
                updatedAt=strategy.get("updatedAt", ""),
                userId=strategy.get("userId", "")
            ))
        
        client.close()
        return strategies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategies: {str(e)}")

@router.delete("/strategies/drag-drop/{strategy_id}")
async def delete_drag_drop_strategy(strategy_id: str):
    """
    Delete a drag-and-drop strategy
    """
    try:
        collection, client = await get_mongodb_collection("drag_drop_strategies")
        
        result = await collection.delete_one({"_id": ObjectId(strategy_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Strategy not found")
        
        client.close()
        return {"message": "Strategy deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete strategy: {str(e)}")

@router.post("/strategies/generate-pine-script", response_model=PineScriptResponse)
async def generate_pine_script(request: StrategyCreateRequest):
    """
    Generate Pine Script code from a drag-and-drop strategy
    """
    try:
        strategy = request.strategy
        filename = f"{strategy.name.replace(' ', '_').lower()}.pine"
        
        # Generate Pine Script code
        pine_script = generate_pine_script_code(strategy)
        
        return PineScriptResponse(code=pine_script, filename=filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate Pine Script: {str(e)}")

@router.post("/strategies/validate", response_model=ValidationResponse)
async def validate_strategy(request: StrategyCreateRequest):
    """
    Validate a drag-and-drop strategy
    """
    try:
        strategy = request.strategy
        errors = []
        
        # Basic validation
        if not strategy.name.strip():
            errors.append("Strategy name is required")
        
        if not strategy.description.strip():
            errors.append("Strategy description is required")
        
        if not strategy.conditions:
            errors.append("At least one condition is required")
        
        # Validate conditions
        for i, condition in enumerate(strategy.conditions):
            if not condition.parameters:
                errors.append(f"Condition {i + 1} must have at least one parameter")
            
            # Check for required parameter types
            has_indicator = any(param.type == 'indicator' for param in condition.parameters)
            has_condition = any(param.type == 'condition' for param in condition.parameters)
            has_action = any(param.type == 'action' for param in condition.parameters)
            
            if not has_indicator:
                errors.append(f"Condition {i + 1} must have at least one indicator")
            if not has_condition:
                errors.append(f"Condition {i + 1} must have at least one condition")
            if not has_action:
                errors.append(f"Condition {i + 1} must have at least one action")
        
        # Validate risk management
        if strategy.riskManagement.stopLoss <= 0:
            errors.append("Stop loss must be greater than 0")
        if strategy.riskManagement.takeProfit <= 0:
            errors.append("Take profit must be greater than 0")
        if strategy.riskManagement.positionSize <= 0:
            errors.append("Position size must be greater than 0")
        if strategy.riskManagement.maxPositions <= 0:
            errors.append("Max positions must be greater than 0")
        if strategy.riskManagement.riskPerTrade <= 0:
            errors.append("Risk per trade must be greater than 0")
        
        return ValidationResponse(isValid=len(errors) == 0, errors=errors)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate strategy: {str(e)}")

def generate_pine_script_code(strategy: DragDropStrategy) -> str:
    """
    Generate Pine Script code from strategy configuration
    """
    code_lines = [
        f"// Generated Strategy: {strategy.name}",
        "//@version=5",
        f'strategy("{strategy.name}", overlay=true)',
        "",
        "// Entry conditions"
    ]
    
    # Generate indicator definitions
    indicators_used = set()
    for condition in strategy.conditions:
        for param in condition.parameters:
            if param.type == 'indicator' and param.id not in indicators_used:
                indicators_used.add(param.id)
                if param.id == 'rsi':
                    code_lines.append(f"rsi = ta.rsi(close, {param.config.get('period', 14)})")
                elif param.id == 'sma':
                    code_lines.append(f"sma = ta.sma(close, {param.config.get('period', 20)})")
                elif param.id == 'ema':
                    code_lines.append(f"ema = ta.ema(close, {param.config.get('period', 20)})")
                elif param.id == 'macd':
                    fast_period = param.config.get('fastPeriod', 12)
                    slow_period = param.config.get('slowPeriod', 26)
                    signal_period = param.config.get('signalPeriod', 9)
                    code_lines.extend([
                        f"[macd_line, signal_line, hist] = ta.macd(close, {fast_period}, {slow_period}, {signal_period})"
                    ])
                elif param.id == 'bollinger':
                    period = param.config.get('period', 20)
                    std_dev = param.config.get('stdDev', 2)
                    code_lines.extend([
                        f"[bb_upper, bb_middle, bb_lower] = ta.bb(close, {period}, {std_dev})"
                    ])
    
    code_lines.append("")
    code_lines.append("// Strategy logic")
    
    # Generate condition logic
    condition_expressions = []
    for condition in strategy.conditions:
        param_expressions = []
        for param in condition.parameters:
            if param.type == 'condition':
                if param.id == 'greater_than':
                    threshold = param.config.get('threshold', 0)
                    param_expressions.append(f"rsi > {threshold}")
                elif param.id == 'less_than':
                    threshold = param.config.get('threshold', 0)
                    param_expressions.append(f"rsi < {threshold}")
                elif param.id == 'crosses_above':
                    param_expressions.append("close > sma")
                elif param.id == 'crosses_below':
                    param_expressions.append("close < sma")
        
        if param_expressions:
            logic_operator = " and " if condition.logic == 'AND' else " or "
            condition_expressions.append(f"({logic_operator.join(param_expressions)})")
    
    if condition_expressions:
        main_condition = " and ".join(condition_expressions)
        code_lines.append(f"if {main_condition}")
        code_lines.append("    strategy.entry(\"Long\", strategy.long)")
    
    code_lines.append("")
    code_lines.append("// Exit conditions")
    
    # Generate exit conditions
    stop_loss_pct = strategy.riskManagement.stopLoss / 100
    take_profit_pct = strategy.riskManagement.takeProfit / 100
    
    code_lines.append(
        f'strategy.exit("Exit", "Long", '
        f'stop=strategy.position_avg_price * (1 - {stop_loss_pct}), '
        f'limit=strategy.position_avg_price * (1 + {take_profit_pct}))'
    )
    
    return "\n".join(code_lines) 