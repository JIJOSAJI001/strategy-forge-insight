from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from bson import ObjectId
import os
import motor.motor_asyncio
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

from auth_mongodb import verify_firebase_token, require_role

router = APIRouter(dependencies=[Depends(verify_firebase_token)])

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

# =====================
# New JSON-first Strategy Definition (single source of truth for backtesting)
# =====================

class IndicatorDef(BaseModel):
    id: str
    type: str  # e.g., "RSI", "SMA"
    params: Dict[str, Any]


class ExpressionDef(BaseModel):
    left: str  # indicator id or literal like "close" if supported by engine
    operator: str  # e.g., ">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"
    right: Dict[str, Any]  # {"value": number} or {"indicator": "id"}


class ActionDef(BaseModel):
    side: Optional[Literal["long", "short"]] = None
    entryName: Optional[str] = None
    exitFrom: Optional[str] = None


class ConditionDef(BaseModel):
    id: str
    type: Literal["entry", "exit"]
    expression: ExpressionDef
    action: ActionDef


class StopTakeDef(BaseModel):
    type: Literal["percentage", "fixed"]
    value: float


class RiskManagementDef(BaseModel):
    stopLoss: StopTakeDef
    takeProfit: StopTakeDef
    capital: float
    positionSize: Literal["fixed", "percent_of_equity"]
    positionValue: float  # amount or percent depending on positionSize


class StrategyDefinition(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    description: str
    ownerId: str
    visibility: Literal["private", "public"]
    timeframe: str  # e.g., "1h", "1d"
    indicators: List[IndicatorDef]
    conditions: List[ConditionDef]
    riskManagement: RiskManagementDef
    pineScriptCode: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class StrategyDefCreateRequest(BaseModel):
    strategy: StrategyDefinition


class StrategyDefResponse(StrategyDefinition):
    id: str = Field(alias="_id")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


async def _now_iso() -> str:
    return datetime.utcnow().isoformat()


def _strategy_def_collection_name() -> str:
    # Use existing collection per requirement
    return "drag_drop_strategies"


def _validate_strategy_definition(strategy: StrategyDefinition) -> List[str]:
    errors: List[str] = []

    if not strategy.name.strip():
        errors.append("name is required")
    if not strategy.description.strip():
        errors.append("description is required")
    if not strategy.ownerId.strip():
        errors.append("ownerId is required")
    if strategy.visibility not in ("private", "public"):
        errors.append("visibility must be 'private' or 'public'")
    if not strategy.timeframe.strip():
        errors.append("timeframe is required")

    indicator_ids = {ind.id for ind in strategy.indicators}
    if len(indicator_ids) != len(strategy.indicators):
        errors.append("indicator ids must be unique")

    for cond in strategy.conditions:
        if cond.type not in ("entry", "exit"):
            errors.append(f"condition {cond.id} type must be 'entry' or 'exit'")
        # expression.left should be an indicator id or supported literal; we enforce indicator id here
        if cond.expression.right is None:
            errors.append(f"condition {cond.id} expression.right is required")
        # right must be either {value} or {indicator}
        right_keys = set(cond.expression.right.keys())
        if not ("value" in right_keys) and not ("indicator" in right_keys):
            errors.append(f"condition {cond.id} right must include 'value' or 'indicator'")
        if "indicator" in right_keys and cond.expression.right.get("indicator") not in indicator_ids:
            errors.append(f"condition {cond.id} right.indicator must reference existing indicator id")
        # left: indicator id must exist (if using id)
        if cond.expression.left in indicator_ids:
            pass
        else:
            # allow literals like 'close' or 'open' optionally; do not hard fail
            allowed_literals = {"open", "high", "low", "close", "volume"}
            if cond.expression.left not in allowed_literals:
                errors.append(f"condition {cond.id} left must be indicator id or one of {allowed_literals}")

        # action validation
        if cond.type == "entry":
            if cond.action.side is None or cond.action.entryName is None:
                errors.append(f"condition {cond.id} entry must specify side and entryName")
            if cond.action.exitFrom is not None:
                errors.append(f"condition {cond.id} entry must not set exitFrom")
        if cond.type == "exit":
            if not cond.action.exitFrom:
                errors.append(f"condition {cond.id} exit must specify exitFrom")
            if cond.action.side is not None or cond.action.entryName is not None:
                errors.append(f"condition {cond.id} exit must not set side or entryName")

    # risk
    if strategy.riskManagement.stopLoss.value <= 0:
        errors.append("stopLoss.value must be > 0")
    if strategy.riskManagement.takeProfit.value <= 0:
        errors.append("takeProfit.value must be > 0")
    if strategy.riskManagement.capital <= 0:
        errors.append("capital must be > 0")
    if strategy.riskManagement.positionSize == "fixed" and strategy.riskManagement.positionValue <= 0:
        errors.append("positionValue must be > 0 when positionSize is fixed")
    if strategy.riskManagement.positionSize == "percent_of_equity":
        if strategy.riskManagement.positionValue <= 0 or strategy.riskManagement.positionValue > 100:
            errors.append("positionValue must be in (0, 100] when positionSize is percent_of_equity")

    return errors


@router.post("/strategies/defs", response_model=StrategyDefResponse)
async def create_strategy_definition(request: StrategyDefCreateRequest):
    try:
        strategy = request.strategy
        # Validate
        errors = _validate_strategy_definition(strategy)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        collection, client = await get_mongodb_collection(_strategy_def_collection_name())
        now = await _now_iso()
        doc: Dict[str, Any] = strategy.dict(by_alias=True)
        doc.pop("_id", None)
        doc["createdAt"] = now
        doc["updatedAt"] = now

        result = await collection.insert_one(doc)
        doc["_id"] = str(result.inserted_id)
        client.close()
        return StrategyDefResponse(**doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create strategy definition: {str(e)}")


@router.get("/strategies/defs/{strategy_id}", response_model=StrategyDefResponse)
async def get_strategy_definition(strategy_id: str):
    try:
        collection, client = await get_mongodb_collection(_strategy_def_collection_name())
        doc = await collection.find_one({"_id": ObjectId(strategy_id)})
        if not doc:
            raise HTTPException(status_code=404, detail="Strategy definition not found")
        doc["_id"] = str(doc["_id"])
        client.close()
        return StrategyDefResponse(**doc)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategy definition: {str(e)}")


@router.get("/strategies/defs", response_model=List[StrategyDefResponse])
async def list_strategy_definitions():
    try:
        collection, client = await get_mongodb_collection(_strategy_def_collection_name())
        strategies: List[StrategyDefResponse] = []
        async for doc in collection.find():
            doc["_id"] = str(doc["_id"])
            strategies.append(StrategyDefResponse(**doc))
        client.close()
        return strategies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list strategy definitions: {str(e)}")


@router.put("/strategies/defs/{strategy_id}", response_model=StrategyDefResponse)
async def update_strategy_definition(strategy_id: str, request: StrategyDefCreateRequest):
    try:
        strategy = request.strategy
        errors = _validate_strategy_definition(strategy)
        if errors:
            raise HTTPException(status_code=400, detail={"errors": errors})

        collection, client = await get_mongodb_collection(_strategy_def_collection_name())
        now = await _now_iso()
        doc: Dict[str, Any] = strategy.dict(by_alias=True)
        doc.pop("_id", None)
        doc["updatedAt"] = now

        result = await collection.update_one({"_id": ObjectId(strategy_id)}, {"$set": doc})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Strategy definition not found")

        saved = await collection.find_one({"_id": ObjectId(strategy_id)})
        saved["_id"] = str(saved["_id"])
        client.close()
        return StrategyDefResponse(**saved)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update strategy definition: {str(e)}")


@router.post("/strategies/defs/validate", response_model=ValidationResponse)
async def validate_strategy_definition(request: StrategyDefCreateRequest):
    try:
        strategy = request.strategy
        errors = _validate_strategy_definition(strategy)
        return ValidationResponse(isValid=len(errors) == 0, errors=errors)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate strategy definition: {str(e)}")

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