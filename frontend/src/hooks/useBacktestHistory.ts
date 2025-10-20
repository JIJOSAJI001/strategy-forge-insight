import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface BacktestHistoryItem {
  _id: string;
  strategy_id: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  created_at: string;
  metrics: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
  };
}

interface BacktestHistoryResponse {
  backtests: BacktestHistoryItem[];
  total: number;
  page: number;
  page_size: number;
}

export const useBacktestHistory = () => {
  const [history, setHistory] = useState<BacktestHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchHistory = useCallback(
    async (page: number = 1, pageSize: number = 10) => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const token = await user.getIdToken();
        
        const response = await axios.get<BacktestHistoryResponse>(
          `${API_BASE_URL}/api/retail/backtest/history`,
          {
            params: { page, page_size: pageSize },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setHistory(response.data.backtests);
        setTotal(response.data.total);
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || err.message || 'Failed to fetch backtest history';
        setError(errorMessage);
        console.error('Error fetching backtest history:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const getBacktestDetails = useCallback(
    async (backtestId: string) => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        
        const response = await axios.get(
          `${API_BASE_URL}/api/retail/backtest/${backtestId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        return response.data;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || err.message || 'Failed to fetch backtest details';
        throw new Error(errorMessage);
      }
    },
    [user]
  );

  const deleteBacktest = useCallback(
    async (backtestId: string) => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        
        await axios.delete(`${API_BASE_URL}/api/retail/backtest/${backtestId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Refresh history after deletion
        fetchHistory();
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.detail || err.message || 'Failed to delete backtest';
        throw new Error(errorMessage);
      }
    },
    [user, fetchHistory]
  );

  return {
    history,
    total,
    isLoading,
    error,
    fetchHistory,
    getBacktestDetails,
    deleteBacktest,
  };
};
