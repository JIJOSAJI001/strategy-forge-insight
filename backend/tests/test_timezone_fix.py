"""Test timezone handling in backtest metrics"""
import pandas as pd
import numpy as np
from datetime import datetime, timezone

# Create sample data with timezone-aware dates
dates = pd.date_range('2020-10-09', '2020-10-16', freq='D', tz='UTC')
prices = [100, 102, 101, 103, 105, 104, 106, 108]

df = pd.DataFrame({
    'date': dates,
    'close': prices
})

print("DataFrame:")
print(df)
print(f"\nDate column dtype: {df['date'].dtype}")
print(f"Is timezone-aware: {df['date'].dt.tz is not None}")

# Test the timezone fix
date_max = pd.to_datetime(df['date'].max())
date_min = pd.to_datetime(df['date'].min())

print(f"\nBefore fix:")
print(f"  date_max: {date_max}, tzinfo: {date_max.tzinfo}")
print(f"  date_min: {date_min}, tzinfo: {date_min.tzinfo}")

if date_max.tzinfo is not None:
    date_max = date_max.tz_localize(None)
if date_min.tzinfo is not None:
    date_min = date_min.tz_localize(None)

print(f"\nAfter fix:")
print(f"  date_max: {date_max}, tzinfo: {date_max.tzinfo}")
print(f"  date_min: {date_min}, tzinfo: {date_min.tzinfo}")

# Try subtraction
try:
    days = (date_max - date_min).days
    print(f"\n✅ Subtraction successful!")
    print(f"  Days: {days}")
    print(f"  Years: {days / 365.25}")
except Exception as e:
    print(f"\n❌ Subtraction failed: {e}")
