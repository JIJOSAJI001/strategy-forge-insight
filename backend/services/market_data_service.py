"""
Market Data Service
Handles caching, syncing, fetching, and merging of historical market data
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Tuple
import asyncio
from collections import defaultdict

import pandas as pd
import yfinance as yf
from motor.motor_asyncio import AsyncIOMotorCollection
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from motor.motor_asyncio import AsyncIOMotorCollection

from db.mongo import MongoDB
from models.market_data import (
    MarketDataCacheDocument,
    MarketDataCacheListItem,
    OHLCVRecord,
    TimeframeEnum
)


# Symbol mapping for common Indian indices
SYMBOL_MAP: Dict[str, str] = {
    "NIFTY": "^NSEI",
    "BANKNIFTY": "^NSEBANK",
    "SENSEX": "^BSESN",
}

# Yahoo Finance interval mapping
TIMEFRAME_TO_YF_INTERVAL: Dict[str, str] = {
    "1d": "1d",
    "1h": "60m",
    "30m": "30m",
    "15m": "15m",
}

# Rate limiting for Yahoo Finance API
RATE_LIMIT_DELAY = 0.5  # seconds between requests
_last_request_time: Dict[str, datetime] = {}
_request_lock = asyncio.Lock()


class MarketDataService:
    """Service for managing market data cache and synchronization"""
    
    def __init__(self):
        self.collection_name = "market_data_cache"
        self.activity_log_name = "admin_activity_log"
    
    async def get_collection(self):
        """Get market data cache collection"""
        return MongoDB.get_collection(self.collection_name)
    
    async def get_activity_log(self):
        """Get admin activity log collection"""
        return MongoDB.get_collection(self.activity_log_name)
    
    def _normalize_symbol(self, symbol: str) -> str:
        """Convert common symbol names to Yahoo Finance tickers"""
        symbol_upper = symbol.upper()
        return SYMBOL_MAP.get(symbol_upper, symbol)
    
    def _get_yf_interval(self, timeframe: str) -> str:
        """Convert timeframe to Yahoo Finance interval"""
        return TIMEFRAME_TO_YF_INTERVAL.get(timeframe, "1d")
    
    async def _rate_limit_yf_request(self, symbol: str):
        """Implement rate limiting for Yahoo Finance API"""
        async with _request_lock:
            last_time = _last_request_time.get(symbol)
            if last_time:
                elapsed = (datetime.now() - last_time).total_seconds()
                if elapsed < RATE_LIMIT_DELAY:
                    await asyncio.sleep(RATE_LIMIT_DELAY - elapsed)
            _last_request_time[symbol] = datetime.now()
    
    async def _fetch_from_yahoo(
        self,
        symbol: str,
        start_date: datetime,
        end_date: datetime,
        timeframe: str
    ) -> pd.DataFrame:
        """Fetch data from Yahoo Finance with rate limiting and retry logic"""
        yf_symbol = self._normalize_symbol(symbol)
        yf_interval = self._get_yf_interval(timeframe)
        
        # Apply rate limiting
        await self._rate_limit_yf_request(yf_symbol)
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Fetch data from Yahoo Finance
                df = yf.download(
                    yf_symbol,
                    start=start_date,
                    end=end_date + timedelta(days=1),
                    interval=yf_interval,
                    progress=False,
                    auto_adjust=False
                )
                
                if df is None or df.empty:
                    if attempt < max_retries - 1:
                        await asyncio.sleep(1 * (attempt + 1))  # Exponential backoff
                        continue
                    return pd.DataFrame()
                
                # Standardize column names
                df = df.reset_index()
                df.columns = [col.lower().replace(' ', '_') for col in df.columns]
                
                # Rename columns to standard format
                rename_map = {
                    'datetime': 'timestamp',
                    'date': 'timestamp',
                    'adj_close': 'close'
                }
                df = df.rename(columns=rename_map)
                
                # Ensure we have required columns
                required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
                df = df[[col for col in required_cols if col in df.columns]]
                
                # Convert timestamp to datetime without timezone
                df['timestamp'] = pd.to_datetime(df['timestamp']).dt.tz_localize(None)
                
                # Remove any duplicates
                df = df.drop_duplicates(subset=['timestamp']).sort_values('timestamp')
                
                return df
                
            except Exception as e:
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 * (attempt + 1))
                    continue
                print(f"❌ Failed to fetch data from Yahoo Finance after {max_retries} attempts: {e}")
                return pd.DataFrame()
        
        return pd.DataFrame()
    
    def _merge_data(
        self,
        existing_data: List[OHLCVRecord],
        new_df: pd.DataFrame
    ) -> Tuple[List[OHLCVRecord], int]:
        """
        Merge existing cached data with newly fetched data
        Returns: (merged_data, records_merged_count)
        """
        # Convert existing data to DataFrame
        if existing_data:
            existing_df = pd.DataFrame([
                {
                    'timestamp': record.timestamp,
                    'open': record.open,
                    'high': record.high,
                    'low': record.low,
                    'close': record.close,
                    'volume': record.volume
                }
                for record in existing_data
            ])
            existing_df['timestamp'] = pd.to_datetime(existing_df['timestamp'])
        else:
            existing_df = pd.DataFrame()
        
        # Combine and remove duplicates (prefer new data)
        if not existing_df.empty and not new_df.empty:
            combined_df = pd.concat([existing_df, new_df], ignore_index=True)
            combined_df = combined_df.drop_duplicates(subset=['timestamp'], keep='last')
            combined_df = combined_df.sort_values('timestamp')
            records_merged = len(new_df)
        elif not new_df.empty:
            combined_df = new_df
            records_merged = len(new_df)
        else:
            combined_df = existing_df
            records_merged = 0
        
        # Convert back to OHLCVRecord list
        merged_data = [
            OHLCVRecord(
                timestamp=row['timestamp'],
                open=float(row['open']),
                high=float(row['high']),
                low=float(row['low']),
                close=float(row['close']),
                volume=float(row['volume'])
            )
            for _, row in combined_df.iterrows()
        ]
        
        return merged_data, records_merged
    
    async def list_cached_data(self) -> List[MarketDataCacheListItem]:
        """List all cached market data with metadata"""
        collection = await self.get_collection()
        
        cursor = collection.find({})
        results = []
        
        async for doc in cursor:
            data_list = doc.get('data', [])
            
            # Calculate date range
            date_range = None
            if data_list:
                timestamps = [
                    datetime.fromisoformat(d['timestamp']) if isinstance(d['timestamp'], str)
                    else d['timestamp']
                    for d in data_list
                ]
                date_range = {
                    'start': min(timestamps).isoformat(),
                    'end': max(timestamps).isoformat()
                }
            
            results.append(MarketDataCacheListItem(
                symbol=doc['symbol'],
                timeframe=doc['timeframe'],
                last_updated=datetime.fromisoformat(doc['last_updated']) if isinstance(doc['last_updated'], str) else doc['last_updated'],
                record_count=len(data_list),
                source=doc.get('source', 'yahoo'),
                date_range=date_range
            ))
        
        return sorted(results, key=lambda x: (x.symbol, x.timeframe))
    
    async def sync_market_data(
        self,
        symbol: str,
        timeframe: str,
        start_date: datetime,
        end_date: datetime,
        force_refresh: bool = False,
        admin_uid: str = None,
        admin_email: str = None
    ) -> Dict[str, Any]:
        """
        Sync market data: fetch from Yahoo Finance and merge with cache
        """
        collection = await self.get_collection()
        
        # Check if data exists
        existing_doc = await collection.find_one({
            'symbol': symbol,
            'timeframe': timeframe
        })
        
        # Fetch new data from Yahoo Finance
        new_df = await self._fetch_from_yahoo(symbol, start_date, end_date, timeframe)
        
        if new_df.empty:
            return {
                'success': False,
                'message': f'Failed to fetch data for {symbol}',
                'symbol': symbol,
                'timeframe': timeframe,
                'records_fetched': 0,
                'records_merged': 0,
                'date_range': {'start': start_date.isoformat(), 'end': end_date.isoformat()},
                'source': 'yahoo',
                'sync_timestamp': datetime.utcnow()
            }
        
        # Merge with existing data if not force refresh
        if existing_doc and not force_refresh:
            existing_data = [
                OHLCVRecord(**{
                    'timestamp': datetime.fromisoformat(d['timestamp']) if isinstance(d['timestamp'], str) else d['timestamp'],
                    'open': d['open'],
                    'high': d['high'],
                    'low': d['low'],
                    'close': d['close'],
                    'volume': d['volume']
                })
                for d in existing_doc.get('data', [])
            ]
            merged_data, records_merged = self._merge_data(existing_data, new_df)
        else:
            # Fresh data or force refresh
            merged_data = [
                OHLCVRecord(
                    timestamp=row['timestamp'],
                    open=float(row['open']),
                    high=float(row['high']),
                    low=float(row['low']),
                    close=float(row['close']),
                    volume=float(row['volume'])
                )
                for _, row in new_df.iterrows()
            ]
            records_merged = len(merged_data)
        
        # Save to cache
        await collection.update_one(
            {'symbol': symbol, 'timeframe': timeframe},
            {
                '$set': {
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'last_updated': datetime.utcnow(),
                    'data': [record.dict() for record in merged_data],
                    'source': 'yahoo',
                    'record_count': len(merged_data)
                }
            },
            upsert=True
        )
        
        # Log admin activity
        if admin_uid and admin_email:
            await self.log_admin_activity(
                action='sync',
                target='market_data',
                details={
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'records_fetched': len(new_df),
                    'records_merged': records_merged,
                    'force_refresh': force_refresh
                },
                admin_uid=admin_uid,
                admin_email=admin_email
            )
        
        # Calculate date range
        timestamps = [record.timestamp for record in merged_data]
        date_range = {
            'start': min(timestamps).isoformat(),
            'end': max(timestamps).isoformat()
        } if timestamps else {'start': start_date.isoformat(), 'end': end_date.isoformat()}
        
        return {
            'success': True,
            'message': f'Successfully synced data for {symbol}',
            'symbol': symbol,
            'timeframe': timeframe,
            'records_fetched': len(new_df),
            'records_merged': records_merged,
            'date_range': date_range,
            'source': 'yahoo',
            'sync_timestamp': datetime.utcnow()
        }
    
    async def delete_market_data(
        self,
        symbol: str,
        timeframe: Optional[str] = None,
        admin_uid: str = None,
        admin_email: str = None
    ) -> Dict[str, Any]:
        """Delete cached market data for a symbol (and optionally timeframe)"""
        collection = await self.get_collection()
        
        query = {'symbol': symbol}
        if timeframe:
            query['timeframe'] = timeframe
        
        result = await collection.delete_many(query)
        
        # Log admin activity
        if admin_uid and admin_email:
            await self.log_admin_activity(
                action='delete',
                target='market_data',
                details={
                    'symbol': symbol,
                    'timeframe': timeframe,
                    'deleted_count': result.deleted_count
                },
                admin_uid=admin_uid,
                admin_email=admin_email
            )
        
        return {
            'success': True,
            'message': f'Deleted {result.deleted_count} record(s)',
            'symbol': symbol,
            'timeframe': timeframe,
            'deleted_count': result.deleted_count
        }
    
    async def get_cached_data(
        self,
        symbol: str,
        timeframe: str,
        start_date: datetime,
        end_date: datetime
    ) -> Optional[pd.DataFrame]:
        """Retrieve cached data for a symbol and timeframe within date range"""
        collection = await self.get_collection()
        
        doc = await collection.find_one({
            'symbol': symbol,
            'timeframe': timeframe
        })
        
        if not doc or not doc.get('data'):
            return None
        
        # Convert to DataFrame
        df = pd.DataFrame([
            {
                'timestamp': datetime.fromisoformat(d['timestamp']) if isinstance(d['timestamp'], str) else d['timestamp'],
                'open': d['open'],
                'high': d['high'],
                'low': d['low'],
                'close': d['close'],
                'volume': d['volume']
            }
            for d in doc['data']
        ])
        
        # Filter by date range
        df = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= end_date)]
        
        return df if not df.empty else None
    
    async def log_admin_activity(
        self,
        action: str,
        target: str,
        details: Dict[str, Any],
        admin_uid: str,
        admin_email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Log admin activity to admin_activity_log collection"""
        activity_log = await self.get_activity_log()
        
        await activity_log.insert_one({
            'action': action,
            'target': target,
            'details': details,
            'admin_uid': admin_uid,
            'admin_email': admin_email,
            'timestamp': datetime.utcnow(),
            'ip_address': ip_address,
            'user_agent': user_agent
        })
    
    async def get_admin_activity_logs(
        self,
        limit: int = 100,
        skip: int = 0,
        action: Optional[str] = None,
        target: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve admin activity logs with optional filtering"""
        activity_log = await self.get_activity_log()
        
        query = {}
        if action:
            query['action'] = action
        if target:
            query['target'] = target
        
        cursor = activity_log.find(query).sort('timestamp', -1).skip(skip).limit(limit)
        logs = []
        
        async for doc in cursor:
            doc['_id'] = str(doc['_id'])
            logs.append(doc)
        
        return logs


# Singleton instance
market_data_service = MarketDataService()
