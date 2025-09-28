# PowerShell script to create .env file
$envContent = @"
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/strategy_forge
DATABASE_NAME=strategy_forge

# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS=backend/firebase-service-account.json
FIREBASE_PROJECT_ID=microproject2-7ac7e
"@

$envContent | Out-File -FilePath "backend\.env" -Encoding UTF8
Write-Host "Created .env file successfully!"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Download Firebase service account JSON from Firebase Console"
Write-Host "2. Save it as: backend/firebase-service-account.json"
Write-Host "3. Run: python backend/scripts/setup_admin.py"