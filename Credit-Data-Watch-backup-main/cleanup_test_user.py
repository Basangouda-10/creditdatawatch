import sqlite3
import os

db_path = 'server/test.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    email = 'shindepayal296@gmail.com'
    cursor.execute("DELETE FROM users WHERE email = ?", (email,))
    conn.commit()
    print(f"Deleted {cursor.rowcount} rows for {email}")
    conn.close()
else:
    print(f"Database not found at {db_path}")
