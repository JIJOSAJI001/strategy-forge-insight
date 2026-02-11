import React, { useState, useEffect } from 'react';
import { generateMockData, type Candle } from '../lib/mockData';
import { SimulationEngine } from '../lib/SimulationEngine';
import { MOCK_STRATEGIES } from '../lib/StrategyExecutor';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';
import { Play, Pause, RotateCcw, TrendingUp, TrendingDown, DollarSign, Save, List, CheckCircle } from 'lucide-react';

const mockData = generateMockData(500);
const engine = new SimulationEngine(mockData);

const DemoPage: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(100);
    const [simState, setSimState] = useState(engine.currentState);
    const [chartData, setChartData] = useState<Candle[]>([]);
    const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    useEffect(() => {
        // Initialize chart
        engine.start(50);
        setSimState(engine.currentState);
        setChartData(mockData.slice(0, 51));
    }, []);

    const tick = () => {
        if (engine.next()) {
            const newState = engine.currentState;
            setSimState(newState);
            // Update chart data window
            const visibleData = mockData.slice(Math.max(0, newState.index - 100), newState.index + 1);
            setChartData(visibleData);
        } else {
            setIsPlaying(false);
        }
    };

    useEffect(() => {
        if (isPlaying) {
            const interval = setInterval(tick, speed);
            return () => clearInterval(interval);
        }
    }, [isPlaying, speed]);

    const handleStrategyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const strategyId = e.target.value;
        setSelectedStrategyId(strategyId);

        if (strategyId) {
            const strategy = MOCK_STRATEGIES.find(s => s.id === strategyId) || null;
            engine.setStrategy(strategy);
            engine.setAutoTrade(true);
        } else {
            engine.setStrategy(null);
            engine.setAutoTrade(false);
        }
    };

    const handleBuy = () => {
        engine.executeOrder('buy', 10);
        setSimState(engine.currentState);
    };

    const handleSell = () => {
        engine.executeOrder('sell', 10);
        setSimState(engine.currentState);
    };

    const handleReset = () => {
        setIsPlaying(false);
        engine.reset();
        engine.start(50);
        // Reset strategy state if needed, or keep selected
        setSimState(engine.currentState);
        setChartData(mockData.slice(0, 51));
    }

    const handleSaveSession = () => {
        // Mock saving to backend
        console.log("Saving session...", {
            trades: simState.trades,
            finalBalance: simState.balance,
            strategyId: selectedStrategyId
        });

        setShowSaveSuccess(true);
        setTimeout(() => setShowSaveSuccess(false), 3000);
    };

    // Format date for XAxis
    const formatDate = (time: number) => {
        return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="min-h-screen bg-neutral-900 text-white p-6 font-sans">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Paper Trading Demo</h1>
                    <p className="text-gray-400 text-sm">Interactive Historical Simulation</p>
                </div>
                <div className="flex gap-4 items-center">
                    {showSaveSuccess && (
                        <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1 rounded-full text-sm animate-fade-in">
                            <CheckCircle size={14} />
                            Session Saved!
                        </div>
                    )}
                    <button
                        onClick={handleSaveSession}
                        disabled={simState.trades.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm rounded-lg border border-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save size={16} />
                        Save Results
                    </button>
                    <div className="h-8 w-px bg-neutral-700 mx-2"></div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Account Equity</div>
                        <div className="text-xl font-bold font-mono text-green-400">${simState.equity.toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-gray-400">Balance</div>
                        <div className="text-xl font-bold font-mono">${simState.balance.toFixed(2)}</div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                {/* Main Chart Area */}
                <div className="col-span-9 bg-neutral-800 rounded-xl p-4 flex flex-col shadow-lg border border-neutral-700">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                            <List size={16} className="text-gray-400" />
                            <select
                                value={selectedStrategyId}
                                onChange={handleStrategyChange}
                                className="bg-neutral-900 border border-neutral-700 text-sm rounded-md px-3 py-1 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">No Strategy (Manual)</option>
                                {MOCK_STRATEGIES.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {selectedStrategyId && (
                                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded ml-2">
                                    Auto-Trading Active
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis
                                    dataKey="time"
                                    tickFormatter={formatDate}
                                    stroke="#525252"
                                    tick={{ fill: '#a3a3a3', fontSize: 12 }}
                                    minTickGap={50}
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    stroke="#525252"
                                    tick={{ fill: '#a3a3a3', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    labelFormatter={(label) => new Date(label).toLocaleString()}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="close"
                                    stroke="#60a5fa"
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                {/* Render Trade Markers */}
                                {simState.trades.map((trade) => {
                                    // Check if trade time is within visible window
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
                    <div className="mt-4 flex items-center justify-center gap-6 p-4 bg-neutral-900/50 rounded-lg">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all ${isPlaying ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30' : 'bg-green-500 text-black hover:bg-green-400'}`}
                        >
                            {isPlaying ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
                        </button>

                        <button
                            onClick={handleReset}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Reset Simulation"
                        >
                            <RotateCcw size={18} />
                        </button>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">Speed:</span>
                            <input
                                type="range"
                                min="10"
                                max="1000"
                                step="10"
                                // Inverse logic: lower interval = higher speed
                                value={1010 - speed}
                                onChange={(e) => setSpeed(1010 - Number(e.target.value))}
                                className="w-32 accent-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar - Trade Panel */}
                <div className="col-span-3 flex flex-col gap-4">
                    {/* Order Entry */}
                    <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700 shadow-lg">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <DollarSign size={18} className="text-blue-400" />
                            Manual Trade
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleBuy}
                                disabled={!!selectedStrategyId}
                                className="bg-green-500/10 text-green-400 border border-green-500/50 hover:bg-green-500/20 py-3 rounded-lg font-bold flex flex-col items-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <TrendingUp size={20} />
                                BUY
                            </button>
                            <button
                                onClick={handleSell}
                                disabled={!!selectedStrategyId}
                                className="bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 py-3 rounded-lg font-bold flex flex-col items-center gap-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <TrendingDown size={20} />
                                SELL
                            </button>
                        </div>
                    </div>

                    {/* Positions */}
                    <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700 shadow-lg flex-1 overflow-hidden flex flex-col">
                        <h2 className="text-lg font-semibold mb-4">Positions</h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {simState.positions.length === 0 && (
                                <div className="text-center text-gray-500 mt-10">No active positions</div>
                            )}
                            {simState.positions.map((pos) => (
                                <div key={pos.id} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                                    <div className="flex justify-between mb-1">
                                        <span className={`font-bold ${pos.side === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                                            {pos.side.toUpperCase()} {pos.symbol}
                                        </span>
                                        <span className={pos.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
                                            {pos.unrealizedPnL >= 0 ? '+' : ''}{pos.unrealizedPnL.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <span>Qty: {pos.quantity}</span>
                                        <span>Entry: {pos.entryPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Log */}
                    <div className="bg-neutral-800 rounded-xl p-4 border border-neutral-700 shadow-lg h-1/3 overflow-hidden flex flex-col">
                        <h2 className="text-lg font-semibold mb-4">Trade Log</h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 text-sm custom-scrollbar">
                            {simState.trades.slice().reverse().map((trade) => (
                                <div key={trade.id} className="flex justify-between items-center bg-neutral-900/50 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1.5 h-1.5 rounded-full ${trade.side === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="text-gray-300">{trade.side.toUpperCase()}</span>
                                    </div>
                                    <div className="text-gray-500">
                                        {trade.price.toFixed(2)}
                                    </div>
                                    {trade.realizedPnL !== undefined && (
                                        <div className={trade.realizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                                            {trade.realizedPnL > 0 ? '+' : ''}{trade.realizedPnL.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemoPage;
