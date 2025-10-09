"""
❌ DEPRECATED: This authentication module is deprecated.
Please use auth_mongodb.py for all authentication operations.
This file has been moved to deprecated_auth/ folder.
"""
raise ImportError("❌ Deprecated: Please use auth_mongodb.py for authentication.")

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Any, Dict, Optional
import firebase_admin
from firebase_admin import auth as fb_auth, credentials
import os
from datetime import datetime, timezone
import json

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

def load_mock_users():
    """Load users from mock JSON file"""
    try:
        with open('mock_users.json', 'r') as f:
            return json.load(f)
    except:
        return {"users": []}

def save_mock_users(users_data):
    """Save users to mock JSON file"""
    try:
        with open('mock_users.json', 'w') as f:
            json.dump(users_data, f, indent=2)
    except:
        pass

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

    # Use mock database instead of MongoDB
    users_data = load_mock_users()
    users = users_data.get("users", [])
    
    # Find existing user
    existing_user = None
    for user in users:
        if user.get("uid") == uid:
            existing_user = user
            break
    
    if existing_user is None:
        # Create new user with default role "retail"
        new_user = {
            "uid": uid,
            "email": email,
            "displayName": name,
            "role": "retail",
            "createdAt": now_iso,
            "lastLogin": now_iso,
        }
        users.append(new_user)
        users_data["users"] = users
        save_mock_users(users_data)
        user_doc = new_user
    else:
        # Update existing user
        existing_user["lastLogin"] = now_iso
        existing_user["email"] = email
        existing_user["displayName"] = name
        
        # Ensure role is valid
        if existing_user.get("role") not in ["admin", "retail"]:
            existing_user["role"] = "retail"
        
        save_mock_users(users_data)
        user_doc = existing_user

    # Attach to request state for downstream usage
    request.state.user = {"uid": uid, "email": email, "displayName": name, "role": user_doc.get("role", "retail")}
    return request.state.user

def require_role(role: str):
    async def _guard(user: Dict[str, Any] = Depends(verify_firebase_token)) -> Dict[str, Any]:
        if user.get("role") != role:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return _guard