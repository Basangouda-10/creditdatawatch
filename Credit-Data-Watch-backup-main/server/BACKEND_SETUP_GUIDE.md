# CREDITDATAWATCH_BACKEND_SETUP_GUIDE

## Complete Backend Built Successfully ✅

Your Python FastAPI backend is now ready with:

### ✅ Completed

1. **Project Structure**
   - app/main.py - FastAPI entry point
   - app/config.py - Environment config (Neon, Google SMTP, Google Drive OAuth2)
   - app/database.py - SQLAlchemy async ORM
   - app/exceptions.py - Custom exceptions
   - app/dependencies.py - FastAPI dependency injection

2. **Database Models** (PostgreSQL on Neon)
   - User (GSTIN-based, with indexes)
   - Subscription (plan tracking)
   - BusinessProfile (multi-unit support)
   - PurchaseOrder (GSTIN validation)
   - DefaulterCase (status tracking)
   - CreditReport (score, status)
   - Settlement (case closure)

3. **Authentication & Security**
   - JWT access/refresh tokens in httpOnly cookies ✅
   - bcrypt password hashing
   - GSTIN validation (format + checksum)
   - OTP via google-libphonenumber (6 digits, 10 min expiry)
   - Access control gating by subscription plan

4. **Services**
   - AuthService - Register, login, refresh tokens
   - UserService - Profile management, phone changes
   - EmailService - Google SMTP (HTML emails)
   - OTPService - Send/verify with expiry tracking
   - AccessControlService - Feature gating (base/royal/groups/enterprise)
   - DriveService - OAuth2, file listing, credentials

5. **API Routes**
   - /api/v1/auth/* - Register, login, OTP, refresh, logout
   - /api/v1/user/* - Profile, subscription, phone change
   - /api/v1/purchase-orders/* - CRUD with GSTIN validation
   - /api/v1/defaulters/* - File cases, list by status
   - /api/v1/credit-reports/* - Request, list, status tracking
   - /api/v1/settlements/* - Create, update settlements
   - /api/v1/drive/* - OAuth2 auth, file listing, callbacks

6. **Middleware**
   - ErrorHandlerMiddleware - Centralized error responses
   - RequestIDMiddleware - Request tracking (X-Request-ID)
   - CORS configuration
   - Trusted hosts validation

7. **Utilities**
   - GSTIN validation (format + Luhn checksum)
   - Phone formatting (E.164: +91XXXXXXXXXX)
   - JWT encode/decode
   - bcrypt hash/verify
   - Consistent response formatting
   - Pydantic schemas for all endpoints

8. **Code Quality**
   - Black-compatible code style
   - Structured logging with request IDs
   - Comprehensive exception handling
   - Type hints throughout
   - Async/await patterns

### 📋 Next Steps

1. **Install Dependencies**
   ```bash
   cd server
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```

2. **Setup Environment**
   - Copy `.env.example` to `.env` (create from README.md)
   - Get Neon PostgreSQL connection string from https://console.neon.tech
   - Generate Google credentials for SMTP and Drive OAuth2
   - Set SECRET_KEY: `python -c "import secrets; print(secrets.token_hex(32))"`

3. **Create Neon PostgreSQL Database**
   - Go to https://console.neon.tech
   - Create project "creditdatawatch"
   - Get connection string: `postgresql+asyncpg://user:password@host/dbname`

4. **Setup Google SMTP (Email)**
   - Enable 2FA on Gmail account
   - Generate app-specific password
   - Set GOOGLE_SMTP_USER and GOOGLE_SMTP_PASSWORD in .env

5. **Setup Google Drive OAuth2**
   - Go to Google Cloud Console (https://console.cloud.google.com)
   - Create project "CreditDataWatch"
   - Enable Google Drive API
   - Create OAuth2 credentials (Desktop application or Web application)
   - Download credentials JSON file
   - Save as `server/credentials/client-credentials.json`
   - Set GOOGLE_CLIENT_CREDENTIALS_FILE in .env
   - Set redirect URI: http://localhost:8000/api/v1/drive/callback

6. **Run Backend**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

7. **Test Endpoints** (in Swagger UI or Postman)
   - POST /api/v1/auth/register (creates user + Base plan)
   - POST /api/v1/auth/login (returns tokens in cookies)
   - GET /api/v1/user/profile (requires auth token)
   - POST /api/v1/purchase-orders (GSTIN validation + access control)

### 🔗 Frontend Integration (Next)

The backend is ready for frontend consumption:

1. **Cookie-Based Auth**
   - Tokens returned in httpOnly cookies (no localStorage)
   - Browser auto-sends cookies with requests
   - Frontend must set `credentials: 'include'` in fetch/axios

2. **API Client Updates**
   - Remove localStorage token management
   - Update axios/fetch to use cookies
   - Handle 401 responses (refresh token flow)

3. **Frontend Routes & Components**
   - Dashboard connects to /api/v1/user endpoints
   - Auth flows use /api/v1/auth endpoints
   - Feature pages check access via subscription in backend

### 📚 Key Features

✅ **Industry Standards**
- Layered architecture (routes → services → repositories)
- Async/await patterns (FastAPI + asyncpg)
- Clean separation of concerns
- Pydantic validation (like Joi in Node)
- Structured error handling

✅ **Security**
- GSTIN validation (checksum + format validation)
- Phone validation with google-libphonenumber
- bcrypt password hashing
- JWT in httpOnly cookies
- CORS, trusted hosts
- Request ID tracking

✅ **Database**
- PostgreSQL on Neon (fully managed)
- SQLAlchemy async ORM
- Proper indexing (GSTIN, email, status)
- Cascade deletes for audit trails
- Migrations-ready (Alembic)

✅ **Email & OTP**
- Google SMTP for HTML emails
- OTP generation, storage, verification
- Expiry tracking (10 min)
- Attempt limiting (max 3 wrong tries)

✅ **Google Drive Integration**
- OAuth2 consent flow using client credentials file
- File listing from Drive
- User credential storage (per-user OAuth tokens)
- Document management ready
- Credentials stored at `server/credentials/client-credentials.json`

✅ **Logging**
- Request ID tracking
- Structured logs (user actions, errors)
- Log levels (INFO, WARNING, ERROR)

### 🚀 Production Deployment

When ready to deploy (Render, Railway, AWS):

1. Update `.env.production` with real values
2. Set COOKIE_SECURE=true, ENVIRONMENT=production
3. Configure real Google SMTP credentials
4. Use Redis for OTP/session storage (instead of in-memory)
5. Add database backup strategy
6. Setup monitoring (Sentry, New Relic, etc.)

### ⚙️ Backend Architecture Summary

```
Request
  ↓
Middleware (CORS, TrustedHosts, ErrorHandler, RequestID)
  ↓
Route Handler (auth.py, core.py, drive.py)
  ↓
Service Layer (AuthService, UserService, DriveService, etc.)
  ↓
Data Layer (SQLAlchemy ORM)
  ↓
Neon PostgreSQL
```

Each layer is modular, testable, and follows clean architecture principles.

### ✅ Verification Checklist

- [ ] Dependencies installed (requirements.txt)
- [ ] Neon PostgreSQL connection tested
- [ ] Google SMTP credentials configured
- [ ] Google Drive OAuth2 client credentials downloaded to `server/credentials/client-credentials.json`
- [ ] GOOGLE_CLIENT_CREDENTIALS_FILE set in .env
- [ ] Backend runs without errors
- [ ] Swagger docs accessible (/docs)
- [ ] Health check passes (/health)
- [ ] Register endpoint creates users
- [ ] Login returns cookies
- [ ] Tokens persist across requests
- [ ] Drive auth URL returns valid consent URL

---

**Backend ready for frontend integration!** 🚀
