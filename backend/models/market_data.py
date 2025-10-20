from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TimeframeEnum(str, Enum):
    """Supported timeframes for market data"""
    ONE_DAY = "1d"
    ONE_HOUR = "1h"
    THIRTY_MIN = "30m"
    FIFTEEN_MIN = "15m"


class OHLCVRecord(BaseModel):
    """Individual OHLCV data point"""
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MarketDataCacheDocument(BaseModel):
    """MongoDB document model for market_data_cache collection"""
    symbol: str
    timeframe: TimeframeEnum
    last_updated: datetime
    data: List[OHLCVRecord]
    source: Optional[str] = "yahoo"  # yahoo, mock, manual
    record_count: Optional[int] = 0
    
    @validator('record_count', always=True)
    def calculate_record_count(cls, v, values):
        return len(values.get('data', []))

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MarketDataCacheListItem(BaseModel):
    """Response model for listing cached market data"""
    symbol: str
    timeframe: str
    last_updated: datetime
    record_count: int
    source: Optional[str] = "yahoo"
    date_range: Optional[Dict[str, str]] = None  # {start: ISO, end: ISO}

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MarketDataSyncRequest(BaseModel):
    """Request model for syncing market data"""
    symbol: str = Field(..., description="Stock symbol (e.g., RELIANCE.NS, ^NSEI)")
    timeframe: TimeframeEnum = Field(default=TimeframeEnum.ONE_DAY, description="Data timeframe")
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    force_refresh: Optional[bool] = Field(default=False, description="Force re-fetch even if data exists")

    @validator('start_date', 'end_date')
    def validate_date_format(cls, v):
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid date format: {v}. Use YYYY-MM-DD")


class MarketDataSyncResponse(BaseModel):
    """Response model for sync operation"""
    success: bool
    message: str
    symbol: str
    timeframe: str
    records_fetched: int
    records_merged: int
    date_range: Dict[str, str]  # {start: ISO, end: ISO}
    source: str
    sync_timestamp: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class MarketDataDeleteRequest(BaseModel):
    """Request model for deleting market data"""
    symbol: str
    timeframe: Optional[TimeframeEnum] = None  # If None, delete all timeframes for symbol


class AdminActivityLog(BaseModel):
    """MongoDB document model for admin_activity_log collection"""
    action: str  # sync, delete, create, update
    target: str  # market_data, strategy, user
    details: Dict[str, Any]
    admin_uid: str
    admin_email: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class BacktestRunRequest(BaseModel):
    """Request model for running backtest (retail user)"""
    strategy_id: str = Field(..., description="MongoDB ObjectId of strategy")
    symbol: str = Field(..., description="Stock symbol to backtest")
    timeframe: TimeframeEnum = Field(default=TimeframeEnum.ONE_DAY)
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    end_date: str = Field(..., description="End date in YYYY-MM-DD format")
    
    @validator('start_date', 'end_date')
    def validate_date_format(cls, v):
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid date format: {v}. Use YYYY-MM-DD")


class BacktestMetrics(BaseModel):
    """Backtest performance metrics"""
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    total_trades: Optional[int] = 0
    winning_trades: Optional[int] = 0
    losing_trades: Optional[int] = 0
    avg_win: Optional[float] = 0.0
    avg_loss: Optional[float] = 0.0
    cagr: Optional[float] = None
    volatility: Optional[float] = None
    calmar_ratio: Optional[float] = None


class EquityCurvePoint(BaseModel):
    """Single point in equity curve"""
    date: str
    equity: float
    drawdown: Optional[float] = 0.0


class BacktestResultResponse(BaseModel):
    """Response model for backtest execution"""
    backtest_id: str
    strategy_id: str
    strategy_name: str
    symbol: str
    timeframe: str
    start_date: str
    end_date: str
    data_points: int
    metrics: BacktestMetrics
    equity_curve: List[EquityCurvePoint]
    execution_time_ms: float
    created_at: datetime
    data_source: str  # cache, yahoo, mock

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
