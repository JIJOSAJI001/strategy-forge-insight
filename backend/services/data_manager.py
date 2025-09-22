import os
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any, List

import pandas as pd
import numpy as np
import yfinance as yf
from motor.motor_asyncio import AsyncIOMotorCollection

from db.mongo import MongoDB


DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

# Map human-friendly symbols to Yahoo Finance tickers
SYMBOL_MAP: Dict[str, str] = {
    "NIFTY": "^NSEI",
    "BANKNIFTY": "^NSEBANK",
    "INFY": "INFY.NS",
    "TCS": "TCS.NS",
}

# Staleness thresholds by timeframe
FRESHNESS_BY_TIMEFRAME_DAYS: Dict[str, int] = {
    "1d": 1,
    "1h": 1,
    "30m": 1,
    "15m": 1,
}


def _ensure_datetime(dt: Any) -> datetime:
    if isinstance(dt, datetime):
        return dt
    return datetime.fromisoformat(str(dt))


def _standardize_df(df: pd.DataFrame) -> pd.DataFrame:
    # Normalize columns to ['date','open','high','low','close','volume']
    rename_map = {
        "Date": "date", "Datetime": "date", "date": "date",
        "Open": "open", "open": "open",
        "High": "high", "high": "high",
        "Low": "low", "low": "low",
        "Close": "close", "Adj Close": "close", "close": "close",
        "Volume": "volume", "volume": "volume",
    }
    df = df.rename(columns=rename_map)
    if "date" not in df.columns:
        if df.index.name and df.index.name.lower() in ("date", "datetime"):
            df = df.reset_index()
        else:
            df.index.name = "date"
            df = df.reset_index()
    df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None)
    for col in ["open", "high", "low", "close"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
    if "volume" in df.columns:
        df["volume"] = pd.to_numeric(df["volume"], errors="coerce").fillna(0).astype(float)
    df = df[[c for c in ["date", "open", "high", "low", "close", "volume"] if c in df.columns]]
    df = df.sort_values("date").drop_duplicates(subset=["date"]).reset_index(drop=True)
    return df


async def _get_collection() -> AsyncIOMotorCollection:
    return MongoDB.get_collection("historical_data")





def _find_local_file(symbol: str, timeframe: str) -> Optional[str]:
    # Check for {symbol}_{timeframe}.parquet/csv and {symbol}.parquet/csv
    candidates = [
        f"{symbol}_{timeframe}.parquet",
        f"{symbol}_{timeframe}.csv",
        f"{symbol}.parquet",
        f"{symbol}.csv",
    ]
    for name in candidates:
        path = os.path.join(DATA_DIR, name)
        if os.path.isfile(path):
            return path
    return None


def _read_local_ohlcv(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".parquet":
        df = pd.read_parquet(path)
    else:
        df = pd.read_csv(path)
    return _standardize_df(df)


async def _read_cached(symbol: str, timeframe: str) -> Tuple[Optional[pd.DataFrame], Optional[datetime]]:
    collection = await _get_collection()
    doc = await collection.find_one({"symbol": symbol, "timeframe": timeframe})
    if not doc or "data" not in doc:
        return None, None
    rows = doc.get("data", [])
    df = pd.DataFrame(rows)
    if df.empty:
        return None, None
    df = _standardize_df(df)
    last_updated = _ensure_datetime(doc.get("last_updated")) if doc.get("last_updated") else None
    return df, last_updated


async def _write_cache(symbol: str, timeframe: str, df: pd.DataFrame, source: str) -> None:
    collection = await _get_collection()
    rows: List[Dict[str, Any]] = df[["date", "open", "high", "low", "close", "volume"]].copy().to_dict(orient="records")
    for r in rows:
        if isinstance(r["date"], (pd.Timestamp, datetime)):
            r["date"] = (pd.Timestamp(r["date"]).to_pydatetime()).isoformat()
        else:
            r["date"] = str(r["date"])
    await collection.update_one(
        {"symbol": symbol, "timeframe": timeframe},
        {
            "$set": {
                "symbol": symbol,
                "timeframe": timeframe,
                "data": rows,
                "source": source,
                "last_updated": datetime.utcnow().isoformat() + "Z",
            }
        },
        upsert=True,
    )


def _yahoo_symbol(symbol: str) -> str:
    return SYMBOL_MAP.get(symbol, symbol)


def _yf_interval(timeframe: str) -> str:
    mapping = {"1d": "1d", "1h": "60m", "30m": "30m", "15m": "15m"}
    return mapping.get(timeframe, "1d")


async def _fetch_yahoo(symbol: str, timeframe: str, start_date: datetime, end_date: datetime) -> pd.DataFrame:
    ticker = _yahoo_symbol(symbol)
    interval = _yf_interval(timeframe)
    df = yf.download(ticker, start=start_date, end=end_date + timedelta(days=1), interval=interval, progress=False)
    if df is None or df.empty:
        return pd.DataFrame()
    df = df.reset_index()
    return _standardize_df(df)


def _is_fresh(last_updated: Optional[datetime], timeframe: str) -> bool:
    if not last_updated:
        return False
    days = FRESHNESS_BY_TIMEFRAME_DAYS.get(timeframe, 1)
    return datetime.utcnow() - last_updated <= timedelta(days=days)


async def get_data(symbol: str, start_date: str, end_date: str, timeframe: str = "1d") -> pd.DataFrame:
    """
    Central data access method. Chooses among local files, Mongo cache, or Yahoo fetch.
    Guarantees a DataFrame with columns: date, open, high, low, close, volume.
    """
    start_dt = _ensure_datetime(start_date)
    end_dt = _ensure_datetime(end_date)

    # 1) Try cache if fresh and covers range
    try:
        cached_df, last_updated = await _read_cached(symbol, timeframe)
    except Exception:
        cached_df, last_updated = None, None

    if cached_df is not None and not cached_df.empty:
        cached_df = cached_df[(cached_df["date"] >= start_dt) & (cached_df["date"] <= end_dt)]
        if _is_fresh(last_updated, timeframe) and not cached_df.empty:
            return cached_df.reset_index(drop=True)

    # 2) Try local files
    try:
        local_path = _find_local_file(symbol, timeframe)
        if local_path:
            local_df = _read_local_ohlcv(local_path)
            sliced = local_df[(local_df["date"] >= start_dt) & (local_df["date"] <= end_dt)].copy()
            if not sliced.empty:
                # Write to cache for faster next time
                try:
                    await _write_cache(symbol, timeframe, local_df, source="mock")
                except Exception:
                    pass
                return sliced.reset_index(drop=True)
    except Exception:
        # Ignore file errors, proceed to fetch
        pass

    # 3) Fetch from Yahoo and cache
    try:
        fetched = await _fetch_yahoo(symbol, timeframe, start_dt, end_dt)
        if not fetched.empty:
            await _write_cache(symbol, timeframe, fetched, source="yahoo")
            return fetched[(fetched["date"] >= start_dt) & (fetched["date"] <= end_dt)].reset_index(drop=True)
    except Exception:
        # Ignore fetch errors and try to fall back
        pass

    # 4) Final fallback: any cached (even stale) or local data overlapping partially
    if cached_df is not None and not cached_df.empty:
        sliced = cached_df[(cached_df["date"] >= start_dt) & (cached_df["date"] <= end_dt)]
        if not sliced.empty:
            return sliced.reset_index(drop=True)

    if local_path := _find_local_file(symbol, timeframe):
        try:
            local_df = _read_local_ohlcv(local_path)
            sliced = local_df[(local_df["date"] >= start_dt) & (local_df["date"] <= end_dt)]
            if not sliced.empty:
                return sliced.reset_index(drop=True)
        except Exception:
            pass

    # If we reach here, no data available
    return pd.DataFrame(columns=["date", "open", "high", "low", "close", "volume"])

