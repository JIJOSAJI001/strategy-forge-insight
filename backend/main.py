from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.strategy import router as strategy_router
from api.data import router as data_router
from api.backtest import router as backtest_router
from api.users import router as users_router
from auth_file import initialize_firebase
import uvicorn

app = FastAPI(
    title="Strategy Forge API",
    description="Backend API for Strategy Forge application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:8080", 
        "http://127.0.0.1:8080"
    ],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(strategy_router, prefix="/api", tags=["strategies"])
app.include_router(data_router, prefix="/api")
app.include_router(backtest_router, prefix="/api")
app.include_router(users_router, prefix="/api")

# MongoDB connection will be handled directly in the API routes

@app.on_event("startup")
async def on_startup():
    try:
        initialize_firebase()
        print("✅ Firebase initialized")
    except Exception as e:
        print(f"❌ Firebase initialization failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    print("✅ API server shutdown")


@app.get("/")
async def root():
    return {"message": "Strategy Forge API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) 