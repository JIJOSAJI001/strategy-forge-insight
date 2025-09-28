# 🚀 Quick Setup Guide

## Step 1: Environment Variables

Create a `.env` file in the `backend` directory:

```env
MONGODB_URI=mongodb://localhost:27017/strategy_forge
DATABASE_NAME=strategy_forge
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/firebase-service-account.json
FIREBASE_PROJECT_ID=your-firebase-project-id
```

## Step 2: Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of this file

## Step 3: Run Setup Scripts

```bash
# Debug current state
python backend/scripts/debug_auth.py

# Fix all issues
python backend/scripts/fix_auth_issues.py
```

## Step 4: Start Services

```bash
# Backend
cd backend
uvicorn main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm run dev
```

## Step 5: Test Login

- **Admin:** `admin@gmail.com` / `Jijo@2003` → `/admin-dashboard`
- **Retail:** Any other account → `/dashboard`

## Troubleshooting

If you see errors:
1. Check `.env` file exists and has correct values
2. Verify Firebase service account JSON file path
3. Ensure MongoDB is running
4. Check browser console for errors
5. Run `python backend/scripts/debug_auth.py` for detailed diagnostics