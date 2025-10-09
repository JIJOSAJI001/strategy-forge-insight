#!/usr/bin/env python3
"""
Test script to verify login functionality for admin and retail users
"""

import asyncio
import requests
import json
from firebase_admin import auth as fb_auth
from core.firebase_setup import firebase_setup, ADMIN_EMAIL, ADMIN_PASSWORD

API_BASE_URL = "http://localhost:8000"

def get_firebase_id_token(email: str, password: str) -> str:
    """
    Get Firebase ID token for authentication testing.
    Note: This is a simplified version for testing. In production,
    the frontend would handle Firebase authentication.
    """
    # For testing purposes, we'll create a custom token
    # In real applications, the frontend handles this
    try:
        firebase_setup.initialize_firebase()
        user = fb_auth.get_user_by_email(email)
        # Create a custom token for testing
        custom_token = fb_auth.create_custom_token(user.uid)
        print(f"✅ Created custom token for {email}")
        return custom_token.decode('utf-8')  # Return as string
    except Exception as e:
        print(f"❌ Failed to create token for {email}: {e}")
        return None

def test_authentication():
    """Test the authentication endpoints"""
    print("🔍 Testing authentication...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test 2: Admin authentication
    print("\n2. Testing admin authentication...")
    try:
        # Get admin token
        admin_token = get_firebase_id_token(ADMIN_EMAIL, ADMIN_PASSWORD)
        if not admin_token:
            print("❌ Failed to get admin token")
            return False
        
        # Test /api/users/me endpoint
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{API_BASE_URL}/api/users/me", headers=headers)
        
        print(f"Response status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Admin authentication successful")
            print(f"   User: {user_data.get('email')}")
            print(f"   Role: {user_data.get('role')}")
        else:
            print(f"❌ Admin authentication failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Admin auth test error: {e}")
    
    # Test 3: Create a test retail user and test authentication
    print("\n3. Testing retail user creation and authentication...")
    try:
        # First create a retail user in Firebase
        test_email = "retail@test.com"
        test_password = "TestPass123"
        
        # Try to create test user
        try:
            test_user = fb_auth.create_user(
                email=test_email,
                password=test_password,
                display_name="Test Retail User"
            )
            print(f"✅ Created test retail user: {test_email}")
        except Exception as e:
            # User might already exist
            try:
                test_user = fb_auth.get_user_by_email(test_email)
                print(f"✅ Using existing test retail user: {test_email}")
            except:
                print(f"❌ Failed to create/get test user: {e}")
                return False
        
        # Get token for retail user
        retail_token = get_firebase_id_token(test_email, test_password)
        if not retail_token:
            print("❌ Failed to get retail token")
            return False
        
        # Test retail user authentication
        headers = {"Authorization": f"Bearer {retail_token}"}
        response = requests.get(f"{API_BASE_URL}/api/users/me", headers=headers)
        
        print(f"Response status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            user_data = response.json()
            print(f"✅ Retail authentication successful")
            print(f"   User: {user_data.get('email')}")
            print(f"   Role: {user_data.get('role')}")
        else:
            print(f"❌ Retail authentication failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Retail auth test error: {e}")
    
    return True

def main():
    """Main test function"""
    print("🧪 Strategy Forge Authentication Test")
    print("=" * 60)
    
    test_authentication()
    
    print("\n" + "=" * 60)
    print("🏁 Testing completed!")

if __name__ == "__main__":
    main()