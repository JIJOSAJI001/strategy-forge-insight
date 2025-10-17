import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { AIMarketInsightPanel } from "@/components/dashboard/AIMarketInsightPanel";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardFooter } from "@/components/dashboard/DashboardFooter";
import { useAuth } from "@/contexts/AuthContext";
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Quick actions configuration
const getQuickActions = (navigate: any) => [
  {
    title: "Create Strategy",
    description: "Build a new trading strategy",
    icon: Plus,
    variant: 'primary' as const,
    onClick: () => navigate('/drag-drop-strategy-builder'),
  },
  {
    title: "Run Backtest",
    description: "Test your strategies",
    icon: Play,
    variant: 'secondary' as const,
    onClick: () => navigate('/backtesting'),
  },
  {
    title: "Compare Strategies",
    description: "Analyze performance",
    icon: BarChart3,
    variant: 'outline' as const,
    onClick: () => navigate('/strategies'),
  },
  // Disabled features - coming soon
  // {
  //   title: "AI Assistant",
  //   description: "Get trading insights (Coming Soon)",
  //   icon: Sparkles,
  //   variant: 'primary' as const,
  //   onClick: () => {},
  // },
  // {
  //   title: "Portfolio View",
  //   description: "Monitor your positions (Coming Soon)",
  //   icon: Target,
  //   variant: 'secondary' as const,
  //   onClick: () => {},
  // },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = user ? await user.getIdToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch metrics with user ID
        const userId = user?.uid;
        const metricsResponse = await fetch(
          `${API_BASE_URL}/api/dashboard/metrics${userId ? `?user_id=${userId}` : ''}`, 
          { headers }
        );
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          const metricsWithIcons = metricsData.metrics.map((m: any, index: number) => ({
            ...m,
            icon: [Star, Play, BarChart3, Shield][index]
          }));
          setMetrics(metricsWithIcons);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep empty arrays on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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

      {/* Alert Banners - Market Insights Only */}
      <div className="space-y-3">
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

      {/* Key Metrics Cards - Full Width */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-[#1F2937] border-[#374151] animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-[#374151] rounded w-24"></div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-8 bg-[#374151] rounded w-32 mb-2"></div>
                  <div className="h-3 bg-[#374151] rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : metrics.length === 0 ? (
          <Card className="bg-[#1F2937] border-[#374151]">
            <CardContent className="py-12">
              <div className="text-center text-[#9CA3AF]">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No backtest results yet</p>
                <p className="text-sm mb-6">Run your first backtest to see performance metrics here</p>
                <Button onClick={() => navigate('/backtesting')}>
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                <div className={`text-xs ${m.changeType === 'positive' ? 'text-[#10B981]' : m.changeType === 'negative' ? 'text-[#EF4444]' : 'text-[#9CA3AF]'}`}>
                  {m.change}
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI Market Insight Panel */}
      <AIMarketInsightPanel 
        insight="Market is bullish, trend-following strategies may work well"
        marketCondition="bullish"
        recommendation="Consider increasing allocation to momentum-based strategies. Current market conditions favor trend-following approaches with proper risk management."
        suggestedStrategies={["Moving Average Crossover", "MACD Strategy", "Bollinger Bands"]}
      />

      {/* Performance Section - Full Width Charts */}
      <Card className="bg-[#1F2937] border-[#374151]">
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

      {/* Quick Actions */}
      <QuickActions actions={getQuickActions(navigate)} />

      {/* Footer with Help Links */}
      <DashboardFooter onNavigate={navigate} />
    </div>
  );
}