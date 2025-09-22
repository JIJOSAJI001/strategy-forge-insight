import argparse
import asyncio

from services.data_manager import get_data


async def run(symbol: str, start: str, end: str, timeframe: str):
    df = await get_data(symbol=symbol, start_date=start, end_date=end, timeframe=timeframe)
    print(f"symbol={symbol} timeframe={timeframe} rows={len(df)}")
    if not df.empty:
        print("start=", df["date"].min())
        print("end=", df["date"].max())


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--symbol", required=True)
    p.add_argument("--start", required=True)
    p.add_argument("--end", required=True)
    p.add_argument("--timeframe", default="1d")
    args = p.parse_args()
    asyncio.run(run(args.symbol, args.start, args.end, args.timeframe))


if __name__ == "__main__":
    main()

