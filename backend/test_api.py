import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Strategy Forge API...")
    print("=" * 50)
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check: PASSED")
        else:
            print("❌ Health check: FAILED")
    except Exception as e:
        print(f"❌ Health check: ERROR - {e}")
    
    # Test strategies endpoint
    try:
        response = requests.get(f"{base_url}/api/strategies")
        if response.status_code == 200:
            strategies = response.json()
            print(f"✅ Strategies API: PASSED - Found {len(strategies)} strategies")
            
            # Show first strategy details
            if strategies:
                first_strategy = strategies[0]
                print(f"📋 Sample Strategy: {first_strategy['title']}")
                print(f"   Performance: {first_strategy['performance']}%")
                print(f"   Rating: {first_strategy['rating']}")
                print(f"   Category: {first_strategy.get('category', 'N/A')}")
        else:
            print(f"❌ Strategies API: FAILED - Status {response.status_code}")
    except Exception as e:
        print(f"❌ Strategies API: ERROR - {e}")
    
    print("\n🎉 API Test Complete!")
    print("💡 Your frontend should now be able to fetch data from the API")

if __name__ == "__main__":
    test_api() 