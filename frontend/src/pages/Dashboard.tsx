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
  const [recentBacktests, setRecentBacktests] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = user ? await user.getIdToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch metrics with user ID
        const userId = user?.uid;
        
        // **OPTIMIZED: Fetch all data in parallel using Promise.allSettled**
        // This prevents one slow request from blocking others
        const [metricsResult, backtestsResult] = await Promise.allSettled([
          fetch(
            `${API_BASE_URL}/api/dashboard/metrics${userId ? `?user_id=${userId}` : ''}`, 
            { headers }
          ),
          fetch(
            `${API_BASE_URL}/api/dashboard/recent-backtests`,
            { headers }
          )
        ]);

        // Process metrics response
        if (metricsResult.status === 'fulfilled' && metricsResult.value.ok) {
          const metricsData = await metricsResult.value.json();
          const metricsWithIcons = metricsData.metrics.map((m: any, index: number) => ({
            ...m,
            icon: [Star, Play, BarChart3, Shield][index]
          }));
          setMetrics(metricsWithIcons);
        } else {
          console.error('Metrics fetch failed:', metricsResult);
          setMetrics([]);
        }

        // Process backtests response
        if (backtestsResult.status === 'fulfilled' && backtestsResult.value.ok) {
          const backtestsData = await backtestsResult.value.json();
          setRecentBacktests(backtestsData.backtests || []);
        } else {
          console.error('Backtests fetch failed:', backtestsResult);
          setRecentBacktests([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep empty arrays on error
        setMetrics([]);
        setRecentBacktests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-6 pb-8">
      {/* Hero Header with Gradient Accent */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#3B82F6]/20 via-[#1F2937] to-[#8B5CF6]/20 border border-[#374151] p-8">
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-[#F9FAFB]">
                    Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
                  </h1>
                  <p className="text-[#9CA3AF]">Here's what's happening with your trading strategies</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg"
                className="border-[#374151] text-[#9CA3AF] hover:bg-[#374151] hover:text-[#F9FAFB]"
                onClick={() => navigate('/backtesting')}
              >
                <Play className="h-4 w-4 mr-2" />
                Run Backtest
              </Button>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white border-0"
                onClick={() => navigate('/drag-drop-strategy-builder')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Strategy
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#8B5CF6]/10 rounded-full blur-3xl"></div>
      </div>

      {/* Market Insight Banner */}
      <Alert className="border-[#10B981]/40 bg-gradient-to-r from-[#10B981]/10 to-[#10B981]/5">
        <TrendingUp className="h-5 w-5 text-[#10B981]" />
        <div className="flex-1">
          <AlertTitle className="text-[#F9FAFB] font-semibold">Market Regime: Bullish Trend</AlertTitle>
          <AlertDescription className="text-[#9CA3AF]">
            AI detected a bullish regime with moderate volatility. Trend-following strategies may outperform.
          </AlertDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-[#10B981] hover:text-[#10B981] hover:bg-[#10B981]/10"
          onClick={() => navigate('/ai-assistant')}
        >
          View Insights
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Alert>

      {/* Stats Grid - Enhanced Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i} className="bg-[#1F2937] border-[#374151] animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-[#374151] rounded w-24"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-8 bg-[#374151] rounded w-32 mb-2"></div>
                <div className="h-3 bg-[#374151] rounded w-20"></div>
              </CardContent>
            </Card>
          ))
        ) : metrics.length === 0 ? (
          <div className="col-span-full">
            <Card className="bg-[#1F2937] border-[#374151] border-dashed">
              <CardContent className="py-16">
                <div className="text-center text-[#9CA3AF]">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#374151] mb-4">
                    <BarChart3 className="h-8 w-8 text-[#9CA3AF]" />
                  </div>
                  <h3 className="text-xl font-semibold text-[#F9FAFB] mb-2">No Data Yet</h3>
                  <p className="text-sm mb-6 max-w-md mx-auto">
                    Start by creating your first strategy and running a backtest to see performance metrics
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => navigate('/strategies')}>
                      <Layers className="h-4 w-4 mr-2" />
                      Browse Strategies
                    </Button>
                    <Button onClick={() => navigate('/drag-drop-strategy-builder')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Strategy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          metrics.map((m, index) => (
            <Card 
              key={m.title} 
              className="bg-gradient-to-br from-[#1F2937] to-[#1F2937]/50 border-[#374151] hover:border-[#3B82F6]/50 transition-all duration-300 group cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#9CA3AF] text-sm font-medium">
                    {m.title}
                  </CardTitle>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-[#3B82F6]/10' :
                    index === 1 ? 'bg-[#10B981]/10' :
                    index === 2 ? 'bg-[#F59E0B]/10' :
                    'bg-[#8B5CF6]/10'
                  }`}>
                    {m.icon && <m.icon className={`h-5 w-5 ${
                      index === 0 ? 'text-[#3B82F6]' :
                      index === 1 ? 'text-[#10B981]' :
                      index === 2 ? 'text-[#F59E0B]' :
                      'text-[#8B5CF6]'
                    }`} />}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-[#F9FAFB] mb-1 group-hover:text-[#3B82F6] transition-colors">
                  {m.value}
                </div>
                <div className={`text-sm font-medium flex items-center gap-1 ${
                  m.changeType === 'positive' ? 'text-[#10B981]' : 
                  m.changeType === 'negative' ? 'text-[#EF4444]' : 
                  'text-[#9CA3AF]'
                }`}>
                  {m.changeType === 'positive' && <TrendingUp className="h-4 w-4" />}
                  {m.changeType === 'negative' && <TrendingDown className="h-4 w-4" />}
                  {m.change}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Performance Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Overview */}
          <Card className="bg-[#1F2937] border-[#374151]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[#F9FAFB]">
                  <BarChart3 className="h-5 w-5 text-[#3B82F6]" />
                  Performance Overview
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-[#9CA3AF] hover:text-[#F9FAFB]">
                    1M
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[#9CA3AF] hover:text-[#F9FAFB]">
                    3M
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[#3B82F6] bg-[#3B82F6]/10">
                    1Y
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[#9CA3AF] hover:text-[#F9FAFB]">
                    All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DashboardCharts />
            </CardContent>
          </Card>

          {/* AI Insights */}
          <AIMarketInsightPanel 
            insight="Market is bullish, trend-following strategies may work well"
            marketCondition="bullish"
            recommendation="Consider increasing allocation to momentum-based strategies. Current market conditions favor trend-following approaches with proper risk management."
            suggestedStrategies={["Moving Average Crossover", "MACD Strategy", "Bollinger Bands"]}
          />
        </div>

        {/* Right Column - Recent Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Recent Backtests */}
          <Card className="bg-[#1F2937] border-[#374151]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F9FAFB] text-lg">
                <Target className="h-5 w-5 text-[#3B82F6]" />
                Recent Backtests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#111827] animate-pulse">
                      <div className="h-4 bg-[#374151] rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-[#374151] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentBacktests.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#374151] mb-3">
                    <Play className="h-6 w-6 text-[#9CA3AF]" />
                  </div>
                  <p className="text-sm text-[#9CA3AF] mb-4">No backtests yet</p>
                  <Button size="sm" onClick={() => navigate('/backtesting')}>
                    Run First Backtest
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentBacktests.slice(0, 5).map((backtest, index) => (
                    <div 
                      key={index}
                      className="p-3 rounded-lg bg-[#111827] hover:bg-[#374151]/30 transition-colors cursor-pointer group"
                      onClick={() => navigate('/backtesting')}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm font-medium text-[#F9FAFB] group-hover:text-[#3B82F6] transition-colors">
                          {backtest.strategy_name || 'Unnamed Strategy'}
                        </span>
                        <Badge 
                          variant={backtest.total_return > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {backtest.total_return > 0 ? '+' : ''}{backtest.total_return}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
                        <span>{backtest.symbol || 'N/A'}</span>
                        <span>{backtest.created_at ? new Date(backtest.created_at).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-[#3B82F6] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10"
                    onClick={() => navigate('/backtesting')}
                  >
                    View All Results
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-[#1F2937] border-[#374151]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F9FAFB] text-lg">
                <Zap className="h-5 w-5 text-[#F59E0B]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start border-[#374151] hover:bg-[#374151] text-[#F9FAFB]"
                onClick={() => navigate('/drag-drop-strategy-builder')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Strategy
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-[#374151] hover:bg-[#374151] text-[#F9FAFB]"
                onClick={() => navigate('/backtesting')}
              >
                <Play className="h-4 w-4 mr-2" />
                Run Backtest
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-[#374151] hover:bg-[#374151] text-[#F9FAFB]"
                onClick={() => navigate('/strategies')}
              >
                <Layers className="h-4 w-4 mr-2" />
                Browse Strategies
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start border-[#374151] hover:bg-[#374151] text-[#F9FAFB]"
                onClick={() => navigate('/ai-assistant')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                AI Assistant
              </Button>
              <Separator className="my-4 bg-[#374151]" />
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-[#9CA3AF] mb-3 uppercase tracking-wider">
                  Resources
                </h4>
                <div className="space-y-2">
                  <button className="flex items-center text-sm text-[#9CA3AF] hover:text-[#3B82F6] transition-colors">
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Getting Started Guide
                  </button>
                  <button className="flex items-center text-sm text-[#9CA3AF] hover:text-[#3B82F6] transition-colors">
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Video Tutorials
                  </button>
                  <button className="flex items-center text-sm text-[#9CA3AF] hover:text-[#3B82F6] transition-colors">
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Documentation
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Banner - Community/Support */}
      <Card className="bg-gradient-to-r from-[#1F2937] via-[#3B82F6]/10 to-[#1F2937] border-[#374151]">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#3B82F6]/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-[#3B82F6]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#F9FAFB]">Join Our Community</h3>
                <p className="text-sm text-[#9CA3AF]">Connect with traders, share strategies, and learn together</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-[#374151]">
                <Users className="h-4 w-4 mr-2" />
                Community Forum
              </Button>
              <Button className="bg-[#3B82F6] hover:bg-[#2563EB]">
                Get Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}