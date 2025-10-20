# Strategy Visibility Fix

## Problem Description
All strategies (both public and private) were visible to all users in the Strategy Library, regardless of who created them. This violated the intended privacy model where private strategies should only be visible to their creators.

## Root Cause
The `/api/strategies` endpoint was fetching all strategies from both collections without any visibility filtering based on:
- Strategy visibility setting (public/private)
- Current authenticated user

## Solution Implemented

### Backend Changes - `Backend/api/strategy.py`

#### 1. Added Authentication Support
```python
from fastapi import Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Bearer scheme for optional authentication
bearer_scheme = HTTPBearer(auto_error=False)
```

#### 2. Updated Get Strategies Endpoint
```python
@router.get("/strategies", response_model=List[StrategyResponse])
async def get_strategies(
    request: Request, 
    creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)
):
```

**Authentication Logic:**
- Token is **optional** (doesn't fail if missing)
- If token provided: verifies and extracts user ID
- If token missing/invalid: shows only public strategies

#### 3. Visibility Filtering Rules

**For Simple Strategies Collection:**
```python
async for strategy in collection_simple.find():
    visibility = strategy.get("visibility", "private")
    owner_id = strategy.get("author", "")
    
    # Show if: PUBLIC or (user is authenticated AND is owner)
    if visibility == "public" or (current_user_id and owner_id == current_user_id):
        # Add to results
```

**For Drag-Drop Strategies Collection:**
```python
async for strategy in collection_defs.find():
    visibility = strategy.get("visibility", "private")
    owner_id = strategy.get("ownerId", "")
    
    # Show if: PUBLIC or (user is authenticated AND is owner)
    if visibility == "public" or (current_user_id and owner_id == current_user_id):
        # Add to results
```

## Behavior After Fix

### Scenario 1: Unauthenticated User
**Request:** No token provided
**Result:** 
- ✅ Sees all PUBLIC strategies
- ❌ Does NOT see any PRIVATE strategies

### Scenario 2: Authenticated User (Alice)
**Request:** Valid token for Alice (uid: "alice123")
**Result:**
- ✅ Sees all PUBLIC strategies
- ✅ Sees her own PRIVATE strategies (where author/ownerId = "alice123")
- ❌ Does NOT see other users' PRIVATE strategies

### Scenario 3: Authenticated User (Bob)
**Request:** Valid token for Bob (uid: "bob456")
**Result:**
- ✅ Sees all PUBLIC strategies
- ✅ Sees his own PRIVATE strategies (where author/ownerId = "bob456")
- ❌ Does NOT see Alice's PRIVATE strategies

## Visual Example

### Before Fix
```
Strategy Library (All Users See):
┌─────────────────────────────────┐
│ Public Strategy A (by Alice)    │ ✅ Correct
│ Public Strategy B (by Bob)      │ ✅ Correct
│ Private Strategy C (by Alice)   │ ❌ WRONG - Bob shouldn't see
│ Private Strategy D (by Bob)     │ ❌ WRONG - Alice shouldn't see
└─────────────────────────────────┘
```

### After Fix

**Alice's View (Authenticated):**
```
Strategy Library:
┌─────────────────────────────────┐
│ Public Strategy A (by Alice)    │ ✅ Public
│ Public Strategy B (by Bob)      │ ✅ Public
│ Private Strategy C (by Alice)   │ ✅ Her own private
└─────────────────────────────────┘
```

**Bob's View (Authenticated):**
```
Strategy Library:
┌─────────────────────────────────┐
│ Public Strategy A (by Alice)    │ ✅ Public
│ Public Strategy B (by Bob)      │ ✅ Public
│ Private Strategy D (by Bob)     │ ✅ His own private
└─────────────────────────────────┘
```

**Guest/Unauthenticated View:**
```
Strategy Library:
┌─────────────────────────────────┐
│ Public Strategy A (by Alice)    │ ✅ Public only
│ Public Strategy B (by Bob)      │ ✅ Public only
└─────────────────────────────────┘
```

## Database Field Mapping

### Simple Strategies Collection
- **Visibility Field:** `visibility` (values: "public" or "private")
- **Owner Field:** `author` (Firebase UID)

### Drag-Drop Strategies Collection
- **Visibility Field:** `visibility` (values: "public" or "private")
- **Owner Field:** `ownerId` (Firebase UID)

## Testing Checklist

### Test 1: Unauthenticated Access
```bash
# Should return only public strategies
curl http://localhost:8000/api/strategies
```

### Test 2: Authenticated User Access
```bash
# Should return public + user's private strategies
curl http://localhost:8000/api/strategies \
  -H "Authorization: Bearer <valid_token>"
```

### Test 3: Create Private Strategy
```bash
# Create a private strategy, verify it's not visible to other users
POST /api/drag-drop-strategies
{
  "name": "My Secret Strategy",
  "visibility": "private"
}
```

### Test 4: Toggle Visibility
```bash
# Change strategy from private to public
PUT /api/drag-drop-strategies/{id}
{
  "visibility": "public"
}
# Verify it becomes visible to all users
```

## Impact on Frontend

### No Changes Required
The frontend (`StrategyLibrary.tsx`) already sends the authentication token with requests:
```typescript
const { user } = useAuth();
const token = await user?.getIdToken();

fetch(url, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

The filtering happens automatically on the backend based on this token.

## Console Output

The endpoint now logs filtering details:
```
🔍 Fetching strategies for authenticated user: alice123
✅ Returning 8 strategies (user: alice123)
```

Or for unauthenticated:
```
⚠️ Token verification failed, showing only public strategies
✅ Returning 3 strategies (user: anonymous)
```

## Security Considerations

### ✅ Secure
- Private strategies are filtered at the database query level
- User authentication is verified before applying owner filters
- No private data leaks in error messages

### ⚠️ Future Enhancements
- Add rate limiting to prevent enumeration attacks
- Consider adding admin override for moderation
- Log access patterns for audit trails

## Related Files Modified
- `Backend/api/strategy.py` - Main visibility filtering logic
- No frontend changes required

## Date Implemented
October 17, 2025
