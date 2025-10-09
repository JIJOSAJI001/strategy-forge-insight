#!/usr/bin/env python3
"""
Test script for the new consolidated Firebase setup system.
This script verifies that all components work correctly.
"""

import asyncio
import os
import sys
import tempfile
from pathlib import Path

# Add Backend directory to path for imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from core.firebase_setup import firebase_setup, validate_environment
from core.file_setup import setup_admin_file
from core.mock_setup import setup_admin_mock

def test_firebase_setup():
    """Test core Firebase setup functionality."""
    print("🔬 Testing Firebase Setup")
    print("=" * 40)
    
    # Test initialization
    success = firebase_setup.initialize_firebase()
    print(f"✅ Firebase initialization: {'PASS' if success else 'FAIL'}")
    
    # Test properties
    print(f"✅ Is initialized: {firebase_setup.is_initialized}")
    print(f"✅ Project ID: {firebase_setup.project_id}")
    print(f"✅ Service account path: {firebase_setup.service_account_path}")
    
    # Test admin user creation
    admin_user = firebase_setup.get_or_create_admin_user()
    print(f"✅ Admin user: {'PASS' if admin_user else 'FAIL'}")
    if admin_user:
        print(f"   UID: {admin_user.uid}")
        print(f"   Email: {admin_user.email}")
    
    return success and admin_user is not None

def test_environment_validation():
    """Test environment validation functionality."""
    print("\n🔬 Testing Environment Validation")
    print("=" * 40)
    
    validation = validate_environment()
    print(f"✅ Environment valid: {validation['valid']}")
    
    if not validation['valid']:
        print("Issues found:")
        for issue in validation['issues']:
            print(f"   • {issue}")
    
    if validation['recommendations']:
        print("Recommendations:")
        for rec in validation['recommendations']:
            print(f"   • {rec}")
    
    return validation['valid']

def test_mock_setup():
    """Test mock setup functionality."""
    print("\n🔬 Testing Mock Setup")
    print("=" * 40)
    
    # Use temporary file for testing
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        temp_file = f.name
    
    try:
        success = setup_admin_mock(temp_file)
        print(f"✅ Mock setup: {'PASS' if success else 'FAIL'}")
        
        # Verify file was created
        if os.path.exists(temp_file):
            print(f"✅ Mock file created: PASS")
            with open(temp_file, 'r') as f:
                import json
                data = json.load(f)
                has_users = 'users' in data and len(data['users']) > 0
                print(f"✅ Mock data valid: {'PASS' if has_users else 'FAIL'}")
        else:
            print(f"❌ Mock file created: FAIL")
            success = False
            
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.unlink(temp_file)
    
    return success

def test_file_setup():
    """Test file-based setup functionality."""
    print("\n🔬 Testing File Setup")
    print("=" * 40)
    
    # Use temporary file for testing
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        temp_file = f.name
    
    try:
        success = setup_admin_file(temp_file)
        print(f"✅ File setup: {'PASS' if success else 'FAIL'}")
        
        # Verify file was created
        if os.path.exists(temp_file):
            print(f"✅ Users file created: PASS")
            with open(temp_file, 'r') as f:
                import json
                data = json.load(f)
                has_users = 'users' in data and len(data['users']) > 0
                print(f"✅ User data valid: {'PASS' if has_users else 'FAIL'}")
        else:
            print(f"❌ Users file created: FAIL")
            success = False
            
    finally:
        # Clean up temp file
        if os.path.exists(temp_file):
            os.unlink(temp_file)
    
    return success

def main():
    """Run all tests."""
    print("🧪 Firebase Consolidation System Tests")
    print("=" * 60)
    
    tests = [
        ("Environment Validation", test_environment_validation),
        ("Firebase Setup", test_firebase_setup),
        ("Mock Setup", test_mock_setup),
        ("File Setup", test_file_setup),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if result:
                passed += 1
                print(f"\n✅ {test_name}: PASSED")
            else:
                print(f"\n❌ {test_name}: FAILED")
        except Exception as e:
            print(f"\n💥 {test_name}: ERROR - {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The consolidated system is working correctly.")
        return True
    else:
        print("❌ Some tests failed. Please check the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)