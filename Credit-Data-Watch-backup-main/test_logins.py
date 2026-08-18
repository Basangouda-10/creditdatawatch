import requests 
BASE = 'http://localhost:8000' 
creds = [ 
    ('payalshinde906@gmail.com', 'AdminPass123!', 'MASTER_ADMIN'), 
    ('ops@cdw.test', 'Ops@12345', 'OPERATIONS'), 
    ('fin@cdw.test', 'Fin@12345', 'FINANCIAL'), 
    ('legal@cdw.test', 'Legal@12345', 'LEGAL'), 
] 
tokens = {} 
for email, pwd, expected_role in creds: 
    r = requests.post(f'{BASE}/api/v1/auth/login', 
        json={'email': email, 'password': pwd, 'gstin': '22AAAAD0000A1Z5'}) 
    if r.status_code == 200: 
        d = r.json()['data'] 
        tokens[expected_role] = d['access_token'] 
        actual_role = d.get('user', {}).get('role', 'UNKNOWN') 
        print(f'OK  {email} | role={actual_role} | expected={expected_role} | match={actual_role==expected_role}') 
    else: 
        print(f'FAIL  {email}: {r.status_code} {r.text[:100]}')