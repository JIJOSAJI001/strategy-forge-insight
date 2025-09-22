from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import os
from datetime import datetime

from db.mongo import MongoDB
from services.data_manager import DATA_DIR, get_data


router = APIRouter(prefix="/data", tags=["data"])


@router.get("/symbols", response_model=List[str])
async def list_symbols() -> List[str]:
    """List available symbols detected in the local data directory."""
    if not os.path.isdir(DATA_DIR):
        return []
    names: set[str] = set()
    for fname in os.listdir(DATA_DIR):
        base, ext = os.path.splitext(fname)
        if ext.lower() not in (".csv", ".parquet"):
            continue
        symbol = base.split("_")[0]
        if symbol:
            names.add(symbol.upper())
    return sorted(names)


@router.post("/force-refresh")
async def force_refresh(
    symbol: str,
    start_date: str = Query(..., description="ISO date e.g. 2020-01-01"),
    end_date: str = Query(..., description="ISO date e.g. 2024-01-01"),
    timeframe: str = Query("1d", description="1d, 1h, 30m, 15m"),
):
    """
    Force fetch data from remote API and refresh MongoDB cache.
    Uses the central get_data which will fetch-and-cache if needed.
    """
    try:
        df = await get_data(symbol=symbol.upper(), start_date=start_date, end_date=end_date, timeframe=timeframe)
        return {
            "symbol": symbol.upper(),
            "timeframe": timeframe,
            "rows": int(df.shape[0]),
            "start": df["date"].min().isoformat() if not df.empty else None,
            "end": df["date"].max().isoformat() if not df.empty else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to refresh data: {e}")

