#!/usr/bin/env python3
"""
MongoDB Admin Setup Module

This module provides MongoDB-specific admin user setup functionality
using the centralized Firebase configuration system.
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from core.firebase_setup import (
    firebase_setup, 
    create_admin_user_data, 
    print_setup_success_message,
    ADMIN_EMAIL, 
    ADMIN_PASSWORD, 
    ADMIN_DISPLAY_NAME
)

# Configure logging
logger = logging.getLogger(__name__)

class MongoDBAdminSetup:
    """MongoDB-specific admin setup functionality."""
    
    def __init__(self):
        """Initialize MongoDB admin setup."""
        self.db = None
        self.users_collection = None
    
    async def connect_to_mongodb(self) -> bool:
        """
        Connect to MongoDB using the db.mongo module.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            from db.mongo import MongoDB
            await MongoDB.connect_to_mongo()
            self.db = MongoDB
            self.users_collection = MongoDB.get_collection("users")
            logger.info("✅ MongoDB connected")
            return True
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            return False
    
    async def create_or_update_admin_user(self) -> bool:
        """
        Create or update admin user in MongoDB.
        
        Returns:
            bool: True if successful, False otherwise
        """
        if self.users_collection is None:
            logger.error("MongoDB not connected")
            return False
        
        # Get or create Firebase admin user
        firebase_user = firebase_setup.get_or_create_admin_user()
        if not firebase_user:
            logger.error("Failed to get/create Firebase admin user")
            return False
        
        try:
            # Check if user exists in MongoDB
            existing_user = await self.users_collection.find_one(
                {"firebaseUid": firebase_user.uid}
            )
            
            # Create standardized user data
            admin_data = create_admin_user_data(firebase_user)
            
            if existing_user:
                # Update existing user to admin
                await self.users_collection.update_one(
                    {"firebaseUid": firebase_user.uid}, 
                    {"$set": admin_data}
                )
                logger.info("✅ Updated existing user to admin role")
            else:
                # Create new admin user
                await self.users_collection.insert_one(admin_data)
                logger.info("✅ Created admin user in MongoDB")
            
            # Verify admin user
            admin_user = await self.users_collection.find_one(
                {"firebaseUid": firebase_user.uid}
            )
            
            if admin_user:
                logger.info("✅ Admin user verified:")
                logger.info(f"   Firebase UID: {admin_user.get('firebaseUid')}")
                logger.info(f"   Email: {admin_user.get('email')}")
                logger.info(f"   Role: {admin_user.get('role')}")
                logger.info(f"   Display Name: {admin_user.get('displayName')}")
                return True
            else:
                logger.error("❌ Failed to verify admin user in MongoDB")
                return False
                
        except Exception as e:
            logger.error(f"❌ MongoDB admin setup failed: {e}")
            return False
    
    async def cleanup(self):
        """Clean up MongoDB connections."""
        if self.db:
            try:
                await self.db.close_mongo_connection()
                logger.info("MongoDB connection closed")
            except Exception as e:
                logger.warning(f"Error closing MongoDB connection: {e}")

async def setup_admin_mongodb() -> bool:
    """
    Main function to set up admin user with MongoDB backend.
    
    Returns:
        bool: True if successful, False otherwise
    """
    print("🔥 Setting up Admin User with MongoDB")
    print("=" * 50)
    
    mongo_setup = MongoDBAdminSetup()
    success = False
    
    try:
        # Initialize Firebase
        if not firebase_setup.initialize_firebase():
            logger.error("Failed to initialize Firebase")
            return False
        
        # Connect to MongoDB
        if not await mongo_setup.connect_to_mongodb():
            logger.error("Failed to connect to MongoDB")
            return False
        
        # Create/update admin user
        if not await mongo_setup.create_or_update_admin_user():
            logger.error("Failed to create/update admin user")
            return False
        
        print_setup_success_message("MongoDB")
        success = True
        
    except Exception as e:
        logger.error(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await mongo_setup.cleanup()
    
    return success

if __name__ == "__main__":
    asyncio.run(setup_admin_mongodb())