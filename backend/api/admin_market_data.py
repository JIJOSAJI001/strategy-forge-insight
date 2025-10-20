"""
Admin Market Data API
Endpoints for managing market data cache (admin only)
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any
from datetime import datetime

from auth_mongodb import verify_firebase_token, require_role
from models.market_data import (
    MarketDataCacheListItem,
    MarketDataSyncRequest,
    MarketDataSyncResponse,
    MarketDataDeleteRequest
)
from services.market_data_service import market_data_service


router = APIRouter(prefix="/admin/market-data", tags=["admin", "market-data"])


@router.get("/", response_model=List[MarketDataCacheListItem])
async def list_market_data(
    user: Dict[str, Any] = Depends(require_role("admin"))
):
    """
    List all cached market data with metadata
    
    **Admin Only**
    
    Returns:
    - List of cached symbols with timeframe, record count, last updated timestamp
    """
    try:
        cached_data = await market_data_service.list_cached_data()
        return cached_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list market data: {str(e)}")


@router.post("/sync", response_model=MarketDataSyncResponse)
async def sync_market_data(
    payload: MarketDataSyncRequest,
    request: Request,
    user: Dict[str, Any] = Depends(require_role("admin"))
):
    """
    Sync market data from Yahoo Finance
    
    **Admin Only**
    
    Logic:
    1. Check if symbol+timeframe exists in cache
    2. Fetch data from Yahoo Finance for specified date range
    3. Merge new data with existing cache (no duplicates)
    4. Update cache and log activity
    
    Parameters:
    - symbol: Stock symbol (e.g., RELIANCE.NS, ^NSEI, NIFTY)
    - timeframe: Data interval (1d, 1h, 30m, 15m)
    - start_date: Start date (YYYY-MM-DD)
    - end_date: End date (YYYY-MM-DD)
    - force_refresh: If true, replace all existing data
    """
    try:
        # Parse dates
        start_date = datetime.fromisoformat(payload.start_date)
        end_date = datetime.fromisoformat(payload.end_date)
        
        # Validate date range
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must be before end_date")
        
        if end_date > datetime.now():
            raise HTTPException(status_code=400, detail="end_date cannot be in the future")
        
        # Get client IP and user agent
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Sync data
        result = await market_data_service.sync_market_data(
            symbol=payload.symbol.upper(),
            timeframe=payload.timeframe.value,
            start_date=start_date,
            end_date=end_date,
            force_refresh=payload.force_refresh,
            admin_uid=user.get("uid"),
            admin_email=user.get("email")
        )
        
        if not result['success']:
            raise HTTPException(status_code=500, detail=result['message'])
        
        return MarketDataSyncResponse(**result)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.delete("/")
async def delete_market_data(
    payload: MarketDataDeleteRequest,
    user: Dict[str, Any] = Depends(require_role("admin"))
):
    """
    Delete cached market data
    
    **Admin Only**
    
    Parameters:
    - symbol: Stock symbol to delete
    - timeframe: Optional. If provided, delete only this timeframe. Otherwise, delete all timeframes.
    """
    try:
        result = await market_data_service.delete_market_data(
            symbol=payload.symbol.upper(),
            timeframe=payload.timeframe.value if payload.timeframe else None,
            admin_uid=user.get("uid"),
            admin_email=user.get("email")
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.get("/activity-logs")
async def get_activity_logs(
    limit: int = 100,
    skip: int = 0,
    action: str = None,
    target: str = None,
    user: Dict[str, Any] = Depends(require_role("admin"))
):
    """
    Get admin activity logs
    
    **Admin Only**
    
    Parameters:
    - limit: Maximum number of logs to return (default: 100)
    - skip: Number of logs to skip for pagination (default: 0)
    - action: Filter by action type (sync, delete, create, update)
    - target: Filter by target type (market_data, strategy, user)
    """
    try:
        logs = await market_data_service.get_admin_activity_logs(
            limit=limit,
            skip=skip,
            action=action,
            target=target
        )
        
        return {
            "logs": logs,
            "count": len(logs),
            "limit": limit,
            "skip": skip
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {str(e)}")


@router.get("/stats")
async def get_market_data_stats(
    user: Dict[str, Any] = Depends(require_role("admin"))
):
    """
    Get statistics about cached market data
    
    **Admin Only**
    
    Returns:
    - Total symbols cached
    - Total records
    - Data by timeframe
    - Recent updates
    """
    try:
        cached_data = await market_data_service.list_cached_data()
        
        # Calculate statistics
        total_symbols = len(set(item.symbol for item in cached_data))
        total_records = sum(item.record_count for item in cached_data)
        
        # Group by timeframe
        by_timeframe = {}
        for item in cached_data:
            tf = item.timeframe
            if tf not in by_timeframe:
                by_timeframe[tf] = {"symbols": set(), "records": 0}
            by_timeframe[tf]["symbols"].add(item.symbol)
            by_timeframe[tf]["records"] += item.record_count
        
        # Convert sets to counts
        timeframe_stats = {
            tf: {
                "symbol_count": len(data["symbols"]),
                "record_count": data["records"]
            }
            for tf, data in by_timeframe.items()
        }
        
        # Get most recent updates
        recent_updates = sorted(
            cached_data,
            key=lambda x: x.last_updated,
            reverse=True
        )[:10]
        
        return {
            "total_symbols": total_symbols,
            "total_records": total_records,
            "total_cache_entries": len(cached_data),
            "by_timeframe": timeframe_stats,
            "recent_updates": [
                {
                    "symbol": item.symbol,
                    "timeframe": item.timeframe,
                    "last_updated": item.last_updated.isoformat(),
                    "record_count": item.record_count
                }
                for item in recent_updates
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch stats: {str(e)}")
