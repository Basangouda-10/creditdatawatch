import requests
import sys

def final_health_check():
    BASE_URL = 'http://localhost:8000/api/v1'
    print('=== FINAL API HEALTH CHECK ===')
    
    try:
        # Login
        login = requests.post(f'{BASE_URL}/auth/login', 
            json={'email':'payalshinde906@gmail.com','password':'AdminPass123!','gstin':'22AAAAD0000A1Z5'})
        
        if login.status_code != 200:
            print(f"❌ Login Failed: {login.status_code} {login.text}")
            return

        token = login.json()['data']['tokens']['access_token']
        headers = {'Authorization': f'Bearer {token}'} 
        
        # Test all endpoints 
        tests = [ 
            ('GET', '/workflow/my-tasks'), 
            ('GET', '/workflow/notifications'), 
            ('GET', '/audit-logs'), 
            ('GET', '/purchase-orders'), 
            ('GET', '/credibility'), 
        ] 
        
        for method, path in tests: 
            try: 
                r = requests.get(f'{BASE_URL}{path}', headers=headers, timeout=5) 
                status = '✅' if r.status_code < 400 else '❌' 
                print(f'{status} {method} {path} → {r.status_code}') 
            except Exception as e: 
                print(f'❌ {method} {path} → ERROR: {e}') 
    except Exception as e:
        print(f"❌ Check Failed: {e}")

if __name__ == "__main__":
    final_health_check()
