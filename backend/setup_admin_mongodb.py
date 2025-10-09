#!/usr/bin/env python3
"""
MongoDB Admin Setup Script (DEPRECATED)

⚠️  DEPRECATION NOTICE:
This script has been replaced by the unified setup system.

Please use instead:
    python unified_setup.py mongodb

Or import and use the new modules:
    from core.mongodb_setup import setup_admin_mongodb
"""

import asyncio
import warnings
from core.mongodb_setup import setup_admin_mongodb as new_setup_admin_mongodb

def setup_admin_mongodb():
    """Deprecated function - redirects to new unified setup."""
    warnings.warn(
        "setup_admin_mongodb.py is deprecated. Use 'python unified_setup.py mongodb' instead.",
        DeprecationWarning,
        stacklevel=2
    )
    
    print("⚠️  DEPRECATION WARNING:")
    print("This script is deprecated. Please use the new unified setup:")
    print("   python unified_setup.py mongodb")
    print("\nProceeding with legacy compatibility...")
    print("=" * 60)
    
    return asyncio.run(new_setup_admin_mongodb())

if __name__ == "__main__":
    asyncio.run(setup_admin_mongodb())