import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { Sparkles, AlertTriangle, BarChart3, Plus, Play, Layers, Target, TrendingUp, Star, Users, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Demo data for metrics, activity, and AI insight
const metrics = [
  {
    title: "Total Strategies",
    value: 18,
    change: "+2 this month",
    changeType: "positive",
    icon: Layers,
  },
  {
    title: "Avg Win Ratio",
    value: "64.2%",
    change: "+1.8% vs last month",
    changeType: "positive",
    icon: BarChart3,
  },
  {
    title: "Sharpe Ratio",
    value: "2.12",
    change: "+0.09 vs benchmark",
    changeType: "positive",
    icon: Target,
  },
  {
    title: "Last Backtest",
    value: "+12.7%",
    change: "MACD Strategy",
    changeType: "positive",
    icon: Play,
  },
  {
    title: "Best Strategy",
    value: "Bollinger Bands",
    change: "+31.7% this month",
    changeType: "positive",
    icon: Star,
  },
];

const activityFeed = [
  {
    id: 1,
    user: "Jane Doe",
    action: "Created new strategy",
    target: "RSI Mean Reversion",
    time: "2m ago",
  },
  {
    id: 2,
    user: "John Smith",
    action: "Optimized parameters",
    target: "Bollinger Bands",
    time: "10m ago",
  },
  {
    id: 3,
    user: "Jane Doe",
    action: "Ran backtest",
    target: "MACD Strategy",
    time: "30m ago",
  },
  {
    id: 4,
    user: "Alex Lee",
    action: "Compared strategies",
    target: "Built-in vs Custom",
    time: "1h ago",
  },
  {
    id: 5,
    user: "Jane Doe",
    action: "Created new strategy",
    target: "Breakout Momentum",
    time: "2h ago",
  },
  {
    id: 6,
    user: "John Smith",
    action: "Detected overfitting",
    target: "RSI Mean Reversion",
    time: "3h ago",
  },
];

const aiInsight =
  "Market regime detected: Bullish momentum with moderate volatility. Consider increasing allocation to trend-following strategies. Portfolio Sharpe ratio is above 2, indicating strong risk-adjusted returns.";

export default function Dashboard() {
  const [showAI, setShowAI] = useState(false);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Your trading performance at a glance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowAI(!showAI)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Insight
          </Button>
          <Button variant="trading" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create New Strategy
          </Button>
        </div>
      </div>

      {/* Alert Banners */}
      <div className="space-y-3">
        <Alert className="border-warning/40 bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <div>
            <AlertTitle>Overfitting Warning</AlertTitle>
            <AlertDescription>
              Recent backtest detected possible overfitting in <span className="font-semibold">RSI Mean Reversion</span>. Review your parameters or use walk-forward validation.
            </AlertDescription>
          </div>
        </Alert>
        <Alert>
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <AlertTitle>Market Regime: Bullish</AlertTitle>
            <AlertDescription>
              AI detected a bullish regime with moderate volatility. Trend-following strategies may outperform.
            </AlertDescription>
          </div>
        </Alert>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.title}
            title={m.title}
            value={m.value}
            change={m.change}
            changeType={m.changeType as any}
            icon={m.icon}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance Trend Chart */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardCharts />
            </CardContent>
          </Card>
        </div>

        {/* AI Insight + Activity Feed */}
        <div className="flex flex-col gap-6">
          {/* AI Insight Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Market Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{aiInsight}</p>
            </CardContent>
          </Card>

          {/* Recent Activity Feed */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 pr-2">
                <div className="space-y-4">
                  {activityFeed.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition">
                      <Avatar>
                        <AvatarFallback>{item.user.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{item.user}</span>
                          <Badge variant="secondary">{item.action}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.target}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="trading" size="lg" className="flex-1 min-w-[180px]">
              <Plus className="h-4 w-4 mr-2" />
              Create New Strategy
            </Button>
            <Button variant="outline" size="lg" className="flex-1 min-w-[180px]">
              <Play className="h-4 w-4 mr-2" />
              Run Backtest
            </Button>
            <Button variant="secondary" size="lg" className="flex-1 min-w-[180px]">
              <BarChart3 className="h-4 w-4 mr-2" />
              Compare with Built-in Strategies
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}