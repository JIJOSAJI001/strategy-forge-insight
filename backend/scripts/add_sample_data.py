import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

load_dotenv()

# Sample strategy data
sample_strategies = [
    {
        "title": "RSI Mean Reversion",
        "description": "Classic mean reversion strategy using RSI indicator with dynamic position sizing",
        "performance": 18.7,
        "sharpe": 2.1,
        "drawdown": -8.2,
        "winrate": 67.3,
        "tags": ["RSI", "Mean Reversion", "Stocks"],
        "downloads": 1247,
        "rating": 4.5,
        "category": "Mean Reversion",
        "difficulty": "Beginner",
        "author": "TradingEdge Team",
        "lastUpdated": "2 days ago",
        "status": "running"
    },
    {
        "title": "Bollinger Band Breakout",
        "description": "Momentum strategy that trades breakouts from Bollinger Bands with volume confirmation",
        "performance": 24.1,
        "sharpe": 1.8,
        "drawdown": -12.5,
        "winrate": 59.2,
        "tags": ["Bollinger Bands", "Breakout", "Volume"],
        "downloads": 892,
        "rating": 4.2,
        "category": "Momentum",
        "difficulty": "Intermediate",
        "author": "QuantMaster",
        "lastUpdated": "1 week ago",
        "status": "paused"
    },
    {
        "title": "MACD Trend Following",
        "description": "Long-term trend following strategy using MACD crossovers with trend filters",
        "performance": 31.4,
        "sharpe": 1.6,
        "drawdown": -15.8,
        "winrate": 52.7,
        "tags": ["MACD", "Trend", "Long-term"],
        "downloads": 654,
        "rating": 3.9,
        "category": "Trend Following",
        "difficulty": "Advanced",
        "author": "AlgoTrader Pro",
        "lastUpdated": "3 days ago",
        "status": "backtesting"
    },
    {
        "title": "Pairs Trading Arbitrage",
        "description": "Market neutral strategy trading statistical arbitrage between correlated assets",
        "performance": 14.2,
        "sharpe": 2.8,
        "drawdown": -4.1,
        "winrate": 71.8,
        "tags": ["Pairs Trading", "Market Neutral", "Statistical Arbitrage"],
        "downloads": 423,
        "rating": 4.7,
        "category": "Arbitrage",
        "difficulty": "Expert",
        "author": "HedgeFund Alpha",
        "lastUpdated": "5 days ago",
        "status": "paper-trading"
    },
    {
        "title": "Volatility Breakout",
        "description": "Intraday strategy capturing volatility breakouts using ATR and volume spikes",
        "performance": 22.8,
        "sharpe": 1.9,
        "drawdown": -11.3,
        "winrate": 61.5,
        "tags": ["ATR", "Volatility", "Intraday"],
        "downloads": 789,
        "rating": 4.0,
        "category": "Volatility",
        "difficulty": "Intermediate",
        "author": "VolatilityKing",
        "lastUpdated": "1 day ago",
        "status": "running"
    },
    {
        "title": "AI Sentiment Strategy",
        "description": "ML-powered strategy using sentiment analysis and social media signals",
        "performance": 19.6,
        "sharpe": 2.2,
        "drawdown": -9.7,
        "winrate": 64.1,
        "tags": ["AI", "Sentiment", "Social Media", "ML"],
        "downloads": 1156,
        "rating": 4.3,
        "category": "AI/ML",
        "difficulty": "Expert",
        "author": "AI Innovations",
        "lastUpdated": "6 hours ago",
        "status": "running"
    },
    {
        "title": "Golden Cross Strategy",
        "description": "Simple moving average crossover strategy with momentum confirmation",
        "performance": 16.3,
        "sharpe": 1.4,
        "drawdown": -10.2,
        "winrate": 58.9,
        "tags": ["Moving Averages", "Crossover", "Momentum"],
        "downloads": 567,
        "rating": 3.8,
        "category": "Trend Following",
        "difficulty": "Beginner",
        "author": "SimpleTrader",
        "lastUpdated": "4 days ago",
        "status": "running"
    },
    {
        "title": "Fibonacci Retracement",
        "description": "Advanced retracement strategy using Fibonacci levels and support/resistance",
        "performance": 28.9,
        "sharpe": 2.3,
        "drawdown": -7.8,
        "winrate": 73.2,
        "tags": ["Fibonacci", "Retracement", "Support/Resistance"],
        "downloads": 445,
        "rating": 4.6,
        "category": "Mean Reversion",
        "difficulty": "Advanced",
        "author": "FibonacciMaster",
        "lastUpdated": "1 week ago",
        "status": "paused"
    }
]

async def add_sample_data():
    """Add sample strategies to MongoDB"""
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    if not mongodb_uri:
        print("❌ MONGODB_URI environment variable is not set")
        return
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[database_name]
        collection = db["strategies"]
        
        print(f"📊 Connecting to database: {database_name}")
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        await collection.delete_many({})
        print("🗑️  Cleared existing strategies")
        
        # Insert sample strategies
        result = await collection.insert_many(sample_strategies)
        print(f"✅ Successfully added {len(result.inserted_ids)} strategies to the database")
        
        # Display the added strategies
        print("\n📋 Added Strategies:")
        print("-" * 50)
        for strategy in sample_strategies:
            print(f"• {strategy['title']} - {strategy['category']} ({strategy['difficulty']})")
            print(f"  Performance: {strategy['performance']}% | Sharpe: {strategy['sharpe']} | Rating: {strategy['rating']}")
            print()
        
        # Get total count
        total_count = await collection.count_documents({})
        print(f"📈 Total strategies in database: {total_count}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error adding sample data: {str(e)}")

if __name__ == "__main__":
    asyncio.run(add_sample_data()) 