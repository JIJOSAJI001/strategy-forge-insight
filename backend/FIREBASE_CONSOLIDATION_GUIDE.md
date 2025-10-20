# Firebase Configuration Consolidation Guide

## 🎯 Overview

This document describes the new consolidated Firebase configuration system that replaces multiple inconsistent setup scripts with a unified, standardized approach.

## 🔧 New Architecture

### Core Components

1. **`core/firebase_setup.py`** - Centralized Firebase configuration and initialization
2. **`core/mongodb_setup.py`** - MongoDB-specific admin setup
3. **`core/file_setup.py`** - File-based admin setup
4. **`core/mock_setup.py`** - Mock database admin setup
5. **`unified_setup.py`** - Single entry point for all setup operations

### Key Improvements

✅ **Standardized Path Resolution**: Automatically finds Firebase service account file  
✅ **Centralized Firebase Initialization**: Single source of truth for Firebase config  
✅ **Environment Variable Management**: Consistent handling across all scripts  
✅ **Error Handling**: Comprehensive validation and troubleshooting  
✅ **Backend Flexibility**: Support for MongoDB, File, and Mock backends  
✅ **Legacy Compatibility**: Existing scripts redirect to new system  

## 🚀 Quick Start

### Option 1: Use the Unified Setup (Recommended)

```bash
# For MongoDB backend
python unified_setup.py mongodb

# For file-based backend
python unified_setup.py file

# For mock database backend
python unified_setup.py mock

# Validate environment only
python unified_setup.py --validate-only
```

### Option 2: Use Individual Modules

```python
# MongoDB setup
from core.mongodb_setup import setup_admin_mongodb
import asyncio
success = asyncio.run(setup_admin_mongodb())

# File-based setup
from core.file_setup import setup_admin_file
success = setup_admin_file()

# Mock setup
from core.mock_setup import setup_admin_mock
success = setup_admin_mock()
```

### Option 3: Use Core Firebase Setup

```python
from core.firebase_setup import firebase_setup

# Initialize Firebase
if firebase_setup.initialize_firebase():
    print("Firebase ready!")
    
    # Get or create admin user
    admin_user = firebase_setup.get_or_create_admin_user()
    if admin_user:
        print(f"Admin user: {admin_user.email}")
```

## 📁 Firebase Service Account File Locations

The new system automatically searches for the Firebase service account file in this order:

1. **Environment Variable**: `GOOGLE_APPLICATION_CREDENTIALS`
2. **Current Directory**: `firebase-service-account.json`
3. **Backend Directory**: `Backend/firebase-service-account.json`
4. **Project Root**: `Backend/firebase-service-account.json` (from root)

This eliminates the path reference inconsistencies that existed before.

## 🔄 Migration from Old Scripts

### Deprecated Scripts (Still Work with Warnings)

- `setup_admin_mongodb.py` → Use `python unified_setup.py mongodb`
- `setup_admin_file.py` → Use `python unified_setup.py file`
- `setup_admin_simple.py` → Use `python unified_setup.py mock`
- `setup_admin_mock.py` → Use `python unified_setup.py mock`

### Updated Authentication Modules

- `auth_mongodb.py` - Now uses centralized Firebase setup
- Other auth modules can be similarly updated

## 🏗️ Environment Setup

### Required Environment Variables

```bash
# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json
FIREBASE_PROJECT_ID=microproject2-7ac7e

# MongoDB Configuration (if using MongoDB)
MONGODB_URI=mongodb://localhost:27017/strategy_forge
DATABASE_NAME=strategy_forge
```

### Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → Project Settings → Service Accounts
3. Click "Generate new private key"
4. Save as `firebase-service-account.json` in the Backend directory

## 🧪 Testing the Setup

### Validate Environment

```bash
python unified_setup.py --validate-only
```

### Test Firebase Connection

```python
from core.firebase_setup import validate_environment

result = validate_environment()
if result["valid"]:
    print("✅ Environment is valid")
else:
    print("❌ Issues found:")
    for issue in result["issues"]:
        print(f"   • {issue}")
```

### Complete Setup Test

```bash
# Setup with MongoDB
python unified_setup.py mongodb

# Start backend
uvicorn main:app --reload --port 8000

# Start frontend (in another terminal)
cd ../frontend && npm run dev

# Test login at http://localhost:3000
# Email: admin@gmail.com
# Password: Jijo@2003
```

## 🔍 Troubleshooting

### Common Issues

**Firebase service account file not found**
```bash
# Check if file exists
ls -la firebase-service-account.json

# Or download from Firebase Console
# Project Settings → Service Accounts → Generate new private key
```

**Environment variables not set**
```bash
# Check current environment
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $FIREBASE_PROJECT_ID

# Set manually if needed
export GOOGLE_APPLICATION_CREDENTIALS=firebase-service-account.json
export FIREBASE_PROJECT_ID=microproject2-7ac7e
```

**MongoDB connection failed**
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand('ping')"

# Start MongoDB if needed
mongod --dbpath /path/to/your/db
```

### Validation Command

```bash
python unified_setup.py --validate-only
```

This will check:
- Firebase service account file existence
- Environment variable configuration
- File permissions
- Network connectivity (if applicable)

## 📋 Next Steps

After successful setup:

1. **Update main.py** to use the appropriate auth module
2. **Start the backend**: `uvicorn main:app --reload --port 8000`
3. **Start the frontend**: `cd ../frontend && npm run dev`
4. **Test admin login** at `http://localhost:3000`
5. **Verify admin dashboard** access

## 🔧 Advanced Usage

### Custom Service Account Path

```python
from core.firebase_setup import firebase_setup

# Initialize with custom path
firebase_setup.initialize_firebase(
    service_account_path="/custom/path/to/credentials.json",
    project_id="custom-project-id"
)
```

### Backend-Specific Configuration

```python
# MongoDB with custom connection
from core.mongodb_setup import MongoDBAdminSetup
mongo_setup = MongoDBAdminSetup()
# ... custom setup logic

# File-based with custom file
from core.file_setup import setup_admin_file
setup_admin_file("custom_users.json")

# Mock with custom file
from core.mock_setup import setup_admin_mock
setup_admin_mock("custom_mock.json")
```

## 📝 Benefits of the New System

1. **Consistency**: All scripts use the same Firebase initialization logic
2. **Maintainability**: Single place to update Firebase configuration
3. **Flexibility**: Easy to add new backend types
4. **Reliability**: Better error handling and validation
5. **User Experience**: Clear success/failure messages and next steps
6. **Debugging**: Comprehensive logging and validation tools

## 🔄 Legacy Support

The old setup scripts still work but show deprecation warnings. They redirect to the new unified system, ensuring backward compatibility while encouraging migration to the new approach.

This consolidation resolves the Firebase configuration complexity issue while providing a more robust and maintainable setup system.