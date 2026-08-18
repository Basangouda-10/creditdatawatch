# Admin Setup Guide

## Overview
The admin system controls:
- Plan management (CRUD operations)
- User role management
- Defaulter case verification & approval
- System analytics & reporting

## Configuration in .env

Add these variables to your `.env` file to enable admin user seeding:

```env
# Admin Configuration (For Initial Seeding)
ADMIN_GSTIN=27AABCD1234H1Z0
ADMIN_EMAIL=admin@creditdatawatch.com
ADMIN_PASSWORD=AdminPassword@123
ADMIN_COMPANY_NAME=CreditDataWatch Admin
ADMIN_PHONE=+919999999999
```

**Important:** 
- `ADMIN_GSTIN` must be a valid 15-character GSTIN format
- `ADMIN_PHONE` must include country code (e.g., +919999999999)
- These values will be used to automatically create the first admin user during setup

## Seeding the Admin User

After configuring `.env`, run the setup script:

```bash
cd server
python setup.py
```

Or manually seed:

```bash
cd server
python -m app.scripts.seed_admin
```

This will create an admin user with:
- Role: `admin`
- Status: `is_active=True`
- Full access to admin routes

## Admin API Endpoints

All admin endpoints require `admin` role and proper authentication.

### Plan Management
- `POST /api/v1/admin/plans` - Create new plan
- `PUT /api/v1/admin/plans/{plan_id}` - Update plan
- `DELETE /api/v1/admin/plans/{plan_id}` - Deactivate plan

### User Management
- `GET /api/v1/admin/users` - List all users (paginated)
- `PUT /api/v1/admin/users/{user_id}/role` - Update user role

### Defaulter Verification
- `GET /api/v1/admin/defaulters/pending` - List pending cases
- `PUT /api/v1/admin/defaulters/{case_id}/verify` - Approve/reject case

### Analytics
- `GET /api/v1/admin/analytics/subscriptions` - Subscription stats
- `GET /api/v1/admin/analytics/defaulters` - Defaulter case stats

## Security Notes

### In Production:
1. **Change Secret Key**: Generate a new `SECRET_KEY` using:
   ```bash
   openssl rand -hex 32
   ```

2. **Set Cookie Security**:
   ```env
   COOKIE_SECURE=true
   COOKIE_DOMAIN=your-domain.com
   ```

3. **Use Strong Admin Password**: Minimum 8 characters with uppercase, lowercase, numbers

4. **Restrict CORS Origins**:
   ```env
   CORS_ORIGINS=["https://yourdomain.com"]
   ```

5. **Enable HTTPS**: Set `COOKIE_SECURE=true` and use production-grade SSL

## Database Admin Role Schema

```sql
-- Check admin users
SELECT id, gstin, email, role, is_active 
FROM users 
WHERE role = 'admin';

-- Update user to admin
UPDATE users SET role = 'admin' WHERE id = '<user_id>';

-- List all plans
SELECT name, display_name, price, is_active 
FROM plans;
```

## Admin User Lifecycle

```
Setup Phase:
.env (ADMIN_*) → seed_admin.py → admin user created (role='admin')
                                    ↓
Admin can now:
- Manage plans
- Manage users (including creating other admins)
- Verify defaulter cases
- View analytics
```

## Example API Call: Create Plan

```bash
curl -X POST http://localhost:8000/api/v1/admin/plans \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d {
    "name": "premium",
    "display_name": "Premium",
    "description": "Premium plan",
    "price": 5000,
    "validity_days": 365,
    "follow_up_limit": 50,
    "legal_assistance_limit": 20
  }
```

## Troubleshooting

### Admin can't access routes
- Verify token has `role: admin` in payload
- Check `require_admin` dependency in `app/dependencies.py`

### Admin seeding fails
- Validate GSTIN format (15 characters)
- Verify phone includes country code
- Check database connection in `.env`

### Can't login with admin credentials
- Verify admin was created: check database
- Confirm `.env` values match created user
- Check password hash (ensure it's 60+ chars in DB)

## Next Steps

After admin setup:
1. [Seed default plans](./COMPLETION-CHECKLIST.md)
2. [Configure Google Drive integration](./SETUP-GUIDE.md)
3. [Deploy to production](./BACKEND_SETUP_GUIDE.md)
