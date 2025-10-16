"""
API Testing Script
Test all new endpoints to verify implementation
"""
import requests
import json
from datetime import datetime, timedelta

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_TOKEN = ""  # Replace with actual admin token
USER_TOKEN = ""   # Replace with actual user token

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_test(name, passed, details=""):
    """Print test result"""
    status = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"    {details}")


def test_health_check():
    """Test basic health endpoint"""
    print(f"\n{BLUE}=== Testing Health Check ==={RESET}")
    try:
        response = requests.get(f"{BASE_URL}/health")
        passed = response.status_code == 200
        print_test("Health Check", passed, f"Status: {response.status_code}")
        if passed:
            print(f"    Response: {response.json()}")
        return passed
    except Exception as e:
        print_test("Health Check", False, str(e))
        return False


def test_admin_list_market_data(token):
    """Test listing cached market data"""
    print(f"\n{BLUE}=== Testing Admin - List Market Data ==={RESET}")
    if not token:
        print_test("List Market Data", False, "Admin token not provided")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/admin/market-data", headers=headers)
        passed = response.status_code == 200
        print_test("List Market Data", passed, f"Status: {response.status_code}")
        if passed:
            data = response.json()
            print(f"    Found {len(data)} cached symbols")
            if data:
                print(f"    First entry: {data[0]}")
        return passed
    except Exception as e:
        print_test("List Market Data", False, str(e))
        return False


def test_admin_sync_market_data(token):
    """Test syncing market data"""
    print(f"\n{BLUE}=== Testing Admin - Sync Market Data ==={RESET}")
    if not token:
        print_test("Sync Market Data", False, "Admin token not provided")
        return False
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Sync last 7 days of NIFTY data
        end_date = datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        payload = {
            "symbol": "NIFTY",
            "timeframe": "1d",
            "start_date": start_date,
            "end_date": end_date,
            "force_refresh": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/market-data/sync",
            headers=headers,
            json=payload
        )
        
        passed = response.status_code == 200
        print_test("Sync Market Data", passed, f"Status: {response.status_code}")
        if passed:
            data = response.json()
            print(f"    Success: {data.get('success')}")
            print(f"    Records fetched: {data.get('records_fetched')}")
            print(f"    Records merged: {data.get('records_merged')}")
        else:
            print(f"    Error: {response.text}")
        return passed
    except Exception as e:
        print_test("Sync Market Data", False, str(e))
        return False


def test_admin_stats(token):
    """Test market data statistics"""
    print(f"\n{BLUE}=== Testing Admin - Market Data Stats ==={RESET}")
    if not token:
        print_test("Market Data Stats", False, "Admin token not provided")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/api/admin/market-data/stats", headers=headers)
        passed = response.status_code == 200
        print_test("Market Data Stats", passed, f"Status: {response.status_code}")
        if passed:
            data = response.json()
            print(f"    Total symbols: {data.get('total_symbols')}")
            print(f"    Total records: {data.get('total_records')}")
            print(f"    Cache entries: {data.get('total_cache_entries')}")
        return passed
    except Exception as e:
        print_test("Market Data Stats", False, str(e))
        return False


def test_admin_activity_logs(token):
    """Test admin activity logs"""
    print(f"\n{BLUE}=== Testing Admin - Activity Logs ==={RESET}")
    if not token:
        print_test("Activity Logs", False, "Admin token not provided")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/admin/market-data/activity-logs?limit=5",
            headers=headers
        )
        passed = response.status_code == 200
        print_test("Activity Logs", passed, f"Status: {response.status_code}")
        if passed:
            data = response.json()
            print(f"    Found {data.get('count')} logs")
            if data.get('logs'):
                latest = data['logs'][0]
                print(f"    Latest: {latest.get('action')} on {latest.get('target')}")
        return passed
    except Exception as e:
        print_test("Activity Logs", False, str(e))
        return False


def test_retail_backtest_history(token):
    """Test backtest history"""
    print(f"\n{BLUE}=== Testing Retail - Backtest History ==={RESET}")
    if not token:
        print_test("Backtest History", False, "User token not provided")
        return False
    
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            f"{BASE_URL}/api/retail/backtest/history?limit=5",
            headers=headers
        )
        passed = response.status_code == 200
        print_test("Backtest History", passed, f"Status: {response.status_code}")
        if passed:
            data = response.json()
            print(f"    Found {data.get('count')} backtests")
            print(f"    Total: {data.get('total')}")
        return passed
    except Exception as e:
        print_test("Backtest History", False, str(e))
        return False


def test_api_docs():
    """Test API documentation endpoint"""
    print(f"\n{BLUE}=== Testing API Documentation ==={RESET}")
    try:
        response = requests.get(f"{BASE_URL}/docs")
        passed = response.status_code == 200
        print_test("API Docs", passed, f"Status: {response.status_code}")
        if passed:
            print(f"    Documentation available at: {BASE_URL}/docs")
        return passed
    except Exception as e:
        print_test("API Docs", False, str(e))
        return False


def main():
    """Run all tests"""
    print(f"\n{YELLOW}{'='*60}{RESET}")
    print(f"{YELLOW}Strategy Forge Backend API Test Suite{RESET}")
    print(f"{YELLOW}{'='*60}{RESET}")
    
    if not ADMIN_TOKEN or not USER_TOKEN:
        print(f"\n{YELLOW}⚠️  Warning: Tokens not configured{RESET}")
        print("Please set ADMIN_TOKEN and USER_TOKEN in this script")
        print("You can still run tests that don't require authentication\n")
    
    results = []
    
    # Public endpoints
    results.append(("Health Check", test_health_check()))
    results.append(("API Docs", test_api_docs()))
    
    # Admin endpoints
    if ADMIN_TOKEN:
        results.append(("Admin - List Market Data", test_admin_list_market_data(ADMIN_TOKEN)))
        results.append(("Admin - Sync Market Data", test_admin_sync_market_data(ADMIN_TOKEN)))
        results.append(("Admin - Stats", test_admin_stats(ADMIN_TOKEN)))
        results.append(("Admin - Activity Logs", test_admin_activity_logs(ADMIN_TOKEN)))
    else:
        print(f"\n{YELLOW}⏭️  Skipping admin tests (no token){RESET}")
    
    # Retail endpoints
    if USER_TOKEN:
        results.append(("Retail - Backtest History", test_retail_backtest_history(USER_TOKEN)))
    else:
        print(f"\n{YELLOW}⏭️  Skipping retail tests (no token){RESET}")
    
    # Summary
    print(f"\n{YELLOW}{'='*60}{RESET}")
    print(f"{YELLOW}Test Summary{RESET}")
    print(f"{YELLOW}{'='*60}{RESET}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{GREEN}✅{RESET}" if result else f"{RED}❌{RESET}"
        print(f"{status} {name}")
    
    print(f"\n{BLUE}Total: {passed}/{total} tests passed{RESET}")
    
    if passed == total:
        print(f"{GREEN}🎉 All tests passed!{RESET}")
    elif passed > 0:
        print(f"{YELLOW}⚠️  Some tests failed{RESET}")
    else:
        print(f"{RED}❌ All tests failed - check server status{RESET}")
    
    print(f"\n{BLUE}Next Steps:{RESET}")
    print("1. Set ADMIN_TOKEN and USER_TOKEN in this script")
    print("2. Run: python scripts/test_api.py")
    print("3. Check API docs at: http://localhost:8000/docs")
    print("4. Review QUICKSTART.md for more examples")


if __name__ == "__main__":
    main()
