import { Strategy, StrategyDefinition, StrategyValidation } from "@/types/strategy";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface StrategyResponse {
  id: string;
  name: string;
  description: string;
  timeframe: string;
  conditions: any[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    maxPositions: number;
    riskPerTrade: number;
  };
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface PineScriptResponse {
  code: string;
  filename: string;
}

class StrategyService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await (await import("firebase/auth")).getIdToken((await import("@/lib/firebase")).auth.currentUser!, true).catch(() => null);
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Strategy service error:', error);
      throw error;
    }
  }

  async saveStrategy(strategy: Strategy): Promise<StrategyResponse> {
    return this.request<StrategyResponse>('/api/strategies', {
      method: 'POST',
      body: JSON.stringify({
        strategy: strategy,
        userId: 'anonymous' // TODO: Get from auth context
      }),
    });
  }

  async updateStrategy(id: string, strategy: Strategy): Promise<StrategyResponse> {
    return this.request<StrategyResponse>(`/api/strategies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(strategy),
    });
  }

  async getStrategy(id: string): Promise<StrategyResponse> {
    return this.request<StrategyResponse>(`/api/strategies/${id}`);
  }

  async getStrategies(): Promise<StrategyResponse[]> {
    return this.request<StrategyResponse[]>('/api/strategies');
  }

  async deleteStrategy(id: string): Promise<void> {
    return this.request<void>(`/api/strategies/${id}`, {
      method: 'DELETE',
    });
  }

  async generatePineScript(strategy: Strategy): Promise<PineScriptResponse> {
    return this.request<PineScriptResponse>('/api/strategies/generate-pine-script', {
      method: 'POST',
      body: JSON.stringify({
        strategy: strategy,
        userId: 'anonymous' // TODO: Get from auth context
      }),
    });
  }

  async backtestStrategy(strategy: Strategy, startDate: string, endDate: string): Promise<any> {
    return this.request<any>('/api/strategies/backtest', {
      method: 'POST',
      body: JSON.stringify({
        strategy,
        startDate,
        endDate,
      }),
    });
  }

  async validateStrategy(strategy: Strategy): Promise<{ isValid: boolean; errors: string[] }> {
    return this.request<{ isValid: boolean; errors: string[] }>('/api/strategies/validate', {
      method: 'POST',
      body: JSON.stringify({
        strategy: strategy,
        userId: 'anonymous' // TODO: Get from auth context
      }),
    });
  }

  // New JSON-first strategy definition methods
  async createStrategyDefinition(strategy: StrategyDefinition): Promise<StrategyDefinition> {
    return this.request<StrategyDefinition>('/api/strategies/defs', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    });
  }

  async updateStrategyDefinition(id: string, strategy: StrategyDefinition): Promise<StrategyDefinition> {
    return this.request<StrategyDefinition>(`/api/strategies/defs/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ strategy }),
    });
  }

  async getStrategyDefinition(id: string): Promise<StrategyDefinition> {
    return this.request<StrategyDefinition>(`/api/strategies/defs/${id}`);
  }

  async getStrategyDefinitions(): Promise<StrategyDefinition[]> {
    return this.request<StrategyDefinition[]>('/api/strategies/defs');
  }

  async validateStrategyDefinition(strategy: StrategyDefinition): Promise<StrategyValidation> {
    return this.request<StrategyValidation>('/api/strategies/defs/validate', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    });
  }
}

export const strategyService = new StrategyService(); 