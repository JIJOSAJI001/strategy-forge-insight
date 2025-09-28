#!/usr/bin/env python3
"""
Test the /api/users/me endpoint
"""

import requests
import json

def test_users_me():
    print("🧪 Testing /api/users/me endpoint")
    print("=" * 40)
    
    # Test without token (should fail)
    try:
        response = requests.get("http://localhost:8000/api/users/me")
        print(f"❌ No token test: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ No token test failed: {e}")
    
    print("\n📋 Manual Test Instructions:")
    print("1. Start frontend: cd frontend && npm run dev")
    print("2. Login with: admin@gmail.com / Jijo@2003")
    print("3. Check browser console for role fetch logs")
    print("4. Should redirect to /admin-dashboard")
    print("\n🔍 Expected /api/users/me response:")
    print(json.dumps({
        "uid": "MIBjRMNkuUZ3m431UyBclGnpuWi1",
        "firebaseUid": "MIBjRMNkuUZ3m431UyBclGnpuWi1", 
        "email": "admin@gmail.com",
        "displayName": "Admin User",
        "role": "admin"
    }, indent=2))

if __name__ == "__main__":
    test_users_me()