export interface Candle {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export const generateMockData = (count: number = 1000): Candle[] => {
    const data: Candle[] = [];
    let currentPrice = 150.0;
    let currentTime = Date.now() - count * 60 * 1000; // Start 'count' minutes ago

    for (let i = 0; i < count; i++) {
        const volatility = 0.5;
        const change = (Math.random() - 0.5) * volatility;

        const open = currentPrice;
        const close = Math.round((open + change) * 100) / 100;
        const high = Math.round((Math.max(open, close) + Math.random() * 0.2) * 100) / 100;
        const low = Math.round((Math.min(open, close) - Math.random() * 0.2) * 100) / 100;
        const volume = Math.floor(Math.random() * 10000) + 1000;

        data.push({
            time: currentTime,
            open,
            high,
            low,
            close,
            volume,
        });

        currentPrice = close;
        currentTime += 60 * 1000; // Increment by 1 minute
    }
    return data;
};
