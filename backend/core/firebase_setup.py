#!/usr/bin/env python3
"""
Centralized Firebase Configuration and Setup Module

This module provides a single, standardized way to initialize Firebase
and handle environment configuration across all scripts.

Key Features:
- Automatic path resolution for Firebase service account
- Environment variable standardization
- Centralized Firebase initialization
- Error handling and validation
- Support for different database backends (MongoDB, File, Mock)
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Literal
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_PROJECT_ID = "microproject2-7ac7e"
DEFAULT_SERVICE_ACCOUNT_FILENAME = "firebase-service-account.json"
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Jijo@2003"
ADMIN_DISPLAY_NAME = "Admin User"

class FirebaseSetup:
    """Centralized Firebase configuration and initialization class."""
    
    def __init__(self):
        """Initialize the FirebaseSetup instance."""
        self._app = None
        self._project_id = None
        self._service_account_path = None
        self._is_initialized = False
    
    def _find_service_account_file(self) -> Optional[str]:
        """
        Find the Firebase service account JSON file using multiple strategies.
        
        Priority order:
        1. GOOGLE_APPLICATION_CREDENTIALS environment variable
        2. firebase-service-account.json in current directory
        3. Backend/firebase-service-account.json (from project root)
        4. ../firebase-service-account.json (if running from Backend)
        
        Returns:
            str: Path to the service account file, or None if not found
        """
        # Strategy 1: Check environment variable
        env_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if env_path and os.path.isfile(env_path):
            logger.info(f"Using Firebase credentials from environment: {env_path}")
            return env_path
        
        # Strategy 2-4: Check common locations
        current_dir = Path.cwd()
        backend_dir = Path(__file__).parent.parent  # Backend directory
        project_root = backend_dir.parent  # Project root
        
        search_paths = [
            current_dir / DEFAULT_SERVICE_ACCOUNT_FILENAME,  # Current directory
            backend_dir / DEFAULT_SERVICE_ACCOUNT_FILENAME,  # Backend directory
            project_root / "Backend" / DEFAULT_SERVICE_ACCOUNT_FILENAME,  # From project root
            project_root / DEFAULT_SERVICE_ACCOUNT_FILENAME,  # Project root
        ]
        
        for path in search_paths:
            if path.exists() and path.is_file():
                logger.info(f"Found Firebase credentials at: {path}")
                return str(path)
        
        logger.warning("Firebase service account file not found in any expected location")
        return None
    
    def _setup_environment_variables(self, service_account_path: str, project_id: str):
        """
        Setup standardized environment variables.
        
        Args:
            service_account_path: Path to the Firebase service account JSON
            project_id: Firebase project ID
        """
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = service_account_path
        os.environ["FIREBASE_PROJECT_ID"] = project_id
        
        logger.info("Environment variables configured:")
        logger.info(f"  GOOGLE_APPLICATION_CREDENTIALS: {service_account_path}")
        logger.info(f"  FIREBASE_PROJECT_ID: {project_id}")
    
    def initialize_firebase(self, 
                          service_account_path: Optional[str] = None,
                          project_id: Optional[str] = None,
                          force_reinit: bool = False) -> bool:
        """
        Initialize Firebase Admin SDK with automatic configuration detection.
        
        Args:
            service_account_path: Optional path to service account JSON
            project_id: Optional Firebase project ID
            force_reinit: Force reinitialization even if already initialized
            
        Returns:
            bool: True if initialization successful, False otherwise
        """
        if self._is_initialized and not force_reinit:
            logger.info("Firebase already initialized")
            return True
        
        if force_reinit and firebase_admin._apps:
            # Delete existing apps to force reinitialization
            for app_name in list(firebase_admin._apps.keys()):
                firebase_admin.delete_app(firebase_admin._apps[app_name])
        
        try:
            # Resolve project ID
            if not project_id:
                project_id = os.getenv("FIREBASE_PROJECT_ID", DEFAULT_PROJECT_ID)
            
            # Initialize Firebase
            if not firebase_admin._apps:
                # Try to get credentials from environment variable first (for production)
                firebase_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
                
                if firebase_json_str:
                    # Parse JSON from environment variable
                    logger.info("Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON environment variable")
                    service_account_info = json.loads(firebase_json_str)
                    cred = credentials.Certificate(service_account_info)
                    self._service_account_path = "env:FIREBASE_SERVICE_ACCOUNT_JSON"
                else:
                    # Fall back to file-based credentials (for local development)
                    if not service_account_path:
                        service_account_path = self._find_service_account_file()
                        if not service_account_path:
                            logger.error("Could not find Firebase service account file or FIREBASE_SERVICE_ACCOUNT_JSON env var")
                            return False
                    
                    logger.info(f"Using Firebase credentials from file: {service_account_path}")
                    cred = credentials.Certificate(service_account_path)
                    self._service_account_path = service_account_path
                    # Setup environment variables for file-based approach
                    self._setup_environment_variables(service_account_path, project_id)
                
                self._app = firebase_admin.initialize_app(
                    cred, 
                    options={"projectId": project_id}
                )
                logger.info(f"✅ Firebase initialized successfully with project: {project_id}")
            else:
                self._app = firebase_admin.get_app()
                logger.info("✅ Using existing Firebase app")
            
            self._project_id = project_id
            self._is_initialized = True
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Firebase initialization failed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def get_firebase_user(self, email: str) -> Optional[fb_auth.UserRecord]:
        """
        Get Firebase user by email.
        
        Args:
            email: User email address
            
        Returns:
            UserRecord or None if user not found
        """
        if not self._is_initialized:
            logger.error("Firebase not initialized")
            return None
        
        try:
            return fb_auth.get_user_by_email(email)
        except fb_auth.UserNotFoundError:
            return None
        except Exception as e:
            logger.error(f"Error fetching user {email}: {e}")
            return None
    
    def create_firebase_user(self, 
                           email: str, 
                           password: str, 
                           display_name: str) -> Optional[fb_auth.UserRecord]:
        """
        Create a new Firebase user.
        
        Args:
            email: User email
            password: User password
            display_name: User display name
            
        Returns:
            UserRecord or None if creation failed
        """
        if not self._is_initialized:
            logger.error("Firebase not initialized")
            return None
        
        try:
            return fb_auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
        except Exception as e:
            logger.error(f"Failed to create user {email}: {e}")
            return None
    
    def get_or_create_admin_user(self) -> Optional[fb_auth.UserRecord]:
        """
        Get existing admin user or create if doesn't exist.
        
        Returns:
            UserRecord for admin user or None if failed
        """
        # Try to get existing user
        user = self.get_firebase_user(ADMIN_EMAIL)
        if user:
            logger.info(f"✅ Admin user exists: {user.uid}")
            return user
        
        # Create new admin user
        user = self.create_firebase_user(ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DISPLAY_NAME)
        if user:
            logger.info(f"✅ Created admin user: {user.uid}")
        
        return user
    
    @property
    def is_initialized(self) -> bool:
        """Check if Firebase is initialized."""
        return self._is_initialized
    
    @property
    def project_id(self) -> Optional[str]:
        """Get the current project ID."""
        return self._project_id
    
    @property
    def service_account_path(self) -> Optional[str]:
        """Get the current service account path."""
        return self._service_account_path

# Global instance for easy access
firebase_setup = FirebaseSetup()

def initialize_firebase(**kwargs) -> bool:
    """
    Convenience function to initialize Firebase using the global instance.
    
    Args:
        **kwargs: Arguments to pass to FirebaseSetup.initialize_firebase()
        
    Returns:
        bool: True if successful, False otherwise
    """
    return firebase_setup.initialize_firebase(**kwargs)

def get_firebase_setup() -> FirebaseSetup:
    """
    Get the global FirebaseSetup instance.
    
    Returns:
        FirebaseSetup: The global instance
    """
    return firebase_setup

def create_admin_user_data(firebase_user: fb_auth.UserRecord) -> Dict[str, Any]:
    """
    Create standardized admin user data dictionary.
    
    Args:
        firebase_user: Firebase UserRecord
        
    Returns:
        Dict containing standardized user data
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    
    return {
        "firebaseUid": firebase_user.uid,
        "uid": firebase_user.uid,  # Keep for backward compatibility
        "email": ADMIN_EMAIL,
        "displayName": ADMIN_DISPLAY_NAME,
        "role": "admin",
        "createdAt": now_iso,
        "lastLogin": now_iso,
    }

def print_setup_success_message(backend_type: str = ""):
    """
    Print standardized success message after setup completion.
    
    Args:
        backend_type: Type of backend being used (MongoDB, File, etc.)
    """
    print(f"\n🎉 {backend_type} admin setup completed!")
    print(f"Admin credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
    print(f"\n📋 Next steps:")
    print(f"1. Start backend: uvicorn main:app --reload --port 8000")
    print(f"2. Start frontend: cd ../frontend && npm run dev")
    print(f"3. Test admin login")

def validate_environment() -> Dict[str, Any]:
    """
    Validate the current environment configuration.
    
    Returns:
        Dict containing validation results
    """
    result = {
        "valid": True,
        "issues": [],
        "recommendations": []
    }
    
    # Check Firebase credentials
    cred_path = firebase_setup._find_service_account_file()
    if not cred_path:
        result["valid"] = False
        result["issues"].append("Firebase service account file not found")
        result["recommendations"].append("Download Firebase service account JSON and place it in the Backend directory")
    
    # Check project ID
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not project_id:
        result["issues"].append("FIREBASE_PROJECT_ID not set")
        result["recommendations"].append("Set FIREBASE_PROJECT_ID environment variable")
    
    return result