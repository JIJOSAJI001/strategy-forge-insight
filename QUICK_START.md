# 🚀 Quick Start Guide - New Backtesting Page

## ✅ **Replacement Complete!**

Your `Backtesting.tsx` page has been successfully replaced with the new implementation.

---

## 🎯 **Test It Now (3 Steps)**

### **Step 1: Ensure axios is installed**
```powershell
cd frontend
npm install axios
```

### **Step 2: Start both servers**

**Terminal 1 - Backend:**
```powershell
cd Backend
python main.py
```
Wait for: `Uvicorn running on http://0.0.0.0:8000`

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```
Wait for: `Local: http://localhost:5173/`

### **Step 3: Test the page**
1. Open browser: `http://localhost:5173/backtest`
2. You should see:
   - Blue gradient header with "📊 Strategy Backtester"
   - Left panel with input forms
   - Right panel saying "No results yet"

---

## 📋 **What You Should See**

### **Header Section:**
```
📊 Strategy Backtester                    [History]
Run your saved or public strategies on real historical market data
```

### **Left Panel (Input):**
- Strategy dropdown
- Symbol input
- Timeframe buttons (1d, 1h, 30m, 15m)
- Date range picker
- Quick date presets
- Run Backtest button

### **Right Panel (Results):**
- Initially shows: "No results yet. Configure and run a backtest"
- After running: Shows metrics, charts, trade log

---

## 🧪 **Test Scenarios**

### **Test 1: Form Validation**
1. Don't fill any fields
2. Click "Run Backtest"
3. ✅ Should show: "Please fill in all required fields"

### **Test 2: Strategy Selection**
1. Click strategy dropdown
2. ✅ Should see: "My Strategies" and "Public Strategies" sections
3. If empty: Create a strategy in Strategy Builder first

### **Test 3: Symbol Autocomplete**
1. Click symbol input
2. Type "NIF"
3. ✅ Should show: NIFTY 50 suggestion

### **Test 4: Date Presets**
1. Click "Last 30 Days" preset
2. ✅ Start and end dates should auto-fill

### **Test 5: Run Backtest** (Full Flow)
1. Select a strategy
2. Enter: "NIFTY"
3. Select: "1d" timeframe
4. Click: "Last 30 Days"
5. Click: "Run Backtest"
6. ✅ Should show loading spinner
7. ✅ Then show results with:
   - Total Return card
   - Sharpe Ratio card
   - Max Drawdown card
   - Win Rate card
   - Equity curve chart
   - Trade log table

### **Test 6: Export**
1. After backtest completes
2. Click "JSON" button
3. ✅ File should download

---

## ⚠️ **Common Issues & Quick Fixes**

### **Issue 1: Strategies dropdown is empty**
**Problem:** No strategies in database
**Fix:**
1. Go to Strategy Builder page
2. Create and save a strategy
3. Come back to Backtesting page
4. Refresh if needed

---

### **Issue 2: "Network Error" when running backtest**
**Problem:** Backend not running or wrong URL
**Fix:**
Check backend is running:
```powershell
curl http://localhost:8000/health
```
Should return: `{"status":"ok"}`

---

### **Issue 3: "Cannot find module 'axios'"**
**Problem:** axios not installed
**Fix:**
```powershell
cd frontend
npm install axios
```

---

### **Issue 4: Authentication error**
**Problem:** Not logged in or token expired
**Fix:**
1. Go to login page
2. Sign in with your account
3. Come back to backtesting page

---

### **Issue 5: Charts not showing**
**Problem:** Recharts not installed
**Fix:**
```powershell
npm install recharts
```

---

## 📸 **Expected Visual Flow**

### **1. Initial State:**
```
┌─────────────────────────────────────────────┐
│ 📊 Strategy Backtester      [History]     │
│ Run your saved strategies...               │
├──────────────┬──────────────────────────────┤
│              │                              │
│   Configure  │   No results yet.           │
│   Backtest   │   Configure and run a       │
│              │   backtest to see results.  │
│   [Inputs]   │                              │
│              │        🔍                     │
│ [Run Button] │                              │
│              │                              │
└──────────────┴──────────────────────────────┘
```

### **2. After Running:**
```
┌─────────────────────────────────────────────┐
│ 📊 Strategy Backtester      [History]     │
│ Run your saved strategies...               │
├──────────────┬──────────────────────────────┤
│              │ ┌──────┬──────┬──────┬──────┐│
│   Configure  │ │+25.5%│ 1.8  │-12.3%│58.5% ││
│   Backtest   │ │Return│Sharpe│Draw  │Win%  ││
│              │ └──────┴──────┴──────┴──────┘│
│   ✅ NIFTY   │                              │
│   ✅ 1d      │ [Overview][Equity][Trades]   │
│   ✅ Dates   │                              │
│              │ 📈 Equity Curve Chart        │
│ [Run Button] │ 📊 Trade Distribution       │
│              │ 📋 Trade Log Table          │
└──────────────┴──────────────────────────────┘
```

---

## 🎯 **Key Differences from Old Page**

| Aspect | Old | New |
|--------|-----|-----|
| **Layout** | Single column | Two-column 30/70 |
| **Strategy** | File upload | Database dropdown |
| **Symbol** | Dropdown | Autocomplete |
| **Dates** | Manual only | Presets + Manual |
| **Results** | All at once | Tabbed interface |
| **Export** | JSON only | CSV, JSON, PDF |
| **Charts** | 2 basic | 4+ interactive |

---

## 📝 **Quick Reference**

### **Supported Symbols:**
- Indices: NIFTY, BANKNIFTY, SENSEX
- Stocks: RELIANCE.NS, INFY.NS, TCS.NS, HDFCBANK.NS, etc.

### **Supported Timeframes:**
- `1d` (Daily) - ⭐ Recommended for beginners
- `1h` (Hourly)
- `30m` (30 Minutes)
- `15m` (15 Minutes)

### **Date Range Tips:**
- Min: 7 days
- Max: 10 years
- Recommended: 1-3 months for testing
- Longer periods = more accurate results

---

## ✅ **Success Checklist**

Before considering it working, verify:

- [ ] Backend responds at `http://localhost:8000`
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Backtesting page shows new UI
- [ ] Strategy dropdown loads strategies
- [ ] Symbol autocomplete shows suggestions
- [ ] Date presets fill dates
- [ ] Run backtest shows loading state
- [ ] Results display after completion
- [ ] Charts render correctly
- [ ] Export JSON works
- [ ] No console errors

---

## 🎊 **You're All Set!**

The new backtesting page is ready to use. Key features:

✅ **Yahoo Finance** live data
✅ **MongoDB** caching
✅ **Database** saved strategies
✅ **Interactive** charts
✅ **Export** functionality
✅ **Responsive** design
✅ **Dark mode** support

---

## 📚 **Need More Help?**

- **Architecture Details:** `BACKTESTING_PAGE_REDESIGN.md`
- **Implementation Guide:** `BACKTESTING_FRONTEND_IMPLEMENTATION.md`
- **Backend APIs:** `Backend/README_MARKET_DATA.md`
- **Comparison:** `BACKTESTING_COMPARISON.md`

---

**🚀 Happy Backtesting! 🚀**
