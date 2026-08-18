# Quick Start - Fix Database Connection Error

## The Error
```
[Errno 11001] getaddrinfo failed
503 Service Unavailable
```

This means PostgreSQL is not running or not configured.

## Fastest Solution (3 Steps)

### Step 1: Install PostgreSQL

**Windows:**
- Download: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for `postgres` user

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
```

### Step 2: Create Database

Open terminal/command prompt and run:

```bash
# Connect to PostgreSQL
psql -U postgres

# Then run these commands:
CREATE DATABASE creditdatawatch;
\q
```

**Can't find psql?**
- Windows: Use pgAdmin (installed with PostgreSQL)
- Or add PostgreSQL bin folder to PATH

### Step 3: Create .env File

Create a file named `.env` in the `server` folder:

```env
DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/creditdatawatch
```

**Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation!**

### Step 4: Test Connection

```bash
cd server
python test_db_connection.py
```

If you see ✅ SUCCESS, you're done!

### Step 5: Restart Server

```bash
python main.py
```

You should now see:
```
INFO: Database tables created/verified
```

Instead of the error message.

---

## Alternative: Use Cloud Database (No Installation Needed)

### Option A: Neon (Free PostgreSQL)

1. Go to https://neon.tech
2. Sign up (free)
3. Create project
4. Copy connection string
5. Convert format:
   - From: `postgresql://user:pass@host/db`
   - To: `postgresql+asyncpg://user:pass@host/db`
6. Add to `.env`:
   ```env
   DATABASE_URL=postgresql+asyncpg://user:pass@host/db
   ```

### Option B: Supabase (Free PostgreSQL)

1. Go to https://supabase.com
2. Create project
3. Get connection string from Settings → Database
4. Convert to asyncpg format
5. Add to `.env`

---

## Still Having Issues?

1. **Check PostgreSQL is running:**
   - Windows: Services → PostgreSQL
   - Mac: `brew services list`
   - Linux: `sudo systemctl status postgresql`

2. **Verify DATABASE_URL format:**
   ```
   postgresql+asyncpg://username:password@host:port/database
   ```

3. **Test connection:**
   ```bash
   python test_db_connection.py
   ```

4. **Check .env file location:**
   - Must be in `server/` folder
   - Named exactly `.env` (not `.env.txt`)

5. **Common mistakes:**
   - Wrong password
   - Database doesn't exist
   - PostgreSQL not running
   - Wrong port (should be 5432)

---

## Need More Help?

See `DATABASE_SETUP.md` for detailed instructions.

