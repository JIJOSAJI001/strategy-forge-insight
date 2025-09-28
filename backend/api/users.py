from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Literal
from datetime import datetime, timezone
from auth_file import verify_firebase_token, require_role
import json


router = APIRouter(prefix="/users", tags=["users"])


class MeResponse(BaseModel):
    uid: str
    email: str | None
    role: Literal["admin", "retail"]
    displayName: str | None = None


@router.get("/me", response_model=MeResponse)
async def me(user=Depends(verify_firebase_token)):
    return {
        "uid": user.get("uid"),
        "email": user.get("email"),
        "role": user.get("role", "retail"),
        "displayName": user.get("displayName"),
    }


class PromoteRequest(BaseModel):
    uid: str
    role: Literal["admin", "retail"]


@router.post("/admin/promote")
async def promote(req: PromoteRequest, admin=Depends(require_role("admin"))):
    # Load users from JSON file
    try:
        with open('users.json', 'r') as f:
            users_data = json.load(f)
    except:
        users_data = {"users": []}
    
    users = users_data.get("users", [])
    
    # Find and update user
    for user in users:
        if user.get("firebaseUid") == req.uid:
            user["role"] = req.role
            break
    
    # Save updated users
    with open('users.json', 'w') as f:
        json.dump(users_data, f, indent=2)
    
    # Create audit record (simplified)
    audit = {
        "action": "promote",
        "targetUid": req.uid,
        "newRole": req.role,
        "promotedBy": admin.get("uid"),
        "promotedAt": datetime.now(timezone.utc).isoformat(),
    }
    
    return {"uid": req.uid, "role": req.role}

