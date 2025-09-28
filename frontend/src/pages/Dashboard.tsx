import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { PortfolioHealthCard } from "@/components/dashboard/PortfolioHealthCard";
import { AIMarketInsightPanel } from "@/components/dashboard/AIMarketInsightPanel";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { 
  Sparkles, 
  AlertTriangle, 
  BarChart3, 
  Plus, 
  Play, 
  Layers, 
  Target, 
  TrendingUp, 
  Star, 
  Users, 
  ArrowRight,
  DollarSign,
  TrendingDown,
  Shield,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Demo data for metrics
const metrics = [
  {
    title: "Best Strategy",
    value: "Bollinger Bands",
    change: "+31.7% this month",
    changeType: "positive",
    icon: Star,
  },
  {
    title: "Latest Backtest",
    value: "+12.7%",
    change: "MACD Strategy",
    changeType: "positive",
    icon: Play,
  },
  {
    title: "Avg Win Rate",
    value: "64.2%",
    change: "+1.8% vs last month",
    changeType: "positive",
    icon: BarChart3,
  },
  {
    title: "Risk Score",
    value: "Low",
    change: "Well diversified",
    changeType: "positive",
    icon: Shield,
  },
];

// Demo data for activity feed
const activityFeed = [
  {
    id: 1,
    user: "Jane Doe",
    action: "Created new strategy",
    target: "RSI Mean Reversion",
    time: "2m ago",
    type: 'create' as const,
  },
  {
    id: 2,
    user: "John Smith",
    action: "Optimized parameters",
    target: "Bollinger Bands",
    time: "10m ago",
    type: 'optimize' as const,
  },
  {
    id: 3,
    user: "Jane Doe",
    action: "Ran backtest",
    target: "MACD Strategy",
    time: "30m ago",
    type: 'backtest' as const,
  },
  {
    id: 4,
    user: "Alex Lee",
    action: "Compared strategies",
    target: "Built-in vs Custom",
    time: "1h ago",
    type: 'compare' as const,
  },
  {
    id: 5,
    user: "System",
    action: "Risk alert",
    target: "High volatility detected",
    time: "2h ago",
    type: 'alert' as const,
  },
  {
    id: 6,
    user: "Jane Doe",
    action: "Created new strategy",
    target: "Breakout Momentum",
    time: "3h ago",
    type: 'create' as const,
  },
];

// Demo data for quick actions
const quickActions = [
  {
    title: "Create Strategy",
    description: "Build a new trading strategy",
    icon: Plus,
    variant: 'primary' as const,
    onClick: () => window.location.href = '/drag-drop-strategy-builder',
  },
  {
    title: "Run Backtest",
    description: "Test your strategies",
    icon: Play,
    variant: 'secondary' as const,
    onClick: () => window.location.href = '/backtesting',
  },
  {
    title: "Compare Strategies",
    description: "Analyze performance",
    icon: BarChart3,
    variant: 'outline' as const,
    onClick: () => window.location.href = '/strategies',
  },
  {
    title: "AI Assistant",
    description: "Get trading insights",
    icon: Sparkles,
    variant: 'primary' as const,
    onClick: () => window.location.href = '/ai-assistant',
  },
  {
    title: "Portfolio View",
    description: "Monitor your positions",
    icon: Target,
    variant: 'secondary' as const,
    onClick: () => window.location.href = '/portfolio',
  },
  {
    title: "Settings",
    description: "Configure preferences",
    icon: Zap,
    variant: 'outline' as const,
    onClick: () => window.location.href = '/settings',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F9FAFB]">Dashboard</h1>
          <p className="text-[#9CA3AF]">Your trading performance at a glance</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-[#374151] text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]"
            onClick={() => navigate('/ai-assistant')}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
          <Button 
            size="sm" 
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
            onClick={() => navigate('/drag-drop-strategy-builder')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Strategy
          </Button>
        </div>
      </div>

      {/* Alert Banners */}
      <div className="space-y-3">
        <Alert className="border-[#EF4444]/40 bg-[#EF4444]/10">
          <AlertTriangle className="h-5 w-5 text-[#EF4444]" />
          <div>
            <AlertTitle className="text-[#F9FAFB]">Overfitting Warning</AlertTitle>
            <AlertDescription className="text-[#9CA3AF]">
              Recent backtest detected possible overfitting in <span className="font-semibold text-[#F9FAFB]">RSI Mean Reversion</span>. Review your parameters or use walk-forward validation.
            </AlertDescription>
          </div>
        </Alert>
        <Alert className="border-[#10B981]/40 bg-[#10B981]/10">
          <TrendingUp className="h-5 w-5 text-[#10B981]" />
          <div>
            <AlertTitle className="text-[#F9FAFB]">Market Regime: Bullish</AlertTitle>
            <AlertDescription className="text-[#9CA3AF]">
              AI detected a bullish regime with moderate volatility. Trend-following strategies may outperform.
            </AlertDescription>
          </div>
        </Alert>
      </div>

      {/* Main Overview Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Portfolio Health */}
        <div className="lg:col-span-1">
          <PortfolioHealthCard 
            score={78}
            trend="up"
            change="+5.2%"
            period="last week"
          />
        </div>

        {/* Key Metrics Cards */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <Card key={m.title} className="bg-[#1F2937] border-[#374151]">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-[#F9FAFB] text-sm font-medium">
                    <m.icon className="h-4 w-4 text-[#3B82F6]" />
                    {m.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-2xl font-bold text-[#F9FAFB] mb-1">{m.value}</div>
                  <div className={`text-xs ${m.changeType === 'positive' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {m.change}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* AI Market Insight Panel */}
      <AIMarketInsightPanel 
        insight="Market is bullish, trend-following strategies may work well"
        marketCondition="bullish"
        recommendation="Consider increasing allocation to momentum-based strategies. Current market conditions favor trend-following approaches with proper risk management."
        suggestedStrategies={["Moving Average Crossover", "MACD Strategy", "Bollinger Bands"]}
      />

      {/* Performance Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Performance Charts */}
        <div className="xl:col-span-2">
          <Card className="bg-[#1F2937] border-[#374151] h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F9FAFB]">
                <BarChart3 className="h-5 w-5 text-[#3B82F6]" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardCharts />
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <div className="xl:col-span-1">
          <ActivityFeed activities={activityFeed} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions actions={quickActions} />

      {/* Footer with Help Links */}
      <DashboardFooter onNavigate={navigate} />
    </div>
  );
}