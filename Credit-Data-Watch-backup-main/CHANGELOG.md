# CreditDataWatch — Complete Changelog

---

## v1.0 — February 11, 2026

### UI & PO Enhancements

#### My Account Page
- Added "Add New PO" and "Clear" buttons under profile section
- Added PO History table matching CSV structure with live updates
- Table columns: PO No, Order Date, Currency, Payment, Supplier, Addresses, Item Summary

#### Purchase Orders CSV Import
- Extended columns support: `order_currency`, `supplier_address`, `item_summary`, `delivery_address`, `invoice_address`, `order_date`, `status`, `notes`, `document_url`

#### Backend
- Added dedicated columns on `PurchaseOrder`: `supplier_address`, `delivery_address`, `invoice_address`
- Startup migration ensures columns exist

#### Email OTP & Security
- Email-based OTP flows for login and email change
- API no longer exposes OTP codes — delivered via SMTP

**Files touched:** `Account.jsx`, `PurchaseOrders.jsx`, `CSVImportModal.jsx`, `Login.jsx`, `core.py`, `main.py`, `auth.py`, `otp_service.py`

---

## v1.1 — February 26, 2026

### Developer/Admin Access & Invitations

#### Developer/Admin Bootstrap
- Permanent developer/admin account reinforced (`payalshinde906@gmail.com`)
- Full access bypass via role/admin flags
- Idempotent bootstrap ensures account, company, flags on every startup
- Added `recreate_dev_admin.py` script
- Admin guard updated in `dependencies.py`

#### Invitation Emails
- HTML email sending for invitations
- Link built from `FRONTEND_URL` with fallback to `localhost:3000`

#### Invitations Management
- `PUT /api/v1/admin/invitations/{id}` — update invitation
- `DELETE /api/v1/admin/invitations/{id}` — delete invitation
- UI: removed Token column, added Actions column with inline Edit/Delete
- Added `adminApi.updateInvitation`, `adminApi.deleteInvitation` to `apiClient.js`

#### Accept Invitation Flow
- `GET /api/v1/invitations/verify?token=...`
- `POST /api/v1/invitations/accept`
- New page `/accept-invite` with token verification and password form
- Clear 4xx errors for invalid/expired/mismatch

#### Database Migrations
- `gstin` set to `NOT NULL`
- Dropped unique indexes on `gstin` to allow multiple employees per company
- Added `subscription_bypass`, `full_access` bypass flags
- Added `drop_users_gstin_unique.py` utility script

---

## v1.2 — March 1, 2026

### Vendor Notifications & BCI

#### Vendor Notifications on PO Creation
- Vendors receive `PO_CREATED` notification when PO is created
- Includes: PO number, vendor name, company name, amount, dates
- Persisted in `notifications` table
- Sent via email using SMTP

#### BCI + Ollama AI Integration
- Verified BCI scoring integrated with Ollama AI
- Raw JSON returned: `score`, `grade`, `risk`
- Timestamp-based aggregation from all POs
- Safe fallback if AI fails

---

## v1.3 — March 4, 2026

### UI Enhancements

#### Purchase Orders Page
- Added Business Credibility Index card on PO page header
- Score progress bar, Grade badge, Risk icons
- Highlighted pending PO rows with amber background
- Quick filters: All, Open, Pending, Closed
- Icon-based actions: Edit, Archive, Delete, Mark Paid
- Dynamic refresh on `poChanged` events

#### Credibility Index Page
- Prominent header card with search and filters
- Extended table: Score (progress bar), Grade (badge), Risk (icons), PO Fulfillment, Performance (stars)
- Populates from PO Management by aggregating unique vendors
- Client-side score/grade/risk/fulfillment/stars computation

#### Email Improvements
- Standardized From header: `CreditDataWatch <no-reply@creditdatawatch.com>`
- Enriched PO emails: PO Number, Vendor, GSTIN, Amount, Due Date, Status, Credibility Index

---

## v1.4 — March 5, 2026

### Vendor Contact Fields & Reminders

#### Vendor Contact Fields
- Added Vendor Email ID and Vendor Mobile Number to Add PO and Edit PO forms
- Backend: `vendor_email`, `vendor_phone` columns added to `PurchaseOrder`
- All CRUD endpoints updated to accept/return new fields

#### Manual Send Reminder
- Send Reminder button in Actions column (Open/Pending POs only)
- Confirmation dialog before sending
- `POST /api/v1/purchase-orders/{po_id}/send-reminder` endpoint
- Returns 400 if PO closed/paid or no vendor email

#### Automatic Scheduled Reminders
- Integrated into daily background scheduler (`_daily_tasks_runner`)
- Sends reminder on configured days before due date
- Daily reminder after due date until PO closed

#### Admin PO Reminder Config
- New page `/admin/po-reminders`
- Configure "before due date" days (7, 3, 2, 1 etc.)
- Toggle daily after-due reminders
- `POReminderConfig` model with `before_days` JSON array

#### Bug Fixes
- Fixed CORS error blocking frontend from backend
- Fixed HTTP 500 on Archive PO (missing columns)
- CSV Import: per-row try/catch, descriptive errors, duplicate/invalid checks

---

## v1.5 — March 6, 2026

### Database & AI Chatbot

#### Backend/Database
- Fixed `.env` override to use PostgreSQL consistently
- Dropped UNIQUE index on `purchase_orders(po_number)` to allow duplicates
- Added SQLite → PostgreSQL migration script
- Auth refresh endpoint hardened — always returns JSON

#### AI Chatbot
- Floating 💬 chat button on every page
- Slide-up chat panel with conversation history
- Typing indicator during Ollama response
- New endpoint: `POST /api/v1/chat`
- Full app knowledge system prompt with 14 sections, all roles, all routes
- Graceful fallback if Ollama unavailable

#### Loading Spinner
- Full-screen spinner during Save, Edit, Archive, Delete, Import
- Reusable `LoadingSpinner.jsx` component

---

## v1.6 — March 12, 2026

### SOP PDF Chatbot & Credibility Fixes

#### SOP PDF Chatbot Integration
- Uploaded CreditDataWatch SOP PDF to backend
- Created `pdf_service.py` to extract text from PDF
- Added `/sop-upload` and `/sop-status` endpoints
- Created `SOPUpload.jsx` at `/admin/sop-upload`
- Chatbot answers from actual SOP PDF (8000 char context)
- Correctly answers membership pricing, star ratings, vendor policies

#### Credibility Index Fix
- List now shows vendor names from Purchase Orders
- Unique vendors fetched directly from `purchase_orders` table
- Each vendor shows Score, Grade, Risk, PO Fulfillment, Stars from real PO data

#### Credibility Detail View Redesign
- 5 metric cards: Credit Score ring, Risk badge, PO Fulfillment bar, Stars, Credit Limit
- 3 tabs: Overview, Financials, AI Report
- AI Recommendation: verdict (Recommended/Caution/Not Recommended) + bullet reasons from Ollama
- Fixed detail page to look up vendors by name from POs

#### Bug Fixes
- Fixed Master Admin subscription bypass on credibility routes
- Fixed View button passing company name instead of UUID
- Fixed route conflict on credibility endpoint
- Fixed SOP upload auth error (cookie-based auth)

---

## v2.0 — March 12–13, 2026

### Auto-Sync Vendor to Credibility Index

#### Credibility Debugging & Fixes
- Fixed blank Credibility Index page
- Fixed View button (disabled → MASTER_ADMIN bypass added)
- Fixed View URL (company name → UUID)
- Fixed missing imports in `CredibilityDetail.jsx`
- Fixed fetch URLs (relative → absolute `http://localhost:8000`)
- Fixed AI Recommendation endpoint (`/api/v1/chat` → `/api/v1/credibility/{id}/ai-analysis`)
- Fixed AI fallback verdict logic
- Fixed Master Admin bypass on list + detail endpoints
- Added `POST /api/v1/credibility/recalculate` endpoint
- Fixed `aggregate_metrics` to read vendor POs correctly
- Removed duplicate Test Company from database
- Fixed PO Fulfillment display field names

#### Auto-Sync Pipeline
- Fixed HTTP 500 on PO creation (removed broken credibility trigger)
- Added `sync_vendor_credibility` helper using direct `asyncpg` connection
- Auto-creates company in `companies` table when PO is created
- Auto-calculates credibility score after every PO save/update/pay
- Added `recalc_for_company` static method to `CredibilityService`
- Backfilled all existing vendors into `companies` + credibility index

#### Ollama AI Scoring
- Connected Ollama `llama3` to `score_with_ai` in `credibility_service.py`
- Sends vendor PO metrics to `llama3`
- Returns Score, Grade, Risk, Stars, AI Summary
- Math-based fallback if Ollama fails
- Fixed score calculation (2/2 paid → Score 100, Grade A)

---

## v2.1 — April 1, 2026

### New Features

#### Feature 1 — Days Left Column
- Added Days Left column in PO table
- Formula: `effective_due_date = due_date + payment_window_days`
- `Days Left = effective_due_date - today`
- Colors: 🟢 green → 🟠 orange → 🔴 red (overdue/due today)

#### Feature 2 — Payment Window per PO
- Added `payment_window_days` column to `purchase_orders` (default 50)
- Inline editable column with ✏️ → ✅ ❌
- Disabled for Paid/Closed POs
- Extending window removes overdue status dynamically

#### Feature 3 — Dynamic Status Display
- Status badge calculated dynamically using effective due date
- Extended payment window → "Open" not "Overdue"
- Paid POs always show "Paid"

#### Feature 4 — Admin Settings
- Added `app_settings` table
- `GET/POST /api/v1/admin/settings` endpoints
- Global payment window threshold for color coding

#### Feature 5 — Legal Notice in Reminder
- Legal notice checkbox in reminder modal
- Admin edits template before sending
- Legal notice sent as PDF attachment (ReportLab)
- Legal notice text removed from email body
- Added `legal_notice_sent_at` column to `purchase_orders`
- ⚖️ badge on PO row when legal notice sent

#### Feature 6 — Legal Support Button
- ⚖️ advocate icon button between Archive and Delete
- Sends all PO details to `payalshinde906@gmail.com`
- Confirmation popup before sending
- Auto-triggers when PO becomes overdue (background scheduler)
- Button turns green when already sent
- Disabled for Paid POs
- Added `legal_support_requested_at` column

#### Feature 7 — Legal Notice PDF
- Created `server/app/services/legal_notice_service.py`
- Professional PDF via ReportLab
- Auto-fills: Vendor, PO Number, Amount, Due Date, Company, Date
- Sent as `Legal_Notice_{po_number}.pdf` attachment
- Temp PDF deleted after sending

---

## v2.2 — April 2, 2026

### Fixes & Infrastructure

#### Scheduled Reminders Fix
- Moved to frequent runner (every 60 seconds)
- Fixed lifespan integration in `main.py`

#### Email Service Fix
- Port 465 → SSL (`smtplib.SMTP_SSL`)
- Added `send_email_with_attachment` function
- All SMTP config from `.env`

#### .env Team Support
- Created `server/.env.example`
- `config.py` updated with `extra = "allow"`
- All hardcoded values → `.env` with fallbacks
- Fixed `SECRET_KEY` as static value (prevents token invalidation on restart)
- Updated `.gitignore`
- Created `README_SETUP.md` for team onboarding

#### Ollama Auto-Start
- `ensure_ollama_running()` — auto-starts if not running
- `ensure_model_available()` — auto-pulls `llama3` if missing
- Added Ollama to Windows startup via registry
- Both called in lifespan startup

#### Post Fresh-Clone Fixes
- Fixed credibility index 500 (UUID not company name)
- Fixed PO creation 400 (missing `payment_window_days`)
- Verified all DB columns exist after clone
- OTP email fixed with correct SSL settings


CHANGELOG — CreditDataWatch
Version 2.3 — April 11, 2026

🔐 Security & Authentication

Blocked duplicate GSTIN registration — shows "Already registered, contact your admin"
Deleted duplicate test account (shindepayal296@gmail.com)
Added developer bypass — payalshinde906@gmail.com always has full access
Added company_domain and allow_any_domain columns to companies table
Domain-specific invite check added (optional enforcement)
subscription_status now included in login API response

📋 Audit Log System

Created po_audit_logs table in database
Every PO delete and update now records: who did it, when, and why
Reason field added to delete/update actions
New /audit-logs page — visible only to MASTER_ADMIN
Filters by action type, date, user, PO number

🌐 Credibility Index Page

Renamed "Platform Reputation (Global CBI)" → "Network Trust Intelligence"
Removed "View Profile" button from the table
Added AI Risk Assessment column with color-coded verdicts: Low Risk / Moderate Risk / High Risk
Half-star rating display added (like Flipkart)

📊 Credibility Detail Page

Renamed "Global CBI Ratings" tab → "Business Rating"
Removed partner review list and rating form from that tab
New star display with half-star support
AI recommendation card: Safe to do business / Moderate Risk / High Risk / Not Rated

👥 Team Management

Fixed 500 Internal Server Error on invite creation
Invitation success message now shows "✅ Invitation sent successfully!" instead of raw token
Fixed invitation email link pointing to wrong port (3000 → 3001)

🌍 IIS Deployment

Created web.config in client/dist for React route handling
Fixed IIS permissions for anonymous access
API proxy rule added in web.config

🗄️ Database

Redundancy check performed — no duplicate PO numbers or users found
po_audit_logs table created
company_domain and allow_any_domain columns added to companies table

---

## v2.4 — April 13, 2026

### Complete Audit Log System & Stability Fixes

#### Audit Log System (Full Integration)
- **Database**: Created `audit_logs` table with fields for `user_id`, `action`, `po_number`, `vendor_name`, `reason`, `old_data`, and `new_data`.
- **Backend**: Integrated `log_audit` helper into all PO life-cycle events: `CREATE`, `UPDATE`, `DELETE`, `MARK_PAID`, and `ARCHIVE`.
- **Reason Tracking**: Every critical PO modification (Delete, Update, Archive, etc.) now requires a user-provided reason, captured in the audit trail.
- **Admin View**: Refactored `/audit-logs` page with:
    - Real-time stats cards for each action type.
    - Advanced filtering (Search by PO/Vendor/User, Filter by Action, Date range).
    - Action-specific color coding (e.g., Green for CREATE, Red for DELETE).
    - Access restricted to `MASTER_ADMIN`, `COMPANY_ADMIN`, and `ADMIN` roles.

#### Authentication & Stability
- **Login Freeze Fix**: Identified and fixed a blocking startup event where Ollama model checks were hanging the server. Moved AI checks to a background thread.
- **Request Reliability**: Added a global 30s timeout and specific 10s timeouts for auth/profile requests in `apiClient.js` to prevent UI freezing.
- **Token Handling**: Improved token storage in `localStorage` (`access_token` and `token` keys) for better compatibility with legacy components.
- **Auto-Logout/Redirect**: Frontend now automatically redirects to login on 401 Unauthorized errors if token refresh fails.
- **AbortError Fix**: Resolved "signal is aborted" errors by ensuring `AbortController` is only used when no external signal is provided.

#### AI & Chatbot Enhancements
- **Chatbot Timeout**: Increased chatbot and AI analysis timeouts from 30s to 60s to accommodate slower AI model response times.
- **Backend Resiliency**: Increased backend HTTP client timeouts for Ollama connections to 60s.
- **Search Fix**: Resolved a 500 Internal Server Error in Audit Logs search by correctly handling date-to-timestamp conversions in the backend.

#### UI/UX Polishing
- **Header**: Removed the lock emoji from the "Audit Logs" link for a cleaner look.
- **Modals**: Implemented a reusable `ReasonModal` for all destructive/critical actions in the Purchase Orders management page.

**Files touched:** `main.py`, `core.py`, `chat.py`, `apiClient.js`, `authService.js`, `AuditLogs.jsx`, `PurchaseOrders.jsx`, `EditPOModal.jsx`, `Header.jsx`, `ai_cbi_service.py`

---

## v2.5 — April 14, 2026

### Smart Import System & Network Optimization

#### Universal Data Intelligence Import System
- **Universal Format Support**: Robust support for **CSV** and **Excel** (`.xlsx`, `.xls`) files, compatible with any export format (Tally, Zoho, custom).
- **Header-less Pattern Mapping**: Implemented a **Data Intelligence Engine** that ignores column headers and analyzes actual data samples to detect fields like **PO Number**, **Vendor**, **Amount**, and **GSTIN**.
- **Scoring & Confidence**: Added a scoring system based on **Pattern Match**, **Uniqueness**, and **Magnitude** to auto-assign columns with real-time confidence indicators (✅/✔️/⚠️).
- **Smart Logic**:
    - **Amount vs. Window**: Automatically distinguishes between Amount (high magnitude) and Payment Window (low magnitude) in numeric columns.
    - **Status Derivation**: Automatically calculates "Overdue" status based on imported due dates.
    - **Currency Cleaning**: Strips currency symbols (₹) and commas from amount fields during processing.
- **Fault-Tolerant Import**: New `CSVImportModal` with a 3-step review workflow. The system never blocks on missing mappings and gracefully skips invalid rows instead of failing the entire import.

#### Performance & Stability
- **DNS Optimization**: Fixed a critical 2-second delay in API requests on Windows by switching from `localhost` to `127.0.0.1` for backend communication.
- **Watch List Refinement**: Excluded database files (`.db`, `.db-journal`, `.db-wal`) from Uvicorn's reload watch list, preventing server crashes during database writes.
- **Timeout Management**: Optimized dashboard performance by increasing parallel request timeouts to 20 seconds.

#### Bug Fixes & Reliability
- **Email Mock Mode**: Implemented a "Mock Mode" for development; if SMTP credentials are not configured, the system logs emails to the console instead of crashing.
- **Cascade Delete**: Added `ondelete="CASCADE"` to Notifications, ensuring database integrity when Purchase Orders are deleted.
- **Backend Stability**: Fixed missing dependency imports in `core.py` and updated raw SQL queries for better SQLite/PostgreSQL cross-compatibility.

**Files touched:** `import_service.py`, `core.py`, `main.py`, `apiClient.js`, `Dashboard.jsx`, `PurchaseOrders.jsx`, `CSVImportModal.jsx`, `email_service.py`, `notification.py`



## [2026-05-06] - Full System Audit & Backend Fixes

### Added
- **Workflow Service**: Created/Updated `server/app/routes/workflow.py` with comprehensive task management for Financial, Legal, Operations, and Master Admin roles.
- **Admin Features**: Added `/admin/payments` page for subscription verification and registered it in `client/src/routes/index.jsx`.
- **Notification Triggers**: Integrated `NotificationService` calls across `core.py`, `payments.py`, and `admin.py` for PO events, payments, and invitations.
- **Audit Logging**: Implemented centralized audit logging in `workflow.py` using the `audit_logs` table.

### Changed
- **Frontend Port Migration**: Updated all references from port 3000 to 3001 in `server/app/config.py`, `.env`, and WebSocket connections.
- **Role Dashboard**: Completely re-implemented `RoleDashboard.jsx` to handle new workflow tasks and approval/rejection logic.
- **Dashboard Routing**: Added automatic redirection for internal roles (FINANCIAL, LEGAL, OPERATIONS) in `Dashboard.jsx`.
- **CORS Configuration**: Expanded `allow_origins` in `main.py` to include port 3001 and other development ports.
- **Notification Service**: Updated `notification_service.py` with specific helper methods for automated alerts.
- **API Client**: Fixed `apiClient.js` to use correct endpoint paths for subscription payments and PO management.

### Fixed
- **SQLite Compatibility**: Fixed `NOW()` errors by replacing them with `CURRENT_TIMESTAMP` for SQLite compatibility.
- **PO Status Flow**: Fixed `core.py` to correctly set `approval_status` when evidence is uploaded during PO creation.
- **Role Permissions**: Fixed access control in `Header.jsx` to show appropriate admin links based on user role.
- **Workflow Handover**: Corrected the logic for legal support requests and financial approvals to ensure tasks appear in the correct queues.

### Verified
- **Regression Testing**: Performed full registration, login, workflow lifecycle, and security testing on a fresh database.
- **Build Stability**: Verified that `npm run build` succeeds without errors.
- **Backend Stability**: Verified server starts on port 8000 with no migration errors.

---

## v3.0 — May 7, 2026

### Multi-Stage Workflow & Dashboard Redesign

#### Multi-Stage Workflow Implementation
- **Subscription Workflow**: Implemented 3-stage approval flow: **User Request → Operations Review → Master Admin Final Approval**.
- **PO Edit Workflow**: Implemented 3-stage approval flow: **Admin Edit with Evidence → Financial Verification → Master Admin Final Apply**.
- **Notification Sync**: Unified in-app notifications and automated emails. Every stage transition now notifies the next handler and the original requester.
- **Role Aliasing**: Fixed notification delivery for role variations (e.g., `OPERATION` vs `OPERATIONS`).

#### Admin & Role Dashboards
- **Master Admin Control Center**: Redesigned as a high-level "Command Center" with summary cards and centralized task management.
- **Role-Specific Dashboards**: Created dedicated views for `OPERATIONS`, `FINANCIAL`, and `LEGAL` teams to focus only on their specific tasks.
- **User Creation**: Master Admin can now create internal users (Operations, Financial, Legal) directly from the dashboard.
- **SOP Upload Removal**: Streamlined the admin interface by removing the legacy SOP Upload and Audit Log sections in favor of the new Activity Monitoring system.

#### User Dashboard Enhancements
- **Customer View**: Redesigned the regular user dashboard to be clean and focused on their own data, removing all internal/testing elements.
- **Status Badges**: Added real-time status indicators for Subscription (Active/Inactive) and PO Approval states.
- **Navigation Cleanup**: Streamlined the header by removing redundant "Admin Tools" links, placing them inside the appropriate dashboards instead.

#### Security & System Reliability
- **Login Fix**: Resolved a critical issue where the login API was not correctly setting secure cookies for session management.
- **Activity Monitoring**: Verified and fixed the backend logging system. Implemented the `user_activity_logs` table in PostgreSQL to track all user actions reliably.
- **Audit Logging**: Refined role normalization in the backend to ensure strict access control for audit and activity logs.

#### Bug Fixes & Cleanup
- **Reference Errors**: Fixed multiple React `ReferenceError` crashes in the Dashboard component.
- **Email Wrapper**: Added a standalone `send_email` helper to prevent circular dependency issues between notification and email services.
- **Port Consistency**: Standardized all frontend-backend communication to use port 3001 for the client and 8000 for the server.

**Files touched:** `workflow_service.py`, `notification_service.py`, `email_service.py`, `Dashboard.jsx`, `WorkflowDashboard.jsx`, `Header.jsx`, `auth.py`, `activity.py`, `index.jsx`, `apiClient.js`

---

## [2026-05-17] - Business Check Request & PO Edit Workflow Complete Fixes

### Fixed
1. **Complete PO Edit Approval Workflow in WorkflowDashboard**: Split the single "PO Edit Approvals" section into 4 distinct sections for each stage in `client/src/pages/WorkflowDashboard.jsx`:
   - **⚙️ PO Truth Verification**: OPERATION role (PENDING_OPERATION status)
   - **⚖️ PO Legal Review**: LEGAL role (OPERATION_VERIFIED status)
   - **💰 PO Financial Review**: FINANCIAL role (LEGAL_VERIFIED status)
   - **👑 PO Final Approval**: MASTER_ADMIN only (FINANCIAL_VERIFIED status)
2. **apiClient FormData Fix**: Fixed `api.post` and `api.put` in `client/src/services/api/apiClient.js` to handle FormData correctly
3. **Business Check Request Endpoint Fixed**: Updated `POST /api/v1/business-requests` in `server/app/routes/core.py` to save `user_email`, `reason`, and `additional_info`
4. **Business Request Modal Fixed**: Updated `BusinessRequestModal.jsx` to use `apiClient` instead of raw fetch, which automatically handles authentication, base URL, and CORS
5. **Duplicate PO Section Removed**: Removed duplicate "PO Truth Verification" section

### Verified
- **PO Edit Approval Flow**:
  1. USER/COMPANY_ADMIN edits a PO with evidence, submits for approval (PENDING_OPERATION)
  2. OPERATION sees it, clicks "Verify & Send to Legal" → OPERATION_VERIFIED
  3. LEGAL sees it, clicks "Verify & Send to Financial" → LEGAL_VERIFIED
  4. FINANCIAL sees it, clicks "Approve for Master" → FINANCIAL_VERIFIED
  5. MASTER_ADMIN sees it, clicks "Final Approve & Apply" → PO is updated!
- **Business Check Request Flow**:
  1. USER/COMPANY_ADMIN fills the "Request Company Business Check" form
  2. Form submits successfully via apiClient
  3. Request is saved to database with all fields
  4. Notifications are sent to OPERATION team and requester
- **Notifications**: Notifications are sent to next role at each stage
- **All Roles**: Each role sees only their assigned pending items

**Files touched:** `WorkflowDashboard.jsx`, `apiClient.js`, `core.py`, `BusinessRequestModal.jsx`, `CHANGELOG.md`

---

## [2026-05-18] - Business Check, Support Requests, Access Control, and Payment Proof Fixes

### Added
1. **Business Check Requesting Company Visibility** (PART 3):
   - Updated `BusinessRequest` model in `server/app/models/__init__.py` to include `user_email`
   - Updated `/business-requests/pending` endpoint to JOIN with users and companies, returning requesting company name, email, created_at, status
   - Updated WorkflowDashboard to display business check requests in table with all required columns
2. **Additional Request Notifications** (PART 4):
   - Created `SupportRequest` model in `server/app/models/__init__.py`
   - Added backend endpoints for support requests: create, list, my requests, resolve
   - Created `SupportRequestModal.jsx` component
   - Added support request section in WorkflowDashboard with Resolve modal
   - Integrated NotificationService for new request and resolve notifications
3. **Upload Directories**: Created all necessary upload directories (payment_proofs, legal_support, legal_notices, po_evidence, business_checks) via `create_upload_dirs.py`

### Fixed
1. **Access Control Fixes**:
   - Updated `AccessControlService` to allow LEGAL, FINANCIAL, FINANCE roles to bypass access checks
   - Updated `require_admin` dependency in `server/app/dependencies.py` to allow those roles
   - Updated `/audit-logs`, `/admin/users/:user_id`, `/admin/users/:user_id/pos`, `/admin/users/:user_id/credibility`, `/admin/users/:user_id/activity` endpoints to allow those roles
   - Updated frontend route in `client/src/routes/index.jsx` for `/admin/users/:userId` to allow those roles
2. **UserProfile.jsx Fix**: Replaced hardcoded fetch with apiClient
3. **PO Edit Verification Rename**: Renamed "PO Truth Verification" to "PO Edit Verification" and "PO Financial Review" to "PO Edit Requests" in WorkflowDashboard and RoleDashboard
4. **Submit Payment Proof Fix**: Added missing `api` import in `client/src/pages/Membership.jsx`
5. **Removed Legal Notice Requests from Master Admin**: Only LEGAL role can see Legal Notice Requests section

### Verified
- **Business Check Requests**: Requesting company name, email, date & status visible to Master Admin and assigned roles
- **Support Requests**: Users can submit requests, admins can see and resolve them, notifications work correctly
- **Access Control**: All roles (MASTER_ADMIN, OPERATION, OPERATIONS, LEGAL, FINANCIAL, FINANCE) have proper access
- **View Profile**: "View Profile" link works for all authorized roles
- **Submit Payment Proof**: Works without network errors
- **PO Edit Verification**: Renamed correctly and workflow functions

**Files touched:** `WorkflowDashboard.jsx`, `RoleDashboard.jsx`, `Membership.jsx`, `UserProfile.jsx`, `SupportRequestModal.jsx`, `routes/index.jsx`, `apiClient.js`, `server/app/models/__init__.py`, `server/app/routes/core.py`, `server/app/routes/admin.py`, `server/app/routes/payments.py`, `server/app/services/access_control_service.py`, `server/app/dependencies.py`, `server/app/config.py`, `create_upload_dirs.py`, `CHANGELOG.md`

---

## [2026-05-18] - COMPANY_ADMIN PO Payment Permission, Roles Table, & Legal Notice Workflow

### Added
1. **Roles Table in Master Admin Dashboard**: Added comprehensive Roles Management table directly below "Create Internal User" in `client/src/pages/WorkflowDashboard.jsx`:
   - Main table columns: Role Name, Created Date, Status badge (Active/Inactive), Assigned Users count, Actions (Edit/Delete)
   - Expandable rows with chevron/arrow icon showing inner activity log table
   - Single row expansion (only one row expands at a time)
   - Activity log table columns: User Name, Email, Password (toggleable hidden with eye icon), Action Performed, Module, Date & Time, Status badge
   - "No activity yet" message when no logs
   - Per-row password visibility toggle
   - Edit role modal and Delete confirmation popup
2. **Dynamic Role Population**: Roles table dynamically populated from system roles and actual user data
   - Shows all system roles: Master Admin, Operations Team (combines OPERATION/OPERATIONS), Financial Team (combines FINANCIAL/FINANCE), Legal Team, Company Admin, Regular User
   - Accurate user counts per role
   - Activity logs show real users assigned to each role
3. **Legal Notice Full Workflow**: Implemented complete legal notice workflow with evidence upload:
   - Step 1: User Side – Updated "Send to Legal" modal in `PurchaseOrders.jsx` to require reason/evidence upload
   - Step 2: Legal Team – Added legal notice review section in `WorkflowDashboard.jsx` for LEGAL role
   - Step 3: Master Admin – Added legal notice final approval section in `WorkflowDashboard.jsx` for MASTER_ADMIN
   - Step 4: User Notifications – Email and in‑app notifications via NotificationService
   - Added PO model fields: `legal_support_reason`, `legal_support_evidence_url`, `legal_support_evidence_filename`, `legal_support_status`, `legal_notes`
   - Updated `send_to_legal_support` endpoint in `core.py` to accept FormData with reason and file upload
   - Added `WorkflowService` functions for legal notice workflow
   - Added endpoints in `workflow.py` for legal review complete, master approve/reject
4. **PDF/Evidence Fix**: All uploaded evidence and generated legal notice PDFs are now properly stored in `uploads/legal_evidence` directory and viewable/downloadable

### Fixed
1. **COMPANY_ADMIN PO Payment Permission (403 Error**: Fixed "Not authorized: Invalid role for this action" in `server/app/routes/core.py`:
   - Modified `mark_paid` endpoint to allow MASTER_ADMIN, COMPANY_ADMIN, OR any user from PO's company
   - Modified `create_po` endpoint to allow MASTER_ADMIN and COMPANY_ADMIN without AccessControlService check
   - Now COMPANY_ADMIN users can mark POs as paid with attached receipts when subscribed

**Files touched:** `WorkflowDashboard.jsx`, `core.py`, `models/__init__.py`, `PurchaseOrders.jsx`, `apiClient.js`, `workflow_service.py`, `workflow.py`, `CHANGELOG.md`
