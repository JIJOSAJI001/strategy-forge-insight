#!/usr/bin/env python3
"""
Simple Admin Setup with Mock Database
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
from datetime import datetime, timezone

# Set environment variables
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'firebase-service-account.json'
os.environ['FIREBASE_PROJECT_ID'] = 'microproject2-7ac7e'

def setup_admin():
    print("🔥 Setting up Admin User with Mock Database")
    print("=" * 50)
    
    try:
        # Initialize Firebase
        if not firebase_admin._apps:
            cred = credentials.Certificate('firebase-service-account.json')
            firebase_admin.initialize_app(cred, options={"projectId": "microproject2-7ac7e"})
        print("✅ Firebase initialized")
        
        # Get admin user from Firebase
        ADMIN_EMAIL = "admin@gmail.com"
        try:
            fb_user = fb_auth.get_user_by_email(ADMIN_EMAIL)
            print(f"✅ Admin user exists: {fb_user.uid}")
        except Exception as e:
            print(f"❌ Admin user not found: {e}")
            return False
        
        # Create mock user database with admin user
        now_iso = datetime.now(timezone.utc).isoformat()
        mock_users = {
            "users": [
                {
                    "uid": fb_user.uid,
                    "email": ADMIN_EMAIL,
                    "displayName": "Admin User",
                    "role": "admin",
                    "createdAt": now_iso,
                    "lastLogin": now_iso
                }
            ]
        }
        
        # Save to JSON file
        with open('mock_users.json', 'w') as f:
            json.dump(mock_users, f, indent=2)
        
        print(f"✅ Created mock user database with admin user")
        print(f"✅ Admin ready: {ADMIN_EMAIL} / Jijo@2003")
        print(f"\n🎯 Ready to test!")
        print(f"1. Start backend: uvicorn main:app --reload --port 8000")
        print(f"2. Start frontend: cd ../frontend && npm run dev")
        print(f"3. Login with: {ADMIN_EMAIL} / Jijo@2003")
        print(f"4. Should redirect to: /admin-dashboard")
        
        return True
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    setup_admin()