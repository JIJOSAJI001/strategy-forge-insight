import requests

def test_cors_port_8001():
    """Test CORS for port 8001"""
    print("🔍 Testing CORS for port 8001...")
    print("=" * 40)
    
    try:
        # Test OPTIONS request to /api/strategies on port 8001
        headers = {
            'Origin': 'http://localhost:8082',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization,Content-Type'
        }
        response = requests.options('http://localhost:8001/api/strategies', headers=headers)
        print(f'Status: {response.status_code}')
        cors_headers = [h for h in response.headers.items() if 'access-control' in h[0].lower()]
        print(f'CORS Headers: {cors_headers}')
        
        if response.status_code == 200 and any('access-control-allow-origin' in h[0].lower() for h in cors_headers):
            print('✅ CORS working for port 8001')
        else:
            print('❌ CORS issue for port 8001')
            
        # Also test a simple GET request
        print("\nTesting GET request...")
        response = requests.get('http://localhost:8001/api/strategies', headers={'Origin': 'http://localhost:8082'})
        print(f'GET Status: {response.status_code}')
        cors_headers = [h for h in response.headers.items() if 'access-control' in h[0].lower()]
        print(f'GET CORS Headers: {cors_headers}')
            
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_cors_port_8001()