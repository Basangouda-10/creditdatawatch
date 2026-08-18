import requests
import json

try:
    resp = requests.get("http://localhost:8000/api/v1/subscriptions/plans")
    print(f"Status: {resp.status_code}")
    print(f"Content: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
