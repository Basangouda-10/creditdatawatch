# Admin System Architecture

## Setup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Initial Deployment                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  1. Configure .env with ADMIN_* variables                   │
│                                                              │
│  ADMIN_GSTIN=27AABCD1234H1Z0                               │
│  ADMIN_EMAIL=admin@company.com                             │
│  ADMIN_PASSWORD=AdminPassword@123                          │
│  ADMIN_COMPANY_NAME=Company Name                           │
│  ADMIN_PHONE=+919999999999                                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  2. Run Setup Script                                         │
│                                                              │
│  $ cd server                                                │
│  $ python setup.py                                          │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────┐
                    │  seed_plans()   │
                    │                 │
                    │  Creates:       │
                    │  - Base         │
                    │  - Royal        │
                    │  - Groups       │
                    │  - Enterprise   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  seed_admin()   │
                    │                 │
                    │  Creates:       │
                    │  - Admin user   │
                    │  - role=admin   │
                    │  - Full access  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  Setup Complete │
                    │  Ready for ops  │
                    └─────────────────┘
```

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    User Login (Any User)                      │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  POST /api/v1/auth/login                                      │
│  {                                                             │
│    "gstin": "27AABCD1234H1Z0",                               │
│    "password": "AdminPassword@123"                            │
│  }                                                             │
└──────────────────────────────────────────────────────────────┘
                              ↓
                   ┌──────────────────┐
                   │  Verify Password │
                   │  Generate Token  │
                   └────────┬─────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                      │
    ┌────▼────────┐                    ┌──────▼──────┐
    │  User Token │                    │ Admin Token │
    │  role=user  │                    │ role=admin  │
    │  Limited    │                    │ Full Access │
    └────────────┘                    └─────────────┘
         │                                   │
         ▼                                   ▼
    User Routes:                      Admin Routes:
    ✓ POST /auth/login                ✓ POST /admin/plans
    ✓ POST /auth/register             ✓ PUT /admin/plans/{id}
    ✓ GET /user/profile               ✓ DELETE /admin/plans/{id}
    ✓ POST /defaulters                ✓ GET /admin/users
    ✓ GET /invoices                   ✓ PUT /admin/users/{id}/role
    ✓ POST /appointments              ✓ PUT /admin/defaulters/{id}/verify
    ✗ Cannot access /admin/*          ✓ GET /admin/analytics/*
```

## Admin Endpoint Hierarchy

```
/api/v1/admin/
├── /plans (Plan Management)
│   ├── POST   - Create new plan
│   ├── PUT    - Update plan
│   └── DELETE - Deactivate plan
│
├── /users (User Management)
│   ├── GET         - List all users
│   └── PUT /{id}/role - Update user role
│
├── /defaulters (Verification)
│   ├── GET /pending        - List pending cases
│   └── PUT /{id}/verify    - Approve/reject case
│
└── /analytics (Reporting)
    ├── GET /subscriptions  - Subscription stats
    └── GET /defaulters     - Defaulter stats
```

## Role-Based Access Control

```
┌─────────────────────────────────────────────────────┐
│              User Authentication                     │
└─────────────────────────────────────────────────────┘
                         ↓
            ┌────────────────────────┐
            │   get_current_user()   │
            │   (Check token/cookie) │
            └────────────┬───────────┘
                         ↓
             ┌───────────────────────┐
             │  Extract role field   │
             │  from token payload   │
             └───────────┬───────────┘
                         ↓
         ┌───────────────────────────────┐
         │                               │
    ┌────▼─────┐               ┌────────▼─────┐
    │ role=user │               │ role=admin   │
    │           │               │              │
    │ Limited   │               │ Can access:  │
    │ routes    │               │ - /admin/*   │
    │           │               │ - All routes │
    └───────────┘               └──────────────┘
         │
         └─ require_admin()
            └─ Throws 403 if not admin
```

## Database Relationship

```
┌─────────────────────────────────────────────────────┐
│                      Database                        │
└─────────────────────────────────────────────────────┘
                         ↓
        ┌────────────────────────────────┐
        │         users table            │
        ├────────────────────────────────┤
        │ id (PK)                        │
        │ gstin (unique)                 │
        │ email (unique)                 │
        │ password_hash                  │
        │ role ← ★ KEY FIELD             │
        │ is_active                      │
        └────────────┬───────────────────┘
                     │
        ┌────────────▼────────────┐
        │ role values:            │
        ├─────────────────────────┤
        │ "user"  - Regular user  │
        │ "admin" - Admin user    │
        │         (can call       │
        │          /admin/*)      │
        └─────────────────────────┘
```

## Seeding Process

```
START
  │
  ├─→ Check .env ADMIN_* variables exist
  │   │
  │   ├─→ If missing → SKIP (show warning)
  │   └─→ If present → CONTINUE
  │
  ├─→ Validate GSTIN format (15 chars)
  │   └─→ If invalid → FAIL
  │
  ├─→ Validate phone (has +country code)
  │   └─→ If invalid → FAIL
  │
  ├─→ Query: SELECT * FROM users WHERE gstin = ADMIN_GSTIN
  │   │
  │   ├─→ If exists → UPDATE role to admin
  │   │                (if not already)
  │   │                → SUCCESS
  │   │
  │   └─→ If not exists → CREATE new admin user
  │                       → INSERT into users
  │                       → COMMIT
  │                       → SUCCESS
  │
  └─→ DONE
```

## Configuration Override Precedence

```
Command Line Args
       ↑
       │ (if provided)
       │
Environment Variables (.env)
       ↑
       │ (if set)
       │
Config Default Values (config.py)
       ↑
       │ (built-in)
       │
Base Application (hard-coded)
```

## Security Flow

```
Request
  │
  ├─→ Extract token (header or cookie)
  │   └─→ If missing → 401 Unauthorized
  │
  ├─→ Decode JWT token
  │   └─→ If invalid → 401 Unauthorized
  │   └─→ If expired → 401 Unauthorized
  │
  ├─→ Get user from database
  │   └─→ If not found → 401 Unauthorized
  │   └─→ If not active → 401 Unauthorized
  │
  ├─→ Check route requires admin?
  │   │
  │   ├─→ No → Allow access (user route)
  │   │
  │   └─→ Yes → Check role field
  │       │
  │       ├─→ role == "admin" → Continue
  │       └─→ role == "user"  → 403 Forbidden
  │
  └─→ Route Handler
      └─→ Execute business logic
```

## Error Handling

```
                        Request
                          │
                    ┌─────▼─────┐
                    │Validation │
                    └─────┬─────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼─────┐   ┌─────▼─────┐   ┌─────▼──────┐
    │  Invalid  │   │ Not Admin │   │  DB Error  │
    │  Format   │   │           │   │            │
    └────┬─────┘   └─────┬─────┘   └─────┬──────┘
         │               │                │
    ┌────▼─────┐   ┌─────▼─────┐   ┌─────▼──────┐
    │ 400 Bad  │   │403         │   │ 500        │
    │ Request  │   │Forbidden   │   │ Server Err │
    └──────────┘   └───────────┘   └────────────┘
         │               │                │
         └───────────────┼────────────────┘
                         │
                    Response + Error Log
```

---

## Key Files

| File | Purpose |
|------|---------|
| `config.py` | Settings & admin config |
| `dependencies.py` | Auth & admin checks |
| `admin.py` | All admin routes |
| `seed_admin.py` | Admin user creation |
| `setup.py` | Unified setup |
| `.env` | Configuration |

---

## Quick Reference

**To create admin:**
```bash
python setup.py
```

**To verify admin exists:**
```sql
SELECT * FROM users WHERE role='admin';
```

**To make user admin:**
```bash
curl -X PUT /api/v1/admin/users/{user_id}/role \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"role": "admin"}'
```

**To test admin access:**
```bash
curl http://localhost:8000/api/v1/admin/analytics/subscriptions \
  -H "Authorization: Bearer <admin_token>"
```
