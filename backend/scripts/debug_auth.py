import asyncio
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from db.mongo import MongoDB
from datetime import datetime, timezone

def _init_firebase():
    if not firebase_admin._apps:
        cred_json_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_json_path and os.path.isfile(cred_json_path):
            cred = credentials.Certificate(cred_json_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()

async def debug_auth():
    print("🔍 Debugging Authentication & Role Issues")
    print("=" * 50)
    
    # Check environment variables
    print("\n📋 Environment Variables:")
    print(f"MONGODB_URI: {'✅ Set' if os.getenv('MONGODB_URI') else '❌ Missing'}")
    print(f"DATABASE_NAME: {os.getenv('DATABASE_NAME', '❌ Missing')}")
    print(f"GOOGLE_APPLICATION_CREDENTIALS: {'✅ Set' if os.getenv('GOOGLE_APPLICATION_CREDENTIALS') else '❌ Missing'}")
    print(f"FIREBASE_PROJECT_ID: {os.getenv('FIREBASE_PROJECT_ID', '❌ Missing')}")
    
    try:
        # Initialize Firebase
        _init_firebase()
        print("\n🔥 Firebase Admin SDK: ✅ Initialized")
        
        # Connect to MongoDB
        await MongoDB.connect_to_mongo()
        print("🗄️ MongoDB: ✅ Connected")
        
        users_col = MongoDB.get_collection("users")
        
        # Check admin user in Firebase
        print("\n👤 Admin User Check:")
        try:
            fb_user = fb_auth.get_user_by_email("admin@gmail.com")
            print(f"Firebase User: ✅ Found")
            print(f"  UID: {fb_user.uid}")
            print(f"  Email: {fb_user.email}")
            print(f"  Display Name: {fb_user.display_name}")
            print(f"  Created: {fb_user.user_metadata.creation_timestamp}")
        except Exception as e:
            print(f"Firebase User: ❌ Not found - {e}")
        
        # Check admin user in MongoDB
        print("\n🗄️ MongoDB User Check:")
        admin_user = await users_col.find_one({"email": "admin@gmail.com"})
        if admin_user:
            print("MongoDB User: ✅ Found")
            print(f"  UID: {admin_user.get('uid', '❌ Missing')}")
            print(f"  Email: {admin_user.get('email', '❌ Missing')}")
            print(f"  Role: {admin_user.get('role', '❌ Missing')}")
            print(f"  Display Name: {admin_user.get('displayName', '❌ Missing')}")
            print(f"  Created: {admin_user.get('createdAt', '❌ Missing')}")
            print(f"  Last Login: {admin_user.get('lastLogin', '❌ Missing')}")
        else:
            print("MongoDB User: ❌ Not found")
        
        # Check all users in MongoDB
        print("\n👥 All Users in MongoDB:")
        async for user in users_col.find():
            print(f"  - {user.get('email', 'No email')} | Role: {user.get('role', 'No role')} | UID: {user.get('uid', 'No UID')}")
        
        # Check role consistency
        print("\n🔍 Role Analysis:")
        roles = await users_col.distinct("role")
        print(f"Distinct roles found: {roles}")
        
        # Count users by role
        admin_count = await users_col.count_documents({"role": "admin"})
        retail_count = await users_col.count_documents({"role": "retail"})
        no_role_count = await users_col.count_documents({"role": {"$exists": False}})
        
        print(f"Admin users: {admin_count}")
        print(f"Retail users: {retail_count}")
        print(f"Users without role: {no_role_count}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await MongoDB.close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(debug_auth())