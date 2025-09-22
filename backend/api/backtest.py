from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
import pandas as pd

from services.data_manager import get_data
from db.mongo import MongoDB


router = APIRouter(prefix="/backtest", tags=["backtest"])


class StrategyImportMeta(BaseModel):
    name: Optional[str] = None
    source: Optional[str] = None  # e.g., "pine_script" or "builder"
    file_name: Optional[str] = None


class SimulationContext(BaseModel):
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    data_years: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class BacktestRequest(BaseModel):
    symbol: str
    start_date: str
    end_date: str
    timeframe: str = "1d"
    strategy: Optional[Dict[str, Any]] | Optional[StrategyImportMeta] = None
    simulation_context: Optional[SimulationContext] = None


class BacktestResponse(BaseModel):
    # Backward compatible fields
    symbol: str
    timeframe: str
    rows: int
    metrics: Dict[str, float]
    equity_curve: List[Dict[str, Any]]
    conditions: Dict[str, Any]

    # Rich schema additions
    strategy: Optional[StrategyImportMeta] = None
    simulation_context: Optional[SimulationContext] = None
    summary: Optional[Dict[str, Any]] = None
    trading_activity: Optional[List[Dict[str, Any]]] = None
    performance_metrics: Optional[Dict[str, Any]] = None
    trading_statistics: Optional[Dict[str, Any]] = None
    risk_analysis: Optional[Dict[str, Any]] = None
    conditions_analysis: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


def _compute_metrics(prices: pd.Series) -> Dict[str, float]:
    if prices.empty or prices.shape[0] < 2:
        return {"pnl": 0.0, "sharpe": 0.0, "max_drawdown": 0.0, "winrate": 0.0}
    rets = prices.pct_change().fillna(0.0)
    pnl = float(prices.iloc[-1] - prices.iloc[0])
    mean_ret = float(rets.mean())
    std_ret = float(rets.std(ddof=1)) if rets.shape[0] > 1 else 0.0
    sharpe = (mean_ret / std_ret * np.sqrt(252.0)) if std_ret > 0 else 0.0
    equity = (1.0 + rets).cumprod()
    peak = equity.cummax()
    drawdown = (equity - peak) / peak
    max_dd = float(drawdown.min()) if not drawdown.empty else 0.0
    winrate = float((rets > 0).mean()) if not rets.empty else 0.0
    return {
        "pnl": round(pnl, 4),
        "sharpe": round(sharpe, 4),
        "max_drawdown": round(max_dd, 4),
        "winrate": round(winrate, 4),
    }


def _equity_curve(prices: pd.Series) -> List[Dict[str, Any]]:
    if prices.empty:
        return []
    rets = prices.pct_change().fillna(0.0)
    equity = (1.0 + rets).cumprod()
    curve = [
        {"date": d.to_pydatetime().isoformat(), "equity": float(v)}
        for d, v in zip(prices.index, equity)
    ]
    return curve


def _conditions_summary(df: pd.DataFrame) -> Dict[str, Any]:
    if df.empty:
        return {"best": [], "risks": [], "neutral": []}
    df = df.copy()
    df["month"] = df["date"].dt.to_period("M").astype(str)
    monthly = df.groupby("month")["close"].apply(lambda s: (s.iloc[-1] / s.iloc[0]) - 1.0)
    best = monthly.sort_values(ascending=False).head(3).round(4).to_dict()
    worst = monthly.sort_values(ascending=True).head(3).round(4).to_dict()
    neutral = {k: v for k, v in monthly[np.isclose(monthly, 0.0, atol=0.001)].head(3).round(4).to_dict().items()}
    return {"best": best, "risks": worst, "neutral": neutral}


@router.post("/run", response_model=BacktestResponse)
async def run_backtest(payload: BacktestRequest):
    try:
        df = await get_data(
            symbol=payload.symbol.upper(),
            start_date=payload.start_date,
            end_date=payload.end_date,
            timeframe=payload.timeframe,
        )
        if df.empty:
            raise HTTPException(status_code=404, detail="No data available for the requested range")

        # Simplest baseline: buy-and-hold equity curve on close prices
        prices = df.set_index("date")["close"].astype(float)
        metrics = _compute_metrics(prices)
        curve = _equity_curve(prices)
        conds = _conditions_summary(df)

        # Construct richer response while keeping legacy fields
        response = BacktestResponse(
            symbol=payload.symbol.upper(),
            timeframe=payload.timeframe,
            rows=int(df.shape[0]),
            metrics=metrics,
            equity_curve=curve,
            conditions=conds,
            strategy=(payload.strategy if isinstance(payload.strategy, dict) else payload.strategy),
            simulation_context=payload.simulation_context or SimulationContext(
                symbol=payload.symbol.upper(),
                timeframe=payload.timeframe,
                start_date=payload.start_date,
                end_date=payload.end_date,
            ),
            summary={
                "total_return": metrics.get("pnl", 0.0),
                "sharpe_ratio": metrics.get("sharpe", 0.0),
                "max_drawdown": metrics.get("max_drawdown", 0.0),
                "winrate": metrics.get("winrate", 0.0),
            },
            trading_activity=[{"month": k, "trades": int(abs(v) * 10)} for k, v in (conds.get("best", {}) or {}).items()],
            performance_metrics={
                "cagr": None,
                "volatility": None,
                "calmar_ratio": None,
                "alpha": None,
                "beta": None,
            },
            trading_statistics={
                "total_trades": None,
                "winning_trades": None,
                "losing_trades": None,
                "avg_win": None,
                "avg_loss": None,
            },
            risk_analysis={
                "max_drawdown": metrics.get("max_drawdown", 0.0),
            },
            conditions_analysis={
                "best_month": list((conds.get("best", {}) or {}).keys())[0] if (conds.get("best") or {}) else None,
                "worst_month": list((conds.get("risks", {}) or {}).keys())[0] if (conds.get("risks") or {}) else None,
                "neutral_months": list((conds.get("neutral", {}) or {}).keys()),
            },
            metadata={
                "source": "api",
            },
        )

        # Persist backtest result
        try:
            collection = MongoDB.get_collection("backtests")
            await collection.insert_one({
                "symbol": response.symbol,
                "timeframe": response.timeframe,
                "rows": response.rows,
                "metrics": response.metrics,
                "equity_curve": response.equity_curve,
                "conditions": response.conditions,
                "requested_at": datetime.utcnow().isoformat() + "Z",
                "strategy": (payload.strategy or {}),
                "simulation_context": (response.simulation_context.dict() if response.simulation_context else {}),
                "start_date": payload.start_date,
                "end_date": payload.end_date,
            })
        except Exception:
            # Non-fatal if persistence fails
            pass

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {e}")

