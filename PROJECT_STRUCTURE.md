# Strategy Forge Insight - Project Structure

## Overview
Strategy Forge Insight is a comprehensive trading strategy development and backtesting platform with AI-powered insights and real-time market analysis.

## Current Project Structure

```
strategy-forge-insight/
├── Backend/                           # Backend API and services
│   ├── api/                           # API modules
│   │   ├── __init__.py
│   │   └── strategy.py                # Strategy-related API endpoints
│   ├── db/                            # Database modules
│   │   ├── __init__.py
│   │   └── mongo.py                   # MongoDB connection and operations
│   ├── scripts/                       # Utility scripts
│   │   ├── add_sample_data.py         # Script to populate database with sample data
│   │   └── view_database.py           # Script to view database contents
│   ├── __pycache__/                   # Python cache files
│   ├── .env                           # Environment variables
│   ├── DATABASE_GUIDE.md              # Database setup and usage guide
│   ├── debug_api.py                   # Debug API implementation
│   ├── env.example                    # Environment variables template
│   ├── final_api.py                   # Final API implementation
│   └── main.py                        # Main application entry point
├── frontend/                          # React + TypeScript frontend
│   ├── dist/                          # Build output
│   ├── node_modules/                  # Dependencies
│   ├── public/                        # Static assets
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   ├── src/                           # Source code
│   │   ├── components/                # Reusable UI components
│   │   │   ├── ai/                    # AI-related components
│   │   │   │   └── AIAssistantPanel.tsx
│   │   │   ├── auth/                  # Authentication components
│   │   │   │   ├── AuthDialog.tsx
│   │   │   │   ├── ProfileDialog.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── dashboard/             # Dashboard components
│   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   ├── AIMarketInsightPanel.tsx
│   │   │   │   ├── DashboardCharts.tsx
│   │   │   │   ├── DashboardFooter.tsx
│   │   │   │   ├── PortfolioHealthCard.tsx
│   │   │   │   ├── QuickActions.tsx
│   │   │   │   └── StrategyCard.tsx
│   │   │   ├── landing/               # Landing page components
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   └── Navbar.tsx
│   │   │   ├── layout/                # Layout components
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   └── AppSidebar.tsx
│   │   │   └── ui/                    # UI component library (shadcn/ui)
│   │   │       ├── accordion.tsx
│   │   │       ├── alert-dialog.tsx
│   │   │       ├── alert.tsx
│   │   │       ├── aspect-ratio.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── breadcrumb.tsx
│   │   │       ├── button.tsx
│   │   │       ├── calendar.tsx
│   │   │       ├── card.tsx
│   │   │       ├── carousel.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── command.tsx
│   │   │       ├── context-menu.tsx
│   │   │       ├── date-range-picker.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── drawer.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── form.tsx
│   │   │       ├── hover-card.tsx
│   │   │       ├── input-otp.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── menubar.tsx
│   │   │       ├── metric-card.tsx
│   │   │       ├── navigation-menu.tsx
│   │   │       ├── pagination.tsx
│   │   │       ├── popover.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── radio-group.tsx
│   │   │       ├── resizable.tsx
│   │   │       ├── scroll-area.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── slider.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── switch.tsx
│   │   │       ├── table.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── textarea.tsx
│   │   │       ├── theme-toggle.tsx
│   │   │       ├── toast.tsx
│   │   │       ├── toaster.tsx
│   │   │       ├── toggle-group.tsx
│   │   │       ├── toggle.tsx
│   │   │       ├── tooltip.tsx
│   │   │       └── use-toast.ts
│   │   ├── contexts/                  # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/                       # Utility libraries
│   │   │   ├── firebase.ts
│   │   │   └── utils.ts
│   │   ├── pages/                     # Page components
│   │   │   ├── Backtesting.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Landing.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── PaperTrading.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── StrategyBuilder.tsx
│   │   │   └── StrategyLibrary.tsx
│   │   ├── App.tsx                    # Main app component
│   │   ├── index.css                  # Global styles
│   │   ├── main.tsx                   # App entry point
│   │   └── vite-env.d.ts             # Vite type definitions
│   ├── .gitignore                     # Git ignore rules
│   ├── bun.lockb                      # Bun lock file
│   ├── components.json                # UI components configuration
│   ├── eslint.config.js              # ESLint configuration
│   ├── index.html                     # HTML template
│   ├── package-lock.json             # npm lock file
│   ├── package.json                   # Dependencies and scripts
│   ├── postcss.config.js             # PostCSS configuration
│   ├── README.md                      # Frontend documentation
│   ├── tailwind.config.ts            # Tailwind CSS configuration
│   ├── tsconfig.app.json             # TypeScript app config
│   ├── tsconfig.json                 # TypeScript base config
│   ├── tsconfig.node.json            # TypeScript node config
│   └── vite.config.ts                # Vite build configuration
├── .git/                              # Git repository
└── PROJECT_STRUCTURE.md               # This file
```

## Recommended Complete Project Structure

```
strategy-forge-insight/
├── Backend/                           # Backend API and services (FastAPI + Python)
│   ├── api/                           # API route modules
│   │   ├── __init__.py
│   │   ├── strategy.py                # Strategy-related endpoints
│   │   ├── auth.py                    # Authentication endpoints
│   │   ├── backtest.py                # Backtesting endpoints
│   │   ├── market.py                  # Market data endpoints
│   │   └── ai.py                      # AI service endpoints
│   ├── db/                            # Database modules
│   │   ├── __init__.py
│   │   ├── mongo.py                   # MongoDB connection and operations
│   │   └── models.py                  # Pydantic models and schemas
│   ├── services/                      # Business logic services
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── strategy_service.py
│   │   ├── backtest_service.py
│   │   ├── market_service.py
│   │   └── ai_service.py
│   ├── middleware/                    # FastAPI middleware
│   │   ├── __init__.py
│   │   ├── auth_middleware.py
│   │   ├── cors_middleware.py
│   │   └── error_middleware.py
│   ├── utils/                         # Utility functions
│   │   ├── __init__.py
│   │   ├── database.py
│   │   ├── logger.py
│   │   ├── validation.py
│   │   └── helpers.py
│   ├── config/                        # Configuration files
│   │   ├── __init__.py
│   │   ├── database_config.py
│   │   ├── redis_config.py
│   │   └── environment_config.py
│   ├── tests/                         # Backend tests
│   │   ├── __init__.py
│   │   ├── test_strategy.py
│   │   ├── test_auth.py
│   │   └── test_backtest.py
│   ├── scripts/                       # Utility scripts
│   │   ├── add_sample_data.py
│   │   └── view_database.py
│   ├── main.py                        # FastAPI app entry point
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                   # Environment variables template
│   ├── .env                           # Environment variables (gitignored)
│   ├── Dockerfile                     # Docker configuration
│   └── docker-compose.yml             # Docker compose setup
├── frontend/                          # React + TypeScript frontend
│   ├── src/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── ai/                    # AI-related components
│   │   │   │   ├── AIAssistantPanel.tsx
│   │   │   │   ├── StrategyAnalyzer.tsx
│   │   │   │   └── MarketPredictor.tsx
│   │   │   ├── auth/                  # Authentication components
│   │   │   │   ├── AuthDialog.tsx
│   │   │   │   ├── ProfileDialog.tsx
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── dashboard/             # Dashboard components
│   │   │   │   ├── DashboardCharts.tsx
│   │   │   │   ├── StrategyCard.tsx
│   │   │   │   ├── PerformanceMetrics.tsx
│   │   │   │   └── MarketOverview.tsx
│   │   │   ├── strategy/              # Strategy-related components
│   │   │   │   ├── StrategyBuilder.tsx
│   │   │   │   ├── StrategyEditor.tsx
│   │   │   │   ├── StrategyList.tsx
│   │   │   │   └── StrategyForm.tsx
│   │   │   ├── backtesting/           # Backtesting components
│   │   │   │   ├── BacktestResults.tsx
│   │   │   │   ├── BacktestChart.tsx
│   │   │   │   ├── BacktestForm.tsx
│   │   │   │   └── BacktestMetrics.tsx
│   │   │   ├── trading/               # Trading components
│   │   │   │   ├── PaperTrading.tsx
│   │   │   │   ├── LiveTrading.tsx
│   │   │   │   ├── OrderBook.tsx
│   │   │   │   └── TradeHistory.tsx
│   │   │   ├── market/                # Market data components
│   │   │   │   ├── MarketChart.tsx
│   │   │   │   ├── MarketData.tsx
│   │   │   │   ├── NewsFeed.tsx
│   │   │   │   └── EconomicCalendar.tsx
│   │   │   ├── layout/                # Layout components
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── AppSidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── ui/                    # UI component library (existing)
│   │   ├── pages/                     # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── StrategyBuilder.tsx
│   │   │   ├── StrategyLibrary.tsx
│   │   │   ├── Backtesting.tsx
│   │   │   ├── PaperTrading.tsx
│   │   │   ├── LiveTrading.tsx
│   │   │   ├── MarketAnalysis.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── NotFound.tsx
│   │   ├── contexts/                  # React contexts
│   │   │   ├── AuthContext.tsx
│   │   │   ├── StrategyContext.tsx
│   │   │   ├── MarketContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-toast.ts
│   │   │   ├── use-strategy.ts
│   │   │   ├── use-backtest.ts
│   │   │   ├── use-market-data.ts
│   │   │   └── use-websocket.ts
│   │   ├── services/                  # API service layer
│   │   │   ├── api.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategy.service.ts
│   │   │   ├── backtest.service.ts
│   │   │   ├── market.service.ts
│   │   │   └── ai.service.ts
│   │   ├── lib/                       # Utility libraries
│   │   │   ├── firebase.ts
│   │   │   ├── utils.ts
│   │   │   ├── constants.ts
│   │   │   ├── validation.ts
│   │   │   └── formatters.ts
│   │   ├── types/                     # TypeScript type definitions
│   │   │   ├── auth.types.ts
│   │   │   ├── strategy.types.ts
│   │   │   ├── backtest.types.ts
│   │   │   ├── market.types.ts
│   │   │   └── api.types.ts
│   │   ├── styles/                    # Global styles
│   │   │   ├── globals.css
│   │   │   └── themes.css
│   │   ├── tests/                     # Frontend tests
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/                        # Static assets
│   │   ├── favicon.ico
│   │   ├── placeholder.svg
│   │   ├── robots.txt
│   │   └── manifest.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── components.json
│   └── README.md
├── shared/                            # Shared code between frontend and backend
│   ├── types/                         # Shared TypeScript types
│   │   ├── strategy.types.ts
│   │   ├── backtest.types.ts
│   │   ├── market.types.ts
│   │   └── common.types.ts
│   ├── utils/                         # Shared utility functions
│   │   ├── validation.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   └── package.json
├── docs/                              # Documentation
│   ├── api/                           # API documentation
│   │   ├── auth.md
│   │   ├── strategy.md
│   │   ├── backtest.md
│   │   └── market.md
│   ├── deployment/                    # Deployment guides
│   │   ├── docker.md
│   │   ├── aws.md
│   │   └── heroku.md
│   ├── development/                   # Development guides
│   │   ├── setup.md
│   │   ├── contributing.md
│   │   └── testing.md
│   └── README.md
├── scripts/                           # Build and deployment scripts
│   ├── build.sh
│   ├── deploy.sh
│   ├── test.sh
│   └── setup.sh
├── .github/                           # GitHub workflows
│   └── workflows/
│       ├── ci.yml
│       ├── cd.yml
│       └── test.yml
├── .gitignore
├── docker-compose.yml                 # Development environment
├── package.json                       # Root package.json for monorepo
├── README.md                          # Project overview
└── PROJECT_STRUCTURE.md               # This file
```

## Key Features and Components

### Frontend Features
- **Dashboard**: Real-time performance metrics and strategy overview
- **Strategy Builder**: Visual strategy creation with drag-and-drop interface
- **Backtesting Engine**: Historical strategy testing with detailed analytics
- **Paper Trading**: Risk-free trading simulation
- **Live Trading**: Real-time trading with broker integration
- **Market Analysis**: Real-time market data and technical indicators
- **AI Assistant**: AI-powered strategy suggestions and market insights

### Backend Services
- **Authentication**: User management and security
- **Strategy Management**: CRUD operations for trading strategies
- **Backtesting Engine**: Historical data processing and strategy evaluation
- **Market Data**: Real-time and historical market data integration
- **AI Services**: Machine learning models for strategy optimization
- **Notification System**: Real-time alerts and notifications

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Shadcn/ui
- **Backend**: FastAPI, Python 3.x, Uvicorn, Motor (async MongoDB driver)
- **Database**: MongoDB Atlas
- **Real-time**: WebSocket, Socket.io
- **AI/ML**: TensorFlow.js, OpenAI API
- **Deployment**: Docker, AWS/Heroku
- **Testing**: Jest, React Testing Library, Cypress

### Backend Dependencies
- **FastAPI**: Modern, fast web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI applications
- **Motor**: Async MongoDB driver for Python
- **PyMongo**: MongoDB driver for Python
- **Pydantic**: Data validation using Python type annotations
- **Python-dotenv**: Environment variable management
- **Python-multipart**: File upload support

## Development Guidelines

### Code Organization
- Use feature-based folder structure
- Separate concerns (UI, business logic, data access)
- Implement proper TypeScript types
- Follow consistent naming conventions

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Component tests for UI components

### Security Considerations
- Implement proper authentication and authorization
- Validate all user inputs
- Use HTTPS in production
- Implement rate limiting
- Secure API endpoints

### Performance Optimization
- Implement lazy loading for components
- Use React.memo for expensive components
- Optimize bundle size with code splitting
- Implement caching strategies
- Use CDN for static assets

This structure provides a scalable foundation for a comprehensive trading strategy platform with modern development practices and robust architecture. 