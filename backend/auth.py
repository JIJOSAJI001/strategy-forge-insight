from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Any, Dict, Optional
import firebase_admin
from firebase_admin import auth as fb_auth, credentials
import os
from db.mongo import MongoDB
from datetime import datetime, timezone


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
        # Allow default credentials (useful in some environments)
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

    users = MongoDB.get_collection("users")

    # Ensure user document exists and is updated
    existing = await users.find_one({"uid": uid})
    if existing is None:
        doc = {
            "uid": uid,
            "email": email,
            "displayName": name,
            "role": "retail",  # Default role for new users
            "createdAt": now_iso,
            "lastLogin": now_iso,
        }
        await users.insert_one(doc)
        user_doc = doc
    else:
        # Backfill role if missing or invalid, normalize to lowercase
        current_role = existing.get("role", "retail")
        if current_role not in ["admin", "retail"]:
            current_role = "retail"
        
        await users.update_one(
            {"_id": existing["_id"]}, 
            {"$set": {
                "lastLogin": now_iso, 
                "role": current_role, 
                "email": email, 
                "displayName": name
            }}
        )
        user_doc = {**existing, "lastLogin": now_iso, "role": current_role, "email": email, "displayName": name}

    # Attach to request state for downstream usage
    request.state.user = {"uid": uid, "email": email, "displayName": name, "role": user_doc.get("role", "retail")}
    return request.state.user


def require_role(role: str):
    async def _guard(user: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return _guard

