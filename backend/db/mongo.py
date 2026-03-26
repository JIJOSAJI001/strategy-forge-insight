from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Any
import os
from dotenv import load_dotenv

load_dotenv()

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[Any] = None
    _connected: bool = False

    @classmethod
    @property
    def db(cls):
        """Shorthand property to access database."""
        if cls.database is None:
            raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
        return cls.database

    @classmethod
    async def connect_to_mongo(cls):
        """Create database connection and set up indexes for performance."""
        mongodb_uri = os.getenv("MONGODB_URI")
        database_name = os.getenv("DATABASE_NAME", "strategy_forge")
        
        if mongodb_uri is None or mongodb_uri == "":
            raise ValueError("MONGODB_URI environment variable is not set")
        
        cls.client = AsyncIOMotorClient(mongodb_uri)
        cls.database = cls.client[database_name]
        cls._connected = True
        print("Connected to MongoDB.")
        
        # Test the connection
        try:
            await cls.database.command("ping")
            print("MongoDB connection verified.")
        except Exception as e:
            print(f"MongoDB connection test failed: {e}")
            cls._connected = False
            raise
        
        # Create indexes for performance optimization
        try:
            print("Creating database indexes...")
            
            # Indexes for backtests collection
            await cls.database["backtests"].create_index([("user_id", 1), ("created_at", -1)])
            await cls.database["backtests"].create_index([("user_id", 1), ("metrics.total_return", -1)])
            await cls.database["backtests"].create_index([("user_id", 1)])
            
            # Indexes for strategies collection (simple strategies)
            await cls.database["strategies"].create_index([("author", 1)])
            await cls.database["strategies"].create_index([("visibility", 1)])
            await cls.database["strategies"].create_index([("author", 1), ("visibility", 1)])
            await cls.database["strategies"].create_index([("author", 1), ("createdAt", -1)])
            
            # Indexes for drag_drop_strategies collection
            await cls.database["drag_drop_strategies"].create_index([("ownerId", 1)])
            await cls.database["drag_drop_strategies"].create_index([("visibility", 1)])
            await cls.database["drag_drop_strategies"].create_index([("ownerId", 1), ("visibility", 1)])
            await cls.database["drag_drop_strategies"].create_index([("ownerId", 1), ("createdAt", -1)])
            
            # Indexes for users collection
            await cls.database["users"].create_index([("uid", 1)], unique=True)
            await cls.database["users"].create_index([("firebaseUid", 1)], unique=True)
            await cls.database["users"].create_index([("email", 1)])
            
            print("Database indexes created successfully")
        except Exception as e:
            print(f"Index creation warning: {e}")
            # Don't fail startup if indexes already exist

    @classmethod
    async def close_mongo_connection(cls):
        """Close database connection."""
        if cls.client:
            cls.client.close()
            cls._connected = False
            print("Disconnected from MongoDB.")

    @classmethod
    def get_collection(cls, collection_name: str):
        """Get collection from database."""
        if cls.database is None:
            raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
        return cls.database[collection_name] 
