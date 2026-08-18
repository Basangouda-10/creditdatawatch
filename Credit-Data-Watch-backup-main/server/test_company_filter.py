import requests

print("=== TESTING LEGAL DASHBOARD WITH COMPANY FILTER ===")

# Step 1: Login as legal@test.com (Test Company)
print("\n1. Login as legal@test.com...")
login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
    "email": "legal@test.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
})
print(f"   Login status: {login_r.status_code}")

if login_r.status_code == 200:
    login_data = login_r.json()
    token = login_data['data']['tokens']['access_token']
    
    print("\n2. Call my-tasks...")
    my_tasks_r = requests.get(
        "http://localhost:8000/api/v1/workflow/my-tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    print(f"   my-tasks status: {my_tasks_r.status_code}")
    
    if my_tasks_r.status_code == 200:
        my_tasks_data = my_tasks_r.json()
        print(f"\n✅ my-tasks keys: {list(my_tasks_data['data'].keys())}")
        
        legal_reqs = my_tasks_data['data'].get('legal_requests', [])
        print(f"✅ Legal requests count (filtered by company): {len(legal_reqs)}")
        
        for i, req in enumerate(legal_reqs):
            print(f"\nRequest {i+1}:")
            for k, v in req.items():
                print(f"  {k:30} = {v}")

print("\n=== ALL DONE! ===")