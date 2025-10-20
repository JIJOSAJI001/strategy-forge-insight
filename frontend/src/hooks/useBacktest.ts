import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface BacktestRequest {
  strategy_id: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
}

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

export const useBacktest = () => {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const runBacktest = useCallback(
    async (request: BacktestRequest) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        
        console.log('🚀 Running backtest:', request);
        console.log('   Token length:', token.length);
        
        const response = await axios.post(
          `${API_BASE_URL}/api/retail/backtest/run`,
          request,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('✅ Backtest completed:', response.data);
        setResult(response.data);
        return response.data;
      } catch (err: any) {
        console.error('❌ Backtest failed:', err);
        console.error('   Status:', err.response?.status);
        console.error('   Detail:', err.response?.data?.detail);
        console.error('   Full response:', err.response?.data);
        
        const errorMessage =
          err.response?.data?.detail || err.message || 'Failed to run backtest';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    result,
    isLoading,
    error,
    runBacktest,
    clearResult,
  };
};
