# Quick Admin Setup Reference Card

## .env Admin Configuration

Copy and customize these values in your `.env` file:

```env
# Admin Configuration (For Initial Seeding)
ADMIN_GSTIN=27AABCD1234H1Z0          # Valid 15-char GSTIN
ADMIN_EMAIL=admin@creditdatawatch.com # Admin login email
ADMIN_PASSWORD=AdminPassword@123      # Hashed in DB (min 6 chars)
ADMIN_COMPANY_NAME=CreditDataWatch    # Organization name
ADMIN_PHONE=+919999999999             # Must include country code
```

## Fixed Environment Variables

| Variable | Old Value | New Value | Reason |
|----------|-----------|-----------|--------|
| GOOGLE_SMTP_PORT | 465 | 587 | Gmail TLS standard |
| OTP_PROVIDER | mock | smtp | Actually sends OTP emails |
| CORS_ORIGINS | 2 URLs | 4 URLs | Include localhost:3001/3002 |
| Missing | — | GOOGLE_SERVICE_ACCOUNT_FILE | Google Drive auth |
| Missing | — | Admin 5 fields | Admin user creation |

## Setup Process (3 Steps)

### 1️⃣ Configure
```env
# Edit .env with your admin credentials
ADMIN_GSTIN=27AABCD1234H1Z0
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=YourPassword
ADMIN_COMPANY_NAME=Your Company
ADMIN_PHONE=+919999999999
```

### 2️⃣ Run Setup
```bash
cd server
python setup.py
```

### 3️⃣ Login
```bash
# Login endpoint
POST /api/v1/auth/login
{
  "gstin": "27AABCD1234H1Z0",
  "password": "YourPassword"
}
```

## Admin Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/v1/admin/users | List all users |
| PUT | /api/v1/admin/users/{id}/role | Update user role |
| POST | /api/v1/admin/plans | Create plan |
| PUT | /api/v1/admin/plans/{id} | Update plan |
| DELETE | /api/v1/admin/plans/{id} | Deactivate plan |
| GET | /api/v1/admin/defaulters/pending | Pending cases |
| PUT | /api/v1/admin/defaulters/{id}/verify | Verify case |
| GET | /api/v1/admin/analytics/subscriptions | Stats |

## Files Changed/Created

**Created:**
- ✨ `server/app/scripts/seed_admin.py` - Admin seeder
- ✨ `server/setup.py` - Unified setup
- ✨ `docs/ADMIN-SETUP.md` - Full guide
- ✨ `.env` - Fixed environment config

**Updated:**
- 🔧 `server/app/config.py` - Added admin fields
- 🔧 `server/app/scripts/__init__.py` - Export seed_admin

## Production Checklist

Before going live:

- [ ] Generate strong `SECRET_KEY`: `openssl rand -hex 32`
- [ ] Set `COOKIE_SECURE=true`
- [ ] Set proper `COOKIE_DOMAIN`
- [ ] Update `CORS_ORIGINS` to production domain
- [ ] Use strong admin password (12+ chars, mixed case)
- [ ] Verify SMTP credentials work
- [ ] Test Google Drive credentials
- [ ] Run full setup: `python setup.py`
- [ ] Test admin login on staging
- [ ] Backup database credentials

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Admin credentials not configured" | Check all 5 ADMIN_* vars are in .env |
| "Invalid GSTIN" | GSTIN must be exactly 15 characters |
| "Invalid phone" | Phone must include country code: +91... |
| "Admin already exists" | Use different GSTIN or manually update DB |
| "SMTP auth failed" | Verify GOOGLE_SMTP_USER/PASSWORD correct |
| "Can't access /admin routes" | Verify token role is "admin" |

## Database Query: Check Admin

```sql
SELECT id, gstin, email, role, is_active, created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;
```

## Need Help?

See detailed guide: [docs/ADMIN-SETUP.md](docs/ADMIN-SETUP.md)
