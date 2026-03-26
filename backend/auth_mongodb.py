from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Any, Dict, Optional
from firebase_admin import auth as fb_auth
from datetime import datetime, timezone

from db.mongo import MongoDB
from core.firebase_setup import firebase_setup


def initialize_firebase() -> None:
    """Initialize Firebase app using centralized setup."""
    try:
        if not firebase_setup.initialize_firebase():
            raise RuntimeError("Failed to initialize Firebase using centralized setup")
        print("Firebase initialized using centralized setup")
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        raise


bearer_scheme = HTTPBearer(auto_error=False)


async def load_users():
    """Load users from MongoDB collection."""
    try:
        await MongoDB.connect_to_mongo()
        users = MongoDB.get_collection("users")
        user_list = await users.find({}).to_list(length=None)
        for user in user_list:
            if "_id" in user:
                user["_id"] = str(user["_id"])
        return {"users": user_list}
    except Exception as e:
        print(f"Failed to load users from MongoDB: {e}")
        return {"users": []}


async def save_users(users_data):
    """Compatibility shim."""
    print("save_users called - MongoDB operations are handled directly")


async def verify_firebase_token(
    request: Request,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """Verify Firebase token and manage user in MongoDB."""
    initialize_firebase()

    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer token")

    token = creds.credentials
    try:
        print("Attempting to verify Firebase token")
        try:
            decoded = fb_auth.verify_id_token(token, check_revoked=False)
        except Exception as clock_error:
            if "Token used too early" in str(clock_error):
                import time

                print("Clock skew detected, retrying token verification")
                time.sleep(2)
                decoded = fb_auth.verify_id_token(token, check_revoked=False)
            else:
                raise

        print("Token verified successfully")
    except Exception as e:
        print(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

    uid = decoded.get("uid")
    email = decoded.get("email")
    name = decoded.get("name") or decoded.get("displayName")
    now_iso = datetime.now(timezone.utc).isoformat()

    try:
        await MongoDB.connect_to_mongo()
        users = MongoDB.get_collection("users")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Database connection failed: {e}")

    existing_user = await users.find_one({"firebaseUid": uid})

    if existing_user is None:
        new_user = {
            "firebaseUid": uid,
            "uid": uid,
            "email": email,
            "displayName": name,
            "role": "retail",
            "createdAt": now_iso,
            "lastLogin": now_iso,
        }
        await users.insert_one(new_user)
        user_doc = new_user
        print(f"Created new user: {email} ({uid})")
    else:
        await users.update_one(
            {"firebaseUid": uid},
            {
                "$set": {
                    "lastLogin": now_iso,
                    "email": email,
                    "displayName": name,
                }
            },
        )

        if existing_user.get("role") not in ["admin", "retail"]:
            existing_user["role"] = "retail"
            await users.update_one({"firebaseUid": uid}, {"$set": {"role": "retail"}})

        user_doc = existing_user
        print(f"Updated existing user: {email} ({uid})")

    request.state.user = {
        "uid": uid,
        "firebaseUid": uid,
        "email": email,
        "displayName": name,
        "role": user_doc.get("role", "retail"),
    }
    return request.state.user


def require_role(role: str):
    async def _guard(user: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return _guard
