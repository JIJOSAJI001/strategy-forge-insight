#!/usr/bin/env python3
"""
Firebase Service Account Diagnostic Script
Compares service account files and shows detailed Firebase info
"""
import os
import json
from dotenv import load_dotenv

def compare_service_accounts():
    """Compare service account files"""
    print("🔍 Firebase Service Account Analysis")
    print("=" * 60)
    
    # Load environment
    load_dotenv()
    
    # Backend service account
    backend_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "Backend/firebase-service-account.json")
    downloads_path = r"c:\Users\user\Downloads\microproject2-7ac7e-firebase-adminsdk-fbsvc-3f5ed6f468.json"
    
    print(f"\n📋 Service Account Files:")
    print(f"  Backend: {backend_path}")
    print(f"  Downloads: {downloads_path}")
    
    # Read backend service account
    if os.path.isfile(backend_path):
        with open(backend_path, 'r') as f:
            backend_creds = json.load(f)
        print(f"\n🔧 Backend Service Account:")
        print(f"  Project ID: {backend_creds.get('project_id')}")
        print(f"  Private Key ID: {backend_creds.get('private_key_id')}")
        print(f"  Client Email: {backend_creds.get('client_email')}")
        print(f"  Client ID: {backend_creds.get('client_id')}")
    else:
        print(f"\n❌ Backend service account not found at: {backend_path}")
        return
    
    # Read downloads service account
    if os.path.isfile(downloads_path):
        with open(downloads_path, 'r') as f:
            downloads_creds = json.load(f)
        print(f"\n📥 Downloads Service Account:")
        print(f"  Project ID: {downloads_creds.get('project_id')}")
        print(f"  Private Key ID: {downloads_creds.get('private_key_id')}")
        print(f"  Client Email: {downloads_creds.get('client_email')}")
        print(f"  Client ID: {downloads_creds.get('client_id')}")
    else:
        print(f"\n❌ Downloads service account not found at: {downloads_path}")
        return
    
    # Compare
    print(f"\n🔍 Comparison:")
    
    # Project ID
    if backend_creds.get('project_id') == downloads_creds.get('project_id'):
        print(f"  Project ID: ✅ Match ({backend_creds.get('project_id')})")
    else:
        print(f"  Project ID: ❌ Mismatch")
        print(f"    Backend: {backend_creds.get('project_id')}")
        print(f"    Downloads: {downloads_creds.get('project_id')}")
    
    # Private Key ID
    if backend_creds.get('private_key_id') == downloads_creds.get('private_key_id'):
        print(f"  Private Key ID: ✅ Match")
    else:
        print(f"  Private Key ID: ❌ DIFFERENT")
        print(f"    Backend: {backend_creds.get('private_key_id')}")
        print(f"    Downloads: {downloads_creds.get('private_key_id')}")
    
    # Client Email
    if backend_creds.get('client_email') == downloads_creds.get('client_email'):
        print(f"  Client Email: ✅ Match")
    else:
        print(f"  Client Email: ❌ Mismatch")
        print(f"    Backend: {backend_creds.get('client_email')}")
        print(f"    Downloads: {downloads_creds.get('client_email')}")
    
    # Client ID
    if backend_creds.get('client_id') == downloads_creds.get('client_id'):
        print(f"  Client ID: ✅ Match")
    else:
        print(f"  Client ID: ❌ Mismatch")
        print(f"    Backend: {backend_creds.get('client_id')}")
        print(f"    Downloads: {downloads_creds.get('client_id')}")
    
    # Summary
    print(f"\n📊 Summary:")
    if backend_creds.get('private_key_id') != downloads_creds.get('private_key_id'):
        print(f"  ❌ CRITICAL: Different private keys detected!")
        print(f"  ❌ Backend is using an OLD service account key")
        print(f"  ❌ Frontend tokens are generated with NEW key")
        print(f"  ✅ SOLUTION: Replace backend service account with downloads version")
        return False
    else:
        print(f"  ✅ Service accounts match")
        return True

def test_firebase_admin():
    """Test Firebase Admin SDK initialization"""
    print(f"\n🧪 Testing Firebase Admin SDK")
    print("=" * 40)
    
    try:
        from auth_mongodb import initialize_firebase
        from firebase_admin import auth as fb_auth
        
        print("Initializing Firebase Admin SDK...")
        initialize_firebase()
        print("✅ Firebase Admin SDK initialized successfully")
        
        # Test with invalid token to see error message
        try:
            fb_auth.verify_id_token("invalid_token_test")
        except Exception as e:
            print(f"✅ Token verification working (rejected invalid token)")
            print(f"   Error message: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Firebase Admin SDK failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Compare service accounts
    accounts_match = compare_service_accounts()
    
    # Test Firebase Admin SDK
    sdk_works = test_firebase_admin()
    
    print(f"\n🎯 Diagnosis Complete:")
    if not accounts_match:
        print(f"  🔴 PROBLEM: Service account mismatch")
        print(f"  📋 SOLUTION:")
        print(f"     1. Copy the Downloads service account file")
        print(f"     2. Replace Backend/firebase-service-account.json")
        print(f"     3. Restart the backend server")
        print(f"     4. Test authentication again")
    else:
        print(f"  ✅ Service accounts match - investigating other causes...")



