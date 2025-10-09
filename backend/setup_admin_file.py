#!/usr/bin/env python3
"""
File-Based Admin Setup Script (DEPRECATED)

⚠️  DEPRECATION NOTICE:
This script has been replaced by the unified setup system.

Please use instead:
    python unified_setup.py file

Or import and use the new modules:
    from core.file_setup import setup_admin_file
"""

import warnings
from core.file_setup import setup_admin_file as new_setup_admin_file

def setup_admin_file():
    """Deprecated function - redirects to new unified setup."""
    warnings.warn(
        "setup_admin_file.py is deprecated. Use 'python unified_setup.py file' instead.",
        DeprecationWarning,
        stacklevel=2
    )
    
    print("⚠️  DEPRECATION WARNING:")
    print("This script is deprecated. Please use the new unified setup:")
    print("   python unified_setup.py file")
    print("\nProceeding with legacy compatibility...")
    print("=" * 60)
    
    return new_setup_admin_file()

if __name__ == "__main__":
    setup_admin_file()