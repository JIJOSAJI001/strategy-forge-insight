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
    async def connect_to_mongo(cls):
        """Create database connection."""
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