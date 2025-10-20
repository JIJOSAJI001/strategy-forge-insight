import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  Share2,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BacktestResult {
  backtest_id: string;
  metrics: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    cagr: number;
    calmar_ratio: number;
    win_rate: number;
    profit_factor: number;
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    avg_win: number;
    avg_loss: number;
  };
  equity_curve: Array<{
    date: string;
    equity: number;
    drawdown: number;
  }>;
  trades?: Array<{
    entry_date: string;
    exit_date: string;
    type: 'long' | 'short';
    entry_price: number;
    exit_price: number;
    pnl: number;
    return: number;
  }>;
}

interface BacktestResultsPanelProps {
  result: BacktestResult | null;
  isLoading: boolean;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onExportPDF: () => void;
}

export const BacktestResultsPanel: React.FC<BacktestResultsPanelProps> = ({
  result,
  isLoading,
  onExportCSV,
  onExportJSON,
  onExportPDF,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Running backtest...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No results yet. Configure and run a backtest to see results.</p>
        </div>
      </div>
    );
  }

  const { metrics, equity_curve, trades } = result;

  // Format number helper with null safety
  const formatNumber = (num: number | undefined | null, decimals: number = 2) => {
    if (num === undefined || num === null || isNaN(num)) return '0.00';
    return num.toFixed(decimals);
  };

  // Format percentage
  const formatPercent = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '0.00%';
    return `${num > 0 ? '+' : ''}${formatNumber(num, 2)}%`;
  };

  // Format currency
  const formatCurrency = (num: number | undefined | null) => {
    if (num === undefined || num === null || isNaN(num)) return '₹0.00';
    return `₹${formatNumber(num, 2)}`;
  };

  // Metric card component
  const MetricCard = ({ label, value, icon, variant = 'default' }: any) => {
    const variants = {
      default: 'border-gray-200 dark:border-gray-700',
      success: 'border-green-500 bg-green-50 dark:bg-green-900/10',
      danger: 'border-red-500 bg-red-50 dark:bg-red-900/10',
      warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    };

    return (
      <div className={`p-4 rounded-lg border-2 ${variants[variant]}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    );
  };

  // Trade distribution data for pie chart
  const tradeDistribution = [
    { name: 'Winning', value: metrics.winning_trades, fill: '#10b981' },
    { name: 'Losing', value: metrics.losing_trades, fill: '#ef4444' },
  ];

  // Monthly returns (simplified - would calculate from equity curve in real implementation)
  const monthlyReturns = equity_curve.slice(0, 12).map((point, idx) => ({
    month: new Date(point.date).toLocaleDateString('en-US', { month: 'short' }),
    return: ((point.equity - 100000) / 100000) * 100,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Backtest Results</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Backtest ID: {result.backtest_id}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onExportCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button onClick={onExportJSON} variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button onClick={onExportPDF} variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Return"
          value={formatPercent(metrics?.total_return)}
          icon={(metrics?.total_return ?? 0) > 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
          variant={(metrics?.total_return ?? 0) > 0 ? 'success' : 'danger'}
        />
        <MetricCard
          label="Sharpe Ratio"
          value={formatNumber(metrics?.sharpe_ratio)}
          icon={<BarChart3 className="w-5 h-5 text-blue-600" />}
          variant={(metrics?.sharpe_ratio ?? 0) > 1 ? 'success' : 'default'}
        />
        <MetricCard
          label="Max Drawdown"
          value={formatPercent(metrics?.max_drawdown)}
          icon={<TrendingDown className="w-5 h-5 text-red-600" />}
          variant="danger"
        />
        <MetricCard
          label="Win Rate"
          value={formatPercent(metrics?.win_rate)}
          icon={<PieChart className="w-5 h-5 text-purple-600" />}
          variant={(metrics?.win_rate ?? 0) > 50 ? 'success' : 'warning'}
        />
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="trades">Trade Log</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Comprehensive backtest statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CAGR</p>
                  <p className="text-lg font-semibold">{formatPercent(metrics?.cagr)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Calmar Ratio</p>
                  <p className="text-lg font-semibold">{formatNumber(metrics?.calmar_ratio)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Volatility</p>
                  <p className="text-lg font-semibold">{formatPercent(metrics?.volatility)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Trades</p>
                  <p className="text-lg font-semibold">{metrics?.total_trades ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Winning Trades</p>
                  <p className="text-lg font-semibold text-green-600">{metrics?.winning_trades ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Losing Trades</p>
                  <p className="text-lg font-semibold text-red-600">{metrics?.losing_trades ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Win</p>
                  <p className="text-lg font-semibold text-green-600">{formatPercent(metrics?.avg_win)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Loss</p>
                  <p className="text-lg font-semibold text-red-600">{formatPercent(metrics?.avg_loss)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={tradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equity Curve Tab */}
        <TabsContent value="equity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equity Curve</CardTitle>
              <CardDescription>Portfolio value over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={equity_curve}>
                  <defs>
                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorEquity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Drawdown Chart</CardTitle>
              <CardDescription>Portfolio drawdown over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={equity_curve}>
                  <defs>
                    <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatPercent(value)}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="drawdown"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorDrawdown)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trade Log Tab */}
        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>Trade Log</CardTitle>
              <CardDescription>Detailed list of all trades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry Date</TableHead>
                      <TableHead>Exit Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Entry Price</TableHead>
                      <TableHead>Exit Price</TableHead>
                      <TableHead>P&L</TableHead>
                      <TableHead>Return</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades && trades.map((trade, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{new Date(trade.entry_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(trade.exit_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              trade.type === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {trade.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>{formatCurrency(trade.entry_price)}</TableCell>
                        <TableCell>{formatCurrency(trade.exit_price)}</TableCell>
                        <TableCell className={trade.pnl > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(trade.pnl)}
                        </TableCell>
                        <TableCell className={trade.return > 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatPercent(trade.return)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Returns</CardTitle>
              <CardDescription>Performance breakdown by month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyReturns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatPercent(value)} />
                  <Bar dataKey="return" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Sharpe Ratio Interpretation</p>
                  <p className="text-sm">
                    {metrics.sharpe_ratio > 2
                      ? '🟢 Excellent risk-adjusted returns'
                      : metrics.sharpe_ratio > 1
                      ? '🟡 Good risk-adjusted returns'
                      : '🔴 Below average risk-adjusted returns'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Drawdown Analysis</p>
                  <p className="text-sm">
                    Max drawdown of {formatPercent(metrics.max_drawdown)}
                    {Math.abs(metrics.max_drawdown) > 20
                      ? ' indicates high volatility. Consider risk management.'
                      : ' shows reasonable volatility.'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Win Rate Analysis</p>
                  <p className="text-sm">
                    {metrics.win_rate > 50
                      ? `🟢 Above 50% win rate (${formatNumber(metrics.win_rate)}%) indicates a profitable strategy.`
                      : `🟡 Win rate of ${formatNumber(metrics.win_rate)}% requires strong profit factor.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BacktestResultsPanel;
