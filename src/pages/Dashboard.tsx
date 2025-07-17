import { MetricCard } from "@/components/ui/metric-card";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  BarChart3,
  Play,
  Settings,
  Plus
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your trading strategies and performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="trading" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Strategy
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Return"
          value="$24,580"
          change="+12.4% vs last month"
          changeType="positive"
          icon={TrendingUp}
        />
        <MetricCard
          title="Sharpe Ratio"
          value="2.34"
          change="+0.15 vs benchmark"
          changeType="positive"
          icon={Target}
        />
        <MetricCard
          title="Max Drawdown"
          value="-5.8%"
          change="Improved from -8.2%"
          changeType="positive"
          icon={TrendingDown}
        />
        <MetricCard
          title="Win Rate"
          value="68.5%"
          change="+3.2% this quarter"
          changeType="positive"
          icon={BarChart3}
        />
      </div>

      {/* Charts Section */}
      <DashboardCharts />

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Play className="h-4 w-4 mr-2" />
              Run Backtest
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Create Strategy
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analysis
            </Button>
          </CardContent>
        </Card>

        {/* Active Strategies */}
        <Card>
          <CardHeader>
            <CardTitle>Active Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">RSI Mean Reversion</p>
                  <p className="text-sm text-muted-foreground">Running</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-success">+8.2%</p>
                  <p className="text-xs text-muted-foreground">24h</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Bollinger Bands</p>
                  <p className="text-sm text-muted-foreground">Paper Trading</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-success">+12.7%</p>
                  <p className="text-xs text-muted-foreground">7d</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">MACD Strategy</p>
                  <p className="text-sm text-muted-foreground">Backtesting</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-danger">-2.1%</p>
                  <p className="text-xs text-muted-foreground">30d</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle>AI Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium">Bullish Momentum Detected</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current market conditions favor trend-following strategies
                </p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">Volatility Alert</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Consider adjusting position sizes for high-vol assets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}