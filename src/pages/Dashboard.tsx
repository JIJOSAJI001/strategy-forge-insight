import { MetricCard } from "@/components/ui/metric-card";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { StrategyCard } from "@/components/dashboard/StrategyCard";
import { AIAssistantPanel } from "@/components/ai/AIAssistantPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  BarChart3,
  Play,
  Settings,
  Plus,
  Sparkles,
  AlertTriangle
} from "lucide-react";

export default function Dashboard() {
  const [showAI, setShowAI] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your trading strategies and performance</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowAI(!showAI)}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button variant="trading" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Strategy
          </Button>
        </div>
      </div>

      {/* AI Insights Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">AI Market Insight</p>
              <p className="text-sm text-muted-foreground">
                Current market conditions show bullish momentum. Consider increasing allocation to trend-following strategies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <StrategyCard
          name="RSI Mean Reversion"
          status="running"
          performance={8.2}
          sharpe={2.1}
          maxDrawdown={-5.8}
          winRate={67.3}
          lastUpdated="2 hours ago"
        />
        <StrategyCard
          name="Bollinger Bands"
          status="paper-trading"
          performance={12.7}
          sharpe={1.8}
          maxDrawdown={-7.1}
          winRate={59.4}
          lastUpdated="1 day ago"
        />
        <StrategyCard
          name="MACD Strategy"
          status="backtesting"
          performance={-2.1}
          sharpe={1.2}
          maxDrawdown={-12.3}
          winRate={51.2}
          lastUpdated="3 days ago"
        />
      </div>

      {/* AI Assistant Panel */}
      <AIAssistantPanel isMinimized={!showAI} onToggleMinimize={() => setShowAI(!showAI)} />
    </div>
  );
}