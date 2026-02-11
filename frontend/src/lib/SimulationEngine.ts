export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}
import { StrategyExecutor, type DragDropStrategy } from './StrategyExecutor';

export interface Position {
    id: string;
    symbol: string;
    side: 'long' | 'short';
    entryPrice: number;
    quantity: number;
    entryTime: number;
    unrealizedPnL: number;
    stopLossPrice?: number; // Risk Management
    takeProfitPrice?: number; // Risk Management
}

export interface Trade {
    id: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    time: number;
    realizedPnL?: number;
    reason?: 'signal' | 'stop_loss' | 'take_profit';
}

export class SimulationEngine {
    private data: Candle[];
    private currentIndex: number;
    private balance: number;
    private positions: Position[];
    private trades: Trade[];
    public initialBalance: number;
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

        const currentCandle = this.data[this.currentIndex];

        // 1. Check Stop Loss / Take Profit for existing positions
        // We check against Low/High of the current candle to see if price *touched* our levels
        const positionsToClose: { pos: Position, price: number, reason: 'stop_loss' | 'take_profit' }[] = [];

        this.positions.forEach(pos => {
            if (pos.side === 'long') {
                if (pos.stopLossPrice && currentCandle.low <= pos.stopLossPrice) {
                    positionsToClose.push({ pos, price: pos.stopLossPrice, reason: 'stop_loss' });
                } else if (pos.takeProfitPrice && currentCandle.high >= pos.takeProfitPrice) {
                    positionsToClose.push({ pos, price: pos.takeProfitPrice, reason: 'take_profit' });
                }
            }
            // Short logic would go here (flipped)
        });

        // Execute SL/TP closes
        positionsToClose.forEach(item => {
            this.executeClosePosition(item.pos, item.price, item.reason);
        });

        // Remove closed positions from active list (executeClosePosition handles logic but we need to ensure list is clean or done there)
        // Actually executeClosePosition should handle removal.


        // 2. Auto-trade Logic (Entry/Exit signals)
        if (this.autoTradeEnabled && this.activeStrategy) {
            const currentPos = this.positions.length > 0 ? this.positions[0].side : null;
            const signal = StrategyExecutor.evaluate(this.activeStrategy, this.data, this.currentIndex, currentPos);

            if (signal === 'buy') this.executeOrder('buy');
            else if (signal === 'sell') this.executeOrder('sell');
        }

        this.currentIndex++;
        return true;
    }

    private executeClosePosition(pos: Position, price: number, reason: 'signal' | 'stop_loss' | 'take_profit') {
        // Find if position still exists (might have been double triggered if logic wasn't careful, so check)
        const idx = this.positions.findIndex(p => p.id === pos.id);
        if (idx === -1) return;

        const closeQty = pos.quantity;
        const proceeds = closeQty * price;
        const cost = closeQty * pos.entryPrice;
        const pnl = proceeds - cost;

        this.balance += proceeds;

        this.trades.push({
            id: Math.random().toString(36).substr(2, 9),
            symbol: pos.symbol,
            side: 'sell',
            price: price,
            quantity: closeQty,
            time: this.data[this.currentIndex].time,
            realizedPnL: pnl,
            reason: reason
        });

        this.positions.splice(idx, 1);
    }

    public executeOrder(side: 'buy' | 'sell', quantity?: number) {
        const currentCandle = this.data[this.currentIndex];
        const price = currentCandle.close;

        if (side === 'buy') {
            // Dynamic Position Sizing
            let qty = quantity;
            if (!qty) {
                // Default risk model: Risk 1% of Equity per trade
                // Stop Loss % comes from strategy or default 2%
                const riskPerTradePct = 0.01;
                const stopLossPct = this.activeStrategy?.stopLossPct || 0.02;

                const equity = this.balance; // Simplified, use balance for sizing base
                const riskAmount = equity * riskPerTradePct;

                // Risk = Price - SL = Price * SL_Pct
                const riskPerShare = price * stopLossPct;

                qty = Math.floor(riskAmount / riskPerShare);

                // Fallback / Sanity check
                if (qty <= 0) qty = 1;
            }

            const cost = price * qty;
            if (this.balance >= cost) {
                this.balance -= cost;

                const slPrice = this.activeStrategy?.stopLossPct ? price * (1 - this.activeStrategy.stopLossPct) : undefined;
                const tpPrice = this.activeStrategy?.takeProfitPct ? price * (1 + this.activeStrategy.takeProfitPct) : undefined;

                const newPos: Position = {
                    id: Math.random().toString(36).substr(2, 9),
                    symbol: 'TEST',
                    side: 'long',
                    entryPrice: price,
                    quantity: qty,
                    entryTime: currentCandle.time,
                    unrealizedPnL: 0,
                    stopLossPrice: slPrice,
                    takeProfitPrice: tpPrice
                };
                this.positions.push(newPos);
                this.trades.push({
                    id: Math.random().toString(36).substr(2, 9),
                    symbol: 'TEST',
                    side: 'buy',
                    price: price,
                    quantity: qty,
                    time: currentCandle.time,
                    reason: 'signal'
                });
            }
        } else if (side === 'sell') {
            // Sell all long positions (Strategy Exit Signal)
            // Copy array to avoid modification issues while iterating
            [...this.positions].forEach(pos => {
                if (pos.side === 'long') {
                    this.executeClosePosition(pos, price, 'signal');
                }
            });
        }
    }

    public reset() {
        this.balance = this.initialBalance;
        this.positions = [];
        this.trades = [];
        this.currentIndex = 0;
    }
}
