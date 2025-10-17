import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function DashboardCharts() {
  const { user } = useAuth();
  const [equityData, setEquityData] = useState<any[]>([]);
  const [drawdownData, setDrawdownData] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const token = user ? await user.getIdToken() : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const userId = user?.uid;

        // Fetch equity curve with user context
        const equityResponse = await fetch(
          `${API_BASE_URL}/api/dashboard/equity-curve`, 
          { headers }
        );
        if (equityResponse.ok) {
          const equityResult = await equityResponse.json();
          setEquityData(equityResult.data);
        }

        // Fetch drawdown with user context
        const drawdownResponse = await fetch(
          `${API_BASE_URL}/api/dashboard/drawdown-history`, 
          { headers }
        );
        if (drawdownResponse.ok) {
          const drawdownResult = await drawdownResponse.json();
          setDrawdownData(drawdownResult.data);
        }

        // Fetch performance comparison with user context
        const performanceResponse = await fetch(
          `${API_BASE_URL}/api/dashboard/performance-comparison`, 
          { headers }
        );
        if (performanceResponse.ok) {
          const performanceResult = await performanceResponse.json();
          setPerformanceData(performanceResult.data);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Use empty data on error
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-[#374151] animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  // Check if user has any backtest data
  const hasData = equityData.length > 1 || performanceData.length > 0;

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-[#9CA3AF] mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-lg font-medium mb-2">No backtest data yet</p>
          <p className="text-sm mb-6">Run backtests to see performance charts and analytics here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Equity Curve */}
      <div>
        <h3 className="text-lg font-semibold text-[#F9FAFB] mb-4">Portfolio Equity Curve</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={equityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB"
              }}
            />
            <Line 
              type="monotone" 
              dataKey="portfolio" 
              stroke="#3B82F6" 
              strokeWidth={2}
              name="Portfolio"
            />
            <Line 
              type="monotone" 
              dataKey="benchmark" 
              stroke="#9CA3AF" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Benchmark"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Drawdown Chart */}
      <div>
        <h3 className="text-lg font-semibold text-[#F9FAFB] mb-4">Maximum Drawdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={drawdownData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB"
              }}
            />
            <Area 
              type="monotone" 
              dataKey="drawdown" 
              stroke="#EF4444" 
              fill="#EF4444"
              fillOpacity={0.3}
              name="Drawdown %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Strategy Performance */}
      <div>
        <h3 className="text-lg font-semibold text-[#F9FAFB] mb-4">Strategy Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="strategy" 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tick={{ fill: '#9CA3AF' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB"
              }}
            />
            <Bar 
              dataKey="returns" 
              fill="#10B981"
              name="Annual Returns %"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}