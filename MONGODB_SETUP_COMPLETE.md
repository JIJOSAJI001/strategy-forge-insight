# 🚀 Complete MongoDB Role-Based Setup

## Prerequisites
- Firebase service account JSON (✅ Done)
- MongoDB Atlas account or local MongoDB

## Step 1: Set up MongoDB

### Option A: MongoDB Atlas (Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create free account and cluster
3. Create database user (username: `admin`, password: `password123`)
4. Whititelist IP `0.0.0.0/0` for development
5. Get connection string like: `mongodb+srv://admin:password123@cluster.xxxxx.mongodb.net/strategy_forge?retryWrites=true&w=majority`

### Option B: Local MongoDB
1. Install MongoDB Community Server
2. Start MongoDB service
3. Use: `mongodb://localhost:27017/strategy_forge`

## Step 2: Update Environment Variables

Update `backend/.env`:
```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string_here
DATABASE_NAME=strategy_forge

# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json
FIREBASE_PROJECT_ID=microproject2-7ac7e
```

## Step 3: Set up Admin User

```bash
cd backend
python setup_admin_mongodb.py
```

This will:
- Create admin user in Firebase (if not exists)
- Create admin user in MongoDB with role "admin"
- Verify setup

## Step 4: Start Services

### Backend:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Frontend:
```bash
cd frontend
npm run dev
```

## Step 5: Test Role-Based Redirects

### Admin Login:
- Email: `admin@gmail.com`
- Password: `Jijo@2003`
- Expected: Redirect to `/admin-dashboard`

### Retail Login:
- Create new account
- Expected: Redirect to `/dashboard`

## Troubleshooting

### If MongoDB connection fails:
1. Check connection string in `.env`
2. Verify MongoDB is running
3. Check IP whitelist (Atlas) or firewall (local)

### If role redirect doesn't work:
1. Check browser console for errors
2. Verify `/api/users/me` returns correct role
3. Check Firebase token is valid

### If admin user not found:
1. Run `python setup_admin_mongodb.py` again
2. Check MongoDB users collection
3. Verify Firebase user exists

## Database Schema

### Users Collection:
```json
{
  "firebaseUid": "firebase-uid",
  "uid": "firebase-uid", 
  "email": "user@example.com",
  "displayName": "User Name",
  "role": "admin" | "retail",
  "createdAt": "2025-01-28T10:00:00Z",
  "lastLogin": "2025-01-28T10:00:00Z"
}
```

### Admin Audits Collection:
```json
{
  "action": "promote",
  "targetUid": "firebase-uid",
  "newRole": "admin",
  "promotedBy": "admin-firebase-uid",
  "promotedAt": "2025-01-28T10:00:00Z"
}
```

## What's Different Now

✅ **MongoDB as single source of truth** for roles
✅ **Proper Firebase + MongoDB integration**
✅ **Role-based redirects** (admin → admin-dashboard, retail → dashboard)
✅ **Persistent user data** across restarts
✅ **Admin promotion system** with audit logging
✅ **Secure authentication flow**

## Next Steps

1. Set up MongoDB (Atlas or local)
2. Update `.env` with MongoDB connection string
3. Run admin setup script
4. Start backend and frontend
5. Test admin login and redirect