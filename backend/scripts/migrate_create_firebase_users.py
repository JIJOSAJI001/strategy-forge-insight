import asyncio
from db.mongo import MongoDB
import firebase_admin
from firebase_admin import credentials, auth as fb_auth
import os


def _init_fb():
    if not firebase_admin._apps:
        cred_json_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_json_path and os.path.isfile(cred_json_path):
            cred = credentials.Certificate(cred_json_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()


async def main():
    _init_fb()
    await MongoDB.connect_to_mongo()
    users_col = MongoDB.get_collection("users")

    # Find users without uid or with empty uid but with email
    cursor = users_col.find({"$or": [{"uid": {"$exists": False}}, {"uid": ""}], "email": {"$exists": True, "$ne": None}})
    async for u in cursor:
        email = u.get("email")
        display_name = u.get("displayName") or ""
        try:
            # Create Firebase account if does not exist
            try:
                fb_user = fb_auth.get_user_by_email(email)
            except Exception:
                fb_user = fb_auth.create_user(email=email, display_name=display_name)

            # Link UID in MongoDB and default role to retail if missing
            await users_col.update_one({"_id": u["_id"]}, {"$set": {"uid": fb_user.uid, "role": (u.get("role") or "retail")}})
            print(f"Linked {email} to uid {fb_user.uid}")
        except Exception as e:
            print(f"Failed to migrate {email}: {e}")

    await MongoDB.close_mongo_connection()


if __name__ == "__main__":
    asyncio.run(main())

