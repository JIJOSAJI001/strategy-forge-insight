#!/usr/bin/env python3
"""
Simple Admin Setup Without MongoDB
This creates a mock user database for testing
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, auth as fb_auth

# Set environment variables
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'backend/firebase-service-account.json'
os.environ['FIREBASE_PROJECT_ID'] = 'microproject2-7ac7e'

def setup_admin_without_mongodb():
    print("🔥 Setting up Admin User (No MongoDB)")
    print("=" * 50)
    
    try:
        # Initialize Firebase
        if not firebase_admin._apps:
            cred = credentials.Certificate('backend/firebase-service-account.json')
            firebase_admin.initialize_app(cred, options={"projectId": "microproject2-7ac7e"})
        print("✅ Firebase initialized")
        
        # Get or create admin user
        ADMIN_EMAIL = "admin@gmail.com"
        ADMIN_PASSWORD = "Jijo@2003"
        ADMIN_DISPLAY_NAME = "Admin User"
        
        try:
            fb_user = fb_auth.get_user_by_email(ADMIN_EMAIL)
            print(f"✅ Admin user exists: {fb_user.uid}")
        except Exception as e:
            if "user-not-found" in str(e):
                fb_user = fb_auth.create_user(
                    email=ADMIN_EMAIL,
                    password=ADMIN_PASSWORD,
                    display_name=ADMIN_DISPLAY_NAME
                )
                print(f"✅ Created admin user: {fb_user.uid}")
        
        # Create mock user database
        mock_users = {
            "users": [
                {
                    "uid": fb_user.uid,
                    "email": ADMIN_EMAIL,
                    "displayName": ADMIN_DISPLAY_NAME,
                    "role": "admin",
                    "createdAt": "2025-01-28T10:00:00Z",
                    "lastLogin": "2025-01-28T10:00:00Z"
                }
            ]
        }
        
        # Save to JSON file (temporary database)
        with open('backend/mock_users.json', 'w') as f:
            json.dump(mock_users, f, indent=2)
        
        print(f"✅ Created mock user database")
        print(f"✅ Admin user ready: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"\n🎯 Ready to test!")
        print(f"1. Start backend: cd backend && uvicorn main:app --reload --port 8000")
        print(f"2. Start frontend: cd frontend && npm run dev")
        print(f"3. Login with: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"4. Should redirect to: /admin-dashboard")
        
        return True
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    setup_admin_without_mongodb()