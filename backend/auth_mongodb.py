from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Any, Dict, Optional
import firebase_admin
from firebase_admin import auth as fb_auth, credentials
import os
from datetime import datetime, timezone
from db.mongo import MongoDB

_firebase_initialized = False

def initialize_firebase() -> None:
    global _firebase_initialized
    if _firebase_initialized:
        return

    cred_json_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    project_id = os.getenv("FIREBASE_PROJECT_ID")

    if firebase_admin._apps:
        _firebase_initialized = True
        return

    if cred_json_path and os.path.isfile(cred_json_path):
        cred = credentials.Certificate(cred_json_path)
        firebase_admin.initialize_app(cred, options={"projectId": project_id} if project_id else None)
    else:
        firebase_admin.initialize_app()
    _firebase_initialized = True

bearer_scheme = HTTPBearer(auto_error=False)

async def verify_firebase_token(request: Request, creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> Dict[str, Any]:
    initialize_firebase()

    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer token")

    token = creds.credentials
    try:
        decoded = fb_auth.verify_id_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    uid = decoded.get("uid")
    email = decoded.get("email")
    name = decoded.get("name") or decoded.get("displayName")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Connect to MongoDB
    try:
        await MongoDB.connect_to_mongo()
        users = MongoDB.get_collection("users")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {e}")

    # Find or create user in MongoDB
    existing_user = await users.find_one({"firebaseUid": uid})
    
    if existing_user is None:
        # Create new user with default role "retail"
        new_user = {
            "firebaseUid": uid,
            "uid": uid,  # Keep for backward compatibility
            "email": email,
            "displayName": name,
            "role": "retail",  # Default role
            "createdAt": now_iso,
            "lastLogin": now_iso,
        }
        await users.insert_one(new_user)
        user_doc = new_user
    else:
        # Update existing user
        await users.update_one(
            {"firebaseUid": uid}, 
            {"$set": {
                "lastLogin": now_iso, 
                "email": email, 
                "displayName": name
            }}
        )
        user_doc = existing_user

    # Attach to request state for downstream usage
    request.state.user = {
        "uid": uid, 
        "email": email, 
        "displayName": name, 
        "role": user_doc.get("role", "retail")
    }
    return request.state.user

def require_role(role: str):
    async def _guard(user: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return _guard