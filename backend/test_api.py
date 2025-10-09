import requests
import os

def test_api():
    base_url = "http://localhost:8000"

    # 🔑 Paste your existing Firebase ID token here
    id_token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImU4MWYwNTJhZWYwNDBhOTdjMzlkMjY1MzgxZGU2Y2I0MzRiYzM1ZjMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiSmlqbyBTYWppIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xEcGo5SnpybGY0cVFBNGl6YUlwRGo1MkI5eml3N2VZZk8zcWVORF9YanVHSkVmZz1zOTYtYyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmNvbS9taWNyb3Byb2plY3QyLTdhYzdlIiwiYXVkIjoibWljcm9wcm9qZWN0Mi03YWM3ZSIsImF1dGhfdGltZSI6MTc1OTk0NDkzMSwidXNlcl9pZCI6IkR2NEFpQXhuZkRNYTFvVVlBV3J3eDlpdjZ4RDMiLCJzdWIiOiJEdjRBaUF4bmZETWExb1VZQVdyd3g5aXY2eEQzIiwiaWF0IjoxNzU5OTQ0OTMyLCJleHAiOjE3NTk5NDg1MzIsImVtYWlsIjoiamlqb3NhamkwMDNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMDk1NTk3MjYzMjkwMTY5MTYzMDAiXSwiZW1haWwiOlsiamlqb3NhamkwMDNAZ21haWwuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.F4ASe_GfpcYgaQ5SenncWr8Wimfjn7HN5jWCMZEoAplEhSRXj-yfT1THn-gRPfjPrM1DaeOMU6B8bB-A3-e-bKqDhUPKU5BDkOhTyJpilSsHPjwE4OJelqeRfIoadWuDkoEP4MPqIlCWo33Umwx-9nS8ut4uzy1Zc370S8pxUm1FvuMwApWRxZ-65ZH-_BWCKk0QhYfxa-Py_C6mc5L-uyznSS5om2I3FT_WV7E1ECrCr1sxwnElubS8MykwVbVdr0xHwWJB0AhkoO6DKVYdlCzOIK4nPfrVYz7n9HBrPvl0GOb2-aBVjmornIZI9lebTs7QphS5Uo4yyUZwChErjw"

    print("🧪 Testing Strategy Forge API...")
    print("=" * 50)

    # Step 1: Health Check
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check: PASSED")
        else:
            print(f"❌ Health check: FAILED - Status {response.status_code}")
    except Exception as e:
        print(f"❌ Health check: ERROR - {e}")
        return

    # Step 2: Test Strategies Endpoint (with JWT)
    try:
        headers = {"Authorization": f"Bearer {id_token}"} if id_token else {}
        response = requests.get(f"{base_url}/api/strategies", headers=headers)

        if response.status_code == 200:
            strategies = response.json()
            print(f"✅ Strategies API: PASSED - Found {len(strategies)} strategies")

            if strategies:
                first_strategy = strategies[0]
                print(f"📋 Sample Strategy: {first_strategy.get('title', 'N/A')}")
                print(f"   Performance: {first_strategy.get('performance', 'N/A')}%")
                print(f"   Rating: {first_strategy.get('rating', 'N/A')}")
        elif response.status_code == 401:
            print("❌ Strategies API: FAILED - Unauthorized (Invalid Token or Backend Issue)")
        else:
            print(f"❌ Strategies API: FAILED - Status {response.status_code}")
    except Exception as e:
        print(f"❌ Strategies API: ERROR - {e}")

    print("\n🎉 API Test Complete!")

if __name__ == "__main__":
    test_api()
