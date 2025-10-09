#!/usr/bin/env python3
"""
Mock Admin Setup Script (DEPRECATED)

⚠️  DEPRECATION NOTICE:
This script has been replaced by the unified setup system.

Please use instead:
    python unified_setup.py mock

Or import and use the new modules:
    from core.mock_setup import setup_admin_mock
"""

import warnings
from core.mock_setup import setup_admin_mock as new_setup_admin_mock

def setup_admin():
    """Deprecated function - redirects to new unified setup."""
    warnings.warn(
        "setup_admin_mock.py is deprecated. Use 'python unified_setup.py mock' instead.",
        DeprecationWarning,
        stacklevel=2
    )
    
    print("⚠️  DEPRECATION WARNING:")
    print("This script is deprecated. Please use the new unified setup:")
    print("   python unified_setup.py mock")
    print("\nProceeding with legacy compatibility...")
    print("=" * 60)
    
    return new_setup_admin_mock()

if __name__ == "__main__":
    setup_admin()