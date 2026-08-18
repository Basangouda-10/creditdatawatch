# CreditDataWatch Backend

Production-grade Python FastAPI backend for credit intelligence and B2B transaction management.

## Setup

### 1. Create Virtual Environment

```bash
cd server
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Create `.env` file in the `server` directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql+asyncpg://user:password@host.neon.tech/dbname?sslmode=require

# JWT
SECRET_KEY=your-secret-key-generate-with-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Cookie Settings
COOKIE_DOMAIN=localhost
COOKIE_PATH=/
COOKIE_SECURE=false  # Set to true in production with HTTPS
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=lax

# Google SMTP (Email)
GOOGLE_SMTP_HOST=smtp.gmail.com
GOOGLE_SMTP_PORT=587
GOOGLE_SMTP_USER=your-gmail@gmail.com
GOOGLE_SMTP_PASSWORD=your-app-password  # Generate in Google Account Security
SENDER_EMAIL=noreply@creditdatawatch.com

# Google Drive OAuth2
GOOGLE_CLIENT_CREDENTIALS_FILE=server/credentials/client-credentials.json
GOOGLE_FOLDER_ID=  # Optional: specific folder for documents
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/drive/callback

# OTP
OTP_PROVIDER=smtp  # or mock for development
OTP_EXPIRY_MINUTES=10

# CORS
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
ALLOWED_HOSTS=["localhost","127.0.0.1"]

# Logging
LOG_LEVEL=INFO
ENVIRONMENT=development  # or production
```

### 4. Run Development Server

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API Docs: http://localhost:8000/docs

## Architecture

- **Models** (`app/models/`): SQLAlchemy ORM with User, Subscription, POs, Defaulters, Credit Reports, Settlements
- **Schemas** (`app/schemas/`): Pydantic request/response validation
- **Services** (`app/services/`): Business logic (Auth, Email, OTP, Drive, Access Control)
- **Routes** (`app/routes/`): FastAPI endpoints organized by domain
- **Middleware** (`app/middleware/`): Error handling, request tracking
- **Utils** (`app/utils/`): GSTIN validation, phone formatting, JWT, bcrypt, response formatting
- **Database**: PostgreSQL on Neon with SQLAlchemy async ORM

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register (returns tokens in httpOnly cookies)
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (clear cookies)
- `POST /api/v1/auth/otp/send` - Send OTP for phone verification
- `POST /api/v1/auth/otp/verify` - Verify OTP

### User
- `GET /api/v1/user/profile` - Get current user profile
- `PUT /api/v1/user/profile` - Update profile
- `POST /api/v1/user/phone-change/send-otp` - Send OTP for phone change
- `POST /api/v1/user/phone-change/verify-otp` - Verify and update phone
- `GET /api/v1/user/subscription` - Get current subscription

### Purchase Orders
- `POST /api/v1/purchase-orders` - Create PO
- `GET /api/v1/purchase-orders` - List POs

### Defaulters
- `POST /api/v1/defaulters` - File defaulter case
- `GET /api/v1/defaulters` - List cases

### Credit Reports
- `POST /api/v1/credit-reports` - Request report
- `GET /api/v1/credit-reports` - List reports

### Settlement
- `POST /api/v1/settlements` - Create settlement
- `GET /api/v1/settlements` - List settlements

### Google Drive
- `GET /api/v1/drive/auth-url` - Get OAuth2 consent URL
- `POST /api/v1/drive/callback` - OAuth2 callback handler
- `GET /api/v1/drive/files` - List files

## Security

- ✅ JWT access/refresh tokens in httpOnly cookies (CSRF protection)
- ✅ bcrypt password hashing
- ✅ GSTIN validation (checksum + format)
- ✅ Phone validation with google-libphonenumber
- ✅ OTP verification (6 digits, 10 min expiry, 3 attempts max)
- ✅ Access control gating (plans → features)
- ✅ CORS and trusted hosts configuration
- ✅ Structured error handling with request IDs

## Deployment

### Render/Railway (Python hosting)

1. Create account at [Render.com](https://render.com) or [Railway.app](https://railway.app)
2. Connect GitHub repo
3. Set environment variables in dashboard
4. Deploy

### Docker

```bash
docker build -t creditdatawatch-api .
docker run -p 8000:8000 --env-file .env creditdatawatch-api
```

## Testing

```bash
pytest -v

# With coverage
pytest --cov=app --cov-report=html
```

## Logging

Structured logging via Python logging module. Logs include:
- Request IDs for tracking
- User actions (register, login, feature usage)
- Errors with full context
- Performance metrics

## Notes

- Phone numbers formatted to E.164 (+91XXXXXXXXXX) for consistency
- Emails sent via Google SMTP (or mocked in development)
- OTP stored in-memory (use Redis in production for multi-instance)
- Drive OAuth uses client credentials file at `server/credentials/client-credentials.json`
- User Drive credentials should be persisted to DB in production
- All timestamps in UTC

## Google Drive Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Drive API
4. Create OAuth2 credentials (Desktop or Web application)
5. Download credentials JSON
6. Save as `server/credentials/client-credentials.json`
7. For web apps, add authorized redirect URI: `http://localhost:8000/api/v1/drive/callback`
8. Set `GOOGLE_CLIENT_CREDENTIALS_FILE` in `.env`
