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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Equity Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Portfolio Equity Curve</CardTitle>
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
                dataKey="portfolio" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Portfolio"
              />
              <Line 
                type="monotone" 
                dataKey="benchmark" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Benchmark"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Drawdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Maximum Drawdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={drawdownData}>
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
              <Area 
                type="monotone" 
                dataKey="drawdown" 
                stroke="hsl(var(--danger))" 
                fill="hsl(var(--danger))"
                fillOpacity={0.3}
                name="Drawdown %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Strategy Performance */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Strategy Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="strategy" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
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
                dataKey="returns" 
                fill="hsl(var(--primary))"
                name="Annual Returns %"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}