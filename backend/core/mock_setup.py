#!/usr/bin/env python3
"""
Mock Database Admin Setup Module

This module provides mock database admin user setup functionality
using the centralized Firebase configuration system.
"""

import json
import logging
from typing import Dict, Any

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

class MockAdminSetup:
    """Mock database admin setup functionality."""
    
    def __init__(self, mock_file: str = "mock_users.json"):
        """
        Initialize mock admin setup.
        
        Args:
            mock_file: Path to the mock users JSON file
        """
        self.mock_file = mock_file
    
    def create_mock_admin_user(self) -> bool:
        """
        Create admin user in mock database.
        
        Returns:
            bool: True if successful, False otherwise
        """
        # Get or create Firebase admin user
        firebase_user = firebase_setup.get_or_create_admin_user()
        if not firebase_user:
            logger.error("Failed to get/create Firebase admin user")
            return False
        
        try:
            # Create standardized user data
            admin_data = create_admin_user_data(firebase_user)
            
            # Create mock database structure
            mock_data = {
                "users": [admin_data]
            }
            
            # Save to mock file
            with open(self.mock_file, 'w') as f:
                json.dump(mock_data, f, indent=2)
            
            logger.info(f"✅ Created mock user database: {self.mock_file}")
            logger.info("✅ Admin user verified:")
            logger.info(f"   Firebase UID: {admin_data.get('firebaseUid')}")
            logger.info(f"   Email: {admin_data.get('email')}")
            logger.info(f"   Role: {admin_data.get('role')}")
            logger.info(f"   Display Name: {admin_data.get('displayName')}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Mock admin setup failed: {e}")
            return False

def setup_admin_mock(mock_file: str = "mock_users.json") -> bool:
    """
    Main function to set up admin user with mock database.
    
    Args:
        mock_file: Path to the mock users JSON file
        
    Returns:
        bool: True if successful, False otherwise
    """
    print("🔥 Setting up Admin User with Mock Database")
    print("=" * 50)
    
    try:
        # Initialize Firebase
        if not firebase_setup.initialize_firebase():
            logger.error("Failed to initialize Firebase")
            return False
        
        # Setup mock admin
        mock_setup = MockAdminSetup(mock_file)
        if not mock_setup.create_mock_admin_user():
            logger.error("Failed to create mock admin user")
            return False
        
        print_setup_success_message("Mock database")
        return True
        
    except Exception as e:
        logger.error(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    setup_admin_mock()