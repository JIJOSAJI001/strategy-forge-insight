import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_simple_connection():
    """Test simple MongoDB connection without any class"""
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    print(f"Testing simple MongoDB connection...")
    print(f"URI: {mongodb_uri[:50] if mongodb_uri else 'None'}...")
    print(f"Database: {database_name}")
    
    try:
        # Create connection
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[database_name]
        collection = db["strategies"]
        
        print("✅ Connected to MongoDB")
        
        # Test collection access
        count = await collection.count_documents({})
        print(f"✅ Collection access successful - Found {count} documents")
        
        # Test fetching documents
        strategies = []
        async for strategy in collection.find():
            strategy["_id"] = str(strategy["_id"])
            strategies.append(strategy)
        
        print(f"✅ Fetched {len(strategies)} strategies successfully")
        
        if strategies:
            print(f"📋 First strategy: {strategies[0]['title']}")
        
        client.close()
        return strategies
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")
        print(f"Error type: {type(e)}")
        return None

if __name__ == "__main__":
    result = asyncio.run(test_simple_connection())
    if result:
        print(f"🎉 Success! Retrieved {len(result)} strategies")
    else:
        print("❌ Failed to retrieve strategies") 