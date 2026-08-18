# Summary of Changes (Session)

This document lists all changes made during this session to fix CORS, registration, and account profile issues.

---

## 1. CORS and Backend Configuration

### Problem
- Frontend at `http://localhost:3001` was blocked by CORS; preflight requests failed with "No 'Access-Control-Allow-Origin' header".
- `.env` only allowed `http://localhost:3000`, so requests from port 3001 were rejected.

### File: `server/.env`
**Change:** Updated `CORS_ORIGINS` to include all dev origins.
- **Before:** `CORS_ORIGINS=["http://localhost:3000"]`
- **After:** `CORS_ORIGINS=["http://localhost:3000","http://localhost:3001","http://localhost:5173","http://localhost:3002"]`

---

### File: `server/app/config.py`
**Change:** Extended `ALLOWED_HOSTS` so the server accepts requests to the API host (avoids TrustedHost rejecting preflight).
- **Before:** `ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0",]`
- **After:** `ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0", "localhost:8000", "127.0.0.1:8000"]`
- Also normalized spacing (list format).

---

### File: `server/app/main.py`
**Changes:**
1. **Merge dev origins into CORS list** so that even if `.env` only has one origin, common dev ports are still allowed:
   - Build `_cors_origins` from `settings.CORS_ORIGINS` and always add `http://localhost:3000`, `3001`, `5173`, `3002` if not already present.
   - Use `_cors_origins` for `CORSMiddleware` instead of `settings.CORS_ORIGINS` directly.
2. **Middleware order** so CORS runs first (handles preflight before other middleware):
   - Order is: TrustedHost → RateLimit → RequestID → ErrorHandler → CORS (CORS added last so it runs first).
3. **CORS options:** Added `expose_headers=["*"]` to the existing CORSMiddleware config.

---

## 2. React Router Future Flags (Console Warnings)

### Problem
Console showed React Router v7 future-flag warnings (`v7_startTransition`, `v7_relativeSplatPath`).

### File: `client/src/App.jsx`
**Change:** Passed future flags to `BrowserRouter`.
- **Before:** `<BrowserRouter>`
- **After:** `<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>`

---

## 3. Registration 500 and Missing Email Method

### Problem
- POST `/api/v1/auth/register` returned 500 Internal Server Error.
- The route called `EmailService.send_registration_email(...)`, but that method did not exist on `EmailService`, causing an `AttributeError`.

### File: `server/app/services/email_service.py`
**Change:** Implemented `send_registration_email` and kept registration safe if email fails.
- **Added:** Static async method `EmailService.send_registration_email(to_email, company_name, phone)` that:
  - Sends a welcome email after registration.
  - Catches all exceptions and only logs them, so registration never fails because of email (e.g. SMTP misconfiguration).
- Removed the previous misplaced `send_otp_email` block that was at module level; the new method is the only addition in this file for this fix.

---

### File: `server/app/routes/auth.py`
**Change:** Safe access to `request_id` when building the register success response.
- **Before:** Used `http_request.state.request_id` directly.
- **After:** `request_id = getattr(getattr(http_request, "state", None), "request_id", "") if http_request else ""` and used that in `ResponseFormatter.create_success(..., request_id=request_id)`.
- Prevents 500 if `state` or `request_id` is missing.

---

## 4. Account Profile 500 (GET /api/v1/account/profile)

### Problem
- After creating an account, GET `/api/v1/account/profile` returned 500.
- New users have no `BusinessProfile` yet; the service creates one on first access but the session was never committed, and response building assumed all attributes existed.

### File: `server/app/routes/business_profile.py`
**Changes:**
1. **Commit after get_profile:** Call `await db.commit()` after `BusinessProfileService.get_profile(...)` so a newly created business profile is persisted.
2. **Defensive serialization:**
   - Added helper `_dt_iso(dt)` that returns `None` for `None` and only calls `isoformat()` when the value has that method; otherwise uses `str(dt)`.
   - Used `... or ""` for required string fields (`name`, `registered_name`, `email`, `phone`, `gstin`) to avoid `None`.
   - Used `getattr(profile, "profile_photo_url", None) or None` and same for `company_logo_url`, `created_at`, `updated_at` so missing or unexpected types don’t raise.
3. **Error handling:** On exception, call `await db.rollback()` and use `logger.exception("Error getting profile")` so the full traceback is logged for debugging.

---

## Files Modified (Quick Reference)

| File | Purpose of change |
|------|-------------------|
| `server/.env` | CORS_ORIGINS to include 3001, 5173, 3002 |
| `server/app/config.py` | ALLOWED_HOSTS with localhost:8000, 127.0.0.1:8000 |
| `server/app/main.py` | CORS origin merge, middleware order, expose_headers |
| `client/src/App.jsx` | React Router v7 future flags on BrowserRouter |
| `server/app/services/email_service.py` | Added send_registration_email (no-op on email failure) |
| `server/app/routes/auth.py` | Safe request_id in register response |
| `server/app/routes/business_profile.py` | Commit after get_profile, defensive serialization, rollback + exception logging |

---

## What to Do After These Changes

1. **Restart the backend** (e.g. `uvicorn app.main:app --reload` from the server directory) so CORS, config, and code changes are loaded.
2. **Hard-refresh or clear cache** on the frontend if needed.
3. **Create account again** – registration should succeed and welcome email may send if SMTP is configured.
4. **Open Account / header** – GET `/api/v1/account/profile` should return 200 and not 500.

If any 500 persists, check server logs for the traceback from `logger.exception("Error getting profile")` to see the exact error (e.g. missing table or column).
