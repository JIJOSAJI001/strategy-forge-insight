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

async def main():
    _init_firebase()
    await MongoDB.connect_to_mongo()
    users_col = MongoDB.get_collection("users")

    try:
        # Check if admin user already exists
        existing_admin = await users_col.find_one({"email": ADMIN_EMAIL})
        
        if existing_admin:
            # Update existing admin user to ensure they have admin role
            await users_col.update_one(
                {"email": ADMIN_EMAIL}, 
                {"$set": {"role": "admin", "lastLogin": datetime.now(timezone.utc).isoformat()}}
            )
            print(f"Updated existing admin user: {ADMIN_EMAIL}")
        else:
            # Create Firebase user
            try:
                fb_user = fb_auth.create_user(
                    email=ADMIN_EMAIL,
                    password=ADMIN_PASSWORD,
                    display_name=ADMIN_DISPLAY_NAME
                )
                print(f"Created Firebase user: {ADMIN_EMAIL}")
            except Exception as e:
                if "email-already-exists" in str(e):
                    # User exists in Firebase, get the user
                    fb_user = fb_auth.get_user_by_email(ADMIN_EMAIL)
                    print(f"Firebase user already exists: {ADMIN_EMAIL}")
                else:
                    raise e

            # Create MongoDB user document
            now_iso = datetime.now(timezone.utc).isoformat()
            user_doc = {
                "uid": fb_user.uid,
                "email": ADMIN_EMAIL,
                "displayName": ADMIN_DISPLAY_NAME,
                "role": "admin",
                "createdAt": now_iso,
                "lastLogin": now_iso,
            }
            
            await users_col.insert_one(user_doc)
            print(f"Created admin user in MongoDB: {ADMIN_EMAIL}")
            print(f"Firebase UID: {fb_user.uid}")

    except Exception as e:
        print(f"Error setting up admin user: {e}")
        raise

    finally:
        await MongoDB.close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())