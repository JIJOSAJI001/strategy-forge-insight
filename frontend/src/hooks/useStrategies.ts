import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Strategy {
  _id: string;
  name: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useStrategies = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStrategies = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      
      const response = await axios.get(`${API_BASE_URL}/api/strategies`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStrategies(response.data);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || 'Failed to fetch strategies';
      setError(errorMessage);
      console.error('Error fetching strategies:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const refreshStrategies = useCallback(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  return {
    strategies,
    isLoading,
    error,
    refreshStrategies,
  };
};
