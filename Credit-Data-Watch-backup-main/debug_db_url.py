
import os
from dotenv import load_dotenv

print("Current directory:", os.getcwd())
print("Files in current dir:", os.listdir())
print("\nChecking server/.env...")
_server_env = os.path.join(os.path.dirname(__file__), 'server', '.env')
print("Server env path:", _server_env)
print("Exists?", os.path.exists(_server_env))

load_dotenv(dotenv_path=_server_env, override=True)
print("\nDATABASE_URL from env:", os.getenv('DATABASE_URL'))
