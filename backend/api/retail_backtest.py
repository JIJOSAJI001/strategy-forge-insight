"""
Retail Backtest API
Endpoints for retail users to run backtests on their strategies
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
import time
from bson import ObjectId

from auth_mongodb import verify_firebase_token
from models.market_data import (
    BacktestRunRequest,
    BacktestResultResponse,
    BacktestMetrics,
    EquityCurvePoint
)
from services.data_manager import get_data
from db.mongo import MongoDB
import pandas as pd
import numpy as np


router = APIRouter(prefix="/retail/backtest", tags=["retail", "backtest"])


def _calculate_metrics(df: pd.DataFrame) -> BacktestMetrics:
    """Calculate comprehensive backtest metrics"""
    if df.empty or len(df) < 2:
        return BacktestMetrics(
            total_return=0.0,
            sharpe_ratio=0.0,
            max_drawdown=0.0,
            win_rate=0.0,
            total_trades=0,
            winning_trades=0,
            losing_trades=0,
            avg_win=0.0,
            avg_loss=0.0
        )
    
    # Calculate returns
    df = df.copy()
    df['returns'] = df['close'].pct_change()
    
    # Total return
    total_return = (df['close'].iloc[-1] / df['close'].iloc[0] - 1) * 100
    
    # Sharpe ratio (annualized)
    mean_return = df['returns'].mean()
    std_return = df['returns'].std()
    sharpe_ratio = (mean_return / std_return * np.sqrt(252)) if std_return > 0 else 0.0
    
    # Maximum drawdown
    cumulative = (1 + df['returns']).cumprod()
    running_max = cumulative.cummax()
    drawdown = (cumulative - running_max) / running_max
    max_drawdown = drawdown.min() * 100
    
    # Win rate
    positive_returns = df['returns'] > 0
    win_rate = positive_returns.sum() / len(df) * 100
    
    # Trade statistics (simplified - based on direction changes)
    df['direction'] = np.sign(df['returns'])
    direction_changes = (df['direction'] != df['direction'].shift()).sum()
    
    winning_trades = positive_returns.sum()
    losing_trades = len(df) - winning_trades
    
    avg_win = df.loc[positive_returns, 'returns'].mean() * 100 if winning_trades > 0 else 0.0
    avg_loss = df.loc[~positive_returns & (df['returns'] != 0), 'returns'].mean() * 100 if losing_trades > 0 else 0.0
    
    # CAGR (Compound Annual Growth Rate)
    # Dates are guaranteed timezone-naive from get_data()
    days = (df['date'].max() - df['date'].min()).days
    years = days / 365.25
    cagr = ((df['close'].iloc[-1] / df['close'].iloc[0]) ** (1/years) - 1) * 100 if years > 0 else 0.0
    
    # Volatility (annualized)
    volatility = std_return * np.sqrt(252) * 100
    
    # Calmar ratio
    calmar_ratio = cagr / abs(max_drawdown) if max_drawdown != 0 else 0.0
    
    return BacktestMetrics(
        total_return=round(total_return, 2),
        sharpe_ratio=round(sharpe_ratio, 4),
        max_drawdown=round(max_drawdown, 2),
        win_rate=round(win_rate, 2),
        total_trades=int(direction_changes),
        winning_trades=int(winning_trades),
        losing_trades=int(losing_trades),
        avg_win=round(avg_win, 2),
        avg_loss=round(avg_loss, 2),
        cagr=round(cagr, 2),
        volatility=round(volatility, 2),
        calmar_ratio=round(calmar_ratio, 4)
    )


def _generate_equity_curve(df: pd.DataFrame) -> List[EquityCurvePoint]:
    """Generate equity curve data points"""
    if df.empty:
        return []
    
    df = df.copy()
    df['returns'] = df['close'].pct_change().fillna(0)
    df['equity'] = (1 + df['returns']).cumprod()
    
    # Calculate drawdown
    running_max = df['equity'].cummax()
    df['drawdown'] = ((df['equity'] - running_max) / running_max * 100).fillna(0)
    
    equity_curve = [
        EquityCurvePoint(
            date=row['date'].isoformat(),
            equity=round(row['equity'], 6),
            drawdown=round(row['drawdown'], 2)
        )
        for _, row in df.iterrows()
    ]
    
    return equity_curve


async def _get_strategy(strategy_id: str, user_uid: str) -> Dict[str, Any]:
    """Get strategy and validate ownership"""
    try:
        strategies = MongoDB.get_collection("strategies")
        strategy = await strategies.find_one({"_id": ObjectId(strategy_id)})
        
        collection_name = "strategies"
        if not strategy:
            # Also try drag_drop_strategies collection
            drag_drop_strategies = MongoDB.get_collection("drag_drop_strategies")
            strategy = await drag_drop_strategies.find_one({"_id": ObjectId(strategy_id)})
            collection_name = "drag_drop_strategies"
            
            if not strategy:
                raise HTTPException(status_code=404, detail="Strategy not found")
        
        # Debug logging
        print(f"🔍 Strategy access check:")
        print(f"   Collection: {collection_name}")
        print(f"   Strategy ID: {strategy_id}")
        print(f"   User UID: {user_uid}")
        print(f"   Strategy user_id: {strategy.get('user_id')}")
        print(f"   Strategy userId: {strategy.get('userId')}")
        print(f"   Strategy ownerId: {strategy.get('ownerId')}")
        print(f"   Strategy is_public: {strategy.get('is_public')}")
        print(f"   Strategy isPublic: {strategy.get('isPublic')}")
        print(f"   Strategy visibility: {strategy.get('visibility')}")
        
        # Check ownership or public access
        is_owner = (
            strategy.get("user_id") == user_uid or 
            strategy.get("userId") == user_uid or
            strategy.get("ownerId") == user_uid
        )
        is_public = (
            strategy.get("is_public", False) or 
            strategy.get("isPublic", False) or
            strategy.get("visibility") == "public"
        )
        
        # Legacy/demo strategies (from 'strategies' collection without ownership fields) are public
        is_legacy_public = (
            collection_name == "strategies" and 
            not strategy.get("user_id") and 
            not strategy.get("userId") and 
            not strategy.get("ownerId")
        )
        
        print(f"   Is Owner: {is_owner}")
        print(f"   Is Public: {is_public}")
        print(f"   Is Legacy Public: {is_legacy_public}")
        
        if not (is_owner or is_public or is_legacy_public):
            raise HTTPException(status_code=403, detail="Access denied to this strategy")
        
        return strategy
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategy: {str(e)}")


@router.post("/run", response_model=BacktestResultResponse)
async def run_backtest(
    payload: BacktestRunRequest,
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Run backtest on a strategy
    
    **Retail User** - Must own the strategy or it must be public
    
    Process:
    1. Validate strategy ownership/access
    2. Fetch market data (from cache or Yahoo Finance)
    3. Apply strategy logic (simplified: buy-and-hold for now)
    4. Calculate metrics and equity curve
    5. Store backtest result
    
    Parameters:
    - strategy_id: MongoDB ObjectId of strategy
    - symbol: Stock symbol to test
    - timeframe: Data interval
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    """
    start_time = time.time()
    
    try:
        # Validate strategy access
        strategy = await _get_strategy(payload.strategy_id, user.get("uid"))
        
        # Parse dates
        start_date = datetime.fromisoformat(payload.start_date)
        end_date = datetime.fromisoformat(payload.end_date)
        
        # Validate date range
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be before end_date")
        
        # Fetch market data
        print(f"📥 Fetching market data...")
        print(f"   Symbol: {payload.symbol.upper()}")
        print(f"   Start: {payload.start_date}")
        print(f"   End: {payload.end_date}")
        print(f"   Timeframe: {payload.timeframe.value}")
        
        try:
            df = await get_data(
                symbol=payload.symbol.upper(),
                start_date=payload.start_date,
                end_date=payload.end_date,
                timeframe=payload.timeframe.value
            )
            print(f"✅ Data fetched successfully, shape: {df.shape if not df.empty else 'empty'}")
        except Exception as fetch_error:
            print(f"❌ Error fetching data: {type(fetch_error).__name__}: {str(fetch_error)}")
            import traceback
            traceback.print_exc()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch market data: {str(fetch_error)}"
            )
        
        if df.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No data available for {payload.symbol} in the specified date range"
            )
        
        # CRITICAL: Ensure all datetime columns are timezone-naive
        # This is a defensive check even though get_data() already normalizes datetimes
        # Protects against future data sources or edge cases
        df['date'] = pd.to_datetime(df['date'], utc=True).dt.tz_localize(None)
        
        print(f"📊 DataFrame info:")
        print(f"   Shape: {df.shape}")
        print(f"   Columns: {list(df.columns)}")
        print(f"   Date dtype: {df['date'].dtype}")
        print(f"   Date sample: {df['date'].iloc[0]}")
        print(f"   Date has timezone: {hasattr(df['date'].iloc[0], 'tzinfo') and df['date'].iloc[0].tzinfo is not None}")
        
        # Calculate metrics (using buy-and-hold strategy for now)
        print(f"🔢 Calculating metrics...")
        metrics = _calculate_metrics(df)
        print(f"✅ Metrics calculated")
        
        print(f"📈 Generating equity curve...")
        equity_curve = _generate_equity_curve(df)
        print(f"✅ Equity curve generated")
        
        # Calculate execution time
        execution_time = (time.time() - start_time) * 1000  # milliseconds
        
        # Store backtest result
        backtests = MongoDB.get_collection("backtests")
        backtest_doc = {
            "strategy_id": payload.strategy_id,
            "strategy_name": strategy.get("name", "Unnamed Strategy"),
            "user_id": user.get("uid"),
            "symbol": payload.symbol.upper(),
            "timeframe": payload.timeframe.value,
            "start_date": payload.start_date,
            "end_date": payload.end_date,
            "data_points": len(df),
            "metrics": metrics.dict(),
            "equity_curve": [point.dict() for point in equity_curve],
            "execution_time_ms": execution_time,
            "created_at": datetime.utcnow(),
            "data_source": "cache"  # TODO: Track actual source
        }
        
        insert_result = await backtests.insert_one(backtest_doc)
        
        # Return response
        return BacktestResultResponse(
            backtest_id=str(insert_result.inserted_id),
            strategy_id=payload.strategy_id,
            strategy_name=strategy.get("name", "Unnamed Strategy"),
            symbol=payload.symbol.upper(),
            timeframe=payload.timeframe.value,
            start_date=payload.start_date,
            end_date=payload.end_date,
            data_points=len(df),
            metrics=metrics,
            equity_curve=equity_curve,
            execution_time_ms=round(execution_time, 2),
            created_at=datetime.utcnow(),
            data_source="cache"
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest execution failed: {str(e)}")



@router.get("/market-data")
async def get_market_data(
    symbol: str = Query(..., description="Stock symbol (e.g., AAPL)"),
    timeframe: str = Query("1d", description="Timeframe (1d, 1h, etc.)"),
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    # user: Dict[str, Any] = Depends(verify_firebase_token)  # Temporarily disabled for demo access
):
    """
    Get historical market data for paper trading
    """
    try:
        start_datetime = datetime.fromisoformat(start_date)
        end_datetime = datetime.fromisoformat(end_date)
        
        df = await get_data(
            symbol=symbol.upper(),
            start_date=start_datetime,
            end_date=end_datetime,
            timeframe=timeframe
        )
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No data found for {symbol}")
            
        # Convert to list of dicts for JSON response
        records = []
        for _, row in df.iterrows():
            records.append({
                "time": row['date'].timestamp() * 1000, # Frontend expects ms timestamp
                "open": row['open'],
                "high": row['high'],
                "low": row['low'],
                "close": row['close'],
                "volume": row['volume']
            })
            
        return records
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")


@router.post("/paper-trading/save-session")
async def save_paper_trading_session(
    session_data: Dict[str, Any],
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Save a completed paper trading session
    """
    try:
        sessions = MongoDB.get_collection("paper_trading_sessions")
        
        doc = {
            "user_id": user.get("uid"),
            "strategy_id": session_data.get("strategyId"),
            "symbol": session_data.get("symbol"),
            "start_date": session_data.get("startDate"),
            "end_date": session_data.get("endDate"),
            "initial_balance": session_data.get("initialBalance"),
            "final_balance": session_data.get("finalBalance"),
            "trades": session_data.get("trades"),
            "created_at": datetime.utcnow()
        }
        
        result = await sessions.insert_one(doc)
        
        return {
            "success": True, 
            "id": str(result.inserted_id),
            "message": "Session saved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save session: {str(e)}")


@router.get("/paper-trading/history")
async def get_paper_trading_history(
    limit: int = 10,
    skip: int = 0,
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Get paper trading history for the authenticated user
    """
    try:
        sessions = MongoDB.get_collection("paper_trading_sessions")
        
        cursor = sessions.find({"user_id": user.get("uid")})\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(limit)
            
        results = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            results.append(doc)
            
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")


@router.get("/history")
async def get_backtest_history(
    strategy_id: Optional[str] = Query(None, description="Filter by strategy ID"),
    symbol: Optional[str] = Query(None, description="Filter by symbol"),
    limit: int = Query(10, ge=1, le=100, description="Number of results"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Get backtest history for the authenticated user
    
    Parameters:
    - strategy_id: Optional filter by strategy
    - symbol: Optional filter by symbol
    - limit: Number of results (max 100)
    - skip: Pagination offset
    """
    try:
        backtests = MongoDB.get_collection("backtests")
        
        # Build query
        query = {"user_id": user.get("uid")}
        if strategy_id:
            query["strategy_id"] = strategy_id
        if symbol:
            query["symbol"] = symbol.upper()
        
        # Fetch backtests
        cursor = backtests.find(query).sort("created_at", -1).skip(skip).limit(limit)
        results = []
        
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            doc["backtest_id"] = doc["_id"]
            results.append(doc)
        
        # Get total count
        total_count = await backtests.count_documents(query)
        
        return {
            "backtests": results,
            "count": len(results),
            "total": total_count,
            "limit": limit,
            "skip": skip
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch backtest history: {str(e)}")


@router.get("/{backtest_id}")
async def get_backtest_details(
    backtest_id: str,
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Get detailed results of a specific backtest
    
    Parameters:
    - backtest_id: MongoDB ObjectId of backtest
    """
    try:
        backtests = MongoDB.get_collection("backtests")
        
        backtest = await backtests.find_one({
            "_id": ObjectId(backtest_id),
            "user_id": user.get("uid")
        })
        
        if not backtest:
            raise HTTPException(status_code=404, detail="Backtest not found or access denied")
        
        backtest["_id"] = str(backtest["_id"])
        backtest["backtest_id"] = backtest["_id"]
        
        return backtest
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch backtest details: {str(e)}")


@router.delete("/{backtest_id}")
async def delete_backtest(
    backtest_id: str,
    user: Dict[str, Any] = Depends(verify_firebase_token)
):
    """
    Delete a backtest result
    
    Parameters:
    - backtest_id: MongoDB ObjectId of backtest
    """
    try:
        backtests = MongoDB.get_collection("backtests")
        
        result = await backtests.delete_one({
            "_id": ObjectId(backtest_id),
            "user_id": user.get("uid")
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Backtest not found or access denied")
        
        return {
            "success": True,
            "message": "Backtest deleted successfully",
            "backtest_id": backtest_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete backtest: {str(e)}")

