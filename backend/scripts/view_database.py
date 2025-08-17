import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pprint import pprint

load_dotenv()

async def view_database():
    """View all strategies in the database"""
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
        
        print(f"📊 Connected to database: {database_name}")
        
        # Get total count
        total_count = await collection.count_documents({})
        print(f"📈 Total strategies in database: {total_count}")
        
        if total_count == 0:
            print("❌ No strategies found in the database")
            print("💡 Run 'python scripts/add_sample_data.py' to add sample data")
            return
        
        # Get all strategies
        strategies = []
        async for strategy in collection.find():
            strategies.append(strategy)
        
        print(f"\n📋 Found {len(strategies)} strategies:")
        print("=" * 80)
        
        for i, strategy in enumerate(strategies, 1):
            print(f"\n{i}. {strategy['title']}")
            print(f"   ID: {strategy['_id']}")
            print(f"   Category: {strategy.get('category', 'N/A')}")
            print(f"   Difficulty: {strategy.get('difficulty', 'N/A')}")
            print(f"   Performance: {strategy['performance']}%")
            print(f"   Sharpe: {strategy['sharpe']}")
            print(f"   Drawdown: {strategy['drawdown']}%")
            print(f"   Win Rate: {strategy['winrate']}%")
            print(f"   Rating: {strategy['rating']}")
            print(f"   Downloads: {strategy['downloads']}")
            print(f"   Author: {strategy.get('author', 'Unknown')}")
            print(f"   Status: {strategy.get('status', 'N/A')}")
            print(f"   Tags: {', '.join(strategy['tags'])}")
            print(f"   Description: {strategy['description'][:100]}...")
            print("-" * 80)
        
        # Show statistics
        print("\n📊 Database Statistics:")
        print("-" * 40)
        
        # Categories
        categories = {}
        difficulties = {}
        for strategy in strategies:
            cat = strategy.get('category', 'Unknown')
            diff = strategy.get('difficulty', 'Unknown')
            categories[cat] = categories.get(cat, 0) + 1
            difficulties[diff] = difficulties.get(diff, 0) + 1
        
        print("Categories:")
        for cat, count in categories.items():
            print(f"  • {cat}: {count}")
        
        print("\nDifficulties:")
        for diff, count in difficulties.items():
            print(f"  • {diff}: {count}")
        
        # Average metrics
        avg_performance = sum(s['performance'] for s in strategies) / len(strategies)
        avg_sharpe = sum(s['sharpe'] for s in strategies) / len(strategies)
        avg_rating = sum(s['rating'] for s in strategies) / len(strategies)
        
        print(f"\nAverage Metrics:")
        print(f"  • Performance: {avg_performance:.1f}%")
        print(f"  • Sharpe Ratio: {avg_sharpe:.2f}")
        print(f"  • Rating: {avg_rating:.1f}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error viewing database: {str(e)}")

async def delete_all_strategies():
    """Delete all strategies from the database"""
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    if not mongodb_uri:
        print("❌ MONGODB_URI environment variable is not set")
        return
    
    try:
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[database_name]
        collection = db["strategies"]
        
        result = await collection.delete_many({})
        print(f"🗑️  Deleted {result.deleted_count} strategies from the database")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error deleting strategies: {str(e)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "delete":
        print("🗑️  Deleting all strategies...")
        asyncio.run(delete_all_strategies())
    else:
        print("📊 Viewing database contents...")
        asyncio.run(view_database()) 