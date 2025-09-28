import asyncio
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from db.mongo import MongoDB
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

async def fix_auth_issues():
    print("🔧 Fixing Authentication & Role Issues")
    print("=" * 50)
    
    try:
        # Initialize Firebase
        _init_firebase()
        print("✅ Firebase Admin SDK initialized")
        
        # Connect to MongoDB
        await MongoDB.connect_to_mongo()
        print("✅ MongoDB connected")
        
        users_col = MongoDB.get_collection("users")
        
        # Step 1: Create/Update Firebase user
        print(f"\n👤 Setting up Firebase user: {ADMIN_EMAIL}")
        try:
            fb_user = fb_auth.get_user_by_email(ADMIN_EMAIL)
            print(f"✅ Firebase user already exists: {fb_user.uid}")
        except Exception as e:
            if "user-not-found" in str(e):
                try:
                    fb_user = fb_auth.create_user(
                        email=ADMIN_EMAIL,
                        password=ADMIN_PASSWORD,
                        display_name=ADMIN_DISPLAY_NAME
                    )
                    print(f"✅ Created new Firebase user: {fb_user.uid}")
                except Exception as create_error:
                    print(f"❌ Failed to create Firebase user: {create_error}")
                    return
            else:
                print(f"❌ Error checking Firebase user: {e}")
                return
        
        # Step 2: Fix MongoDB user document
        print(f"\n🗄️ Setting up MongoDB user document")
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Check if user exists in MongoDB
        existing_user = await users_col.find_one({"email": ADMIN_EMAIL})
        
        if existing_user:
            # Update existing user
            update_data = {
                "uid": fb_user.uid,
                "role": "admin",  # Ensure role is exactly "admin"
                "displayName": ADMIN_DISPLAY_NAME,
                "lastLogin": now_iso
            }
            
            await users_col.update_one(
                {"email": ADMIN_EMAIL}, 
                {"$set": update_data}
            )
            print(f"✅ Updated existing MongoDB user")
        else:
            # Create new user document
            user_doc = {
                "uid": fb_user.uid,
                "email": ADMIN_EMAIL,
                "displayName": ADMIN_DISPLAY_NAME,
                "role": "admin",  # Ensure role is exactly "admin"
                "createdAt": now_iso,
                "lastLogin": now_iso,
            }
            
            await users_col.insert_one(user_doc)
            print(f"✅ Created new MongoDB user document")
        
        # Step 3: Fix all users with missing or incorrect roles
        print(f"\n🔧 Fixing role issues for all users")
        
        # Fix users with missing roles
        result1 = await users_col.update_many(
            {"role": {"$exists": False}}, 
            {"$set": {"role": "retail"}}
        )
        print(f"✅ Fixed {result1.modified_count} users with missing roles")
        
        # Fix users with incorrect role values (case sensitivity, typos, etc.)
        result2 = await users_col.update_many(
            {"role": {"$nin": ["admin", "retail"]}}, 
            {"$set": {"role": "retail"}}
        )
        print(f"✅ Fixed {result2.modified_count} users with incorrect roles")
        
        # Step 4: Verify the fix
        print(f"\n✅ Verification:")
        admin_user = await users_col.find_one({"email": ADMIN_EMAIL})
        if admin_user:
            print(f"Admin user verified:")
            print(f"  Email: {admin_user.get('email')}")
            print(f"  UID: {admin_user.get('uid')}")
            print(f"  Role: {admin_user.get('role')}")
            print(f"  Display Name: {admin_user.get('displayName')}")
        
        # Count users by role
        admin_count = await users_col.count_documents({"role": "admin"})
        retail_count = await users_col.count_documents({"role": "retail"})
        print(f"\n📊 Final counts:")
        print(f"  Admin users: {admin_count}")
        print(f"  Retail users: {retail_count}")
        
        print(f"\n🎉 Authentication setup completed successfully!")
        print(f"Admin credentials: {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
        
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        await MongoDB.close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(fix_auth_issues())