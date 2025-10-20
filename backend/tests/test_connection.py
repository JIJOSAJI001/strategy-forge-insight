"""
Test MongoDB connection and list strategies
"""
import asyncio
import motor.motor_asyncio
from dotenv import load_dotenv
import os

load_dotenv()

async def test_connection():
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv("MONGODB_URI")
        print(f"MongoDB URI: {mongodb_uri[:50]}..." if mongodb_uri else "Not found")
        
        if not mongodb_uri:
            print("❌ MONGODB_URI not found in .env file")
            return
        
        # Create connection
        client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_uri)
        db = client.strategy_forge
        collection = db.strategies
        
        print("✅ Connected to MongoDB")
        
        # Count documents
        count = await collection.count_documents({})
        print(f"📊 Found {count} strategies in database")
        
        # List first few strategies
        if count > 0:
            print("\n📋 Sample strategies:")
            async for strategy in collection.find().limit(3):
                print(f"  - {strategy.get('title', 'Untitled')}")
        else:
            print("\n⚠️  No strategies found in database")
            print("   You may need to add sample data")
        
        client.close()
        print("\n✅ Connection test complete")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
