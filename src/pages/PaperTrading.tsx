import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { 
  Play, 
  Pause, 
  Square, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

// Sample portfolio data
const portfolioData = [
  { time: "09:30", value: 100000, pnl: 0 },
  { time: "10:00", value: 100350, pnl: 350 },
  { time: "10:30", value: 100120, pnl: 120 },
  { time: "11:00", value: 100580, pnl: 580 },
  { time: "11:30", value: 100420, pnl: 420 },
  { time: "12:00", value: 100890, pnl: 890 },
  { time: "12:30", value: 100650, pnl: 650 },
  { time: "13:00", value: 101200, pnl: 1200 },
];

const positions = [
  { 
    id: 1, 
    symbol: "AAPL", 
    side: "LONG", 
    quantity: 100, 
    entryPrice: 150.25, 
    currentPrice: 152.80, 
    unrealizedPnL: 255, 
    entryTime: "09:45",
    strategy: "RSI Mean Reversion"
  },
  { 
    id: 2, 
    symbol: "GOOGL", 
    side: "LONG", 
    quantity: 50, 
    entryPrice: 2750.00, 
    currentPrice: 2785.50, 
    unrealizedPnL: 1775, 
    entryTime: "10:15",
    strategy: "Bollinger Breakout"
  },
  { 
    id: 3, 
    symbol: "TSLA", 
    side: "SHORT", 
    quantity: 75, 
    entryPrice: 265.50, 
    currentPrice: 263.20, 
    unrealizedPnL: 172.5, 
    entryTime: "11:30",
    strategy: "Momentum Reversal"
  },
];

const signals = [
  {
    id: 1,
    symbol: "MSFT",
    strategy: "MACD Crossover",
    signal: "BUY",
    strength: "Strong",
    price: 415.80,
    time: "13:45",
    confidence: 0.87
  },
  {
    id: 2,
    symbol: "NVDA",
    strategy: "RSI Oversold",
    signal: "BUY",
    strength: "Moderate",
    price: 485.25,
    time: "13:42",
    confidence: 0.72
  },
  {
    id: 3,
    symbol: "SPY",
    strategy: "Support Level",
    signal: "SELL",
    strength: "Weak",
    price: 445.90,
    time: "13:38",
    confidence: 0.61
  },
];

const recentTrades = [
  { id: 1, symbol: "META", side: "BUY", quantity: 60, price: 485.20, pnl: 420, time: "12:15", status: "closed" },
  { id: 2, symbol: "AMZN", side: "SELL", quantity: 40, price: 145.80, pnl: -180, time: "11:45", status: "closed" },
  { id: 3, symbol: "NFLX", side: "BUY", quantity: 25, price: 425.30, pnl: 315, time: "10:30", status: "closed" },
];

export default function PaperTrading() {
  const [isTrading, setIsTrading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState("all");

  const totalPnL = positions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
  const portfolioValue = 100000 + totalPnL;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Paper Trading</h1>
          <p className="text-muted-foreground">Simulate live trading with real market data</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant={isTrading ? "danger" : "trading"} 
            size="sm"
            onClick={() => setIsTrading(!isTrading)}
          >
            {isTrading ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Trading
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Trading
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Square className="h-4 w-4 mr-2" />
            Close All Positions
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      <Card className={`border-2 ${isTrading ? 'border-success bg-success/5' : 'border-danger bg-danger/5'}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isTrading ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-danger" />
              )}
              <div>
                <p className="font-medium">
                  {isTrading ? "Paper Trading Active" : "Paper Trading Paused"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isTrading 
                    ? "Strategies are running and executing trades automatically"
                    : "All automated trading is currently suspended"
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Session Started</p>
              <p className="font-medium">09:30 AM EST</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-2xl font-bold">${portfolioValue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {totalPnL >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger" />
                  )}
                  <span className={`text-sm font-medium ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily P&L</p>
                <p className="text-2xl font-bold text-success">+$1,247</p>
                <p className="text-sm text-muted-foreground">+1.25%</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Positions</p>
                <p className="text-2xl font-bold">{positions.length}</p>
                <p className="text-sm text-muted-foreground">
                  {positions.filter(p => p.side === "LONG").length} Long, {positions.filter(p => p.side === "SHORT").length} Short
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Win Rate Today</p>
                <p className="text-2xl font-bold">68.5%</p>
                <p className="text-sm text-success">+3.2% vs avg</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Intraday Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }} 
              />
              <ReferenceLine y={100000} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Positions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {positions.map((position) => (
                <div key={position.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={position.side === "LONG" ? "default" : "secondary"}>
                      {position.side}
                    </Badge>
                    <div>
                      <p className="font-medium">{position.symbol}</p>
                      <p className="text-sm text-muted-foreground">{position.strategy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{position.quantity} @ ${position.entryPrice}</span>
                      {position.unrealizedPnL >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-danger" />
                      )}
                    </div>
                    <p className={`font-medium ${position.unrealizedPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                      {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Signals */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Live Trading Signals</CardTitle>
              <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Strategies</SelectItem>
                  <SelectItem value="rsi">RSI Strategy</SelectItem>
                  <SelectItem value="macd">MACD Strategy</SelectItem>
                  <SelectItem value="bollinger">Bollinger Bands</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signals.map((signal) => (
                <div key={signal.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={signal.signal === "BUY" ? "default" : "destructive"}>
                      {signal.signal}
                    </Badge>
                    <div>
                      <p className="font-medium">{signal.symbol}</p>
                      <p className="text-sm text-muted-foreground">{signal.strategy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${signal.price}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(signal.confidence * 100)}% confidence
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge variant={trade.side === "BUY" ? "default" : "secondary"}>
                    {trade.side}
                  </Badge>
                  <div>
                    <p className="font-medium">{trade.symbol}</p>
                    <p className="text-sm text-muted-foreground">{trade.time}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.quantity} @ ${trade.price}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">Closed</Badge>
                  <p className={`font-medium mt-1 ${trade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}