#!/usr/bin/env python3
"""
Test CORS functionality
"""

import requests

def test_cors():
    """Test CORS functionality"""
    print("🔍 Testing CORS...")
    print("=" * 40)
    
    base_url = "http://localhost:8000"  # Backend runs on port 8000
    
    # Test 1: Basic health check
    print("\n1. Testing basic health check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
    
    # Test 2: OPTIONS request to /api/users/me
    print("\n2. Testing OPTIONS request to /api/users/me...")
    try:
        headers = {
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization,Content-Type"
        }
        response = requests.options(f"{base_url}/api/users/me", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ OPTIONS request successful")
        else:
            print(f"❌ OPTIONS request failed: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ OPTIONS test error: {e}")
    
    # Test 3: Check CORS headers on regular GET request
    print("\n3. Testing CORS headers on GET request...")
    try:
        headers = {"Origin": "http://localhost:3000"}
        response = requests.get(f"{base_url}/health", headers=headers)
        print(f"Status: {response.status_code}")
        cors_headers = {k: v for k, v in response.headers.items() if 'access-control' in k.lower()}
        print(f"CORS Headers: {cors_headers}")
        
        if 'access-control-allow-origin' in cors_headers:
            print("✅ CORS headers present")
        else:
            print("❌ Missing CORS headers")
            
    except Exception as e:
        print(f"❌ CORS headers test error: {e}")

if __name__ == "__main__":
    test_cors()