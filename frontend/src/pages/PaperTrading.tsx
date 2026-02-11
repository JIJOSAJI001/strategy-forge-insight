import React, { useState, useEffect } from 'react';
import { SimulationEngine, type Position, type Candle } from '../lib/SimulationEngine';
import { StrategyExecutor } from '../lib/StrategyExecutor';
import { strategyService } from '../services/strategy.service';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Play, Pause, RotateCcw, TrendingUp, TrendingDown, DollarSign, Save, List, CheckCircle, History, Calendar, Search, Maximize2, Minimize2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API Service Wrapper for Market Data
const marketDataService = {
  getMarketData: async (symbol: string, timeframe: string, startDate: string, endDate: string) => {
    // This assumes your backend URL is configured in Vite proxy or environment variable
    // Adjust URL as needed based on your setup
    // Safe token retrieval
    let token = null;
    try {
      const authModule = await import("firebase/auth");
      const firebaseModule = await import("@/lib/firebase");
      if (firebaseModule.auth && firebaseModule.auth.currentUser) {
        token = await authModule.getIdToken(firebaseModule.auth.currentUser, false);
      }
    } catch (e) {
      console.warn("Failed to retrieve auth token, proceeding as anonymous", e);
    }

    const params = new URLSearchParams({
      symbol,
      timeframe,
      start_date: startDate,
      end_date: endDate
    });

    const response = await fetch(`${API_BASE_URL}/api/retail/backtest/market-data?${params}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch market data (${response.status}): ${errorText}`);
    }
    const data = await response.json();

    // Map API response to Candle interface
    return data.map((d: any) => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume
    }));
  },

  saveSession: async (sessionData: any) => {
    const token = await (await import("firebase/auth")).getIdToken((await import("@/lib/firebase")).auth.currentUser!, true).catch(() => null);

    const response = await fetch(`${API_BASE_URL}/api/retail/backtest/paper-trading/save-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) throw new Error('Failed to save session');
    return await response.json();
  },

  getHistory: async () => {
    const token = await (await import("firebase/auth")).getIdToken((await import("@/lib/firebase")).auth.currentUser!, true).catch(() => null);
    const response = await fetch(`${API_BASE_URL}/api/retail/backtest/paper-trading/history`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });

    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  }
};

const PaperTrading: React.FC = () => {
  const [activeTab, setActiveTab] = useState('simulation');
  const [isTradeLogExpanded, setIsTradeLogExpanded] = useState(false);

  // Simulation State
  const [engine, setEngine] = useState<SimulationEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(100);
  const [simState, setSimState] = useState<any>(null);
  const [chartData, setChartData] = useState<Candle[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');

  // Setup State
  const [symbol, setSymbol] = useState('AAPL');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2025-01-01');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // History State
  const [history, setHistory] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    loadStrategies();
    loadHistory();
  }, []);

  const loadStrategies = async () => {
    try {
      const defs = await strategyService.getStrategyDefinitions();
      setStrategies(defs);
    } catch (error) {
      console.error("Failed to load strategies", error);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await marketDataService.getHistory();
      setHistory(hist);
    } catch (error) {
      console.error("Failed to load history", error);
    }
  };

  const initializeSimulation = async () => {
    if (!symbol || !startDate || !endDate) return;

    setIsLoadingData(true);
    try {
      const data = await marketDataService.getMarketData(symbol, '1d', startDate, endDate);
      if (data.length === 0) {
        toast.error("No data found for this range");
        return;
      }

      const newEngine = new SimulationEngine(data);
      setEngine(newEngine);
      setSimState(newEngine.currentState);
      setChartData(data.slice(0, 50)); // Initial view
      newEngine.start(50);

      setIsPlaying(false);
      toast.success(`Loaded ${data.length} candles for ${symbol}`);
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to load market data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const tick = () => {
    if (engine && engine.next()) {
      const newState = engine.currentState;
      setSimState(newState);
      // Update chart data window
      const fullData = (engine as any).data; // Access private data via any cast for view
      const visibleData = fullData.slice(Math.max(0, newState.index - 100), newState.index + 1);
      setChartData(visibleData);
    } else {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying && engine) {
      const interval = setInterval(tick, speed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, speed, engine]);

  const handleStrategyChange = (strategyId: string) => {
    setSelectedStrategyId(strategyId);
    if (engine) {
      if (strategyId && strategyId !== 'manual') {
        const strategy = strategies.find(s => s._id === strategyId || s.id === strategyId);

        if (strategy) {
          // Map backend StrategyDefinition to DragDropStrategy
          const entryConds = strategy.conditions?.filter((c: any) => c.type === 'entry') || [];
          const exitConds = strategy.conditions?.filter((c: any) => c.type === 'exit') || [];

          const mapCondition = (c: any) => {
            // Extract indicator type from 'left' (e.g. 'RSI_14' -> 'RSI')
            let indicator: any = 'Price';
            let period = 14; // Default

            const left = c.expression?.left || '';
            const leftParts = left.split('_');

            if (left.includes('RSI')) {
              indicator = 'RSI';
              if (leftParts.length > 1 && !isNaN(parseInt(leftParts[1]))) {
                period = parseInt(leftParts[1]);
              }
            } else if (left.includes('SMA')) {
              indicator = 'SMA';
              if (leftParts.length > 1 && !isNaN(parseInt(leftParts[1]))) {
                period = parseInt(leftParts[1]);
              }
            } else if (left.includes('EMA')) {
              indicator = 'EMA';
              if (leftParts.length > 1 && !isNaN(parseInt(leftParts[1]))) {
                period = parseInt(leftParts[1]);
              }
            }

            // Extract value
            let value = c.expression?.right?.value || 0;
            if (c.expression?.right?.indicator) {
              // Handle right side indicator if needed
              value = 0;
            }

            // Map operator
            let operator: any = c.expression?.operator || '>';
            if (operator === 'crosses_above') operator = 'crossesAbove';
            if (operator === 'crosses_below') operator = 'crossesBelow';

            return {
              indicator,
              operator,
              value,
              period
            };
          };

          let stopLossPct = strategy.stopLoss || 0.02;
          if (stopLossPct > 1) stopLossPct /= 100;

          let takeProfitPct = strategy.takeProfit || 0.04;
          if (takeProfitPct > 1) takeProfitPct /= 100;

          const mappedStrategy = {
            id: strategyId,
            name: strategy.name,
            description: strategy.description,
            entryConditions: entryConds.map(mapCondition),
            exitConditions: exitConds.map(mapCondition),
            stopLossPct,
            takeProfitPct
          };

          engine.setStrategy(mappedStrategy as any);
          engine.setAutoTrade(true);
        }
      } else {
        engine.setStrategy(null);
        engine.setAutoTrade(false);
      }
    }
  };

  const handleSaveSession = async () => {
    if (!simState) return;

    try {
      await marketDataService.saveSession({
        strategyId: selectedStrategyId,
        symbol: symbol,
        startDate: startDate,
        endDate: endDate,
        initialBalance: engine?.initialBalance || 100000,
        finalBalance: simState.balance,
        trades: simState.trades
      });
      toast.success("Session saved successfully!");
      loadHistory(); // Refresh history tab
    } catch (error) {
      toast.error("Failed to save session");
    }
  };

  // Format date for XAxis
  const formatDate = (time: number) => {
    return new Date(time).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paper Trading</h1>
          <p className="text-muted-foreground">Validate your strategies in a risk-free environment</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="simulation">Live Simulation</TabsTrigger>
          <TabsTrigger value="history">History & Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="simulation" className="space-y-4">
          {/* Setup Card */}
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Symbol</label>
                <Input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} className="w-32" placeholder="AAPL" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="dark:[color-scheme:dark]" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="dark:[color-scheme:dark]" />
              </div>
              <Button onClick={initializeSimulation} disabled={isLoadingData}>
                {isLoadingData ? "Loading..." : "Load Data"}
              </Button>
            </CardContent>
          </Card>

          {engine && simState ? (
            <div className="grid grid-cols-12 gap-6 h-[600px]">
              {/* Main Chart Area */}
              <div className="col-span-9 bg-card rounded-xl border flex flex-col shadow-sm h-full overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Select value={selectedStrategyId} onValueChange={handleStrategyChange}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">No Strategy (Manual)</SelectItem>
                        {strategies.map(s => (
                          <SelectItem key={s._id || s.id} value={s._id || s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedStrategyId && selectedStrategyId !== 'manual' && (
                      <span className="text-xs text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                        Auto-Trading Active
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Equity</div>
                      <div className="text-lg font-bold text-green-500">${simState.equity.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 min-w-0 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis
                        dataKey="time"
                        tickFormatter={formatDate}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Line
                        type="monotone"
                        dataKey="close"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      {/* Render Trade Markers */}
                      {simState.trades.map((trade: any) => {
                        if (trade.time >= chartData[0]?.time && trade.time <= chartData[chartData.length - 1]?.time) {
                          return (
                            <ReferenceDot
                              key={trade.id}
                              x={trade.time}
                              y={trade.price}
                              r={5}
                              fill={trade.side === 'buy' ? '#22c55e' : '#ef4444'}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          );
                        }
                        return null;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Controls */}
                <div className="p-4 border-t flex items-center justify-center gap-6 bg-muted/20">
                  <Button
                    variant={isPlaying ? "destructive" : "default"}
                    size="lg"
                    className="rounded-full w-32"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <><Pause className="mr-2 h-4 w-4" /> Pause</> : <><Play className="mr-2 h-4 w-4" /> Start</>}
                  </Button>

                  <Button variant="ghost" size="icon" onClick={() => {
                    setIsPlaying(false);
                    engine.reset();
                    engine.start(50);
                    setSimState(engine.currentState);
                    setChartData((engine as any).data.slice(0, 50));
                  }}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Speed:</span>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={1010 - speed}
                      onChange={(e) => setSpeed(1010 - Number(e.target.value))}
                      className="w-32 accent-primary"
                    />
                  </div>

                  <div className="flex-1"></div>

                  <Button variant="outline" onClick={handleSaveSession} disabled={simState.trades.length === 0}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Results
                  </Button>
                </div>
              </div>

              {/* Sidebar */}
              <div className="col-span-3 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
                <Card className={`${isTradeLogExpanded ? 'h-1/3' : 'flex-1'} flex flex-col min-h-0 overflow-hidden transition-all duration-300`}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium">Positions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto">
                    {simState.positions.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-8">No active positions</div>
                    ) : (
                      <div className="space-y-2">
                        {simState.positions.map((pos: any) => (
                          <div key={pos.id} className="bg-muted p-2 rounded text-sm">
                            <div className="flex justify-between font-medium">
                              <span className={pos.side === 'long' ? 'text-green-500' : 'text-red-500'}>
                                {pos.side.toUpperCase()}
                              </span>
                              <span className={pos.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Qty: {pos.quantity}</span>
                              <span>Entry: {pos.entryPrice.toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <div className="p-4 border-t grid grid-cols-2 gap-2">
                    <Button
                      className="w-full bg-green-500 hover:bg-green-600"
                      onClick={() => { engine.executeOrder('buy', 10); setSimState(engine.currentState); }}
                      disabled={!!selectedStrategyId && selectedStrategyId !== 'manual'}
                    >
                      Buy
                    </Button>
                    <Button
                      className="w-full bg-red-500 hover:bg-red-600"
                      onClick={() => { engine.executeOrder('sell', 10); setSimState(engine.currentState); }}
                      disabled={!!selectedStrategyId && selectedStrategyId !== 'manual'}
                    >
                      Sell
                    </Button>
                  </div>
                </Card>

                <Card className={`${isTradeLogExpanded ? 'flex-1' : 'h-1/3'} flex flex-col transition-all duration-300`}>
                  <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium">Trade Log</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => setIsTradeLogExpanded(!isTradeLogExpanded)}
                    >
                      {isTradeLogExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto">
                    <div className="space-y-2">
                      {simState.trades.slice().reverse().map((trade: any) => (
                        <div key={trade.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${trade.side === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>{trade.side.toUpperCase()}</span>
                            {trade.reason && (
                              <span className="text-[10px] text-muted-foreground px-1 border rounded capitalize ml-1">
                                {trade.reason.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          <div className="font-mono">{trade.price.toFixed(2)}</div>
                          {trade.realizedPnL !== undefined && (
                            <div className={trade.realizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {trade.realizedPnL > 0 ? '+' : ''}{trade.realizedPnL.toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center border rounded-xl bg-muted/10 border-dashed">
              <div className="text-center space-y-2">
                <Search className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Select a symbol and date range to load simulation data</p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {selectedSession ? (
            <div className="space-y-4">
              <Button variant="ghost" className="mb-4" onClick={() => setSelectedSession(null)}>
                ← Back to History
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Session Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Symbol</span>
                        <span className="font-bold">{selectedSession.symbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date Range</span>
                        <span className="font-mono">{selectedSession.start_date || 'N/A'} - {selectedSession.end_date || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Strategy</span>
                        <span>{selectedSession.strategy_id === 'manual' || !selectedSession.strategy_id ? 'Manual' : 'Automated'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Initial Balance</span>
                        <span className="font-mono">${(selectedSession.initial_balance || 100000).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Final Balance</span>
                        <span className="font-mono font-bold text-green-500">${(selectedSession.final_balance || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Net Profit</span>
                        <span className={`font-mono font-bold ${(selectedSession.final_balance - (selectedSession.initial_balance || 100000)) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          ${((selectedSession.final_balance || 0) - (selectedSession.initial_balance || 100000)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Trade Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const trades = selectedSession.trades || [];
                      const winningTrades = trades.filter((t: any) => t.realizedPnL && t.realizedPnL > 0).length;
                      const totalTrades = trades.filter((t: any) => t.side === 'sell').length; // Assuming sell closes trade for this simplified metric
                      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Trades</span>
                            <span>{trades.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Winning Trades</span>
                            <span className="text-green-500">{winningTrades}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Win Rate</span>
                            <span>{winRate.toFixed(1)}%</span>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Trade History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="p-3">Time</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Reason</th>
                          <th className="p-3">Price</th>
                          <th className="p-3">Quantity</th>
                          <th className="p-3 text-right">PnL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedSession.trades || []).map((trade: any, i: number) => (
                          <tr key={i} className="border-t hover:bg-muted/50">
                            <td className="p-3">{new Date(trade.time).toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-xs ${trade.side === 'buy' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                                {trade.side.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-xs capitalize text-muted-foreground">{trade.reason ? trade.reason.replace('_', ' ') : '-'}</td>
                            <td className="p-3 font-mono">${trade.price.toFixed(2)}</td>
                            <td className="p-3">{trade.quantity}</td>
                            <td className={`p-3 text-right font-mono ${trade.realizedPnL > 0 ? 'text-green-500' : trade.realizedPnL < 0 ? 'text-red-500' : ''}`}>
                              {trade.realizedPnL ? `$${trade.realizedPnL.toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No saved sessions found.</p>
                  ) : (
                    history.map((session, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="space-y-1">
                          <div className="font-bold flex items-center gap-2">
                            {session.symbol}
                            <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded">
                              {new Date(session.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Strategy: {session.strategy_name || (session.strategy_id === 'manual' ? "Manual" : session.strategy_id || "Unknown")}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-lg">
                            ${session.final_balance?.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {session.trades?.length || 0} trades
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaperTrading;