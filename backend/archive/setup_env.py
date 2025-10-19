#!/usr/bin/env python3
"""
Environment Setup Helper Script
This script helps you create the .env file with the correct configuration.
"""

import os

def create_env_file():
    """Create .env file with Firebase configuration"""
    
    env_content = """# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/strategy_forge
DATABASE_NAME=strategy_forge

# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=backend/firebase-service-account.json
FIREBASE_PROJECT_ID=microproject2-7ac7e
"""
    
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    if os.path.exists(env_path):
        print(f"⚠️  .env file already exists at: {env_path}")
        response = input("Do you want to overwrite it? (y/N): ")
        if response.lower() != 'y':
            print("❌ Setup cancelled")
            return False
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        print(f"✅ Created .env file at: {env_path}")
        print("\n📋 Next steps:")
        print("1. Download Firebase service account JSON:")
        print("   - Go to Firebase Console → Project Settings → Service Accounts")
        print("   - Click 'Generate new private key'")
        print("   - Save as: backend/firebase-service-account.json")
        print("\n2. Run admin setup:")
        print("   python backend/scripts/setup_admin.py")
        print("\n3. Start the backend:")
        print("   cd backend && uvicorn main:app --reload --port 8000")
        return True
    except Exception as e:
        print(f"❌ Error creating .env file: {e}")
        return False

if __name__ == "__main__":
    print("🔧 Environment Setup Helper")
    print("=" * 40)
    create_env_file()