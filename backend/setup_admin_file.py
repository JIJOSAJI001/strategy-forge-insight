#!/usr/bin/env python3
"""
File-Based Admin Setup Script
Creates admin user in Firebase and JSON file
"""

import os
import json
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
from datetime import datetime, timezone

# Admin credentials
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "Jijo@2003"
ADMIN_DISPLAY_NAME = "Admin User"

def _init_firebase():
    if not firebase_admin._apps:
        cred_json_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_json_path and os.path.isfile(cred_json_path):
            cred = credentials.Certificate(cred_json_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()

def setup_admin_file():
    print("🔥 Setting up Admin User with File Database")
    print("=" * 50)
    
    # Set environment variables
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'firebase-service-account.json'
    os.environ['FIREBASE_PROJECT_ID'] = 'microproject2-7ac7e'
    
    try:
        # Initialize Firebase
        _init_firebase()
        print("✅ Firebase initialized")
        
        # Get or create Firebase user
        try:
            fb_user = fb_auth.get_user_by_email(ADMIN_EMAIL)
            print(f"✅ Firebase user exists: {fb_user.uid}")
        except Exception as e:
            if "user-not-found" in str(e):
                try:
                    fb_user = fb_auth.create_user(
                        email=ADMIN_EMAIL,
                        password=ADMIN_PASSWORD,
                        display_name=ADMIN_DISPLAY_NAME
                    )
                    print(f"✅ Created Firebase user: {fb_user.uid}")
                except Exception as create_error:
                    print(f"❌ Failed to create Firebase user: {create_error}")
                    return False
            else:
                print(f"❌ Error checking Firebase user: {e}")
                return False
        
        # Create/update JSON user database
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Load existing users
        try:
            with open('users.json', 'r') as f:
                users_data = json.load(f)
        except:
            users_data = {"users": []}
        
        users = users_data.get("users", [])
        
        # Find existing user
        existing_user = None
        for user in users:
            if user.get("firebaseUid") == fb_user.uid:
                existing_user = user
                break
        
        if existing_user:
            # Update existing user to admin
            existing_user["role"] = "admin"
            existing_user["email"] = ADMIN_EMAIL
            existing_user["displayName"] = ADMIN_DISPLAY_NAME
            existing_user["lastLogin"] = now_iso
            print(f"✅ Updated existing user to admin role")
        else:
            # Create new admin user
            admin_user = {
                "firebaseUid": fb_user.uid,
                "uid": fb_user.uid,  # Keep for backward compatibility
                "email": ADMIN_EMAIL,
                "displayName": ADMIN_DISPLAY_NAME,
                "role": "admin",
                "createdAt": now_iso,
                "lastLogin": now_iso,
            }
            users.append(admin_user)
            users_data["users"] = users
            print(f"✅ Created admin user in JSON database")
        
        # Save users
        with open('users.json', 'w') as f:
            json.dump(users_data, f, indent=2)
        
        # Verify admin user
        admin_user = None
        for user in users:
            if user.get("firebaseUid") == fb_user.uid:
                admin_user = user
                break
        
        if admin_user:
            print(f"\n✅ Admin user verified:")
            print(f"   Firebase UID: {admin_user.get('firebaseUid')}")
            print(f"   Email: {admin_user.get('email')}")
            print(f"   Role: {admin_user.get('role')}")
            print(f"   Display Name: {admin_user.get('displayName')}")
        
        print(f"\n🎉 File-based admin setup completed!")
        print(f"Admin credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"\n📋 Next steps:")
        print(f"1. Update main.py to use auth_file.py")
        print(f"2. Start backend: uvicorn main:app --reload --port 8000")
        print(f"3. Start frontend: cd ../frontend && npm run dev")
        print(f"4. Test admin login - should redirect to /admin-dashboard")
        
        return True
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    setup_admin_file()