import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { useQuery } from "@tanstack/react-query";
import { runBacktestUI, type UIBacktest, type BacktestRequest } from "@/services/backtest.service";
import { useMemo, useRef, useState } from "react";
import { 
  Play, 
  RotateCcw, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Bar
} from "recharts";

function formatPercent(n?: number) {
  if (n === undefined || n === null) return "-";
  return `${(n * 100).toFixed(2)}%`;
}

function trendType(value?: number, goodIfHigh = true): "positive" | "negative" | "neutral" {
  if (value === undefined || value === null) return "neutral";
  if (value === 0) return "neutral";
  const isPositive = value > 0;
  return goodIfHigh ? (isPositive ? "positive" : "negative") : (isPositive ? "negative" : "positive");
}

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Backtesting() {
  // Input Configuration Panel state
  const [symbol, setSymbol] = useState<string>("NIFTY");
  const [timeframe, setTimeframe] = useState<string>("1d");
  const [rangeYears, setRangeYears] = useState<number>(5);
  const [startDate, setStartDate] = useState<string>("2019-01-01");
  const [endDate, setEndDate] = useState<string>("2024-01-01");
  const [pineMeta, setPineMeta] = useState<{ name?: string; file_name?: string } | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const paramsRef = useRef<BacktestRequest | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useQuery<UIBacktest>({
    queryKey: ["backtest", paramsRef.current],
    queryFn: () => runBacktestUI(paramsRef.current as BacktestRequest),
    enabled: false,
  });

  const equityData = data?.equity_curve ?? [];
  const tradingActivity = useMemo(() => data?.trading_activity ?? [], [data]);

  const handleExport = () => {
    if (!data) return;
    downloadJSON(`backtest_${data?.header.symbol ?? "result"}.json`, data);
  };
  const handleRerun = () => { if (paramsRef.current) refetch(); };
  const handleNew = () => { window.location.href = "/strategy-builder"; };

  const handleImportPine = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPineMeta({ name: file.name.replace(/\.[^/.]+$/, ''), file_name: file.name });
  };

  const handleRun = async () => {
    // Compute dates from rangeYears if user left defaults; prefer explicit dates
    const req: BacktestRequest = {
      symbol,
      start_date: startDate,
      end_date: endDate,
      timeframe,
      strategy: pineMeta ? { name: pineMeta.name, source: "pine_script", file_name: pineMeta.file_name } : { source: "builder" },
      simulation_context: {
        symbol,
        timeframe,
        data_years: rangeYears,
        start_date: startDate,
        end_date: endDate,
      },
    };
    paramsRef.current = req;
    await refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Backtesting Environment</h1>
          <p className="text-muted-foreground">
            {data?.header?.symbol || symbol} • {data?.header?.timeframe || timeframe}
            {(data?.header?.period?.start || startDate) && (data?.header?.period?.end || endDate) ? (
              <> • {(data?.header?.period?.start || startDate)} to {(data?.header?.period?.end || endDate)}</>
            ) : null}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <input ref={fileInputRef} type="file" accept=".pine" className="hidden" onChange={handleImportPine} />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Download className="h-4 w-4 mr-2" />
            Import Pine Script
          </Button>
          <Button variant="outline" size="sm" onClick={handleRerun} disabled={!paramsRef.current || isFetching}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Re-run Backtest
          </Button>
          <Button variant="trading" size="sm" onClick={handleRun} disabled={isFetching}>
            <Play className="h-4 w-4 mr-2" />
            Run Backtest
          </Button>
        </div>
      </div>

      {/* Input Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Input Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-muted-foreground mb-1">Index/Stock Symbol</label>
              <select className="h-10 rounded-md border bg-transparent px-3" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
                <option value="NIFTY">NIFTY</option>
                <option value="BANKNIFTY">BANKNIFTY</option>
                <option value="INFY">INFY</option>
                <option value="TCS">TCS</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-muted-foreground mb-1">Timeframe</label>
              <select className="h-10 rounded-md border bg-transparent px-3" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                <option value="1m">1m</option>
                <option value="1h">1h</option>
                <option value="1d">1d</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-muted-foreground mb-1">Data Range (years)</label>
              <input type="number" min={1} max={15} className="h-10 rounded-md border bg-transparent px-3" value={rangeYears} onChange={(e) => setRangeYears(Number(e.target.value))} />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-muted-foreground mb-1">Imported Strategy</label>
              <div className="h-10 flex items-center rounded-md border px-3 text-sm">
                {pineMeta?.file_name || "None"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="flex flex-col">
              <label className="text-sm text-muted-foreground mb-1">Start Date</label>
              <input type="date" className="h-10 rounded-md border bg-transparent px-3" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-muted-foreground mb-1">End Date</label>
              <input type="date" className="h-10 rounded-md border bg-transparent px-3" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Screen */}
      {(isLoading || isFetching) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Simulating...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {symbol} • {timeframe} • {rangeYears}y ({startDate} to {endDate})
                </p>
                <div className="mt-4 h-2 w-full max-w-md overflow-hidden rounded bg-muted">
                  <div className="h-2 w-1/2 animate-pulse rounded bg-primary" style={{ animationDuration: '1200ms' }} />
                </div>
              </div>
              <div className="w-60 text-sm">
                <div className="font-medium mb-2">Live Feed</div>
                <div className="h-28 overflow-auto rounded border p-2 text-xs text-muted-foreground">
                  <div>Initializing engine...</div>
                  <div>Loading dataset {symbol} ({timeframe})</div>
                  <div>Running historical playback...</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">{(isLoading || isFetching) ? "Running" : isError ? "Error" : data ? "Completed" : "Idle"}</Badge>
              <div>
                <h3 className="font-medium">{data?.header?.strategy_name || pineMeta?.name || `${data?.header?.symbol ?? symbol} Strategy`}</h3>
                <p className="text-sm text-muted-foreground">Backtest Period: {data?.header?.period?.start || startDate || "-"} - {data?.header?.period?.end || endDate || "-"}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-success">{formatPercent(data?.summary?.total_return)}</p>
              <p className="text-sm text-muted-foreground">Total Return</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Return"
          value={formatPercent(data?.summary?.total_return)}
          changeType={trendType(data?.summary?.total_return, true)}
          icon={TrendingUp}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={(data?.summary?.sharpe_ratio ?? 0).toFixed(2)}
          changeType={trendType(data?.summary?.sharpe_ratio, true)}
          icon={Target}
        />
        <MetricCard
          title="Max Drawdown"
          value={formatPercent(data?.summary?.max_drawdown)}
          changeType={trendType(data?.summary?.max_drawdown, false)}
          icon={TrendingDown}
        />
        <MetricCard
          title="Total Trades"
          value={data?.summary?.total_trades ?? data?.trading_statistics?.total_trades ?? "-"}
          change={data?.summary?.winrate !== undefined ? `${formatPercent(data.summary.winrate)} win rate` : undefined}
          changeType={trendType(data?.summary?.winrate, true)}
          icon={BarChart3}
        />
        <MetricCard
          title="Win Rate"
          value={formatPercent(data?.summary?.winrate)}
          changeType={trendType(data?.summary?.winrate, true)}
          icon={BarChart3}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <Card>
          <CardHeader>
            <CardTitle>Equity Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={equityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  name="Portfolio Value"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trading Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={tradingActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar 
                  dataKey="trades" 
                  fill="hsl(var(--primary))"
                  name="Trades Count"
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CAGR</span>
              <span className="font-medium">{formatPercent(data?.performance_metrics?.cagr)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volatility</span>
              <span className="font-medium">{formatPercent(data?.performance_metrics?.volatility)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Calmar Ratio</span>
              <span className="font-medium">{data?.performance_metrics?.calmar_ratio ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alpha</span>
              <span className="font-medium text-success">{formatPercent(data?.performance_metrics?.alpha)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Beta</span>
              <span className="font-medium">{data?.performance_metrics?.beta ?? "-"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Trading Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-medium">{data?.trading_statistics?.total_trades ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Winning Trades</span>
              <span className="font-medium text-success">{data?.trading_statistics?.winning_trades ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Losing Trades</span>
              <span className="font-medium text-danger">{data?.trading_statistics?.losing_trades ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Win</span>
              <span className="font-medium text-success">{formatPercent(data?.trading_statistics?.avg_win)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Loss</span>
              <span className="font-medium text-danger">{formatPercent(data?.trading_statistics?.avg_loss)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Drawdown</span>
            <span className="font-medium text-danger">{formatPercent(data?.risk_analysis?.max_drawdown)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Drawdown</span>
            <span className="font-medium">{formatPercent(data?.risk_analysis?.avg_drawdown)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Recovery Time</span>
            <span className="font-medium">{data?.risk_analysis?.recovery_time ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VaR (95%)</span>
            <span className="font-medium text-danger">{formatPercent(data?.risk_analysis?.var_95)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sortino Ratio</span>
            <span className="font-medium text-success">{data?.risk_analysis?.sortino_ratio ?? "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Market Conditions and Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Market Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Best Month</span>
              <span className="font-medium text-success">{data?.conditions_analysis?.best_month ?? "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Worst Month</span>
              <span className="font-medium text-danger">{data?.conditions_analysis?.worst_month ?? "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Neutral Months</span>
              <span className="font-medium">{data?.conditions_analysis?.neutral_months?.join(", ") || "-"}</span>
            </div>
          </div>
          {data?.metadata ? (
            <div className="pt-2 text-xs text-muted-foreground">
              <span>Backtest ID: {data.metadata.backtest_id || "-"}</span>
              <span className="mx-2">•</span>
              <span>Created: {data.metadata.created_at || "-"}</span>
              <span className="mx-2">•</span>
              <span>Source: {data.metadata.source || "-"}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}