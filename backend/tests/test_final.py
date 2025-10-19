import requests

try:
    response = requests.options(
        'http://localhost:8000/api/strategies', 
        headers={'Origin': 'http://localhost:8082'}
    )
    print(f'Port 8000 CORS Status: {response.status_code}')
    origin_headers = [h for h in response.headers.items() if 'access-control-allow-origin' in h[0].lower()]
    print(f'Origin headers: {origin_headers}')
    
    if response.status_code == 200 and origin_headers:
        print('✅ CORS working on port 8000!')
    else:
        print('❌ CORS not working on port 8000')
        
except Exception as e:
    print(f'Error: {e}')