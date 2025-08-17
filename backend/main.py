from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.strategy import router as strategy_router
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

# MongoDB connection will be handled directly in the API routes

@app.get("/")
async def root():
    return {"message": "Strategy Forge API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True) 