import requests

def test_port_8082():
    try:
        response = requests.options(
            'http://localhost:8000/api/users/me',
            headers={
                'Origin': 'http://localhost:8082',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Authorization,Content-Type'
            }
        )
        print(f'Status: {response.status_code}')
        cors_headers = [h for h in response.headers.items() if 'access-control' in h[0].lower()]
        print(f'CORS Headers: {cors_headers}')
        
        if response.status_code == 200:
            print('✅ CORS working for port 8082')
        else:
            print('❌ CORS issue for port 8082')
            
    except Exception as e:
        print(f'Error: {e}')

if __name__ == '__main__':
    test_port_8082()