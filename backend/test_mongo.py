import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

async def test_mongo_connection():
    """Test MongoDB connection directly"""
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    print(f"Testing MongoDB connection...")
    print(f"URI: {mongodb_uri[:50]}...")
    print(f"Database: {database_name}")
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[database_name]
        collection = db["strategies"]
        
        print("✅ Connected to MongoDB")
        
        # Test collection access
        count = await collection.count_documents({})
        print(f"✅ Collection access successful - Found {count} documents")
        
        # Test fetching one document
        strategy = await collection.find_one()
        if strategy:
            print(f"✅ Document fetch successful - Title: {strategy.get('title', 'N/A')}")
        else:
            print("❌ No documents found")
        
        client.close()
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_mongo_connection()) 