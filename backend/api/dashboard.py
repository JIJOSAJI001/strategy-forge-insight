from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import os
from auth_mongodb import verify_firebase_token

router = APIRouter(dependencies=[Depends(verify_firebase_token)])

async def get_mongodb_collection(collection_name: str):
    """Helper function to get MongoDB collection"""
    import motor.motor_asyncio
    from dotenv import load_dotenv
    
    load_dotenv()
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    if mongodb_uri is None or mongodb_uri == "":
        raise HTTPException(status_code=500, detail="MongoDB URI not configured")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
    db = client[database_name]
    return db[collection_name], client


@router.get("/dashboard/metrics")
async def get_dashboard_metrics(user_info: dict = Depends(verify_firebase_token)):
    """
    Get real-time dashboard metrics for a user based on their backtest results
    """
    try:
        user_id = user_info.get("uid")
        
        # Get user's strategies
        strategies_collection, client1 = await get_mongodb_collection("drag_drop_strategies")
        
        # Get user's backtests from the correct collection
        backtest_collection, client2 = await get_mongodb_collection("backtests")
        
        # Count strategies owned by this user
        total_strategies = await strategies_collection.count_documents(
            {"ownerId": user_id}
        )
        
        # Get latest backtest for this user (check both field names)
        latest_backtest = await backtest_collection.find_one(
            {"user_id": user_id},
            sort=[("created_at", -1)]
        )
        
        # Get all backtests for this user
        backtest_cursor = backtest_collection.find(
            {"user_id": user_id}
        )
        
        backtests = await backtest_cursor.to_list(length=100)
        
        avg_winrate = 0
        best_strategy_name = "N/A"
        best_strategy_return = 0
        latest_return = 0
        latest_strategy_name = "N/A"
        
        if backtests:
            # Calculate average win rate
            winrates = [b.get("metrics", {}).get("win_rate", 0) for b in backtests if "metrics" in b]
            avg_winrate = sum(winrates) / len(winrates) if winrates else 0
            
            # Find best performing strategy
            for backtest in backtests:
                metrics = backtest.get("metrics", {})
                total_return = metrics.get("total_return", 0)
                if total_return > best_strategy_return:
                    best_strategy_return = total_return
                    best_strategy_name = backtest.get("strategy_name", "Unknown")
        
        if latest_backtest:
            latest_return = latest_backtest.get("metrics", {}).get("total_return", 0)
            latest_strategy_name = latest_backtest.get("strategy_name", "Unknown")
        
        # Risk score based on diversification
        risk_score = "High"
        if total_strategies >= 5:
            risk_score = "Low"
        elif total_strategies >= 3:
            risk_score = "Medium"
        
        client1.close()
        client2.close()
        
        return {
            "metrics": [
                {
                    "title": "Best Strategy",
                    "value": best_strategy_name if best_strategy_name != "N/A" else "No backtests yet",
                    "change": f"+{best_strategy_return:.1f}% return" if best_strategy_return > 0 else f"{best_strategy_return:.1f}% return" if best_strategy_return < 0 else "No data",
                    "changeType": "positive" if best_strategy_return > 0 else "negative" if best_strategy_return < 0 else "neutral"
                },
                {
                    "title": "Latest Backtest",
                    "value": f"+{latest_return:.1f}%" if latest_return > 0 else f"{latest_return:.1f}%" if latest_return < 0 else "No backtests",
                    "change": latest_strategy_name,
                    "changeType": "positive" if latest_return > 0 else "negative" if latest_return < 0 else "neutral"
                },
                {
                    "title": "Avg Win Rate",
                    "value": f"{avg_winrate:.1f}%" if backtests else "N/A",
                    "change": f"From {len(backtests)} backtest{'s' if len(backtests) != 1 else ''}",
                    "changeType": "positive" if avg_winrate > 50 else "neutral"
                },
                {
                    "title": "Strategies",
                    "value": str(total_strategies),
                    "change": f"Risk: {risk_score}",
                    "changeType": "positive" if risk_score == "Low" else "neutral"
                }
            ]
        }
    except Exception as e:
        print(f"❌ Error fetching dashboard metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {str(e)}")


@router.get("/dashboard/equity-curve")
async def get_equity_curve(user_info: dict = Depends(verify_firebase_token), days: int = 180):
    """
    Get portfolio equity curve data for the authenticated user
    """
    try:
        user_id = user_info.get("uid")
        backtest_collection, client = await get_mongodb_collection("backtests")
        
        # Get backtests for this user within date range
        start_date = datetime.now() - timedelta(days=days)
        
        backtests = await backtest_collection.find(
            {
                "user_id": user_id,
                "created_at": {"$gte": start_date}
            }
        ).sort("created_at", 1).to_list(length=1000)
        
        # Aggregate equity by date
        equity_data = []
        cumulative_return = 10000  # Starting capital
        benchmark = 10000
        
        for backtest in backtests:
            created_at = backtest.get("created_at")
            date = created_at.strftime("%Y-%m-%d") if isinstance(created_at, datetime) else str(created_at)[:10]
            metrics = backtest.get("metrics", {})
            total_return = metrics.get("total_return", 0)
            
            cumulative_return += cumulative_return * (total_return / 100)
            benchmark += benchmark * 0.01  # 1% benchmark growth
            
            equity_data.append({
                "date": date,
                "portfolio": round(cumulative_return, 2),
                "benchmark": round(benchmark, 2)
            })
        
        client.close()
        
        # If no data, return starting point
        if not equity_data:
            equity_data = [
                {"date": "Start", "portfolio": 10000, "benchmark": 10000}
            ]
        
        return {"data": equity_data}
    except Exception as e:
        print(f"❌ Error fetching equity curve: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch equity curve: {str(e)}")


@router.get("/dashboard/drawdown-history")
async def get_drawdown_history(user_info: dict = Depends(verify_firebase_token)):
    """
    Get drawdown history for the authenticated user
    """
    try:
        user_id = user_info.get("uid")
        backtest_collection, client = await get_mongodb_collection("backtests")
        
        backtests = await backtest_collection.find(
            {"user_id": user_id}
        ).sort("created_at", 1).to_list(length=1000)
        
        drawdown_data = []
        for backtest in backtests:
            created_at = backtest.get("created_at")
            date = created_at.strftime("%Y-%m-%d") if isinstance(created_at, datetime) else str(created_at)[:10]
            metrics = backtest.get("metrics", {})
            max_drawdown = abs(metrics.get("max_drawdown", 0))  # Make positive for display
            
            drawdown_data.append({
                "date": date,
                "drawdown": max_drawdown
            })
        
        client.close()
        
        return {"data": drawdown_data if drawdown_data else [{"date": "Start", "drawdown": 0}]}
    except Exception as e:
        print(f"❌ Error fetching drawdown: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch drawdown: {str(e)}")


@router.get("/dashboard/performance-comparison")
async def get_performance_comparison(user_info: dict = Depends(verify_firebase_token)):
    """
    Compare performance of different strategies for the authenticated user
    """
    try:
        user_id = user_info.get("uid")
        backtest_collection, client = await get_mongodb_collection("backtests")
        
        # Aggregate by strategy name for this user
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$strategy_name",
                "avgReturn": {"$avg": "$metrics.total_return"},
                "count": {"$sum": 1}
            }},
            {"$sort": {"avgReturn": -1}},
            {"$limit": 10}
        ]
        
        results = await backtest_collection.aggregate(pipeline).to_list(length=10)
        
        performance_data = [
            {
                "strategy": result["_id"] if result["_id"] else "Unknown",
                "returns": round(result["avgReturn"], 2)
            }
            for result in results
        ]
        
        client.close()
        
        return {"data": performance_data if performance_data else []}
    except Exception as e:
        print(f"❌ Error fetching performance comparison: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch performance: {str(e)}")


@router.get("/activity/recent")
async def get_recent_activity(user_id: str = None, limit: int = 20):
    """
    Get recent user activity
    """
    try:
        # Check multiple collections for activity
        strategies_collection, client1 = await get_mongodb_collection("drag_drop_strategies")
        backtest_collection, client2 = await get_mongodb_collection("backtest_results")
        
        activities = []
        
        # Get recent strategies
        recent_strategies = await strategies_collection.find(
            {"ownerId": user_id} if user_id else {}
        ).sort("createdAt", -1).limit(5).to_list(length=5)
        
        for strategy in recent_strategies:
            activities.append({
                "id": str(strategy["_id"]),
                "user": strategy.get("ownerId", "User"),
                "action": "Created new strategy",
                "target": strategy.get("name", "Untitled"),
                "time": _time_ago(strategy.get("createdAt", "")),
                "type": "create"
            })
        
        # Get recent backtests
        recent_backtests = await backtest_collection.find(
            {"userId": user_id} if user_id else {}
        ).sort("timestamp", -1).limit(10).to_list(length=10)
        
        for backtest in recent_backtests:
            activities.append({
                "id": str(backtest["_id"]),
                "user": backtest.get("userId", "User"),
                "action": "Ran backtest",
                "target": backtest.get("strategyName", "Unknown Strategy"),
                "time": _time_ago(backtest.get("timestamp", "")),
                "type": "backtest"
            })
        
        # Sort by time and limit
        activities = sorted(activities, key=lambda x: x["time"], reverse=False)[:limit]
        
        client1.close()
        client2.close()
        
        return {"activities": activities}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch activity: {str(e)}")


def _time_ago(timestamp_str: str) -> str:
    """Convert ISO timestamp to human-readable time ago"""
    try:
        if not timestamp_str:
            return "Unknown time"
        
        timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
        now = datetime.now(timestamp.tzinfo)
        delta = now - timestamp
        
        if delta.days > 365:
            return f"{delta.days // 365}y ago"
        elif delta.days > 30:
            return f"{delta.days // 30}mo ago"
        elif delta.days > 0:
            return f"{delta.days}d ago"
        elif delta.seconds > 3600:
            return f"{delta.seconds // 3600}h ago"
        elif delta.seconds > 60:
            return f"{delta.seconds // 60}m ago"
        else:
            return "Just now"
    except:
        return "Unknown time"
