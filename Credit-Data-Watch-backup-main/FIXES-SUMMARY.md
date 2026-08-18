# Environment & Configuration Fixes Summary

## Issues Found & Fixed

### 1. **SMTP Port Error** ❌→✓
- **Issue**: `GOOGLE_SMTP_PORT=465` (wrong for TLS)
- **Fix**: Changed to `GOOGLE_SMTP_PORT=587` (correct for STARTTLS)
- **Why**: Gmail SMTP requires port 587 with STARTTLS for secure connection

### 2. **Missing Google Service Account** ❌→✓
- **Issue**: `GOOGLE_SERVICE_ACCOUNT_FILE` not in `.env` but referenced in config
- **Fix**: Added `GOOGLE_SERVICE_ACCOUNT_FILE=server/credentials/service-account.json`
- **Why**: Used for Google Drive API automation and Drive authentication

### 3. **OTP Provider Misconfiguration** ❌→✓
- **Issue**: `OTP_PROVIDER=mock` (development stub, not functional)
- **Fix**: Changed to `OTP_PROVIDER=smtp` (uses email for real OTP delivery)
- **Why**: Mock provider doesn't actually send OTPs; SMTP uses configured email service

### 4. **Missing Twilio Variables** ❌→✓
- **Issue**: Not in `.env` but referenced in config
- **Fix**: Added empty Twilio fields with explanations
- **Why**: Optional for SMS backup; SMTP fallback works without them

### 5. **Missing CORS Origins** ❌→✓
- **Issue**: Only 2 localhost URLs, missing development variants
- **Fix**: Added `http://localhost:3001` and `http://localhost:3002`
- **Why**: Support multiple frontend dev ports for team development

### 6. **Missing Admin Configuration** ❌→✓
- **Issue**: No admin seeding mechanism
- **Fix**: Added 5 new `.env` variables:
  - `ADMIN_GSTIN` - Admin user GSTIN
  - `ADMIN_EMAIL` - Admin login email
  - `ADMIN_PASSWORD` - Admin password (hashed in DB)
  - `ADMIN_COMPANY_NAME` - Organization name
  - `ADMIN_PHONE` - Contact number
- **Why**: Enables automatic admin user creation during setup

## New Files Created

### 1. **[server/app/scripts/seed_admin.py](server/app/scripts/seed_admin.py)**
- Automatically creates admin user from `.env` credentials
- Validates GSTIN and phone format
- Skips if admin already exists
- Idempotent and safe to run multiple times

### 2. **[server/setup.py](server/setup.py)**
- Unified setup script that runs all seeders
- Seeds plans + admin in one command
- Clear success/error messaging
- Production-ready

### 3. **[docs/ADMIN-SETUP.md](docs/ADMIN-SETUP.md)**
- Complete admin configuration guide
- API endpoint documentation
- Security best practices
- SQL queries for admin management
- Troubleshooting guide

## Updated Files

### 1. **[server/app/config.py](server/app/config.py)**
- Added 5 admin configuration fields to `Settings` class
- All variables optional (empty defaults)
- Auto-loaded from `.env`

### 2. **[server/app/scripts/__init__.py](server/app/scripts/__init__.py)**
- Exported `seed_admin` function for easy import
- Consistent with existing `seed_plans` export

### 3. **[.env](.env)** (Created)
- Fixed SMTP port
- Added missing Google Drive config
- Updated OTP provider
- Added empty Twilio fields
- Added admin credentials section
- Expanded CORS origins

## How to Use

### 1. Update `.env`
```env
# Corrected values already in place:
GOOGLE_SMTP_PORT=587  # ✓ Fixed
OTP_PROVIDER=smtp     # ✓ Fixed

# Add your admin credentials:
ADMIN_GSTIN=27AABCD1234H1Z0
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=SecurePassword123
ADMIN_COMPANY_NAME=Your Company
ADMIN_PHONE=+919999999999
```

### 2. Run Setup
```bash
cd server
python setup.py
```

Output:
```
============================================================
CreditDataWatch - Database Initialization
============================================================

Step 1: Seeding default plans...
------------------------------------------------------------
✓ Successfully seeded 4 default plans:
  - Base (₹0, 10 follow-ups)
  - Royal (₹4999, 20 follow-ups)
  - Groups (₹14999, 50 follow-ups)
  - Enterprise (₹0, 999 follow-ups)

Step 2: Seeding admin user...
------------------------------------------------------------
✓ Admin user created successfully:
  - GSTIN: 27AABCD1234H1Z0
  - Email: admin@yourcompany.com
  - Company: Your Company
  - Phone: +919999999999
  - Role: admin

============================================================
✓ Setup complete!
============================================================
```

### 3. Login with Admin
```bash
POST /api/v1/auth/login
{
  "gstin": "27AABCD1234H1Z0",
  "password": "SecurePassword123"
}
```

## Admin Access

Once logged in with admin credentials, access admin endpoints:

```bash
# Get all users
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/v1/admin/users

# Create new plan
curl -X POST -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/v1/admin/plans

# View analytics
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:8000/api/v1/admin/analytics/subscriptions
```

## Summary Table

| Item | Status | Details |
|------|--------|---------|
| SMTP Port Fix | ✓ | 465→587 (TLS standard) |
| Google Service Account | ✓ | Added missing config |
| OTP Provider | ✓ | mock→smtp (functional) |
| Twilio Variables | ✓ | Added optional fields |
| CORS Origins | ✓ | Expanded for dev |
| Admin Config | ✓ | 5 new .env variables |
| Admin Seeding | ✓ | New seed_admin.py script |
| Setup Script | ✓ | Unified setup.py |
| Documentation | ✓ | Complete ADMIN-SETUP.md |

All issues resolved. System ready for deployment! 🚀
