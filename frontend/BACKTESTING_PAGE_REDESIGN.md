# 📊 Backtesting Page Redesign - Retailer Dashboard

## 🎯 Objective

Redesign the Backtesting section to seamlessly integrate with the new hybrid market data system (MongoDB cache + Yahoo Finance), use stored strategies from MongoDB, and provide interactive performance visualization.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Backtesting Page (React)                   │
│                                                             │
│  ┌──────────────────┐        ┌─────────────────────────┐  │
│  │  Input Panel     │        │  Results Panel          │  │
│  │  - Strategy      │   ➜    │  - Summary Stats        │  │
│  │  - Symbol        │        │  - Equity Curve         │  │
│  │  - Timeframe     │        │  - Trade Distribution   │  │
│  │  - Date Range    │        │  - Trade Log Table      │  │
│  └────────┬─────────┘        └─────────────────────────┘  │
└───────────┼──────────────────────────────────────────────────┘
            │
            │ POST /api/retail/backtest/run
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                              │
│  1. Validate strategy ownership/access                      │
│  2. Check MongoDB cache for market data                     │
│  3. If not cached → fetch from Yahoo Finance                │
│  4. Apply strategy logic (buy-and-hold for now)             │
│  5. Calculate comprehensive metrics                         │
│  6. Return backtest result with equity curve                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Page Structure

### **Layout: Two-Column Responsive Design**

```
┌─────────────────────────────────────────────────────────┐
│  Header: 📊 Strategy Backtester                         │
│  Subtext: Run your saved strategies on historical data │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│  Input Panel     │     Results Panel                    │
│  (30% width)     │     (70% width)                      │
│                  │                                      │
│  [Select Fields] │     [Loading State]                  │
│  [Run Button]    │     OR                               │
│                  │     [Summary Cards]                  │
│                  │     [Charts]                         │
│                  │     [Trade Log]                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

---

## 🎨 Component Breakdown

### **1. Header Component**

```tsx
<BacktestHeader />
```

**Features:**
- Title: "📊 Strategy Backtester"
- Subtitle: "Run your saved or public strategies on real historical market data"
- Breadcrumb: Dashboard > Backtesting
- Help icon with tooltip

**UI Elements:**
```tsx
<div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-lg mb-6">
  <h1 className="text-3xl font-bold text-white mb-2">
    📊 Strategy Backtester
  </h1>
  <p className="text-blue-100">
    Run your saved or public strategies on real historical market data
  </p>
</div>
```

---

### **2. Input Panel Component**

```tsx
<BacktestInputPanel 
  onRunBacktest={handleRunBacktest}
  loading={isRunning}
/>
```

**Fields:**

#### **A. Strategy Selection**
```tsx
<Select
  label="Select Strategy"
  placeholder="Choose a strategy..."
  options={strategies}
  onChange={setSelectedStrategy}
  icon={<Layers />}
/>
```

**API Integration:**
```typescript
// Fetch strategies on mount
useEffect(() => {
  const fetchStrategies = async () => {
    const response = await api.get('/api/strategies', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Filter: owned + public strategies
    const userStrategies = response.data.filter(
      s => s.userId === currentUser.uid || s.isPublic
    );
    
    setStrategies(userStrategies);
  };
  
  fetchStrategies();
}, []);
```

**Display Format:**
```
My Strategies (3)
  ├─ 📈 RSI Momentum Strategy (Private)
  ├─ 📊 Moving Average Crossover (Public)
  └─ 🎯 Breakout Strategy (Private)

Public Strategies (5)
  ├─ ⭐ Top Rated: Trend Following (by @trader123)
  ├─ 📈 Scalping Strategy (by @quickTrader)
  └─ ...
```

---

#### **B. Symbol Input**
```tsx
<AutocompleteInput
  label="Symbol"
  placeholder="e.g., NIFTY, BANKNIFTY, RELIANCE.NS"
  suggestions={symbolSuggestions}
  onChange={setSymbol}
  icon={<TrendingUp />}
/>
```

**Suggestions List:**
```typescript
const symbolSuggestions = [
  { value: "NIFTY", label: "NIFTY 50", icon: "🇮🇳" },
  { value: "BANKNIFTY", label: "BANK NIFTY", icon: "🏦" },
  { value: "RELIANCE.NS", label: "Reliance Industries", icon: "🏢" },
  { value: "INFY.NS", label: "Infosys", icon: "💻" },
  { value: "TCS.NS", label: "Tata Consultancy", icon: "🏢" },
  { value: "HDFCBANK.NS", label: "HDFC Bank", icon: "🏦" },
  // ... more
];
```

---

#### **C. Timeframe Selector**
```tsx
<Select
  label="Timeframe"
  options={timeframes}
  value={timeframe}
  onChange={setTimeframe}
  icon={<Clock />}
/>
```

**Options:**
```typescript
const timeframes = [
  { value: "1d", label: "1 Day", recommended: true },
  { value: "1h", label: "1 Hour" },
  { value: "30m", label: "30 Minutes" },
  { value: "15m", label: "15 Minutes" },
];
```

---

#### **D. Date Range Picker**
```tsx
<DateRangePicker
  label="Backtest Period"
  startDate={startDate}
  endDate={endDate}
  onChange={handleDateChange}
  maxDate={new Date()}
  presets={[
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 3 Months", days: 90 },
    { label: "Last 6 Months", days: 180 },
    { label: "Last 1 Year", days: 365 },
  ]}
/>
```

**Validation:**
- End date must be after start date
- End date cannot be in the future
- Minimum period: 7 days
- Maximum period: 5 years

---

#### **E. Data Source Display**
```tsx
<InfoBadge
  icon={<Database />}
  label="Data Source"
  value="Yahoo Finance (Live Fetch)"
  tooltip="Data is fetched from Yahoo Finance and cached for faster future requests"
  variant="info"
/>
```

---

#### **F. Run Button**
```tsx
<Button
  onClick={handleRunBacktest}
  disabled={!isFormValid || isRunning}
  loading={isRunning}
  size="lg"
  className="w-full mt-6"
>
  {isRunning ? (
    <>
      <Loader className="animate-spin mr-2" />
      Running Backtest...
    </>
  ) : (
    <>
      <Play className="mr-2" />
      Run Backtest
    </>
  )}
</Button>
```

**Validation:**
```typescript
const isFormValid = useMemo(() => {
  return (
    selectedStrategy &&
    symbol.trim() !== "" &&
    timeframe &&
    startDate &&
    endDate &&
    startDate < endDate
  );
}, [selectedStrategy, symbol, timeframe, startDate, endDate]);
```

---

### **3. Results Panel Component**

```tsx
<BacktestResultsPanel 
  result={backtestResult}
  loading={isRunning}
/>
```

**States:**

#### **A. Empty State (Initial)**
```tsx
<EmptyState
  icon={<BarChart3 />}
  title="Ready to Backtest"
  description="Select a strategy and configure parameters to run your first backtest"
/>
```

#### **B. Loading State**
```tsx
<LoadingState
  icon={<Loader className="animate-spin" />}
  title="Running Backtest..."
  description="Fetching market data and calculating results"
  progress={progress}
/>
```

**Progress Steps:**
```typescript
const steps = [
  { id: 1, label: "Validating strategy", duration: 500 },
  { id: 2, label: "Fetching market data", duration: 2000 },
  { id: 3, label: "Applying strategy logic", duration: 1000 },
  { id: 4, label: "Calculating metrics", duration: 800 },
  { id: 5, label: "Generating charts", duration: 500 },
];
```

#### **C. Results State**
```tsx
<ResultsDisplay result={backtestResult} />
```

---

## 📊 Results Display Components

### **1. Summary Stats Cards**

```tsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
  <StatCard
    icon={<TrendingUp />}
    label="Total Return"
    value={`${result.metrics.total_return}%`}
    change={result.metrics.total_return}
    trend={result.metrics.total_return > 0 ? 'up' : 'down'}
  />
  
  <StatCard
    icon={<Target />}
    label="Win Rate"
    value={`${result.metrics.win_rate}%`}
    subtitle={`${result.metrics.winning_trades}/${result.metrics.total_trades}`}
  />
  
  <StatCard
    icon={<Activity />}
    label="Sharpe Ratio"
    value={result.metrics.sharpe_ratio.toFixed(2)}
    tooltip="Risk-adjusted return measure"
  />
  
  <StatCard
    icon={<TrendingDown />}
    label="Max Drawdown"
    value={`${result.metrics.max_drawdown}%`}
    trend="down"
    variant="danger"
  />
  
  <StatCard
    icon={<DollarSign />}
    label="CAGR"
    value={`${result.metrics.cagr}%`}
    subtitle="Annualized"
  />
</div>
```

**Card Design:**
```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
  <div className="flex items-center justify-between mb-2">
    <span className="text-gray-500 text-sm">{label}</span>
    {icon}
  </div>
  <div className="text-2xl font-bold text-gray-900 dark:text-white">
    {value}
  </div>
  {subtitle && (
    <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
  )}
</div>
```

---

### **2. Equity Curve Chart**

```tsx
<Card title="Equity Curve" subtitle="Portfolio value over time">
  <EquityCurveChart data={result.equity_curve} />
</Card>
```

**Chart Implementation (Recharts):**
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const EquityCurveChart = ({ data }) => {
  // Transform data
  const chartData = data.map(point => ({
    date: new Date(point.date).toLocaleDateString(),
    equity: point.equity,
    drawdown: Math.abs(point.drawdown || 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => value.split('/').slice(0, 2).join('/')}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
        />
        <Tooltip 
          formatter={(value, name) => [
            `${(value * 100).toFixed(2)}%`,
            name === 'equity' ? 'Portfolio Value' : 'Drawdown'
          ]}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="equity" 
          stroke="#3b82f6" 
          fillOpacity={1} 
          fill="url(#colorEquity)" 
          name="Equity"
        />
        <Area 
          type="monotone" 
          dataKey="drawdown" 
          stroke="#ef4444" 
          fillOpacity={1} 
          fill="url(#colorDrawdown)" 
          name="Drawdown"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
```

---

### **3. Performance Metrics Table**

```tsx
<Card title="Detailed Metrics" className="mb-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <MetricRow label="Total Trades" value={result.metrics.total_trades} />
    <MetricRow label="Winning Trades" value={result.metrics.winning_trades} />
    <MetricRow label="Losing Trades" value={result.metrics.losing_trades} />
    <MetricRow label="Average Win" value={`${result.metrics.avg_win}%`} />
    <MetricRow label="Average Loss" value={`${result.metrics.avg_loss}%`} />
    <MetricRow label="Profit Factor" value={result.metrics.profit_factor?.toFixed(2) || 'N/A'} />
    <MetricRow label="Volatility" value={`${result.metrics.volatility}%`} />
    <MetricRow label="Calmar Ratio" value={result.metrics.calmar_ratio?.toFixed(2) || 'N/A'} />
    <MetricRow label="Data Points" value={result.data_points} />
    <MetricRow label="Execution Time" value={`${result.execution_time_ms}ms`} />
  </div>
</Card>
```

---

### **4. Trade Distribution Chart**

```tsx
<Card title="Trade Distribution" subtitle="Profit/Loss per trade">
  <TradeDistributionChart trades={result.trading_activity} />
</Card>
```

**Chart Implementation:**
```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const TradeDistributionChart = ({ trades }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={trades}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          formatter={(value) => [`${value} trades`, 'Count']}
        />
        <Bar dataKey="trades" fill="#3b82f6">
          {trades.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.trades > 0 ? '#10b981' : '#ef4444'} 
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
```

---

### **5. Trade Log Table**

```tsx
<Card title="Trade History" subtitle="Detailed trade-by-trade breakdown">
  <TradeLogTable trades={result.trade_log} />
</Card>
```

**Table Implementation:**
```tsx
const TradeLogTable = ({ trades }) => {
  const columns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'type', label: 'Type', render: (row) => (
      <Badge variant={row.type === 'BUY' ? 'success' : 'danger'}>
        {row.type}
      </Badge>
    )},
    { key: 'price', label: 'Price', format: 'currency' },
    { key: 'quantity', label: 'Qty', format: 'number' },
    { key: 'pnl', label: 'P/L', render: (row) => (
      <span className={row.pnl > 0 ? 'text-green-600' : 'text-red-600'}>
        {row.pnl > 0 ? '+' : ''}{row.pnl.toFixed(2)}%
      </span>
    )},
    { key: 'cumulative', label: 'Cumulative Return', format: 'percentage' },
  ];

  return (
    <DataTable
      columns={columns}
      data={trades}
      pagination
      pageSize={10}
      sortable
      exportable
    />
  );
};
```

---

## 🔌 API Integration

### **1. Run Backtest**

```typescript
const runBacktest = async (params: BacktestParams) => {
  try {
    setIsRunning(true);
    setProgress(0);

    const response = await axios.post(
      '/api/retail/backtest/run',
      {
        strategy_id: params.strategyId,
        symbol: params.symbol.toUpperCase(),
        timeframe: params.timeframe,
        start_date: params.startDate,
        end_date: params.endDate,
      },
      {
        headers: {
          Authorization: `Bearer ${getFirebaseToken()}`,
          'Content-Type': 'application/json',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setProgress(percentCompleted);
        },
      }
    );

    setBacktestResult(response.data);
    toast.success('Backtest completed successfully!');
    
    // Save to history
    await saveBacktestToHistory(response.data);
    
  } catch (error) {
    console.error('Backtest failed:', error);
    toast.error(error.response?.data?.detail || 'Backtest failed. Please try again.');
  } finally {
    setIsRunning(false);
    setProgress(100);
  }
};
```

---

### **2. Fetch Strategies**

```typescript
const fetchStrategies = async () => {
  try {
    const response = await axios.get('/api/strategies', {
      headers: { Authorization: `Bearer ${getFirebaseToken()}` }
    });

    // Separate owned and public strategies
    const owned = response.data.filter(s => s.userId === currentUser.uid);
    const public = response.data.filter(s => s.isPublic && s.userId !== currentUser.uid);

    setOwnedStrategies(owned);
    setPublicStrategies(public);
    
  } catch (error) {
    console.error('Failed to fetch strategies:', error);
    toast.error('Failed to load strategies');
  }
};
```

---

### **3. Fetch Backtest History**

```typescript
const fetchBacktestHistory = async (page = 0, limit = 10) => {
  try {
    const response = await axios.get(
      `/api/retail/backtest/history?skip=${page * limit}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${getFirebaseToken()}` }
      }
    );

    setBacktestHistory(response.data.backtests);
    setTotalResults(response.data.total);
    
  } catch (error) {
    console.error('Failed to fetch history:', error);
  }
};
```

---

## 🎨 UI/UX Enhancements

### **1. Action Buttons**

```tsx
<div className="flex gap-2 mt-6">
  <Button
    variant="secondary"
    onClick={handleExportCSV}
    icon={<Download />}
  >
    Export CSV
  </Button>
  
  <Button
    variant="secondary"
    onClick={handleExportJSON}
    icon={<FileJson />}
  >
    Export JSON
  </Button>
  
  <Button
    variant="secondary"
    onClick={handleExportPDF}
    icon={<FileText />}
  >
    Export PDF
  </Button>
  
  <Button
    variant="primary"
    onClick={handleSaveReport}
    icon={<Save />}
  >
    Save Report
  </Button>
</div>
```

---

### **2. Comparison Mode (Optional)**

```tsx
<Toggle
  label="Compare Strategies"
  checked={compareMode}
  onChange={setCompareMode}
/>

{compareMode && (
  <ComparisonView
    strategy1={backtestResult1}
    strategy2={backtestResult2}
  />
)}
```

**Comparison Table:**
```tsx
<table>
  <thead>
    <tr>
      <th>Metric</th>
      <th>Strategy 1</th>
      <th>Strategy 2</th>
      <th>Difference</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Total Return</td>
      <td>{result1.metrics.total_return}%</td>
      <td>{result2.metrics.total_return}%</td>
      <td className={getDifferenceColor(...)}>
        {difference}%
      </td>
    </tr>
    {/* ... more rows */}
  </tbody>
</table>
```

---

### **3. History Sidebar**

```tsx
<Drawer
  open={showHistory}
  onClose={() => setShowHistory(false)}
  title="Backtest History"
>
  <BacktestHistoryList
    backtests={backtestHistory}
    onSelect={loadBacktestResult}
    onDelete={deleteBacktest}
  />
</Drawer>
```

---

## 📱 Responsive Design

### **Breakpoints:**

```css
/* Mobile: < 768px */
- Stack input panel above results
- Single column layout
- Simplified charts

/* Tablet: 768px - 1024px */
- Side-by-side layout
- 2-column stat cards
- Full charts

/* Desktop: > 1024px */
- Full 30/70 split
- 5-column stat cards
- Advanced features visible
```

---

## 🚀 Performance Optimizations

### **1. Lazy Loading**
```tsx
const EquityCurveChart = lazy(() => import('./charts/EquityCurveChart'));
const TradeLogTable = lazy(() => import('./tables/TradeLogTable'));
```

### **2. Memoization**
```tsx
const chartData = useMemo(() => {
  return result.equity_curve.map(transformData);
}, [result.equity_curve]);
```

### **3. Debouncing**
```tsx
const debouncedSymbolSearch = useMemo(
  () => debounce(searchSymbol, 300),
  []
);
```

---

## 🎯 User Flow

```
1. User lands on Backtesting Page
   ↓
2. Sees empty state with instructions
   ↓
3. Selects strategy from dropdown
   ↓
4. Enters symbol (with autocomplete)
   ↓
5. Chooses timeframe and date range
   ↓
6. Clicks "Run Backtest"
   ↓
7. Loading state with progress indicator
   ↓
8. Results displayed with:
   - Summary stats
   - Equity curve chart
   - Trade distribution
   - Trade log table
   ↓
9. User can:
   - Export results
   - Save report
   - Run another backtest
   - Compare with previous results
```

---

## ✅ Implementation Checklist

### **Phase 1: Core Features**
- [ ] Input panel layout
- [ ] Strategy dropdown (API integration)
- [ ] Symbol autocomplete
- [ ] Timeframe selector
- [ ] Date range picker
- [ ] Run backtest API call
- [ ] Loading states
- [ ] Error handling

### **Phase 2: Results Display**
- [ ] Summary stat cards
- [ ] Equity curve chart (Recharts)
- [ ] Trade distribution chart
- [ ] Trade log table
- [ ] Responsive layout

### **Phase 3: Enhancements**
- [ ] Export functionality (CSV, JSON, PDF)
- [ ] Save report to history
- [ ] Backtest history sidebar
- [ ] Compare mode
- [ ] Advanced filters
- [ ] Dark mode support

### **Phase 4: Polish**
- [ ] Loading animations
- [ ] Empty states
- [ ] Error states
- [ ] Tooltips and help text
- [ ] Keyboard shortcuts
- [ ] Accessibility (a11y)

---

## 🎨 Color Scheme

```css
/* Primary Colors */
--primary-blue: #3b82f6;
--primary-purple: #8b5cf6;

/* Status Colors */
--success: #10b981;  /* Green for profits */
--danger: #ef4444;   /* Red for losses */
--warning: #f59e0b;  /* Orange for warnings */
--info: #3b82f6;     /* Blue for info */

/* Neutral Colors */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "recharts": "^2.10.0",
    "axios": "^1.6.0",
    "react-datepicker": "^4.21.0",
    "react-select": "^5.8.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^2.30.0",
    "jspdf": "^2.5.1",
    "papaparse": "^5.4.1"
  }
}
```

---

## 🚀 Next Steps

1. **Create component files:**
   - `BacktestingPage.tsx`
   - `BacktestInputPanel.tsx`
   - `BacktestResultsPanel.tsx`
   - `EquityCurveChart.tsx`
   - `TradeLogTable.tsx`

2. **Implement API hooks:**
   - `useBacktest.ts`
   - `useStrategies.ts`
   - `useBacktestHistory.ts`

3. **Add routing:**
   - Update `App.tsx` or routing config
   - Add `/dashboard/backtesting` route

4. **Test integration:**
   - Test with real Firebase tokens
   - Verify API responses
   - Test error scenarios

5. **Deploy and monitor:**
   - Deploy to staging
   - User testing
   - Performance monitoring

---

## 📝 Notes

- Backend API endpoints are already implemented and tested
- All backtest logic is handled server-side
- Frontend focuses on UX and visualization
- Real-time progress updates possible via WebSocket (future enhancement)
- Consider adding notification system for long-running backtests

---

**Ready to implement! 🚀**

All backend APIs are functional and documented. Frontend can now be built to consume these endpoints and provide an excellent user experience.
