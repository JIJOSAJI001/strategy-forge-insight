import argparse
import asyncio
import os
from datetime import datetime
from typing import Any, Dict, List

import pandas as pd

from db.mongo import MongoDB
from services.data_manager import _standardize_df  # reuse normalization


def _read_file(path: str) -> pd.DataFrame:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".parquet":
        df = pd.read_parquet(path)
    else:
        df = pd.read_csv(path)
    return _standardize_df(df)


async def _write_cache(symbol: str, timeframe: str, df: pd.DataFrame, source: str) -> None:
    collection = MongoDB.get_collection("historical_data")
    rows: List[Dict[str, Any]] = df[[c for c in ["date", "open", "high", "low", "close", "volume"] if c in df.columns]].copy().to_dict(orient="records")
    for r in rows:
        if isinstance(r.get("date"), (pd.Timestamp, datetime)):
            r["date"] = (pd.Timestamp(r["date"]).to_pydatetime()).isoformat()
        else:
            r["date"] = str(r.get("date"))
    await collection.update_one(
        {"symbol": symbol.upper(), "timeframe": timeframe},
        {
            "$set": {
                "symbol": symbol.upper(),
                "timeframe": timeframe,
                "data": rows,
                "source": source,
                "last_updated": datetime.utcnow().isoformat() + "Z",
            }
        },
        upsert=True,
    )


async def main():
    parser = argparse.ArgumentParser(description="Ingest OHLCV CSV/Parquet into MongoDB historical_data cache")
    parser.add_argument("--symbol", required=True, help="Symbol key, e.g., NIFTY, BANKNIFTY, INFY, TCS")
    parser.add_argument("--timeframe", required=True, help="Timeframe label, e.g., 1d, 1h, 30m, 15m")
    parser.add_argument("--file", required=True, help="Path to CSV or Parquet file")
    parser.add_argument("--source", default="manual", help="Source label to store in cache metadata")
    args = parser.parse_args()

    if not os.path.isfile(args.file):
        raise FileNotFoundError(f"File not found: {args.file}")

    # Connect to Mongo via env vars
    await MongoDB.connect_to_mongo()

    try:
        df = _read_file(args.file)
        if df.empty:
            raise ValueError("Parsed DataFrame is empty after standardization")
        await _write_cache(args.symbol, args.timeframe, df, source=args.source)
        print(
            f"Ingested {len(df)} rows into historical_data for symbol={args.symbol.upper()} timeframe={args.timeframe}"
        )
    finally:
        await MongoDB.close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())

