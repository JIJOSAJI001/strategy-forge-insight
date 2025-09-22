// Backend shape currently implemented by our FastAPI service
export type BacktestResponse = {
  symbol: string;
  timeframe: string;
  rows: number;
  metrics: Record<string, number>;
  equity_curve: { date: string; equity: number }[];
  conditions: {
    best: Record<string, number>;
    risks: Record<string, number>;
    neutral: Record<string, number>;
  };
};

// UI model that reflects the richer, structured JSON described in the spec
export type UIBacktest = {
  header: {
    strategy_name?: string;
    symbol: string;
    timeframe?: string;
    period?: { start?: string; end?: string };
  };
  summary: {
    total_return?: number;
    sharpe_ratio?: number;
    max_drawdown?: number;
    total_trades?: number;
    winrate?: number;
  };
  equity_curve: { date: string; equity: number }[];
  trading_activity: { month: string; trades: number }[];
  performance_metrics?: {
    cagr?: number;
    volatility?: number;
    calmar_ratio?: number;
    alpha?: number;
    beta?: number;
  };
  trading_statistics?: {
    total_trades?: number;
    winning_trades?: number;
    losing_trades?: number;
    avg_win?: number;
    avg_loss?: number;
  };
  risk_analysis?: {
    max_drawdown?: number;
    avg_drawdown?: number;
    recovery_time?: string;
    var_95?: number;
    sortino_ratio?: number;
  };
  conditions_analysis?: {
    best_month?: string;
    worst_month?: string;
    neutral_months?: string[];
  };
  metadata?: {
    backtest_id?: string;
    created_at?: string;
    source?: string;
  };
};

export type StrategyImportMeta = {
  name?: string;
  source?: "pine_script" | "builder" | string;
  file_name?: string;
};

export type SimulationContext = {
  symbol: string;
  timeframe?: string;
  data_years?: number;
  start_date?: string;
  end_date?: string;
};

export type BacktestRequest = {
  symbol: string;
  start_date: string;
  end_date: string;
  timeframe?: string;
  strategy?: StrategyImportMeta | Record<string, unknown>;
  simulation_context?: SimulationContext;
};

export async function runBacktest(req: BacktestRequest): Promise<BacktestResponse> {
  const res = await fetch(`/api/backtest/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(detail || `Backtest failed with ${res.status}`);
  }
  return res.json();
}

// Maps the current backend response (or a richer one if present) to the UI model
export function mapToUIBacktest(
  req: BacktestRequest,
  backend: BacktestResponse | any
): UIBacktest {
  // If the backend already follows the richer schema, pass through relevant fields
  if (backend && backend.summary && backend.performance_metrics) {
    return {
      header: {
        strategy_name: backend?.strategy?.name || backend.strategy_name,
        symbol: backend?.simulation_context?.symbol || backend.symbol || req.symbol,
        timeframe: backend?.simulation_context?.timeframe || backend.timeframe || req.timeframe,
        period: {
          start: backend?.simulation_context?.start_date || req.start_date,
          end: backend?.simulation_context?.end_date || req.end_date,
        },
      },
      summary: backend.summary,
      equity_curve: backend.equity_curve ?? [],
      trading_activity: backend.trading_activity ?? [],
      performance_metrics: backend.performance_metrics,
      trading_statistics: backend.trading_statistics,
      risk_analysis: backend.risk_analysis,
      conditions_analysis: backend.conditions_analysis,
      metadata: backend.metadata,
    };
  }

  // Otherwise adapt from our existing simpler backend
  const metrics = (backend?.metrics ?? {}) as Record<string, number>;
  const summary = {
    total_return: metrics.pnl, // pnl in absolute terms; callers may format as percent/amount
    sharpe_ratio: metrics.sharpe,
    max_drawdown: metrics.max_drawdown,
    total_trades: undefined,
    winrate: metrics.winrate,
  };

  // Derive a minimal conditions analysis from available fields
  const conditions_analysis = backend?.conditions
    ? {
        best_month: Object.keys(backend.conditions.best ?? {})[0],
        worst_month: Object.keys(backend.conditions.risks ?? {})[0],
        neutral_months: Object.keys(backend.conditions.neutral ?? {}),
      }
    : undefined;

  return {
    header: {
      symbol: backend?.symbol ?? req.symbol,
      timeframe: backend?.timeframe ?? req.timeframe,
      period: { start: req.start_date, end: req.end_date },
    },
    summary,
    equity_curve: backend?.equity_curve ?? [],
    trading_activity: [],
    performance_metrics: undefined,
    trading_statistics: undefined,
    risk_analysis: {
      max_drawdown: metrics.max_drawdown,
    },
    conditions_analysis,
    metadata: undefined,
  };
}

export async function runBacktestUI(req: BacktestRequest): Promise<UIBacktest> {
  const backend = await runBacktest(req);
  return mapToUIBacktest(req, backend);
}

