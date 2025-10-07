from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal, List, Optional, Dict, Any
from datetime import datetime, timezone
from auth_file import verify_firebase_token, require_role, load_users, save_users, initialize_firebase
import json
from firebase_admin import auth as fb_auth


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
    users_data = load_users()
    users = users_data.get("users", [])

    # Find and update user
    target = None
    for u in users:
        if u.get("firebaseUid") == req.uid:
            u["role"] = req.role
            target = u
            break

    if target is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Save updated users
    save_users(users_data)

    # Create audit record (simplified)
    audit = {
        "action": "promote",
        "targetUid": req.uid,
        "newRole": req.role,
        "promotedBy": admin.get("uid"),
        "promotedAt": datetime.now(timezone.utc).isoformat(),
    }
    
    return {"uid": req.uid, "role": req.role}


# ===== Admin user management endpoints =====

class PermissionUpdate(BaseModel):
    permissions: Dict[str, Any]


class UserCreate(BaseModel):
    email: str
    password: Optional[str] = None
    displayName: Optional[str] = None
    role: Literal["admin", "retail"] = "retail"
    permissions: Optional[Dict[str, Any]] = None


class UserUpdate(BaseModel):
    uid: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    role: Optional[Literal["admin", "retail"]] = None
    permissions: Optional[Dict[str, Any]] = None
    active: Optional[bool] = None


class UserRecord(BaseModel):
    uid: str
    email: Optional[str]
    displayName: Optional[str]
    role: Literal["admin", "retail"]
    createdAt: Optional[str] = None
    lastLogin: Optional[str] = None
    active: Optional[bool] = True
    permissions: Optional[Dict[str, Any]] = None


@router.get("/admin", response_model=List[UserRecord])
async def list_users(admin=Depends(require_role("admin"))):
    users_data = load_users()
    return users_data.get("users", [])


@router.get("/admin/count")
async def count_users(admin=Depends(require_role("admin"))):
    users_data = load_users()
    users = users_data.get("users", [])
    return {"count": len(users)}


@router.post("/admin")
async def create_user(payload: UserCreate, admin=Depends(require_role("admin"))):
    initialize_firebase()
    users_data = load_users()
    users = users_data.get("users", [])

    # Create user in Firebase Auth if password provided
    try:
        user_record = fb_auth.create_user(
            email=payload.email,
            password=payload.password or None,
            display_name=payload.displayName or None,
        )
        uid = user_record.uid
    except Exception as e:
        # If email already in Firebase, try to fetch by email
        try:
            uid = fb_auth.get_user_by_email(payload.email).uid
        except Exception:
            raise HTTPException(status_code=400, detail=f"Failed to create user: {e}")

    now_iso = datetime.now(timezone.utc).isoformat()
    new_user = {
        "firebaseUid": uid,
        "uid": uid,
        "email": payload.email,
        "displayName": payload.displayName,
        "role": payload.role,
        "createdAt": now_iso,
        "lastLogin": None,
        "active": True,
        "permissions": payload.permissions or {},
    }
    # If exists update else append
    replaced = False
    for i, u in enumerate(users):
        if u.get("firebaseUid") == uid:
            users[i] = {**u, **new_user}
            replaced = True
            break
    if not replaced:
        users.append(new_user)
    users_data["users"] = users
    save_users(users_data)
    return {"uid": uid}


@router.put("/admin")
async def update_user(payload: UserUpdate, admin=Depends(require_role("admin"))):
    users_data = load_users()
    users = users_data.get("users", [])
    target = None
    for u in users:
        if u.get("firebaseUid") == payload.uid:
            target = u
            break
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.email is not None:
        target["email"] = payload.email
    if payload.displayName is not None:
        target["displayName"] = payload.displayName
    if payload.role is not None:
        target["role"] = payload.role
    if payload.permissions is not None:
        target["permissions"] = payload.permissions
    if payload.active is not None:
        target["active"] = payload.active
    save_users(users_data)
    return {"uid": target.get("uid")}


@router.delete("/admin/{uid}")
async def delete_user(uid: str, admin=Depends(require_role("admin"))):
    users_data = load_users()
    users = users_data.get("users", [])
    new_users = [u for u in users if u.get("firebaseUid") != uid]
    if len(new_users) == len(users):
        raise HTTPException(status_code=404, detail="User not found")
    users_data["users"] = new_users
    save_users(users_data)
    return {"deleted": True}


@router.post("/admin/{uid}/deactivate")
async def deactivate_user(uid: str, admin=Depends(require_role("admin"))):
    users_data = load_users()
    users = users_data.get("users", [])
    updated = False
    for u in users:
        if u.get("firebaseUid") == uid:
            u["active"] = False
            updated = True
            break
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    save_users(users_data)
    return {"uid": uid, "active": False}


@router.post("/admin/{uid}/reset-password")
async def reset_password(uid: str, admin=Depends(require_role("admin"))):
    initialize_firebase()
    # Obtain email from users.json
    users = load_users().get("users", [])
    email = None
    for u in users:
        if u.get("firebaseUid") == uid:
            email = u.get("email")
            break
    if not email:
        raise HTTPException(status_code=404, detail="Email not found for user")
    try:
        link = fb_auth.generate_password_reset_link(email)
        return {"resetLink": link}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate reset link: {e}")


@router.post("/admin/{uid}/revoke-sessions")
async def revoke_sessions(uid: str, admin=Depends(require_role("admin"))):
    initialize_firebase()
    try:
        fb_auth.revoke_refresh_tokens(uid)
        return {"revoked": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to revoke sessions: {e}")

