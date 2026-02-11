import { type Candle } from './SimulationEngine';

export interface StrategyCondition {
    indicator: 'RSI' | 'SMA' | 'EMA' | 'Price';
    operator: '>' | '<' | 'crossesAbove' | 'crossesBelow';
    value: number | 'Price' | 'SMA' | 'EMA';
    period?: number;
}

export interface DragDropStrategy {
    id: string;
    name: string;
    description: string;
    entryConditions: StrategyCondition[];
    exitConditions: StrategyCondition[];
    stopLossPct?: number;
    takeProfitPct?: number;
}

// Simple technical indicator calculation helpers
const calculateSMA = (data: Candle[], period: number, index: number): number => {
    if (index < period - 1) return 0;
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += data[index - i].close;
    }
    return sum / period;
};

const calculateRSI = (data: Candle[], period: number, index: number): number => {
    if (index < period) return 50;

    let gains = 0;
    let losses = 0;

    // Calculate initial average (simple)
    for (let i = index - period + 1; i <= index; i++) {
        const diff = data[i].close - data[i - 1].close;
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    if (losses === 0) return 100;

    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
};

export class StrategyExecutor {
    static evaluate(strategy: DragDropStrategy, data: Candle[], index: number, position: 'long' | 'short' | null): 'buy' | 'sell' | 'hold' {
        if (index < 50) return 'hold'; // Warmup



        // Check Exit Conditions first if in position
        if (position === 'long') {
            const shouldExit = strategy.exitConditions.some(cond =>
                this.checkCondition(cond, data, index)
            );
            if (shouldExit) return 'sell';
        }

        // Check Entry Conditions if not in position
        if (position === null) {
            const shouldEnter = strategy.entryConditions.every(cond =>
                this.checkCondition(cond, data, index)
            );
            if (shouldEnter) return 'buy';
        }

        return 'hold';
    }

    private static checkCondition(cond: StrategyCondition, data: Candle[], index: number): boolean {
        const currentPrice = data[index].close;
        let leftValue = 0;

        // Get Left Value
        if (cond.indicator === 'Price') leftValue = currentPrice;
        else if (cond.indicator === 'SMA') leftValue = calculateSMA(data, cond.period || 14, index);
        else if (cond.indicator === 'RSI') leftValue = calculateRSI(data, cond.period || 14, index);

        // Get Right Value
        let rightValue = 0;
        if (typeof cond.value === 'number') rightValue = cond.value;
        else if (cond.value === 'Price') rightValue = currentPrice;

        // Compare
        switch (cond.operator) {
            case '>': return leftValue > rightValue;
            case '<': return leftValue < rightValue;
            // Simplified cross logic for demo
            case 'crossesAbove': return leftValue > rightValue && leftValue * 0.95 < rightValue;
            case 'crossesBelow': return leftValue < rightValue && leftValue * 1.05 > rightValue;
            default: return false;
        }
    }
}


