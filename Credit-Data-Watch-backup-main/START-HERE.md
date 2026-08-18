# Configuration & Admin System - Complete Reference

## 📌 Where to Start?

**Just want to get started?** → [ADMIN-QUICKSTART.md](ADMIN-QUICKSTART.md)  
**Need all the details?** → [docs/ADMIN-SETUP.md](docs/ADMIN-SETUP.md)  
**Want to understand the fixes?** → [FIXES-SUMMARY.md](FIXES-SUMMARY.md)  
**See the full status?** → [CONFIG-COMPLETE.md](CONFIG-COMPLETE.md)  

---

## 📚 Documentation Map

### For Quick Setup
| Document | Purpose | Read Time |
|----------|---------|-----------|
| [ADMIN-QUICKSTART.md](ADMIN-QUICKSTART.md) | Copy-paste .env + 3 steps | 5 min |
| [.env](.env) | Pre-fixed environment file | 2 min |

### For Complete Understanding
| Document | Purpose | Read Time |
|----------|---------|-----------|
| [CONFIG-COMPLETE.md](CONFIG-COMPLETE.md) | Full overview of all changes | 10 min |
| [FIXES-SUMMARY.md](FIXES-SUMMARY.md) | Detailed explanation of each fix | 15 min |
| [docs/ADMIN-SETUP.md](docs/ADMIN-SETUP.md) | Production-ready admin guide | 20 min |
| [ADMIN-ARCHITECTURE.md](ADMIN-ARCHITECTURE.md) | Visual diagrams & flows | 10 min |

### Project Documentation (Existing)
| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Project overview |
| [docs/SETUP-GUIDE.md](docs/SETUP-GUIDE.md) | General setup |
| [server/BACKEND_SETUP_GUIDE.md](server/BACKEND_SETUP_GUIDE.md) | Backend setup |

---

## 🔧 What Was Fixed

### Configuration Errors (5 issues)
```
✓ SMTP Port: 465 → 587 (Gmail TLS standard)
✓ OTP Provider: mock → smtp (actually sends OTPs)
✓ Missing: GOOGLE_SERVICE_ACCOUNT_FILE (added)
✓ CORS Origins: 2 → 4 localhost ports
✓ Missing: Admin configuration system (created)
```

### Admin System (Complete Implementation)
```
✓ .env variables for admin credentials
✓ config.py updated with admin fields
✓ seed_admin.py script for user creation
✓ setup.py unified setup script
✓ Complete documentation & guides
✓ Security best practices
✓ Troubleshooting guide
```

---

## 📂 Files Created/Updated

### ✨ Created (7 files)
```
Root/
├── .env                          Configuration with all fixes
├── ADMIN-QUICKSTART.md           Copy-paste setup guide
├── FIXES-SUMMARY.md              Detailed fix explanations
├── CONFIG-COMPLETE.md            Full completion status
├── ADMIN-ARCHITECTURE.md         Visual diagrams

docs/
└── ADMIN-SETUP.md                Comprehensive admin guide

server/
├── setup.py                       Unified setup script
└── app/scripts/
    └── seed_admin.py             Admin seeding script
```

### 🔧 Updated (2 files)
```
server/app/
├── config.py                     Added admin configuration fields
└── scripts/__init__.py           Export seed_admin function
```

---

## 🚀 3-Step Quick Start

### 1️⃣ Configure
```env
# Edit .env with your values
ADMIN_GSTIN=27AABCD1234H1Z0
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=YourPassword
ADMIN_COMPANY_NAME=Your Company
ADMIN_PHONE=+919999999999
```

### 2️⃣ Setup
```bash
cd server
python setup.py
```

### 3️⃣ Login
```bash
POST /api/v1/auth/login
{ "gstin": "27AABCD1234H1Z0", "password": "YourPassword" }
```

---

## 📖 Detailed Guides

### For Development
```
Start with:
1. ADMIN-QUICKSTART.md    (5 min)
2. CONFIG-COMPLETE.md     (10 min)
3. ADMIN-ARCHITECTURE.md  (10 min)

Run setup:
$ cd server
$ python setup.py
```

### For Production
```
Start with:
1. CONFIG-COMPLETE.md          (10 min)
2. docs/ADMIN-SETUP.md         (20 min)
3. ADMIN-ARCHITECTURE.md       (10 min)

Checklist in ADMIN-SETUP.md
- Generate new SECRET_KEY
- Set COOKIE_SECURE=true
- Update CORS_ORIGINS
- Use strong admin password
```

### For Operations/DevOps
```
Start with:
1. docs/ADMIN-SETUP.md#production-checklist
2. docs/ADMIN-SETUP.md#database-admin-role-schema
3. docs/ADMIN-SETUP.md#troubleshooting

Database queries included for:
- Check admin users
- Update user roles
- List all plans
```

---

## 🎯 Common Tasks

### Create Admin User
```bash
cd server
python -m app.scripts.seed_admin
```

### Create Additional Plans
```bash
curl -X POST http://localhost:8000/api/v1/admin/plans \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom",
    "display_name": "Custom Plan",
    "price": 10000,
    "validity_days": 365,
    "follow_up_limit": 100,
    "legal_assistance_limit": 50
  }'
```

### Make User Admin
```bash
curl -X PUT http://localhost:8000/api/v1/admin/users/{user_id}/role \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

### View System Analytics
```bash
curl http://localhost:8000/api/v1/admin/analytics/subscriptions \
  -H "Authorization: Bearer <admin_token>"
```

### Check Admin in Database
```bash
cd server
python -c "
import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def test():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text('SELECT gstin, email, role FROM users WHERE role=\"admin\"')
        )
        for row in result.fetchall():
            print(f'Admin: {row[1]} ({row[0]}) - Role: {row[2]}')

asyncio.run(test())
"
```

---

## ⚠️ Important Notes

### Security
- **Never commit `.env` to version control**
- **Generate new `SECRET_KEY` for production** (see ADMIN-SETUP.md)
- **Use strong admin passwords** (12+ characters)
- **Enable `COOKIE_SECURE=true` in production**

### Migration
- **Admin seeding is idempotent** (safe to run multiple times)
- **Existing admins won't be overwritten**
- **Database must exist and be accessible**

### Compatibility
- **Python 3.9+**
- **PostgreSQL with asyncpg**
- **FastAPI 0.104+**

---

## 📊 Status Matrix

| Component | Status | Location |
|-----------|--------|----------|
| SMTP Port Fixed | ✅ | .env:18 |
| OTP Provider Fixed | ✅ | .env:31 |
| Google Service Account | ✅ | .env:24 |
| CORS Expanded | ✅ | .env:37 |
| Admin Config | ✅ | .env:46-50 |
| Admin Script | ✅ | server/app/scripts/seed_admin.py |
| Setup Script | ✅ | server/setup.py |
| Documentation | ✅ | docs/ADMIN-SETUP.md |
| Quick Guide | ✅ | ADMIN-QUICKSTART.md |
| Architecture Docs | ✅ | ADMIN-ARCHITECTURE.md |

---

## 🆘 Support

### Can't login?
See: [docs/ADMIN-SETUP.md#troubleshooting](docs/ADMIN-SETUP.md#troubleshooting)

### Setup failed?
See: [ADMIN-QUICKSTART.md#troubleshooting](ADMIN-QUICKSTART.md#troubleshooting)

### Need details?
See: [FIXES-SUMMARY.md](FIXES-SUMMARY.md)

### Want architecture info?
See: [ADMIN-ARCHITECTURE.md](ADMIN-ARCHITECTURE.md)

---

## 📞 Quick Links

- 📄 [.env Configuration](.env)
- 🚀 [Quick Start Guide](ADMIN-QUICKSTART.md)
- 📋 [Complete Setup Guide](docs/ADMIN-SETUP.md)
- 🔍 [Fix Details](FIXES-SUMMARY.md)
- 📊 [Status Report](CONFIG-COMPLETE.md)
- 🏗️ [Architecture](ADMIN-ARCHITECTURE.md)

---

**Status: ✅ All configuration errors fixed | Admin system fully implemented | Ready for deployment**

*Last updated: 2024 | Version: 1.0*



 CreditDataWatch — How To Use (Quick Start)
Step 1 — Start the servers

Start backend: open terminal in server/ folder → python main.py
Start frontend: open terminal in client/ folder → npm run dev
Frontend runs on localhost:3001, backend on localhost:8000

Step 2 — Register your company

Go to localhost:3001/register
Enter company name, GSTIN, email, password
First person to register with a GSTIN becomes MASTER_ADMIN
Note: payalshinde906@gmail.com is the developer account — always has full access

Step 3 — Login

Go to localhost:3001/login
Use email + password OR email + OTP
After login you land on the Dashboard

Step 4 — Add Purchase Orders

Go to Purchase Orders from the navbar
Fill in: PO Number, Vendor Name, GSTIN, Email, Phone, Amount, Due Date, Payment Window
Click Save PO
PO appears in the table with Days Left and Status calculated automatically

Step 5 — Manage POs

✅ Mark as Paid — closes the PO
✏️ Edit — update any field (asks for reason, gets logged)
📧 Send Reminder — sends email to vendor
⚖️ Legal Support — notifies legal team
🗄️ Archive — hides from main view
🗑️ Delete — permanently removes (asks for reason, gets logged)

Step 6 — Check Credibility

Go to Credibility Index from navbar
See Direct Trade Reliability — your business history with vendors
See Network Trust Intelligence — platform-wide star ratings + AI risk verdict

Step 7 — Invite Team Members

Go to localhost:3001/admin/team
Enter email, select role (OPERATIONS / ADMIN / LEGAL etc.), set expiry hours
Click Send Invitation — email sent automatically
Invited person clicks link → fills password → joins your company

Step 8 — View Audit Logs (MASTER_ADMIN only)

Go to localhost:3001/audit-logs
See all PO actions — who deleted/updated what and when
Filter by action type, date, user or PO number

Step 9 — Check Subscription

Go to Membership from navbar
View current plan and status
Upgrade plan to unlock more features