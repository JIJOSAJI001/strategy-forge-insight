#!/usr/bin/env python3
"""
Unified Admin Setup Script

This is the single, consolidated setup script that can handle all backend types:
- MongoDB
- File-based
- Mock database

Usage:
    python unified_setup.py [backend_type]
    
    backend_type: mongodb, file, mock (default: mongodb)

Examples:
    python unified_setup.py mongodb
    python unified_setup.py file
    python unified_setup.py mock
"""

import sys
import asyncio
import argparse
import logging
from typing import Literal

from core.firebase_setup import firebase_setup, validate_environment
from core.mongodb_setup import setup_admin_mongodb
from core.file_setup import setup_admin_file
from core.mock_setup import setup_admin_mock

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

BackendType = Literal["mongodb", "file", "mock"]

class UnifiedSetup:
    """Unified setup handler for all backend types."""
    
    def __init__(self):
        """Initialize unified setup."""
        self.backend_handlers = {
            "mongodb": self._setup_mongodb,
            "file": self._setup_file,
            "mock": self._setup_mock
        }
    
    async def _setup_mongodb(self) -> bool:
        """Setup MongoDB backend."""
        return await setup_admin_mongodb()
    
    async def _setup_file(self) -> bool:
        """Setup file-based backend."""
        return setup_admin_file()
    
    async def _setup_mock(self) -> bool:
        """Setup mock database backend."""
        return setup_admin_mock()
    
    def validate_environment_setup(self) -> bool:
        """
        Validate the environment before setup.
        
        Returns:
            bool: True if environment is valid, False otherwise
        """
        print("🔍 Validating environment...")
        print("=" * 40)
        
        validation = validate_environment()
        
        if validation["valid"]:
            print("✅ Environment validation passed")
            return True
        
        print("❌ Environment validation failed:")
        for issue in validation["issues"]:
            print(f"   • {issue}")
        
        if validation["recommendations"]:
            print("\n📋 Recommendations:")
            for rec in validation["recommendations"]:
                print(f"   • {rec}")
        
        return False
    
    async def setup_backend(self, backend_type: BackendType) -> bool:
        """
        Setup admin user for the specified backend type.
        
        Args:
            backend_type: Type of backend to setup
            
        Returns:
            bool: True if successful, False otherwise
        """
        if backend_type not in self.backend_handlers:
            logger.error(f"❌ Unknown backend type: {backend_type}")
            logger.info(f"Available types: {list(self.backend_handlers.keys())}")
            return False
        
        # Validate environment first
        if not self.validate_environment_setup():
            logger.error("❌ Environment validation failed. Please fix issues before proceeding.")
            return False
        
        print(f"\n🚀 Starting {backend_type.upper()} setup...")
        print("=" * 50)
        
        try:
            handler = self.backend_handlers[backend_type]
            success = await handler()
            
            if success:
                print(f"\n🎯 {backend_type.upper()} setup completed successfully!")
                self._print_next_steps(backend_type)
            else:
                print(f"\n❌ {backend_type.upper()} setup failed!")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Unexpected error during {backend_type} setup: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _print_next_steps(self, backend_type: BackendType):
        """Print backend-specific next steps."""
        print("\n📋 Next Steps:")
        print("=" * 20)
        
        if backend_type == "mongodb":
            print("1. Ensure MongoDB is running (mongod)")
            print("2. Update main.py to use auth_mongodb.py")
            
        elif backend_type == "file":
            print("1. Update main.py to use auth_file.py")
            print("2. Ensure users.json file permissions are correct")
            
        elif backend_type == "mock":
            print("1. Update main.py to use mock authentication")
            print("2. Use mock_users.json for testing")
        
        print("\nGeneral steps:")
        print("3. Start backend: uvicorn main:app --reload --port 8000")
        print("4. Start frontend: cd ../frontend && npm run dev")
        print("5. Test admin login at http://localhost:3000")
        print("6. Should redirect to /admin-dashboard after login")

def main():
    """Main entry point for the unified setup script."""
    parser = argparse.ArgumentParser(
        description="Unified admin setup script for Strategy Forge Insight",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python unified_setup.py mongodb    # Setup with MongoDB backend
  python unified_setup.py file       # Setup with file-based backend  
  python unified_setup.py mock       # Setup with mock database backend
        """
    )
    
    parser.add_argument(
        "backend",
        nargs="?",
        choices=["mongodb", "file", "mock"],
        default="mongodb",
        help="Backend type to setup (default: mongodb)"
    )
    
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate environment without setting up"
    )
    
    args = parser.parse_args()
    
    print("🔥 Strategy Forge Insight - Unified Admin Setup")
    print("=" * 60)
    print(f"Backend Type: {args.backend.upper()}")
    print("=" * 60)
    
    setup = UnifiedSetup()
    
    if args.validate_only:
        success = setup.validate_environment_setup()
        sys.exit(0 if success else 1)
    
    # Run async setup
    success = asyncio.run(setup.setup_backend(args.backend))
    
    if success:
        print(f"\n🎉 SUCCESS: {args.backend.upper()} admin setup completed!")
    else:
        print(f"\n💥 FAILED: {args.backend.upper()} admin setup failed!")
        print("\nTroubleshooting:")
        print("• Check Firebase service account file exists")
        print("• Verify environment variables are set correctly")
        print("• Ensure database service is running (if applicable)")
        print("• Run with --validate-only flag to check environment")
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()