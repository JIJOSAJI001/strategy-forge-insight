#!/usr/bin/env python3
"""
Simple Firebase Admin Setup Test
This script tests Firebase connection without MongoDB dependency
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, auth as fb_auth

# Set environment variables directly
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'backend/firebase-service-account.json'
os.environ['FIREBASE_PROJECT_ID'] = 'microproject2-7ac7e'

def test_firebase():
    print("🔥 Testing Firebase Admin SDK Setup")
    print("=" * 50)
    
    try:
        # Initialize Firebase
        if not firebase_admin._apps:
            cred = credentials.Certificate('backend/firebase-service-account.json')
            firebase_admin.initialize_app(cred, options={"projectId": "microproject2-7ac7e"})
        print("✅ Firebase Admin SDK initialized successfully")
        
        # Test creating admin user
        ADMIN_EMAIL = "admin@gmail.com"
        ADMIN_PASSWORD = "Jijo@2003"
        ADMIN_DISPLAY_NAME = "Admin User"
        
        print(f"\n👤 Creating admin user: {ADMIN_EMAIL}")
        
        try:
            # Check if user already exists
            fb_user = fb_auth.get_user_by_email(ADMIN_EMAIL)
            print(f"✅ Admin user already exists: {fb_user.uid}")
            print(f"   Email: {fb_user.email}")
            print(f"   Display Name: {fb_user.display_name}")
        except Exception as e:
            if "user-not-found" in str(e):
                try:
                    # Create new user
                    fb_user = fb_auth.create_user(
                        email=ADMIN_EMAIL,
                        password=ADMIN_PASSWORD,
                        display_name=ADMIN_DISPLAY_NAME
                    )
                    print(f"✅ Created new admin user: {fb_user.uid}")
                    print(f"   Email: {fb_user.email}")
                    print(f"   Display Name: {fb_user.display_name}")
                except Exception as create_error:
                    print(f"❌ Failed to create admin user: {create_error}")
                    return False
            else:
                print(f"❌ Error checking admin user: {e}")
                return False
        
        print(f"\n🎉 Firebase setup completed successfully!")
        print(f"Admin credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"\n📋 Next steps:")
        print(f"1. Set up MongoDB (local or Atlas)")
        print(f"2. Run: python backend/scripts/setup_admin.py")
        print(f"3. Start backend: uvicorn main:app --reload --port 8000")
        print(f"4. Start frontend: npm run dev")
        print(f"5. Login with admin credentials")
        
        return True
        
    except Exception as e:
        print(f"❌ Firebase setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_firebase()