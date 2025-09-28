// JSON-first Strategy Definition Types (matches backend schema)

export interface IndicatorDef {
  id: string;
  type: string; // e.g., "RSI", "SMA", "EMA", "MACD"
  params: Record<string, any>;
}

export interface ExpressionDef {
  left: string; // indicator id or OHLCV literal
  operator: string; // ">", "<", ">=", "<=", "==", "crosses_above", "crosses_below"
  right: {
    value?: number;
    indicator?: string;
  };
}

export interface ActionDef {
  side?: "long" | "short";
  entryName?: string;
  exitFrom?: string;
}

export interface ConditionDef {
  id: string;
  type: "entry" | "exit";
  expression: ExpressionDef;
  action: ActionDef;
}

export interface StopTakeDef {
  type: "percentage" | "fixed";
  value: number;
}

export interface RiskManagementDef {
  stopLoss: StopTakeDef;
  takeProfit: StopTakeDef;
  capital: number;
  positionSize: "fixed" | "percent_of_equity";
  positionValue: number;
}

export interface StrategyDefinition {
  id?: string;
  name: string;
  description: string;
  ownerId: string;
  visibility: "private" | "public";
  timeframe: string;
  indicators: IndicatorDef[];
  conditions: ConditionDef[];
  riskManagement: RiskManagementDef;
  pineScriptCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// UI-specific types for the builder
export interface IndicatorTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultParams: Record<string, any>;
  icon: React.ReactNode;
}

export interface ConditionTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ReactNode;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface StrategyValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// Legacy types for backward compatibility
export interface Parameter {
  id: string;
  type: 'indicator' | 'condition' | 'action';
  name: string;
  category: string;
  description: string;
  config: Record<string, any>;
  icon: React.ReactNode;
}

export interface StrategyCondition {
  id: string;
  parameters: Parameter[];
  logic: 'AND' | 'OR';
}

export interface Strategy {
  name: string;
  description: string;
  timeframe: string;
  conditions: StrategyCondition[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    positionSize: number;
    maxPositions: number;
    riskPerTrade: number;
  };
}