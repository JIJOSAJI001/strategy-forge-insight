import { type Candle } from './mockData';
import { StrategyExecutor, type DragDropStrategy } from './StrategyExecutor';

export interface Position {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    quantity: number;
    entryTime: number;
    unrealizedPnL: number;
}

export interface Trade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    time: number;
    realizedPnL?: number;
}

export class SimulationEngine {
    private data: Candle[];
    private currentIndex: number;
    private balance: number;
    private positions: Position[];
    private trades: Trade[];
    private initialBalance: number;
    private activeStrategy: DragDropStrategy | null = null;
    private autoTradeEnabled: boolean = false;

    constructor(data: Candle[], initialBalance: number = 100000) {
        this.data = data;
        this.initialBalance = initialBalance;
        this.balance = initialBalance;
        this.positions = [];
        this.trades = [];
        this.currentIndex = 0;
    }

    public setStrategy(strategy: DragDropStrategy | null) {
        this.activeStrategy = strategy;
    }

    public setAutoTrade(enabled: boolean) {
        this.autoTradeEnabled = enabled;
    }

    public get currentState() {
        const currentCandle = this.data[this.currentIndex];
        const totalUnrealizedPnL = this.positions.reduce((acc, pos) => {
            const pnl = pos.side === 'long'
                ? (currentCandle.close - pos.entryPrice) * pos.quantity
                : (pos.entryPrice - currentCandle.close) * pos.quantity;
            return acc + pnl;
        }, 0);

        return {
            candle: currentCandle,
            index: this.currentIndex,
            balance: this.balance,
            equity: this.balance + totalUnrealizedPnL,
            positions: this.positions.map(p => ({
                ...p,
                unrealizedPnL: p.side === 'long' ? (currentCandle.close - p.entryPrice) * p.quantity : (p.entryPrice - currentCandle.close) * p.quantity
            })),
            trades: this.trades,
            isFinished: this.currentIndex >= this.data.length - 1
        };
    }

    public start(startIndex: number = 0) {
        this.currentIndex = startIndex;
    }

    public next(): boolean {
        if (this.currentIndex >= this.data.length - 1) {
            return false;
        }

        // Auto-trade Logic
        if (this.autoTradeEnabled && this.activeStrategy) {
            const currentPos = this.positions.length > 0 ? this.positions[0].side : null;
            const signal = StrategyExecutor.evaluate(this.activeStrategy, this.data, this.currentIndex, currentPos);

            if (signal === 'buy') this.executeOrder('buy', 10);
            else if (signal === 'sell') this.executeOrder('sell', 10);
        }

        this.currentIndex++;
        return true;
    }

    public executeOrder(side: 'buy' | 'sell', quantity: number) {
        const currentCandle = this.data[this.currentIndex];
        const price = currentCandle.close; // Simplified fill at close

        if (side === 'buy') {
            // Simple long entry
            const cost = price * quantity;
            if (this.balance >= cost) {
                this.balance -= cost;
                const newPos: Position = {
                    id: Math.random().toString(36).substr(2, 9),
                    symbol: 'TEST',
                    side: 'long',
                    entryPrice: price,
                    quantity: quantity,
                    entryTime: currentCandle.time,
                    unrealizedPnL: 0
                };
                this.positions.push(newPos);
                this.trades.push({
                    id: Math.random().toString(36).substr(2, 9),
                    symbol: 'TEST',
                    side: 'buy',
                    price: price,
                    quantity: quantity,
                    time: currentCandle.time
                });
            }
        } else if (side === 'sell') {
            // Sell to close any long positions (FIFO for simplicity)
            // Or open short if no position. Let's just handle closing longs for this demo.
            let qtyToSell = quantity;

            // Filter long positions
            const longPositions = this.positions.filter(p => p.side === 'long');

            // If we have long positions, close them
            for (const pos of longPositions) {
                if (qtyToSell <= 0) break;

                const closeQty = Math.min(pos.quantity, qtyToSell);
                const proceeds = closeQty * price;
                const cost = closeQty * pos.entryPrice;
                const pnl = proceeds - cost;

                this.balance += proceeds;
                qtyToSell -= closeQty;
                pos.quantity -= closeQty;

                this.trades.push({
                    id: Math.random().toString(36).substr(2, 9),
                    symbol: 'TEST',
                    side: 'sell',
                    price: price,
                    quantity: closeQty,
                    time: currentCandle.time,
                    realizedPnL: pnl
                });
            }

            // Clean up closed positions
            this.positions = this.positions.filter(p => p.quantity > 0);
        }
    }

    public reset() {
        this.balance = this.initialBalance;
        this.positions = [];
        this.trades = [];
        this.currentIndex = 0;
    }
}
