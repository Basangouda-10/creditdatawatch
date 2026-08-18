import requests

print("=== TESTING LEGAL DASHBOARD ===")

# Step 1: Login as legal@test.com
login_r = requests.post("http://localhost:8000/api/v1/auth/login", json={
    "email": "legal@test.com",
    "password": "Test@1234",
    "gstin": "22AAAAD0000A1Z5"
})
print(f"Login status: {login_r.status_code}")
login_data = login_r.json()
token = login_data['data']['tokens']['access_token']
print(f"\n✅ Got token: {token[:60]}...")

# Step 2: Call /api/v1/workflow/my-tasks
my_tasks_r = requests.get("http://localhost:8000/api/v1/workflow/my-tasks", 
    headers={"Authorization": f"Bearer {token}"})
print(f"\nmy-tasks status: {my_tasks_r.status_code}")

if my_tasks_r.status_code == 200:
    my_tasks_data = my_tasks_r.json()
    print(f"\n✅ my-tasks data keys: {list(my_tasks_data['data'].keys())}")
    
    legal_reqs = my_tasks_data['data'].get('legal_requests', [])
    print(f"\n✅ Legal requests count: {len(legal_reqs)}")
    
    for i, req in enumerate(legal_reqs):
        print(f"\n  Request {i+1}:")
        for k, v in req.items():
            print(f"    {k:30} = {v}")
else:
    print(f"\n❌ my-tasks failed: {my_tasks_r.text}")

print("\n=== DONE ===")