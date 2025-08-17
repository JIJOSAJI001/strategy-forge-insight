import requests
import json

def debug_api():
    base_url = "http://localhost:8000"
    
    print("🔍 Debugging Strategy Forge API...")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health check - Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Health check: PASSED")
        else:
            print(f"❌ Health check: FAILED - {response.text}")
    except Exception as e:
        print(f"❌ Health check: ERROR - {e}")
    
    # Test strategies endpoint
    try:
        print(f"\nTesting strategies endpoint: {base_url}/api/strategies")
        response = requests.get(f"{base_url}/api/strategies")
        print(f"Strategies API - Status: {response.status_code}")
        
        if response.status_code == 200:
            strategies = response.json()
            print(f"✅ Strategies API: PASSED - Found {len(strategies)} strategies")
            
            # Show first strategy details
            if strategies:
                first_strategy = strategies[0]
                print(f"📋 Sample Strategy: {first_strategy['title']}")
                print(f"   Performance: {first_strategy['performance']}%")
                print(f"   Rating: {first_strategy['rating']}")
        else:
            print(f"❌ Strategies API: FAILED - Status {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Strategies API: ERROR - {e}")
        print(f"Error type: {type(e)}")
    
    print("\n🎉 Debug Complete!")

if __name__ == "__main__":
    debug_api() 