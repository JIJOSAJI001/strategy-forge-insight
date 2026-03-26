from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

from api.strategy import router as strategy_router
from api.data import router as data_router
from api.backtest import router as backtest_router
from api.users import router as users_router
from api.admin_market_data import router as admin_market_data_router
from api.retail_backtest import router as retail_backtest_router
from api.dashboard import router as dashboard_router
from api.ai import router as ai_router
from auth_mongodb import initialize_firebase
from db.mongo import MongoDB
from core.redis_setup import RedisCache


load_dotenv()

app = FastAPI(
    title="Strategy Forge API",
    description="Backend API for Strategy Forge application",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "https://strategy-forge-insight.vercel.app",
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
        "Access-Control-Request-Headers",
    ],
    expose_headers=["*"],
)


app.include_router(strategy_router, prefix="/api", tags=["strategies"])
app.include_router(data_router, prefix="/api")
app.include_router(backtest_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api", tags=["dashboard"])
app.include_router(ai_router, prefix="/api", tags=["ai"])
# app.include_router(admin_market_data_router, prefix="/api", tags=["admin"])
app.include_router(retail_backtest_router, prefix="/api", tags=["retail"])


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
        await MongoDB.connect_to_mongo()
        print("MongoDB connected")

        await RedisCache.connect_to_redis()
        if RedisCache.is_connected():
            print("Redis cache enabled")
        else:
            print("Redis cache disabled (continuing without caching)")

        print("Environment check:")
        print(f"  MONGODB_URI: {'Set' if os.getenv('MONGODB_URI') else 'Missing'}")
        print(
            "  GOOGLE_APPLICATION_CREDENTIALS: "
            f"{'Set' if os.getenv('GOOGLE_APPLICATION_CREDENTIALS') else 'Missing'}"
        )
        print(f"  FIREBASE_PROJECT_ID: {'Set' if os.getenv('FIREBASE_PROJECT_ID') else 'Missing'}")
        print(
            f"  REDIS_URL: {'Set' if os.getenv('REDIS_URL') else 'Using default (localhost:6379)'}"
        )

        initialize_firebase()
        print("Firebase initialized")

        print("\n" + "=" * 60)
        print("Strategy Forge API Started Successfully")
        print("=" * 60)
        print("\nAvailable API Routes:")
        print("  Retail Routes:")
        print("    POST   /api/retail/backtest/run       - Run backtest on strategy")
        print("    GET    /api/retail/backtest/history   - Get backtest history")
        print("    GET    /api/retail/backtest/{id}      - Get backtest details")
        print("    DELETE /api/retail/backtest/{id}      - Delete backtest")
        print("\n  AI Routes:")
        print("    POST   /api/ai/analyze-strategy/{strategy_id}")
        print("    POST   /api/ai/analyze-paper-session/{session_id}")
        print("    POST   /api/ai/chat")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"Startup failed: {e}")
        import traceback

        traceback.print_exc()


@app.on_event("shutdown")
async def on_shutdown():
    await MongoDB.close_mongo_connection()
    await RedisCache.close_redis_connection()
    print("API server shutdown")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
