#!/usr/bin/env python3
"""
File-Based Admin Setup Module

This module provides file-based admin user setup functionality
using the centralized Firebase configuration system.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional

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

class FileBasedAdminSetup:
    """File-based admin setup functionality."""
    
    def __init__(self, users_file: str = "users.json"):
        """
        Initialize file-based admin setup.
        
        Args:
            users_file: Path to the users JSON file
        """
        self.users_file = users_file
        self.users_data = {"users": []}
    
    def load_users(self) -> bool:
        """
        Load existing users from JSON file.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            if os.path.exists(self.users_file):
                # Check if file is empty
                if os.path.getsize(self.users_file) == 0:
                    logger.info(f"Empty users file found: {self.users_file}")
                    self.users_data = {"users": []}
                else:
                    with open(self.users_file, 'r') as f:
                        content = f.read().strip()
                        if content:
                            self.users_data = json.loads(content)
                            logger.info(f"✅ Loaded existing users from {self.users_file}")
                        else:
                            logger.info(f"Empty content in users file: {self.users_file}")
                            self.users_data = {"users": []}
            else:
                logger.info(f"Creating new users file: {self.users_file}")
                self.users_data = {"users": []}
            
            # Ensure users key exists
            if "users" not in self.users_data:
                self.users_data["users"] = []
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load users file: {e}")
            return False
    
    def save_users(self) -> bool:
        """
        Save users data to JSON file.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with open(self.users_file, 'w') as f:
                json.dump(self.users_data, f, indent=2)
            logger.info(f"✅ Saved users to {self.users_file}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to save users file: {e}")
            return False
    
    def find_user_by_uid(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        """
        Find user by Firebase UID.
        
        Args:
            firebase_uid: Firebase user UID
            
        Returns:
            User data dict or None if not found
        """
        users = self.users_data.get("users", [])
        for user in users:
            if user.get("firebaseUid") == firebase_uid:
                return user
        return None
    
    def create_or_update_admin_user(self) -> bool:
        """
        Create or update admin user in JSON file.
        
        Returns:
            bool: True if successful, False otherwise
        """
        # Get or create Firebase admin user
        firebase_user = firebase_setup.get_or_create_admin_user()
        if not firebase_user:
            logger.error("Failed to get/create Firebase admin user")
            return False
        
        try:
            # Load existing users
            if not self.load_users():
                return False
            
            # Find existing user
            existing_user = self.find_user_by_uid(firebase_user.uid)
            
            # Create standardized user data
            admin_data = create_admin_user_data(firebase_user)
            
            if existing_user:
                # Update existing user to admin
                users = self.users_data["users"]
                for i, user in enumerate(users):
                    if user.get("firebaseUid") == firebase_user.uid:
                        users[i] = admin_data
                        break
                logger.info("✅ Updated existing user to admin role")
            else:
                # Add new admin user
                self.users_data["users"].append(admin_data)
                logger.info("✅ Created admin user in JSON database")
            
            # Save users
            if not self.save_users():
                return False
            
            # Verify admin user
            admin_user = self.find_user_by_uid(firebase_user.uid)
            if admin_user:
                logger.info("✅ Admin user verified:")
                logger.info(f"   Firebase UID: {admin_user.get('firebaseUid')}")
                logger.info(f"   Email: {admin_user.get('email')}")
                logger.info(f"   Role: {admin_user.get('role')}")
                logger.info(f"   Display Name: {admin_user.get('displayName')}")
                return True
            else:
                logger.error("❌ Failed to verify admin user in JSON file")
                return False
                
        except Exception as e:
            logger.error(f"❌ File-based admin setup failed: {e}")
            return False

def setup_admin_file(users_file: str = "users.json") -> bool:
    """
    Main function to set up admin user with file-based backend.
    
    Args:
        users_file: Path to the users JSON file
        
    Returns:
        bool: True if successful, False otherwise
    """
    print("🔥 Setting up Admin User with File Database")
    print("=" * 50)
    
    try:
        # Initialize Firebase
        if not firebase_setup.initialize_firebase():
            logger.error("Failed to initialize Firebase")
            return False
        
        # Setup file-based admin
        file_setup = FileBasedAdminSetup(users_file)
        if not file_setup.create_or_update_admin_user():
            logger.error("Failed to create/update admin user")
            return False
        
        print_setup_success_message("File-based")
        return True
        
    except Exception as e:
        logger.error(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    setup_admin_file()