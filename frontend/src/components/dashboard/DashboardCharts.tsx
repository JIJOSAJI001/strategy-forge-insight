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

// Sample data for charts
const equityData = [
  { date: "Jan", portfolio: 10000, benchmark: 10000 },
  { date: "Feb", portfolio: 10250, benchmark: 10100 },
  { date: "Mar", portfolio: 10800, benchmark: 10350 },
  { date: "Apr", portfolio: 11200, benchmark: 10200 },
  { date: "May", portfolio: 11800, benchmark: 10800 },
  { date: "Jun", portfolio: 12400, benchmark: 11000 },
];

const drawdownData = [
  { date: "Jan", drawdown: 0 },
  { date: "Feb", drawdown: -2.5 },
  { date: "Mar", drawdown: -1.2 },
  { date: "Apr", drawdown: -3.8 },
  { date: "May", drawdown: -1.5 },
  { date: "Jun", drawdown: 0 },
];

const performanceData = [
  { strategy: "RSI Mean Reversion", returns: 24.5 },
  { strategy: "Moving Average", returns: 18.2 },
  { strategy: "Bollinger Bands", returns: 31.7 },
  { strategy: "MACD Strategy", returns: 15.9 },
];

export function DashboardCharts() {
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