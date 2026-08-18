"""
Minimal test of auth route
"""
import asyncio
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/test")
async def test_route():
    response_data = {
        "success": True,
        "message": "Test successful"
    }
    
    # This is what auth.py is doing
    response = JSONResponse(content=response_data)
    # secure=False is intentional for local HTTP testing; set to True in production
    response.set_cookie(key="test_token", value="test123", secure=False)
    return response

if __name__ == "__main__":
    import uvicorn
    print("Testing JSONResponse with cookies...")
    uvicorn.run(app, host="127.0.0.1", port=8001)
