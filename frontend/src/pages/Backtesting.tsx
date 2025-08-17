import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { Progress } from "@/components/ui/progress";
import { 
  Play, 
  RotateCcw, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  DollarSign,
  Calendar,
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

const backtestData = [
  { date: "2023-01", equity: 10000, trades: 12, drawdown: 0 },
  { date: "2023-02", equity: 10250, trades: 15, drawdown: -1.2 },
  { date: "2023-03", equity: 10800, trades: 18, drawdown: -0.5 },
  { date: "2023-04", equity: 11200, trades: 22, drawdown: -2.1 },
  { date: "2023-05", equity: 11800, trades: 19, drawdown: -0.8 },
  { date: "2023-06", equity: 12400, trades: 25, drawdown: 0 },
  { date: "2023-07", equity: 12100, trades: 16, drawdown: -2.4 },
  { date: "2023-08", equity: 13200, trades: 28, drawdown: -1.1 },
];

export default function Backtesting() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Backtesting Results</h1>
          <p className="text-muted-foreground">Analyze your strategy performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Re-run
          </Button>
          <Button variant="trading" size="sm">
            <Play className="h-4 w-4 mr-2" />
            New Backtest
          </Button>
        </div>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                Completed
              </Badge>
              <div>
                <h3 className="font-medium">RSI Mean Reversion Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  Backtest Period: Jan 2023 - Aug 2023 • SPY 1H
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-success">+32.0%</p>
              <p className="text-sm text-muted-foreground">Total Return</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Return"
          value="32.0%"
          change="vs 8.2% benchmark"
          changeType="positive"
          icon={TrendingUp}
        />
        <MetricCard
          title="Sharpe Ratio"
          value="1.85"
          change="Excellent risk-adj. return"
          changeType="positive"
          icon={Target}
        />
        <MetricCard
          title="Max Drawdown"
          value="-2.4%"
          change="Low volatility"
          changeType="positive"
          icon={TrendingDown}
        />
        <MetricCard
          title="Total Trades"
          value="155"
          change="68% win rate"
          changeType="positive"
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
              <LineChart data={backtestData}>
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
              <ComposedChart data={backtestData}>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CAGR</span>
              <span className="font-medium">28.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volatility</span>
              <span className="font-medium">12.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Calmar Ratio</span>
              <span className="font-medium">11.88</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alpha</span>
              <span className="font-medium text-success">23.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Beta</span>
              <span className="font-medium">0.45</span>
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
              <span className="font-medium">155</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Winning Trades</span>
              <span className="font-medium text-success">105 (68%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Losing Trades</span>
              <span className="font-medium text-danger">50 (32%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Win</span>
              <span className="font-medium text-success">$124.50</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Loss</span>
              <span className="font-medium text-danger">-$67.20</span>
            </div>
          </CardContent>
        </Card>

        {/* Risk Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Drawdown</span>
              <span className="font-medium text-danger">-2.4%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Drawdown</span>
              <span className="font-medium">-1.2%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recovery Time</span>
              <span className="font-medium">12 days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VaR (95%)</span>
              <span className="font-medium">-1.8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sortino Ratio</span>
              <span className="font-medium">2.45</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}