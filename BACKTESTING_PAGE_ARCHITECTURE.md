# Backtesting Page Architecture Documentation

## Overview
This document provides a comprehensive overview of the backtesting page structure in the Strategy Forge retail dashboard, including technical stack, state management, authentication integration, API layer, and workflow.

---

## 1. Technology Stack

### Frontend Framework
- **React 18.3.1** with TypeScript
- **Vite 5.4.1** as build tool and development server
- **React Router DOM 6.26.2** for routing
- **SWC** for fast compilation (`@vitejs/plugin-react-swc`)

### UI Component Library
- **shadcn/ui** - Radix UI-based component system
  - Card, Button, Badge, Input, Select components
  - MetricCard (custom component for key metrics display)
- **Radix UI** primitives (@radix-ui/react-*)
- **Tailwind CSS 3.4.11** for styling
  - Custom theme with HSL-based color system
  - Dark mode support via `class` strategy
  - Custom animations and keyframes

### Data Visualization
- **Recharts 3.1.0**
  - LineChart for equity curve
  - ComposedChart for trading activity
  - Bar charts for trade distribution
  - Responsive containers

### State Management & Data Fetching
- **TanStack Query (React Query) 5.56.2**
  - Query caching and invalidation
  - Loading and error states
  - Background refetching
  - Disabled initial query execution (manual trigger)

### Authentication
- **Firebase Authentication 12.0.0**
  - Email/password login
  - Google OAuth integration
  - Token-based API authentication

### Styling & Theming
- **Tailwind CSS** with custom configuration
- **tailwindcss-animate** for animations
- **class-variance-authority** for component variants
- **clsx** & **tailwind-merge** for conditional classes

### Form & Validation
- **React Hook Form 7.53.0**
- **Zod 3.23.8** for schema validation
- **@hookform/resolvers** for integration

### Icons
- **Lucide React 0.462.0**
  - Play, RotateCcw, Download, TrendingUp, TrendingDown, Target, BarChart3

---

## 2. Frontend Stack Details

### Build Configuration (vite.config.ts)
```typescript
{
  server: {
    host: "::",
    port: 8080
  },
  plugins: [react(), componentTagger()],
  resolve: {
    alias: {
      "@": "./src"  // Path aliasing for cleaner imports
    }
  }
}
```

### TypeScript Configuration
- **Compiler Options:**
  - Path mapping: `@/*` → `./src/*`
  - `noImplicitAny: false` (allows implicit any)
  - `skipLibCheck: true`
  - `strictNullChecks: false`
  - `allowJs: true`

### Tailwind Theme Customization
- **Custom Colors:**
  - Trading-specific: `success`, `danger`
  - Chart colors: `chart-1` through `chart-5`
  - Semantic colors: `primary`, `secondary`, `muted`, `accent`
  - Dark mode via HSL CSS variables
- **Custom Animations:**
  - `accordion-down` / `accordion-up`
  - Pulse animations for loading states

---

## 3. State Management Architecture

### Local Component State
The `Backtesting.tsx` component uses React's `useState` for UI configuration:

```typescript
// Input configuration state
const [symbol, setSymbol] = useState<string>("NIFTY");
const [timeframe, setTimeframe] = useState<string>("1d");
const [rangeYears, setRangeYears] = useState<number>(5);
const [startDate, setStartDate] = useState<string>("2019-01-01");
const [endDate, setEndDate] = useState<string>("2024-01-01");
const [pineMeta, setPineMeta] = useState<{
  name?: string;
  file_name?: string;
} | undefined>(undefined);
```

### Persistent State (useRef)
```typescript
const fileInputRef = useRef<HTMLInputElement | null>(null); // File upload
const paramsRef = useRef<BacktestRequest | null>(null);     // Last request params
```

### Server State (React Query)
```typescript
const { data, isLoading, isFetching, isError, refetch } = useQuery<UIBacktest>({
  queryKey: ["backtest", paramsRef.current],
  queryFn: () => runBacktestUI(paramsRef.current as BacktestRequest),
  enabled: false,  // Manual trigger only
});
```

**React Query Benefits:**
- Automatic caching of backtest results
- Loading and error states
- Background refetching capability
- Request deduplication
- Retry logic with exponential backoff

### Computed State (useMemo)
```typescript
const equityData = data?.equity_curve ?? [];
const tradingActivity = useMemo(() => data?.trading_activity ?? [], [data]);
```

---

## 4. Authentication Integration

### Firebase Setup (lib/firebase.ts)
```typescript
const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
};
```

### Auth Context (AuthContext.tsx)
**Provides:**
- `user: User | null` - Current Firebase user
- `loading: boolean` - Auth state loading
- `role: "admin" | "retail" | null` - User role from backend
- `displayName: string | null`
- `login(email, password)` - Email/password login
- `loginWithGoogle()` - Google OAuth login
- `logout()` - Sign out
- `refreshUser()` - Reload user data

**Flow:**
1. Firebase auth state change triggers `onAuthStateChanged`
2. Get ID token from Firebase user
3. Call `/api/users/me` with Bearer token
4. Fetch user role from backend (MongoDB)
5. Redirect based on role: admin → `/admin-dashboard`, retail → `/dashboard`

### Protected Route (ProtectedRoute.tsx)
```typescript
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) navigate("/");  // Redirect to landing
  
  return <>{children}</>;
};
```

### Route Configuration
```typescript
<Route 
  path="/backtesting" 
  element={
    <ProtectedRoute>
      <AppLayout>
        <Backtesting />
      </AppLayout>
    </ProtectedRoute>
  } 
/>
```

---

## 5. API Client Layer

### Service Architecture (backtest.service.ts)

#### Type Definitions
```typescript
// Backend response type
export type BacktestResponse = {
  symbol: string;
  timeframe: string;
  rows: number;
  metrics: Record<string, number>;
  equity_curve: { date: string; equity: number }[];
  conditions: {
    best: Record<string, number>;
    risks: Record<string, number>;
    neutral: Record<string, number>;
  };
};

// UI model (enriched, structured)
export type UIBacktest = {
  header: {
    strategy_name?: string;
    symbol: string;
    timeframe?: string;
    period?: { start?: string; end?: string };
  };
  summary: {
    total_return?: number;
    sharpe_ratio?: number;
    max_drawdown?: number;
    total_trades?: number;
    winrate?: number;
  };
  equity_curve: { date: string; equity: number }[];
  trading_activity: { month: string; trades: number }[];
  performance_metrics?: {
    cagr?: number;
    volatility?: number;
    calmar_ratio?: number;
    alpha?: number;
    beta?: number;
  };
  trading_statistics?: {
    total_trades?: number;
    winning_trades?: number;
    losing_trades?: number;
    avg_win?: number;
    avg_loss?: number;
  };
  risk_analysis?: {
    max_drawdown?: number;
    avg_drawdown?: number;
    recovery_time?: string;
    var_95?: number;
    sortino_ratio?: number;
  };
  conditions_analysis?: {
    best_month?: string;
    worst_month?: string;
    neutral_months?: string[];
  };
  metadata?: {
    backtest_id?: string;
    created_at?: string;
    source?: string;
  };
};

// Request payload
export type BacktestRequest = {
  symbol: string;
  start_date: string;
  end_date: string;
  timeframe?: string;
  strategy?: {
    name?: string;
    source?: "pine_script" | "builder";
    file_name?: string;
  };
  simulation_context?: {
    symbol: string;
    timeframe?: string;
    data_years?: number;
    start_date?: string;
    end_date?: string;
  };
};
```

#### API Functions
```typescript
// Core backtest execution
export async function runBacktest(req: BacktestRequest): Promise<BacktestResponse> {
  const res = await fetch(`/api/backtest/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Backtest failed: ${res.status}`);
  return res.json();
}

// Adapter function: backend → UI model
export function mapToUIBacktest(
  req: BacktestRequest,
  backend: BacktestResponse | any
): UIBacktest {
  // Maps simple backend response to rich UI model
  // Handles both legacy format and new enriched format
}

// Unified interface for UI
export async function runBacktestUI(req: BacktestRequest): Promise<UIBacktest> {
  const backend = await runBacktest(req);
  return mapToUIBacktest(req, backend);
}
```

### Strategy Service (strategy.service.ts)
```typescript
class StrategyService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await getIdToken(auth.currentUser!, true);
    return fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    }).then(res => res.json());
  }
  
  async backtestStrategy(strategy, startDate, endDate): Promise<any>;
  async getStrategies(): Promise<StrategyResponse[]>;
  // ... other methods
}
```

---

## 6. Backend Integration

### FastAPI Endpoints

#### Main Backend (main.py)
- **Base URL:** `http://localhost:8000`
- **CORS:** Configured for ports 8080, 8081, 8082, 5173, 3000, 4173
- **MongoDB:** Connected via `MongoDB.connect_to_mongo()`
- **Firebase Admin:** Initialized for token verification

#### Retail Backtest API (api/retail_backtest.py)
```python
router = APIRouter(prefix="/retail/backtest", tags=["retail", "backtest"])

@router.post("/run", response_model=BacktestResultResponse)
async def run_backtest(
    payload: BacktestRunRequest,
    user: Dict = Depends(verify_firebase_token)
)

@router.get("/history")
async def get_backtest_history(
    strategy_id: Optional[str],
    symbol: Optional[str],
    limit: int = 10,
    skip: int = 0,
    user: Dict = Depends(verify_firebase_token)
)

@router.get("/{backtest_id}")
async def get_backtest_details(
    backtest_id: str,
    user: Dict = Depends(verify_firebase_token)
)

@router.delete("/{backtest_id}")
async def delete_backtest(
    backtest_id: str,
    user: Dict = Depends(verify_firebase_token)
)
```

#### Backend Workflow
1. **Verify Firebase Token:** Extract user from JWT
2. **Validate Strategy Access:** Check ownership or public access
3. **Fetch Market Data:** From MongoDB cache or Yahoo Finance
4. **Calculate Metrics:**
   - Total return, Sharpe ratio, max drawdown
   - Win rate, CAGR, volatility, Calmar ratio
   - Trade statistics (wins, losses, avg win/loss)
5. **Generate Equity Curve:** Daily portfolio value progression
6. **Store Result:** Save to MongoDB `backtests` collection
7. **Return Response:** Structured `BacktestResultResponse`

---

## 7. Component Structure & UI Layout

### Page Structure (Backtesting.tsx)
```
┌─────────────────────────────────────────────────────────────┐
│ Header Section                                              │
│  • Title: "Backtesting Environment"                        │
│  • Subtitle: Symbol • Timeframe • Period                   │
│  • Actions: Import Pine Script, Re-run, Run Backtest       │
├─────────────────────────────────────────────────────────────┤
│ Input Configuration Panel (Card)                           │
│  Grid Layout (4 columns):                                  │
│    • Symbol dropdown (NIFTY, BANKNIFTY, INFY, TCS)        │
│    • Timeframe dropdown (1m, 1h, 1d)                      │
│    • Data range (years) input                              │
│    • Imported strategy display                             │
│  Second Row (4 columns):                                   │
│    • Start date picker                                     │
│    • End date picker                                       │
├─────────────────────────────────────────────────────────────┤
│ Simulation Screen (Conditional - during loading)           │
│  • Status: "Simulating..."                                 │
│  • Progress bar (animated pulse)                           │
│  • Live feed (mock log messages)                           │
├─────────────────────────────────────────────────────────────┤
│ Status Card                                                 │
│  • Badge: Running/Completed/Error/Idle                     │
│  • Strategy name                                            │
│  • Period display                                           │
│  • Total Return (large, highlighted)                       │
├─────────────────────────────────────────────────────────────┤
│ Key Metrics Grid (5 columns)                               │
│  MetricCards for:                                          │
│    1. Total Return                                         │
│    2. Sharpe Ratio                                         │
│    3. Max Drawdown                                         │
│    4. Total Trades                                         │
│    5. Win Rate                                             │
├─────────────────────────────────────────────────────────────┤
│ Charts Section (2 column grid)                             │
│  Left: Equity Curve (LineChart)                           │
│  Right: Trading Activity (ComposedChart with Bar)          │
├─────────────────────────────────────────────────────────────┤
│ Detailed Metrics (2 column grid)                           │
│  Left: Performance Metrics Card                            │
│    • CAGR, Volatility, Calmar Ratio, Alpha, Beta         │
│  Right: Trading Statistics Card                            │
│    • Total/Winning/Losing Trades, Avg Win/Loss            │
├─────────────────────────────────────────────────────────────┤
│ Risk Analysis Card (5 column grid)                         │
│  • Max Drawdown, Avg Drawdown, Recovery Time               │
│  • VaR (95%), Sortino Ratio                                │
├─────────────────────────────────────────────────────────────┤
│ Market Conditions Card                                      │
│  • Best/Worst/Neutral months                               │
│  • Metadata: Backtest ID, Created date, Source             │
└─────────────────────────────────────────────────────────────┘
```

### Key Components Used
1. **Card/CardHeader/CardTitle/CardContent** - Container components
2. **Button** - Actions (Run, Re-run, Export, Import)
3. **Badge** - Status indicators
4. **MetricCard** - Custom component for key metrics with icons
5. **LineChart/ComposedChart** - Recharts visualizations
6. **Input/Select** - Form controls

---

## 8. User Workflow

### Standard Backtest Flow
```
1. User navigates to /backtesting (authenticated, protected route)
   ↓
2. User configures parameters:
   • Selects symbol (NIFTY, BANKNIFTY, INFY, TCS)
   • Chooses timeframe (1m, 1h, 1d)
   • Sets date range (start/end dates or data years)
   • Optionally imports Pine Script strategy (.pine file)
   ↓
3. User clicks "Run Backtest" button
   ↓
4. Frontend constructs BacktestRequest:
   {
     symbol: "NIFTY",
     start_date: "2019-01-01",
     end_date: "2024-01-01",
     timeframe: "1d",
     strategy: { name: "My Strategy", source: "pine_script", file_name: "strategy.pine" },
     simulation_context: { ... }
   }
   ↓
5. React Query executes runBacktestUI():
   • Sets isLoading/isFetching = true
   • Shows simulation screen with progress bar
   ↓
6. API call to POST /api/backtest/run
   • Firebase token sent in Authorization header
   ↓
7. Backend processing:
   • Verifies Firebase token → extracts user
   • Validates strategy access (ownership/public)
   • Fetches market data from MongoDB/Yahoo
   • Calculates metrics (return, Sharpe, drawdown, etc.)
   • Generates equity curve
   • Stores result in MongoDB backtests collection
   ↓
8. Backend returns BacktestResponse
   ↓
9. Frontend maps to UIBacktest model
   ↓
10. React Query caches result
    • Sets data = UIBacktest
    • Sets isLoading = false
    ↓
11. UI renders results:
    • Status card shows "Completed" badge
    • Key metrics grid displays 5 primary metrics
    • Equity curve chart visualizes portfolio growth
    • Trading activity chart shows monthly trades
    • Detailed metrics cards show performance/trading stats
    • Risk analysis card displays drawdown metrics
    • Market conditions card shows best/worst periods
```

### Re-run Workflow
```
1. User clicks "Re-run Backtest" button
   ↓
2. Frontend uses paramsRef.current (last request)
   ↓
3. React Query refetch() triggers new API call
   ↓
4. Backend processes with same parameters
   ↓
5. UI updates with new results
```

### Export Workflow
```
1. User clicks "Export" button (if data exists)
   ↓
2. Frontend calls downloadJSON():
   • Creates JSON blob from UIBacktest data
   • Generates download link
   • Triggers browser download
   • Filename: backtest_SYMBOL.json
```

### Import Pine Script Workflow
```
1. User clicks "Import Pine Script" button
   ↓
2. Hidden file input opens (accept=".pine")
   ↓
3. User selects .pine file
   ↓
4. onChange handler extracts filename and name
   ↓
5. setPineMeta({ name, file_name })
   ↓
6. UI updates "Imported Strategy" field
   ↓
7. On "Run Backtest", strategy metadata sent to backend
```

---

## 9. Data Flow Diagram

```
┌─────────────┐         ┌──────────────┐         ┌───────────────┐
│   Browser   │ ◄─────► │   Firebase   │ ◄─────► │  FastAPI      │
│   (React)   │         │     Auth     │         │   Backend     │
└──────┬──────┘         └──────────────┘         └───────┬───────┘
       │                                                  │
       │  1. Login credentials                            │
       ├─────────────────────────────────────────────────►│
       │                                                  │
       │  2. Firebase ID Token                            │
       │◄─────────────────────────────────────────────────┤
       │                                                  │
       │  3. GET /api/users/me (Bearer token)             │
       ├─────────────────────────────────────────────────►│
       │                                                  │  ┌──────────────┐
       │  4. User role + profile                          │  │   MongoDB    │
       │◄─────────────────────────────────────────────────┤  │   Database   │
       │                                                  │  └──────┬───────┘
       │  5. Navigate to /backtesting                     │         │
       │                                                  │         │
       │  6. User configures backtest params              │         │
       │                                                  │         │
       │  7. POST /api/backtest/run (Bearer token, params)│         │
       ├─────────────────────────────────────────────────►│         │
       │                                                  │         │
       │                                   8. Verify token│         │
       │                                   9. Validate strategy      │
       │                                   10. Fetch data │◄────────┤
       │                                   11. Calculate  │         │
       │                                   12. Store result├────────►│
       │                                                  │         │
       │  13. BacktestResponse                            │         │
       │◄─────────────────────────────────────────────────┤         │
       │                                                  │         │
       │  14. React Query caches + renders                │         │
       │                                                  │         │
```

---

## 10. Key Features & Design Patterns

### Features
1. **Real-time Simulation Feedback:** Animated progress bar during processing
2. **Comprehensive Metrics:** 20+ performance, risk, and trading metrics
3. **Interactive Charts:** Recharts-based equity curve and activity visualizations
4. **Strategy Import:** Support for Pine Script file upload
5. **Export Functionality:** JSON export of backtest results
6. **Responsive Design:** Mobile-friendly grid layouts
7. **Dark Mode Support:** Theme-aware color system
8. **Error Handling:** Toast notifications for errors
9. **Loading States:** Skeleton screens and spinners
10. **Caching:** React Query automatic result caching

### Design Patterns
1. **Adapter Pattern:** `mapToUIBacktest()` adapts backend response to UI model
2. **Service Layer:** Centralized API calls in `backtest.service.ts`
3. **Context API:** Global auth state via `AuthContext`
4. **Higher-Order Components:** `ProtectedRoute` wrapper
5. **Composition:** Radix UI primitives composed into custom components
6. **Responsive Design:** Tailwind's responsive grid system
7. **Type Safety:** TypeScript interfaces for all data structures
8. **Separation of Concerns:** UI, state, API, auth in separate layers

---

## 11. Performance Optimizations

1. **React Query Caching:** Prevents redundant API calls
2. **useMemo:** Memoizes trading activity computation
3. **useRef:** Avoids re-renders for file input and params
4. **Code Splitting:** Dynamic imports via Vite
5. **Tree Shaking:** Vite's built-in optimization
6. **SWC Compilation:** Faster than Babel
7. **Lazy Loading:** Routes loaded on demand
8. **Conditional Rendering:** Only render sections when data exists

---

## 12. Error Handling & Edge Cases

### Frontend Error Handling
```typescript
// React Query error state
if (isError) {
  // Display error badge in status card
  return <Badge variant="destructive">Error</Badge>;
}

// API service error handling
try {
  const response = await fetch(url, config);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json();
} catch (error) {
  console.error('Backtest error:', error);
  throw error; // React Query handles display
}
```

### Backend Error Handling
```python
# Strategy not found
if not strategy:
    raise HTTPException(status_code=404, detail="Strategy not found")

# Access denied
if not (is_owner or is_public):
    raise HTTPException(status_code=403, detail="Access denied")

# Invalid date range
if start_date > end_date:
    raise HTTPException(status_code=400, detail="Invalid date range")

# No data available
if df.empty:
    raise HTTPException(status_code=404, detail="No data available")
```

### Edge Cases Handled
1. **Empty data sets:** Return default metrics with zeros
2. **Invalid date ranges:** Validation before API call
3. **Missing strategy:** Graceful fallback to default strategy
4. **Authentication expiry:** Token refresh on 401
5. **Network failures:** Retry logic via React Query
6. **Concurrent requests:** React Query deduplication

---

## 13. Security Considerations

1. **Firebase Token Verification:** Backend validates every request
2. **CORS Configuration:** Whitelisted origins only
3. **Strategy Ownership:** Backend checks user_id before access
4. **SQL Injection Prevention:** MongoDB parameterized queries (Pydantic models)
5. **XSS Prevention:** React's built-in sanitization
6. **HTTPS Enforcement:** Production deployments use HTTPS
7. **Environment Variables:** Sensitive config in .env files
8. **Token Expiry Handling:** Automatic refresh on 401

---

## 14. Future Enhancement Opportunities

1. **WebSocket Support:** Real-time simulation progress updates
2. **Strategy Comparison:** Side-by-side backtest comparison
3. **Advanced Filtering:** Filter backtest history by date, performance
4. **Backtest Templates:** Pre-configured backtest scenarios
5. **Monte Carlo Simulation:** Statistical confidence intervals
6. **Walk-forward Analysis:** Time-series cross-validation
7. **Multi-symbol Backtests:** Portfolio-level testing
8. **Custom Indicators:** User-defined technical indicators
9. **Risk Overlay:** Real-time risk metrics during simulation
10. **PDF Reports:** Exportable backtest reports

---

## Summary

The backtesting page is a comprehensive, production-ready implementation leveraging:

- **Modern React** with TypeScript for type safety
- **React Query** for efficient server state management
- **Firebase Auth** for secure, token-based authentication
- **FastAPI backend** with MongoDB for scalable data storage
- **Recharts** for professional financial visualizations
- **Tailwind CSS** with shadcn/ui for beautiful, accessible UI
- **Service layer architecture** for clean separation of concerns

The workflow is optimized for retail traders, providing professional-grade backtesting capabilities with an intuitive, responsive interface. The architecture supports future enhancements while maintaining code quality and maintainability.
