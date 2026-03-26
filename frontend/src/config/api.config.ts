/**
 * Centralized API Configuration
 * Single source of truth for API endpoints and base URL
 */

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30 seconds
  
  ENDPOINTS: {
    // Strategy endpoints
    STRATEGIES: '/api/strategies',
    STRATEGY_BY_ID: (id: string) => `/api/strategies/${id}`,
    STRATEGY_DEFS: '/api/strategies/defs',
    STRATEGY_DEF_BY_ID: (id: string) => `/api/strategies/defs/${id}`,
    STRATEGY_VALIDATE: '/api/strategies/validate',
    STRATEGY_DEF_VALIDATE: '/api/strategies/defs/validate',
    
    // Dashboard endpoints
    DASHBOARD_METRICS: '/api/dashboard/metrics',
    DASHBOARD_EQUITY_CURVE: '/api/dashboard/equity-curve',
    DASHBOARD_DRAWDOWN: '/api/dashboard/drawdown-history',
    DASHBOARD_PERFORMANCE: '/api/dashboard/performance-comparison',
    ACTIVITY_RECENT: '/api/activity/recent',
    
    // Backtest endpoints
    BACKTEST_RUN: '/api/retail/backtest/run',
    BACKTEST_HISTORY: '/api/retail/backtest/history',
    BACKTEST_BY_ID: (id: string) => `/api/retail/backtest/${id}`,
    
    // User endpoints
    USERS_ME: '/api/users/me',
    
    // Data endpoints
    MARKET_DATA: '/api/data',

    // AI assistant endpoints
    AI_CHAT: '/api/ai/chat',
    AI_ANALYZE_STRATEGY: (strategyId: string) => `/api/ai/analyze-strategy/${strategyId}`,
    AI_ANALYZE_PAPER_SESSION: (sessionId: string) => `/api/ai/analyze-paper-session/${sessionId}`,
  }
};

/**
 * Helper function to build full URL
 */
export const buildUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Helper function to get auth headers
 */
export const getAuthHeaders = async (token?: string): Promise<HeadersInit> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
