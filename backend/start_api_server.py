"""
Simple API Server Starter
Runs the working_api.py with proper async handling
"""
import uvicorn
import asyncio
import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    print("=" * 60)
    print("Starting Strategy Forge API Server")
    print("=" * 60)
    print(f"Server URL: http://localhost:8001")
    print(f"API Endpoint: http://localhost:8001/api/strategies")
    print(f"Health Check: http://localhost:8001/health")
    print("=" * 60)
    print("\nPress CTRL+C to stop the server\n")
    
    try:
        uvicorn.run(
            "working_api:app",
            host="0.0.0.0",
            port=8001,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
