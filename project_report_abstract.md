# Strategy Forge Insight — Project Report Abstract

## Abstract

This project presents **Strategy Forge Insight**, a comprehensive web-based trading strategy research and evaluation platform designed for retail traders. The platform implements **five core functional modules**, each backed by a full-stack architecture combining a React 18 / TypeScript frontend with a Python FastAPI backend.

---

### (1) Strategy Library & Management

A curated collection of pre-built trading strategies stored in MongoDB that users can browse, filter by tags and categories, view performance metrics (Sharpe ratio, drawdown, win rate), and compare side-by-side for analysis. Strategy definitions support both admin-curated entries and user-created drag-and-drop strategies, with visibility controls (public / private) and ownership-based access enforcement.

---

### (2) Historical Backtesting Engine

Enables traders to configure and execute backtests by selecting market symbols (e.g., NIFTY, BANKNIFTY, INFY, TCS, AAPL), timeframes (`1m`, `1h`, `1d`), and date ranges. Market data is sourced from **yfinance** with Redis-cached delivery. Results are displayed through comprehensive metrics including:

- Total return, Sharpe ratio, max drawdown, total trades, win rate
- CAGR (Compound Annual Growth Rate), volatility, Calmar ratio
- Average win/loss per trade

Interactive visualizations are rendered via **Recharts** — including equity curves and trading activity charts. Backtest results are persisted to the `backtests` MongoDB collection for downstream AI analysis.

---

### (3) Drag-and-Drop Strategy Builder

Features an intuitive visual interface using **@dnd-kit** where users can drag indicators (RSI, SMA, EMA, MACD, Bollinger Bands), conditions (greater than, less than, crosses above/below), and actions (buy, sell, stop loss, take profit) into sortable condition zones. The builder supports:

- Risk management parameter configuration (stop-loss %, take-profit %)
- Automatic downloadable **Pine Script** code generation
- Real-time strategy complexity analysis

Saved strategies are stored in the `drag_drop_strategies` MongoDB collection and are directly usable in the backtesting and paper trading modules.

---

### (4) Paper Trading Simulation Module *(New)*

A fully interactive, candle-by-candle market simulation engine built entirely on the frontend using TypeScript. Users select a global symbol (e.g., AAPL, RELIANCE), date range, and an optional automated strategy. The simulation runs against real historical OHLCV data fetched from the backend (`/api/retail/backtest/market-data`).

**Core components:**

- **`SimulationEngine.ts`** — Manages simulation state including balance, open positions, trade log, equity calculation, and candle-by-candle stepping. Implements dynamic position sizing based on a 1% equity risk model and auto-applies stop-loss and take-profit levels per candle high/low.
- **`StrategyExecutor.ts`** — Evaluates drag-and-drop strategy conditions (RSI, SMA, EMA, price crossovers) against live candle data to generate `buy` / `sell` / `hold` signals for the automated trading mode.

**Features include:**

- Play / Pause / Reset simulation controls with adjustable speed
- Real-time price chart with trade markers (green = buy, red = sell) via Recharts
- Positions panel showing unrealized P&L per open position
- Trade log with expand/collapse toggle and reason tags (`signal`, `stop_loss`, `take_profit`)
- Manual buy/sell buttons for non-automated mode
- Session save to MongoDB (`paper_trading_sessions` collection) via `POST /api/retail/backtest/paper-trading/save-session`
- Session history tab displaying saved runs with symbol, date range, final balance, and trade count
- Detailed session drilldown showing session overview, performance summary, trade statistics, and full trade history table

---

### (5) AI Research Assistant *(New)*

An analytical reasoning layer powered by **OpenRouter LLM** (via the OpenAI-compatible API), integrated as a fully live chat interface under `/ai-assistant`. The AI operates exclusively on already-generated platform data (backtests, paper trading sessions, strategy definitions) — it never queries live market data or gives buy/sell predictions.

**Backend architecture (`Backend/api/ai.py`, `Backend/services/ai/`):**

- **`ContextBuilder`** (`context_builder.py`) — Fetches and normalizes strategy configs, backtest reports, and paper-trading session logs from MongoDB into structured, LLM-ready analytical contexts. Supports:
  - `build_strategy_context()` — strategy + backtest + paper session cross-context
  - `build_paper_trade_context()` — session behavioral analysis with backtest comparison
  - `build_backtest_context()` — standalone backtest report context
  - `build_portfolio_context()` — cross-strategy ranking and comparison
  - `build_context_from_message_with_fallback()` — smart name-matching from free-form chat
  - Cross-report divergence computation (PnL delta, win-rate drift, drawdown expansion)
- **`LLMClient`** (`llm_client.py`) — Routes requests to OpenRouter models by task type:
  - Explanatory summarization → `Kwaipilot KAT-Coder-Pro V1`
  - Short metric explanations → `openrouter/ctl-large`
  - Enforces temperature `0.1–0.2`, token limits, retry logic, and schema-validated structured JSON output
- **`RAGService`** (`rag_service.py`) — FAISS-based retrieval-augmented generation layer indexing metric definitions, risk interpretation guidelines, and platform rules to supplement LLM reasoning
- **Guardrails** — Enforced at both system prompt and application code level: no buy/sell/hold advice, no price predictions, no parameter suggestions; policy violations result in polite refusals redirecting to measurable metrics
- **AI Cache** — Redis caching keyed by `ai:analysis:{endpoint}:{model}:{analysis_version}:{context_hash}` with configurable TTL (default 15 min); any change to report data, prompt, or schema automatically invalidates stale entries

**FastAPI endpoints:**
- `POST /api/ai/analyze-strategy/{strategy_id}` — Strengths, weaknesses, risk structure, stability assessment, caveats
- `POST /api/ai/analyze-paper-session/{session_id}` — Behavioral patterns, execution drift, risk discipline
- `POST /api/ai/chat` — Controlled free-form chat with intelligent query routing (portfolio queries, strategy inventory, bearish resilience, reference follow-ups, metric explanations)

**Frontend (`AIAssistant.tsx`):**

- Free-form chat interface with conversation history (last 8 turns as context)
- Strategy context selector (auto-loads from `/api/strategies`)
- Paper session selector (auto-loads from `/api/retail/backtest/paper-trading/history`)
- Task mode toggle (Auto / Force Metric Explanation)
- One-click "Analyze Strategy" and "Analyze Paper Session" shortcut buttons
- Structured response formatting with strengths, weaknesses, evidence data points, confidence level, and caveats rendered in chat bubbles

---

### Platform Infrastructure

**Authentication & Access Control:**
Secure user authentication through **Firebase** (email/password and Google OAuth) with role-based access control distinguishing admin and retail users.

**Retail Dashboard:**
Comprehensive portfolio metrics display and activity feeds.

**Admin Dashboard:**
System status monitoring including API health, database connections, and Redis cache status.

**Profile Management:**
Theme toggle (dark/light mode) support and user profile management.

---

### Backend Architecture

| Component | Detail |
|---|---|
| **Framework** | FastAPI with Motor (async MongoDB driver) |
| **Database** | MongoDB Atlas — collections: `strategies`, `drag_drop_strategies`, `backtests`, `paper_trading_sessions`, `users` |
| **Caching** | Redis — delivering **~25x performance improvement** (2539ms to ~8ms for cached market data requests) |
| **DB Indexing** | Compound indexes on high-frequency query fields — **~10x query optimization** |
| **Market Data** | yfinance (Yahoo Finance) with local cache fallback and Redis overlay |
| **AI Layer** | OpenRouter LLM + FAISS RAG + ContextBuilder pipeline |
| **Auth** | Firebase JWT token verification (`verify_firebase_token`) on all protected endpoints |

---

### Frontend Architecture

| Component | Detail |
|---|---|
| **Framework** | React 18 with TypeScript |
| **Server State** | TanStack Query (React Query) — automatic caching, background refetching, stale-while-revalidate |
| **Component Library** | Shadcn/ui built on Radix UI primitives |
| **Charts** | Recharts (equity curves, trading activity, paper trading live chart) |
| **Drag-and-Drop** | @dnd-kit (Strategy Builder) |
| **Simulation Engine** | Custom TypeScript `SimulationEngine` + `StrategyExecutor` (no external library) |
| **AI Chat UI** | Custom chat interface with OpenRouter-powered backend responses |
| **Deployment** | Frontend: Vercel; Backend: Render (configured via `vercel.json` / `render.yaml`) |

---

*Generated: March 2026 | Project: Strategy Forge Insight*
