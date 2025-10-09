#!/usr/bin/env python3
"""
Firebase Configuration Verification Script
Compares frontend and backend Firebase configurations
"""
import os
import json
from dotenv import load_dotenv

def verify_firebase_config():
    """Verify Firebase configuration consistency"""
    print("🔍 Firebase Configuration Verification")
    print("=" * 50)
    
    # Load backend environment
    load_dotenv()
    
    # Backend Firebase config
    backend_project_id = os.getenv("FIREBASE_PROJECT_ID")
    backend_creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    
    print(f"\n📋 Backend Configuration:")
    print(f"  Project ID: {backend_project_id}")
    print(f"  Credentials Path: {backend_creds_path}")
    
    # Check if credentials file exists
    if backend_creds_path and os.path.isfile(backend_creds_path):
        print(f"  Credentials File: ✅ Exists")
        try:
            with open(backend_creds_path, 'r') as f:
                creds = json.load(f)
            print(f"  Service Account Project: {creds.get('project_id')}")
            print(f"  Client Email: {creds.get('client_email')}")
        except Exception as e:
            print(f"  Credentials File: ❌ Error reading - {e}")
    else:
        print(f"  Credentials File: ❌ Missing or invalid path")
    
    # Frontend Firebase config (from your provided values)
    frontend_config = {
        "apiKey": "AIzaSyDvCeE9-Lz3IagSrnEfzvwfEK3JXysuD-w",
        "authDomain": "microproject2-7ac7e.firebaseapp.com",
        "projectId": "microproject2-7ac7e",
        "storageBucket": "microproject2-7ac7e.firebasestorage.app",
        "messagingSenderId": "896381780535",
        "appId": "1:896381780535:web:85e7026f071ea2b4d2f5b2"
    }
    
    print(f"\n📋 Frontend Configuration:")
    print(f"  Project ID: {frontend_config['projectId']}")
    print(f"  Auth Domain: {frontend_config['authDomain']}")
    print(f"  Storage Bucket: {frontend_config['storageBucket']}")
    print(f"  App ID: {frontend_config['appId']}")
    
    # Compare configurations
    print(f"\n🔍 Configuration Comparison:")
    
    # Project ID comparison
    if backend_project_id == frontend_config['projectId']:
        print(f"  Project ID: ✅ Match ({backend_project_id})")
    else:
        print(f"  Project ID: ❌ Mismatch")
        print(f"    Backend: {backend_project_id}")
        print(f"    Frontend: {frontend_config['projectId']}")
    
    # Check if backend credentials match frontend project
    if backend_creds_path and os.path.isfile(backend_creds_path):
        try:
            with open(backend_creds_path, 'r') as f:
                creds = json.load(f)
            creds_project = creds.get('project_id')
            if creds_project == frontend_config['projectId']:
                print(f"  Service Account Project: ✅ Match ({creds_project})")
            else:
                print(f"  Service Account Project: ❌ Mismatch")
                print(f"    Credentials: {creds_project}")
                print(f"    Frontend: {frontend_config['projectId']}")
        except Exception as e:
            print(f"  Service Account Project: ❌ Error - {e}")
    
    # Summary
    print(f"\n📊 Summary:")
    if backend_project_id == frontend_config['projectId']:
        print(f"  ✅ Backend and Frontend are using the same Firebase project")
        print(f"  ✅ Configuration appears consistent")
    else:
        print(f"  ❌ Backend and Frontend are using different Firebase projects")
        print(f"  ❌ This will cause authentication failures")
    
    return backend_project_id == frontend_config['projectId']

def test_firebase_token_verification():
    """Test if backend can verify Firebase tokens"""
    print(f"\n🧪 Testing Firebase Token Verification")
    print("=" * 50)
    
    try:
        from auth_mongodb import initialize_firebase
        from firebase_admin import auth as fb_auth
        
        # Initialize Firebase
        initialize_firebase()
        print("✅ Firebase Admin SDK initialized")
        
        # Test with a sample token (this will fail but shows if SDK is working)
        try:
            # This will fail with invalid token, but shows SDK is working
            fb_auth.verify_id_token("invalid_token")
        except Exception as e:
            if "Invalid token" in str(e) or "Token expired" in str(e):
                print("✅ Firebase Admin SDK can verify tokens (rejected invalid token as expected)")
            else:
                print(f"❌ Firebase Admin SDK error: {e}")
        
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    # Verify configuration
    config_match = verify_firebase_config()
    
    # Test token verification
    test_firebase_token_verification()
    
    print(f"\n🎯 Next Steps:")
    if config_match:
        print(f"  1. Ensure Backend/.env file exists with correct values")
        print(f"  2. Restart the backend server")
        print(f"  3. Test authentication again")
    else:
        print(f"  1. Fix Firebase project ID mismatch")
        print(f"  2. Update backend credentials to match frontend project")
        print(f"  3. Restart both frontend and backend")

