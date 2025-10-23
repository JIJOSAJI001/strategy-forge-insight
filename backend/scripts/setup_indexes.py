"""
MongoDB Index Setup Script
Creates optimized indexes for market data caching and backtesting
"""
import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


async def setup_indexes():
    """Create indexes for all collections"""
    mongodb_uri = os.getenv("MONGODB_URI")
    database_name = os.getenv("DATABASE_NAME", "strategy_forge")
    
    if not mongodb_uri:
        raise ValueError("MONGODB_URI environment variable is not set")
    
    print("🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client[database_name]
    
    try:
        # Test connection
        await db.command("ping")
        print("✅ Connected to MongoDB")
        
        # ========================================
        # market_data_cache collection
        # ========================================
        print("\n📊 Setting up indexes for market_data_cache...")
        market_data_cache = db["market_data_cache"]
        
        # Compound index: symbol + timeframe (unique)
        await market_data_cache.create_index(
            [("symbol", 1), ("timeframe", 1)],
            unique=True,
            name="idx_symbol_timeframe"
        )
        print("  ✅ Created unique index: symbol + timeframe")
        
        # Index: last_updated (for freshness checks)
        await market_data_cache.create_index(
            [("last_updated", -1)],
            name="idx_last_updated"
        )
        print("  ✅ Created index: last_updated")
        
        # Index: source
        await market_data_cache.create_index(
            [("source", 1)],
            name="idx_source"
        )
        print("  ✅ Created index: source")
        
        # Index for data array timestamps (for range queries)
        # Note: This creates an index on all timestamps in the data array
        await market_data_cache.create_index(
            [("data.timestamp", 1)],
            name="idx_data_timestamp"
        )
        print("  ✅ Created index: data.timestamp")
        
        # ========================================
        # admin_activity_log collection
        # ========================================
        print("\n📝 Setting up indexes for admin_activity_log...")
        admin_activity_log = db["admin_activity_log"]
        
        # Index: timestamp (for recent activity queries)
        await admin_activity_log.create_index(
            [("timestamp", -1)],
            name="idx_timestamp"
        )
        print("  ✅ Created index: timestamp")
        
        # Index: admin_uid (for per-admin activity tracking)
        await admin_activity_log.create_index(
            [("admin_uid", 1)],
            name="idx_admin_uid"
        )
        print("  ✅ Created index: admin_uid")
        
        # Compound index: action + target (for filtered queries)
        await admin_activity_log.create_index(
            [("action", 1), ("target", 1)],
            name="idx_action_target"
        )
        print("  ✅ Created index: action + target")
        
        # ========================================
        # strategies collection
        # ========================================
        print("\n🎯 Setting up indexes for strategies...")
        strategies = db["strategies"]
        
        # Index: user_id / userId (for user's strategies)
        await strategies.create_index(
            [("user_id", 1)],
            name="idx_user_id"
        )
        print("  ✅ Created index: user_id")
        
        # Also index userId for backward compatibility
        await strategies.create_index(
            [("userId", 1)],
            name="idx_userId"
        )
        print("  ✅ Created index: userId")
        
        # Index: is_public / isPublic (for public strategies)
        await strategies.create_index(
            [("is_public", 1)],
            name="idx_is_public"
        )
        print("  ✅ Created index: is_public")
        
        await strategies.create_index(
            [("isPublic", 1)],
            name="idx_isPublic"
        )
        print("  ✅ Created index: isPublic")
        
        # Index: created_at / createdAt (for sorting)
        await strategies.create_index(
            [("created_at", -1)],
            name="idx_created_at"
        )
        print("  ✅ Created index: created_at")
        
        await strategies.create_index(
            [("createdAt", -1)],
            name="idx_createdAt"
        )
        print("  ✅ Created index: createdAt")
        
        # ========================================
        # backtests collection
        # ========================================
        print("\n🧪 Setting up indexes for backtests...")
backtests = db["backtests"]
        
        # Index: user_id (for user's backtests)
        await backtests.create_index(
            [("user_id", 1)],
            name="idx_user_id"
        )
        print("  ✅ Created index: user_id")
        
        # Compound index: user_id + created_at (for sorted user queries)
        await backtests.create_index(
            [("user_id", 1), ("created_at", -1)],
            name="idx_user_created"
        )
        print("  ✅ Created index: user_id + created_at")
        
        # Compound index: user_id + strategy_id (for strategy-specific backtests)
        await backtests.create_index(
            [("user_id", 1), ("strategy_id", 1)],
            name="idx_user_strategy"
        )
        print("  ✅ Created index: user_id + strategy_id")
        
        # Compound index: user_id + symbol (for symbol-specific backtests)
        await backtests.create_index(
            [("user_id", 1), ("symbol", 1)],
            name="idx_user_symbol"
        )
        print("  ✅ Created index: user_id + symbol")
        
        # Index: created_at (for recent backtests)
        await backtests.create_index(
            [("created_at", -1)],
            name="idx_created_at"
        )
        print("  ✅ Created index: created_at")
        
        # ========================================
        # users collection
        # ========================================
        print("\n👥 Setting up indexes for users...")
        users = db["users"]
        
        # Index: firebaseUid (unique, for authentication)
        await users.create_index(
            [("firebaseUid", 1)],
            unique=True,
            name="idx_firebaseUid"
        )
        print("  ✅ Created unique index: firebaseUid")
        
        # Index: email (unique, for lookups)
        await users.create_index(
            [("email", 1)],
            unique=True,
            name="idx_email"
        )
        print("  ✅ Created unique index: email")
        
        # Index: role (for role-based queries)
        await users.create_index(
            [("role", 1)],
            name="idx_role"
        )
        print("  ✅ Created index: role")
        
        # ========================================
        # historical_data collection (existing)
        # ========================================
        print("\n📈 Setting up indexes for historical_data...")
        historical_data = db["historical_data"]
        
        # Compound index: symbol + timeframe (unique)
        await historical_data.create_index(
            [("symbol", 1), ("timeframe", 1)],
            unique=True,
            name="idx_symbol_timeframe"
        )
        print("  ✅ Created unique index: symbol + timeframe")
        
        # Index: last_updated
        await historical_data.create_index(
            [("last_updated", -1)],
            name="idx_last_updated"
        )
        print("  ✅ Created index: last_updated")
        
        print("\n" + "="*60)
        print("✅ All indexes created successfully!")
        print("="*60)
        
        # Print index summary
        print("\n📊 Index Summary:")
        collections = [
            "market_data_cache",
            "admin_activity_log",
            "strategies",
            "backtests",
            "users",
            "historical_data"
        ]
        
        for coll_name in collections:
            coll = db[coll_name]
            indexes = await coll.list_indexes().to_list(length=None)
            print(f"\n  {coll_name}:")
            for idx in indexes:
                print(f"    - {idx['name']}: {idx.get('key', {})}")
        
    except Exception as e:
        print(f"❌ Error setting up indexes: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB")


if __name__ == "__main__":
    print("="*60)
    print("🚀 MongoDB Index Setup")
    print("="*60)
    asyncio.run(setup_indexes())
