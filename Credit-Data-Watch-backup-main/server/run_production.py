from waitress import serve
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.main import app

if __name__ == '__main__':
    print("Starting CreditDataWatch on port 8000...")
    serve(app, host='127.0.0.1', port=8000)