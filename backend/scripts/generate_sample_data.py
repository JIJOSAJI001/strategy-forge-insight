import argparse
import os
from datetime import datetime
from typing import List

import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def trading_days(start: str, end: str) -> pd.DatetimeIndex:
    start_dt = pd.to_datetime(start)
    end_dt = pd.to_datetime(end)
    all_days = pd.date_range(start=start_dt, end=end_dt, freq="B")
    return all_days


def synth_ohlcv(num: int, start_price: float = 1000.0, vol: float = 0.015, seed: int = 42):
    rng = np.random.default_rng(seed)
    returns = rng.normal(loc=0.0003, scale=vol, size=num)
    prices = start_price * np.exp(np.cumsum(returns))
    closes = prices
    highs = closes * (1 + np.abs(rng.normal(0.002, 0.005, size=num)))
    lows = closes * (1 - np.abs(rng.normal(0.002, 0.005, size=num)))
    opens = (highs + lows) / 2
    vols = rng.integers(low=100000, high=2000000, size=num)
    return opens, highs, lows, closes, vols


def generate(symbol: str, start: str, end: str) -> pd.DataFrame:
    dates = trading_days(start, end)
    opens, highs, lows, closes, vols = synth_ohlcv(len(dates), start_price=1000.0 + hash(symbol) % 500)
    df = pd.DataFrame(
        {
            "date": dates,
            "open": opens,
            "high": highs,
            "low": lows,
            "close": closes,
            "volume": vols,
        }
    )
    df = df.round({"open": 2, "high": 2, "low": 2, "close": 2})
    return df


def main():
    parser = argparse.ArgumentParser(description="Generate sample daily OHLCV data and save CSV files")
    parser.add_argument("--symbols", nargs="+", required=True, help="Symbols to generate, e.g., NIFTY BANKNIFTY INFY TCS")
    parser.add_argument("--start", default="2019-01-01")
    parser.add_argument("--end", default="2024-01-01")
    parser.add_argument("--timeframe", default="1d", help="Timeframe label used in filename")
    args = parser.parse_args()

    os.makedirs(DATA_DIR, exist_ok=True)

    for sym in args.symbols:
        df = generate(sym, args.start, args.end)
        out_path = os.path.join(DATA_DIR, f"{sym}_{args.timeframe}.csv")
        df.to_csv(out_path, index=False)
        print(f"Wrote {len(df)} rows -> {out_path}")


if __name__ == "__main__":
    main()

