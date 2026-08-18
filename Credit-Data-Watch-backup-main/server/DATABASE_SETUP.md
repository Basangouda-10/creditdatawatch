# Database Setup Guide

## Error: `[Errno 11001] getaddrinfo failed`

This error means the server cannot connect to PostgreSQL. Follow the steps below to fix it.

## Option 1: Install and Setup PostgreSQL (Recommended for Production)

### Step 1: Install PostgreSQL

**Windows:**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Default port is `5432`

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Step 2: Create Database and User

**Windows (using pgAdmin or Command Prompt):**
1. Open pgAdmin (installed with PostgreSQL)
2. Connect to PostgreSQL server
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `creditdatawatch`
5. Click "Save"

**Or using Command Line (psql):**
```bash
# Open Command Prompt (Windows) or Terminal (Mac/Linux)
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE creditdatawatch;

# Create user (optional, or use postgres user)
CREATE USER credituser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE creditdatawatch TO credituser;

# Exit
\q
```

### Step 3: Configure DATABASE_URL

Create a `.env` file in the `server` directory:

```env
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/creditdatawatch
```

Replace:
- `postgres` with your PostgreSQL username (usually `postgres`)
- `your_password` with your PostgreSQL password
- `localhost:5432` with your database host and port (default is `localhost:5432`)
- `creditdatawatch` with your database name

### Step 4: Test Connection

Restart your server:
```bash
python main.py
```

You should see:
```
INFO: Database tables created/verified
```

Instead of:
```
WARNING: Database connection failed during startup
```

---

## Option 2: Use SQLite for Development (Quick Setup)

If you don't want to install PostgreSQL, you can use SQLite for development.

### Step 1: Update Database Configuration

Edit `server/app/database.py`:

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings
import os

# Use SQLite for development if DATABASE_URL is not set or points to localhost
if not settings.DATABASE_URL or "localhost" in settings.DATABASE_URL:
    # Use SQLite
    database_path = os.path.join(os.path.dirname(__file__), "..", "creditdatawatch.db")
    DATABASE_URL = f"sqlite+aiosqlite:///{database_path}"
else:
    DATABASE_URL = settings.DATABASE_URL

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
```

**Note:** You'll need to install `aiosqlite`:
```bash
pip install aiosqlite
```

### Step 2: Update requirements.txt

Add `aiosqlite` to `server/requirements.txt`

---

## Option 3: Use Cloud Database (Neon, Supabase, etc.)

### Using Neon (Free PostgreSQL in the cloud)

1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project
4. Copy the connection string (it looks like):
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb
   ```
5. Convert it to asyncpg format:
   ```
   postgresql+asyncpg://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb
   ```
6. Add to `.env` file:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb
   ```

### Using Supabase

1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Convert to asyncpg format and add to `.env`

---

## Quick Fix: Create .env File

Create a file named `.env` in the `server` directory with:

```env
# For local PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/creditdatawatch

# OR for Neon (cloud)
# DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb

# JWT Secret (change this!)
SECRET_KEY=your-super-secret-key-change-this-in-production

# Environment
ENVIRONMENT=development
LOG_LEVEL=INFO
```

**Important:** Replace `postgres:postgres` with your actual PostgreSQL username and password!

---

## Verify Database Connection

After setting up, test the connection:

```python
# Create a test file: server/test_db.py
import asyncio
from app.database import engine
from sqlalchemy import text

async def test_connection():
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            print(f"Result: {result.scalar()}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())
```

Run it:
```bash
python test_db.py
```

---

## Troubleshooting

### Error: "password authentication failed"
- Check your PostgreSQL password
- Make sure the username is correct

### Error: "database does not exist"
- Create the database: `CREATE DATABASE creditdatawatch;`

### Error: "connection refused"
- Make sure PostgreSQL is running:
  - Windows: Check Services → PostgreSQL
  - Mac: `brew services list`
  - Linux: `sudo systemctl status postgresql`

### Error: "could not connect to server"
- Check if PostgreSQL is listening on port 5432
- Check firewall settings
- Verify the host and port in DATABASE_URL

---

## Next Steps

1. ✅ Create `.env` file with correct DATABASE_URL
2. ✅ Ensure PostgreSQL is running
3. ✅ Create the database
4. ✅ Restart the server
5. ✅ Test login/registration

The error should be resolved once the database is properly configured!

