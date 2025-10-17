from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.strategy import router as strategy_router
from api.data import router as data_router
from api.backtest import router as backtest_router
from api.users import router as users_router
from api.admin_market_data import router as admin_market_data_router
from api.retail_backtest import router as retail_backtest_router
from api.dashboard import router as dashboard_router
from auth_mongodb import initialize_firebase
from db.mongo import MongoDB
import uvicorn
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Strategy Forge API",
    description="Backend API for Strategy Forge application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Common React dev server port
        "http://127.0.0.1:3000",
        "http://localhost:5173",   # Vite dev server port
        "http://127.0.0.1:5173",
        "http://localhost:8080",   # Alternative dev server port
        "http://127.0.0.1:8080",
        "http://localhost:8082",   # Your current frontend port
        "http://127.0.0.1:8082",
        "http://localhost:4173",   # Vite preview port
        "http://127.0.0.1:4173",
        "http://localhost:8081",   # Additional port
        "http://127.0.0.1:8081"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=["*"],
)

# Include routers
app.include_router(strategy_router, prefix="/api", tags=["strategies"])
app.include_router(data_router, prefix="/api")
app.include_router(backtest_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])
# Temporarily disabled due to pydantic schema issue
# app.include_router(admin_market_data_router, prefix="/api", tags=["admin"])
app.include_router(retail_backtest_router, prefix="/api", tags=["retail"])

# MongoDB connection will be handled directly in the API routes

@app.get("/")
async def root():
    return {"message": "Strategy Forge API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.options("/api/users/me")
async def options_users_me():
    """Explicit OPTIONS handler for /api/users/me endpoint"""
    return {"message": "OPTIONS request successful"}

@app.on_event("startup")
async def on_startup():
    try:
        # Connect to MongoDB
        await MongoDB.connect_to_mongo()
        print("✅ MongoDB connected")
        
        # Verify environment variables are loaded
        print(f"🔧 Environment check:")
        print(f"  MONGODB_URI: {'✅ Set' if os.getenv('MONGODB_URI') else '❌ Missing'}")
        print(f"  GOOGLE_APPLICATION_CREDENTIALS: {'✅ Set' if os.getenv('GOOGLE_APPLICATION_CREDENTIALS') else '❌ Missing'}")
        print(f"  FIREBASE_PROJECT_ID: {'✅ Set' if os.getenv('FIREBASE_PROJECT_ID') else '❌ Missing'}")
        
        initialize_firebase()
        print("✅ Firebase initialized")
        
        print("\n" + "="*60)
        print("🚀 Strategy Forge API Started Successfully!")
        print("="*60)
        print("\n📋 Available API Routes:")
        print("  Admin Routes:")
        print("    GET    /api/admin/market-data         - List cached market data")
        print("    POST   /api/admin/market-data/sync    - Sync market data from Yahoo")
        print("    DELETE /api/admin/market-data         - Delete cached data")
        print("    GET    /api/admin/market-data/stats   - Get cache statistics")
        print("    GET    /api/admin/market-data/activity-logs - Get admin logs")
        print("\n  Retail Routes:")
        print("    POST   /api/retail/backtest/run       - Run backtest on strategy")
        print("    GET    /api/retail/backtest/history   - Get backtest history")
        print("    GET    /api/retail/backtest/{id}      - Get backtest details")
        print("    DELETE /api/retail/backtest/{id}      - Delete backtest")
        print("\n  Other Routes:")
        print("    GET    /api/strategies                - List strategies")
        print("    POST   /api/strategies                - Create strategy")
        print("    GET    /api/data                      - Get market data")
        print("    POST   /api/backtest/run              - Run backtest (legacy)")
        print("    GET    /api/users/me                  - Get current user")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        import traceback
        traceback.print_exc()


@app.on_event("shutdown")
async def on_shutdown():
    await MongoDB.close_mongo_connection()
    print("✅ API server shutdown")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 