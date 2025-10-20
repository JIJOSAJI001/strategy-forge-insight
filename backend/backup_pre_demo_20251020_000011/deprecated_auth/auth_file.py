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
import json
from datetime import datetime, timezone

_firebase_initialized = False

def initialize_firebase() -> None:
    global _firebase_initialized
    if _firebase_initialized:
        return

    cred_json_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    project_id = os.getenv("FIREBASE_PROJECT_ID")
    
    print(f"🔍 Firebase initialization:")
    print(f"   Credentials path: {cred_json_path}")
    print(f"   File exists: {os.path.isfile(cred_json_path) if cred_json_path else False}")
    print(f"   Project ID: {project_id}")

    if firebase_admin._apps:
        _firebase_initialized = True
        print("✅ Firebase already initialized")
        return

    if cred_json_path and os.path.isfile(cred_json_path):
        try:
            cred = credentials.Certificate(cred_json_path)
            firebase_admin.initialize_app(cred, options={"projectId": project_id} if project_id else None)
            print("✅ Firebase initialized with service account")
        except Exception as e:
            print(f"❌ Failed to initialize Firebase with service account: {e}")
            raise
    else:
        print("❌ Service account file not found, cannot initialize Firebase properly")
        print(f"   Expected path: {cred_json_path}")
        print(f"   Current working directory: {os.getcwd()}")
        raise FileNotFoundError(f"Service account file not found at: {cred_json_path}")
    
    _firebase_initialized = True

bearer_scheme = HTTPBearer(auto_error=False)

def load_users():
    """Load users from JSON file"""
    try:
        with open('users.json', 'r') as f:
            return json.load(f)
    except:
        return {"users": []}

def save_users(users_data):
    """Save users to JSON file"""
    with open('users.json', 'w') as f:
        json.dump(users_data, f, indent=2)

async def verify_firebase_token(request: Request, creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)) -> Dict[str, Any]:
    initialize_firebase()

    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing Authorization: Bearer token")

    token = creds.credentials
    try:
        print(f"🔍 Attempting to verify Firebase token...")
        print(f"   Token length: {len(token)}")
        print(f"   Token preview: {token[:50]}...")
        
        decoded = fb_auth.verify_id_token(token)
        print(f"✅ Token verified successfully")
        print(f"   UID: {decoded.get('uid')}")
        print(f"   Email: {decoded.get('email')}")
        print(f"   Project ID: {decoded.get('aud')}")
        
    except Exception as e:
        print(f"❌ Token verification failed: {str(e)}")
        print(f"   Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")

    uid = decoded.get("uid")
    email = decoded.get("email")
    name = decoded.get("name") or decoded.get("displayName")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Load users from JSON file
    users_data = load_users()
    users = users_data.get("users", [])
    
    # Find existing user
    existing_user = None
    for user in users:
        if user.get("firebaseUid") == uid:
            existing_user = user
            break
    
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
        users.append(new_user)
        users_data["users"] = users
        save_users(users_data)
        user_doc = new_user
    else:
        # Update existing user
        existing_user["lastLogin"] = now_iso
        existing_user["email"] = email
        existing_user["displayName"] = name
        
        # Ensure role is valid
        if existing_user.get("role") not in ["admin", "retail"]:
            existing_user["role"] = "retail"
        
        save_users(users_data)
        user_doc = existing_user

    # Attach to request state for downstream usage
    request.state.user = {
        "uid": uid, 
        "firebaseUid": uid,
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