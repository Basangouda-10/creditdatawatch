import asyncio
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_ROOT = os.path.dirname(CURRENT_DIR)
if SERVER_ROOT not in sys.path:
    sys.path.insert(0, SERVER_ROOT)

from app.main import _ensure_dev_admin  # type: ignore

if __name__ == "__main__":
    asyncio.run(_ensure_dev_admin())
    print("Developer admin ensured")
