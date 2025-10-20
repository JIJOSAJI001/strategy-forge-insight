from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import motor.motor_asyncio

app = FastAPI(title="Final Strategy API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "http://localhost:8080", 
        "http://127.0.0.1:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Final Strategy API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/strategies")
async def get_strategies():
    """Fetch all strategies from MongoDB Atlas"""
    try:
        # Create connection
        client = motor.motor_asyncio.AsyncIOMotorClient(
            "mongodb+srv://admin:6235826893@cluster0.verow7n.mongodb.net/strategy_forge?retryWrites=true&w=majority&appName=Cluster0"
        )
        
        # Get database and collection
        db = client.get_database("strategy_forge")
        collection = db.get_collection("strategies")
        
        # Fetch strategies
        cursor = collection.find({})
        strategies = []
        
        async for strategy in cursor:
            # Convert ObjectId to string
            strategy["_id"] = str(strategy["_id"])
            strategies.append(strategy)
        
        # Close connection
        client.close()
        
        return strategies
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Error details: {error_details}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch strategies: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 