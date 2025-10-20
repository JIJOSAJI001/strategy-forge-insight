#!/usr/bin/env python3
"""
Comprehensive MongoDB Data Checker
Checks all collections: strategies, users, backtests
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pprint import pprint
from datetime import datetime

load_dotenv()

async def check_all_collections():
    """Check all MongoDB collections for data"""
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    if not mongodb_uri:
        print("❌ MONGODB_URI environment variable is not set")
        return
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[database_name]
        
        print(f"🔍 Checking MongoDB Database: {database_name}")
        print("=" * 60)
        
        # List all collections
        collections = await db.list_collection_names()
        print(f"📋 Available collections: {collections}")
        print()
        
        # Check each collection
        for collection_name in collections:
            await check_collection(db, collection_name)
        
        # Check specific collections we care about
        await check_strategies_collection(db)
        await check_users_collection(db)
        await check_backtests_collection(db)
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        import traceback
        traceback.print_exc()

async def check_collection(db, collection_name):
    """Check a specific collection"""
    try:
        collection = db[collection_name]
        count = await collection.count_documents({})
        print(f"📊 Collection '{collection_name}': {count} documents")
        
        if count > 0:
            # Show first document structure
            first_doc = await collection.find_one()
            print(f"   Sample fields: {list(first_doc.keys())}")
            
    except Exception as e:
        print(f"❌ Error checking collection {collection_name}: {e}")

async def check_strategies_collection(db):
    """Detailed check of strategies collection"""
    print("\n🎯 STRATEGIES COLLECTION")
    print("-" * 40)
    
    try:
        strategies = db["strategies"]
        count = await strategies.count_documents({})
        print(f"Total strategies: {count}")
        
        if count > 0:
            # Get sample strategy
            strategy = await strategies.find_one()
            print(f"\n📋 Sample Strategy:")
            print(f"  Title: {strategy.get('title', 'N/A')}")
            print(f"  ID: {strategy.get('_id')}")
            print(f"  Performance: {strategy.get('performance', 'N/A')}%")
            print(f"  Sharpe: {strategy.get('sharpe', 'N/A')}")
            print(f"  Category: {strategy.get('category', 'N/A')}")
            print(f"  Tags: {strategy.get('tags', [])}")
            
            # Check for JSON strategy definitions
            json_strategies = await strategies.count_documents({"strategy": {"$exists": True}})
            print(f"\n📈 JSON Strategy Definitions: {json_strategies}")
            
            # Show all strategy titles
            print(f"\n📝 All Strategy Titles:")
            async for strategy in strategies.find({}, {"title": 1, "_id": 1}):
                print(f"  • {strategy.get('title', 'Untitled')} (ID: {strategy.get('_id')})")
                
    except Exception as e:
        print(f"❌ Error checking strategies: {e}")

async def check_users_collection(db):
    """Detailed check of users collection"""
    print("\n👥 USERS COLLECTION")
    print("-" * 40)
    
    try:
        users = db["users"]
        count = await users.count_documents({})
        print(f"Total users: {count}")
        
        if count > 0:
            # Get sample user
            user = await users.find_one()
            print(f"\n👤 Sample User:")
            print(f"  UID: {user.get('uid', 'N/A')}")
            print(f"  Email: {user.get('email', 'N/A')}")
            print(f"  Role: {user.get('role', 'N/A')}")
            print(f"  Display Name: {user.get('displayName', 'N/A')}")
            print(f"  Created: {user.get('createdAt', 'N/A')}")
            print(f"  Last Login: {user.get('lastLogin', 'N/A')}")
            
            # Count by role
            admin_count = await users.count_documents({"role": "admin"})
            retail_count = await users.count_documents({"role": "retail"})
            print(f"\n📊 User Roles:")
            print(f"  Admin users: {admin_count}")
            print(f"  Retail users: {retail_count}")
            
            # Show all users
            print(f"\n👥 All Users:")
            async for user in users.find({}, {"email": 1, "role": 1, "uid": 1}):
                print(f"  • {user.get('email', 'No email')} | Role: {user.get('role', 'No role')} | UID: {user.get('uid', 'No UID')}")
                
    except Exception as e:
        print(f"❌ Error checking users: {e}")

async def check_backtests_collection(db):
    """Detailed check of backtests collection"""
    print("\n⚡ BACKTESTS COLLECTION")
    print("-" * 40)
    
    try:
        backtests = db["backtests"]
        count = await backtests.count_documents({})
        print(f"Total backtests: {count}")
        
        if count > 0:
            # Get sample backtest
            backtest = await backtests.find_one()
            print(f"\n📊 Sample Backtest:")
            print(f"  Symbol: {backtest.get('symbol', 'N/A')}")
            print(f"  Timeframe: {backtest.get('timeframe', 'N/A')}")
            print(f"  Rows: {backtest.get('rows', 'N/A')}")
            print(f"  Requested At: {backtest.get('requested_at', 'N/A')}")
            
            # Show metrics if available
            metrics = backtest.get('metrics', {})
            if metrics:
                print(f"  Metrics: {metrics}")
                
            # Show all backtests
            print(f"\n⚡ All Backtests:")
            async for backtest in backtests.find({}, {"symbol": 1, "timeframe": 1, "requested_at": 1}):
                print(f"  • {backtest.get('symbol', 'N/A')} ({backtest.get('timeframe', 'N/A')}) - {backtest.get('requested_at', 'N/A')}")
                
    except Exception as e:
        print(f"❌ Error checking backtests: {e}")

async def test_data_insertion():
    """Test inserting sample data to verify write operations"""
    print("\n🧪 TESTING DATA INSERTION")
    print("-" * 40)
    
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    try:
        client = AsyncIOMotorClient(mongodb_uri)
        db = client[database_name]
        
        # Test strategy insertion
        test_strategy = {
            "title": "Test Strategy",
            "description": "This is a test strategy to verify MongoDB write operations",
            "performance": 15.5,
            "sharpe": 1.2,
            "drawdown": 5.0,
            "winrate": 65.0,
            "tags": ["test", "verification"],
            "downloads": 0,
            "rating": 4.0,
            "category": "test",
            "difficulty": "beginner",
            "author": "system",
            "lastUpdated": datetime.utcnow().isoformat(),
            "status": "test"
        }
        
        strategies = db["strategies"]
        result = await strategies.insert_one(test_strategy)
        print(f"✅ Test strategy inserted with ID: {result.inserted_id}")
        
        # Verify insertion
        inserted = await strategies.find_one({"_id": result.inserted_id})
        if inserted:
            print(f"✅ Verification successful: {inserted['title']}")
            
            # Clean up test data
            await strategies.delete_one({"_id": result.inserted_id})
            print(f"🧹 Test data cleaned up")
        else:
            print(f"❌ Verification failed: Could not find inserted document")
            
        client.close()
        
    except Exception as e:
        print(f"❌ Error testing data insertion: {e}")

if __name__ == "__main__":
    print("🔍 MongoDB Data Checker")
    print("=" * 60)
    
    # Check all collections
    asyncio.run(check_all_collections())
    
    # Test data insertion
    asyncio.run(test_data_insertion())
    
    print("\n✅ Data check complete!")



