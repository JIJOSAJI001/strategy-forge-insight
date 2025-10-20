#!/usr/bin/env python3
"""
Firebase Path Verification Script
Verifies the correct path for Firebase service account file
"""
import os
from dotenv import load_dotenv

def verify_firebase_path():
    """Verify Firebase service account file path"""
    print("🔍 Firebase Path Verification")
    print("=" * 50)
    
    # Load environment
    load_dotenv()
    
    # Get current working directory
    cwd = os.getcwd()
    print(f"Current working directory: {cwd}")
    
    # Get credentials path from environment
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    print(f"GOOGLE_APPLICATION_CREDENTIALS: {cred_path}")
    
    # Check if file exists
    if cred_path:
        file_exists = os.path.isfile(cred_path)
        print(f"File exists: {file_exists}")
        
        if file_exists:
            # Get absolute path
            abs_path = os.path.abspath(cred_path)
            print(f"Absolute path: {abs_path}")
            
            # Check file size
            file_size = os.path.getsize(cred_path)
            print(f"File size: {file_size} bytes")
            
            # Try to read the file
            try:
                import json
                with open(cred_path, 'r') as f:
                    creds = json.load(f)
                print(f"✅ File is valid JSON")
                print(f"   Project ID: {creds.get('project_id')}")
                print(f"   Client Email: {creds.get('client_email')}")
                print(f"   Private Key ID: {creds.get('private_key_id')}")
            except Exception as e:
                print(f"❌ Error reading file: {e}")
        else:
            print(f"❌ File not found at: {cred_path}")
            
            # Suggest correct paths
            print(f"\n💡 Suggested paths:")
            print(f"   If running from Backend/: firebase-service-account.json")
            print(f"   If running from project root: Backend/firebase-service-account.json")
            print(f"   Absolute path: {os.path.abspath('firebase-service-account.json')}")
    else:
        print("❌ GOOGLE_APPLICATION_CREDENTIALS not set in environment")
    
    # Check common locations
    print(f"\n🔍 Checking common locations:")
    common_paths = [
        "firebase-service-account.json",
        "Backend/firebase-service-account.json",
        "../firebase-service-account.json",
        "./firebase-service-account.json"
    ]
    
    for path in common_paths:
        exists = os.path.isfile(path)
        print(f"   {path}: {'✅' if exists else '❌'}")
        if exists:
            abs_path = os.path.abspath(path)
            print(f"      Absolute: {abs_path}")

if __name__ == "__main__":
    verify_firebase_path()
