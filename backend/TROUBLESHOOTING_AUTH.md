# 🔧 Authentication & Role Troubleshooting Guide

## Quick Fix Commands

### 1. Debug Current State
```bash
cd backend
python scripts/debug_auth.py
```

### 2. Fix All Issues Automatically
```bash
cd backend
python scripts/fix_auth_issues.py
```

### 3. Manual Admin Setup
```bash
cd backend
python scripts/setup_admin.py
```

## Common Issues & Solutions

### 🔑 Issue: Admin user not created properly

**Symptoms:**
- Login fails or user doesn't exist
- User exists but role is not "admin"

**Solutions:**
1. Run the fix script: `python scripts/fix_auth_issues.py`
2. Check Firebase Console for user existence
3. Verify MongoDB user document has correct role

**Manual Fix:**
```javascript
// In MongoDB shell
db.users.updateOne(
  { email: "admin@gmail.com" },
  { $set: { role: "admin" } }
)
```

### 🔄 Issue: Role mismatch

**Symptoms:**
- User has role "Admin", "ADMIN", or missing entirely
- Frontend shows wrong dashboard

**Solutions:**
1. Run fix script to normalize all roles
2. Check role is exactly "admin" or "retail" (lowercase)

**Manual Fix:**
```javascript
// Fix all role inconsistencies
db.users.updateMany(
  { role: { $nin: ["admin", "retail"] } },
  { $set: { role: "retail" } }
)
```

### 🌐 Issue: Wrong Firebase project

**Symptoms:**
- Backend can't verify tokens
- Users created in different project

**Solutions:**
1. Check `GOOGLE_APPLICATION_CREDENTIALS` points to correct service account
2. Verify `FIREBASE_PROJECT_ID` matches frontend config
3. Ensure service account has Firebase Admin SDK permissions

### 🔌 Issue: Backend API not returning role

**Symptoms:**
- `/api/users/me` returns 401 or missing role
- Frontend shows "null" role

**Solutions:**
1. Check backend logs for token verification errors
2. Verify MongoDB connection
3. Test API endpoint directly:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/users/me
```

### 🖥️ Issue: Frontend redirect problems

**Symptoms:**
- Always redirects to retail dashboard
- Redirects before role is fetched

**Solutions:**
1. Check browser console for role fetch errors
2. Verify `VITE_API_URL` environment variable
3. Clear browser cache and localStorage

### 🧪 Issue: Testing problems

**Symptoms:**
- Login with wrong account
- Old session cached

**Solutions:**
1. Clear browser data completely
2. Logout and login again
3. Check Firebase Auth state in browser dev tools

## Environment Setup Checklist

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/strategy_forge
DATABASE_NAME=strategy_forge
GOOGLE_APPLICATION_CREDENTIALS=path/to/firebase-service-account.json
FIREBASE_PROJECT_ID=your-project-id
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

## Testing Steps

1. **Start Backend:**
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Admin Login:**
   - Email: `admin@gmail.com`
   - Password: `Jijo@2003`
   - Should redirect to `/admin-dashboard`

4. **Test Retail Login:**
   - Create new account or use existing
   - Should redirect to `/dashboard`

## Debug Commands

### Check MongoDB Users
```javascript
// In MongoDB shell
db.users.find().pretty()
db.users.find({role: "admin"})
db.users.find({email: "admin@gmail.com"})
```

### Check Firebase Users
```bash
# Using Firebase CLI
firebase auth:export users.json
```

### Test API Endpoints
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test user endpoint (replace TOKEN)
curl -H "Authorization: Bearer TOKEN" http://localhost:8000/api/users/me
```

## Log Locations

- **Backend logs:** Console output from uvicorn
- **Frontend logs:** Browser console (F12)
- **Firebase logs:** Firebase Console > Authentication
- **MongoDB logs:** MongoDB logs or Compass

## Emergency Reset

If everything is broken:

1. **Reset MongoDB:**
   ```javascript
   db.users.deleteMany({})
   ```

2. **Run setup:**
   ```bash
   python scripts/fix_auth_issues.py
   ```

3. **Clear browser data and test again**

## Support

If issues persist:
1. Run `python scripts/debug_auth.py` and share output
2. Check all environment variables are set
3. Verify Firebase project configuration
4. Test with a fresh browser session