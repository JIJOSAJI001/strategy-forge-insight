#!/usr/bin/env python3
"""
MongoDB Admin Setup Script
Creates admin user in MongoDB with proper role
"""

import asyncio
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
import os
from datetime import datetime, timezone
from db.mongo import MongoDB

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

async def setup_admin_mongodb():
    print("🔥 Setting up Admin User with MongoDB")
    print("=" * 50)
    
    try:
        # Initialize Firebase
        _init_firebase()
        print("✅ Firebase initialized")
        
        # Connect to MongoDB
        await MongoDB.connect_to_mongo()
        print("✅ MongoDB connected")
        
        users_col = MongoDB.get_collection("users")
        
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
        
        # Create/update MongoDB user document
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Check if user exists in MongoDB
        existing_user = await users_col.find_one({"firebaseUid": fb_user.uid})
        
        if existing_user:
            # Update existing user to admin
            await users_col.update_one(
                {"firebaseUid": fb_user.uid}, 
                {"$set": {
                    "role": "admin",
                    "email": ADMIN_EMAIL,
                    "displayName": ADMIN_DISPLAY_NAME,
                    "lastLogin": now_iso
                }}
            )
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
            
            await users_col.insert_one(admin_user)
            print(f"✅ Created admin user in MongoDB")
        
        # Verify admin user
        admin_user = await users_col.find_one({"firebaseUid": fb_user.uid})
        if admin_user:
            print(f"\n✅ Admin user verified:")
            print(f"   Firebase UID: {admin_user.get('firebaseUid')}")
            print(f"   Email: {admin_user.get('email')}")
            print(f"   Role: {admin_user.get('role')}")
            print(f"   Display Name: {admin_user.get('displayName')}")
        
        print(f"\n🎉 MongoDB admin setup completed!")
        print(f"Admin credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        print(f"\n📋 Next steps:")
        print(f"1. Update main.py to use auth_mongodb.py")
        print(f"2. Start backend: uvicorn main:app --reload --port 8000")
        print(f"3. Start frontend: cd ../frontend && npm run dev")
        print(f"4. Test admin login")
        
        return True
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        await MongoDB.close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(setup_admin_mongodb())