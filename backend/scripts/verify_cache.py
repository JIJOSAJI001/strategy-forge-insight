import argparse
import asyncio
from typing import List

from db.mongo import MongoDB


async def verify(symbols: List[str], timeframe: str):
    await MongoDB.connect_to_mongo()
    try:
        collection = MongoDB.get_collection("historical_data")
        for sym in symbols:
            doc = await collection.find_one({"symbol": sym.upper(), "timeframe": timeframe})
            if not doc:
                print(f"MISS {sym.upper()} {timeframe}: no document")
                continue
            rows = len(doc.get("data", []))
            print(f"HIT  {sym.upper()} {timeframe}: rows={rows}, source={doc.get('source')} updated={doc.get('last_updated')}")
    finally:
        await MongoDB.close_mongo_connection()


def main():
    parser = argparse.ArgumentParser(description="Verify historical_data cache entries exist and have rows")
    parser.add_argument("--symbols", nargs="+", required=True)
    parser.add_argument("--timeframe", default="1d")
    args = parser.parse_args()
    asyncio.run(verify(args.symbols, args.timeframe))


if __name__ == "__main__":
    main()

