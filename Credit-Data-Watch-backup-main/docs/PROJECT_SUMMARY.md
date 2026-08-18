# Purchase Order Manager - Project Summary

## System Overview

**Purchase Order Manager** is a modern full-stack application for automated purchase order processing. The system replaces the legacy credit data watch system with a new architecture focused on purchase orders, dynamic fields, partial success processing, and role-based access control.

## Architecture

### Technology Stack

**Backend:**
- Python 3.10+
- FastAPI (REST API)
- SQLAlchemy + Alembic (ORM & migrations)
- APScheduler (background jobs)
- Google Drive API (file storage) 
- PyJWT + Passlib (authentication)
- Structlog (structured logging)

**Frontend:**
- React 18 (JavaScript, NOT TypeScript)
- Vite (build tool)
- Tailwind CSS (styling)
- Vitest (testing)

**Database:**
- PostgreSQL (Neon cloud recommended)

**Infrastructure:**
- Google Drive (four-folder architecture with daily subfolders)
- Git (version control)

### Four-Folder Google Drive Architecture

```
Inbox (Root)
└── 2025-11-17/
    └── po_file.csv

Success (Root)
└── 2025-11-17/
    └── po_file_success.csv

Error (Root)
└── 2025-11-17/
    └── po_file_error.csv

Backup (Root)
└── 2025-11-17/
    └── po_file_backup.csv
```

## Database Schema

### Tables

#### purchase_orders
```sql
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    purchase_order_no VARCHAR(50) UNIQUE NOT NULL,
    order_date DATE NOT NULL,
    order_currency VARCHAR(10) NOT NULL,
    purchase_order_amount NUMERIC(18,2) NOT NULL,
    payment_terms_days INTEGER NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_address TEXT NOT NULL,
    item_summary TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    invoice_address TEXT NOT NULL,
    supplier_company_registration_no VARCHAR(100),
    purchase_company_registration_no VARCHAR(100),
    source_filename VARCHAR(255) NOT NULL,
    processed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    -- Dynamic fields added via ALTER TABLE based on config
);

CREATE INDEX ix_purchase_orders_purchase_order_no ON purchase_orders(purchase_order_no);
```

#### users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'it', 'sales', 'accounts', 'third_party') NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX ix_users_username ON users(username);
CREATE INDEX ix_users_email ON users(email);
```

#### file_processing_logs
```sql
CREATE TABLE file_processing_logs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,  -- 'success', 'partial', 'error'
    records_total INTEGER NOT NULL DEFAULT 0,
    records_success INTEGER NOT NULL DEFAULT 0,
    records_error INTEGER NOT NULL DEFAULT 0,
    error_details TEXT,
    processed_at TIMESTAMP NOT NULL
);
```

## Processing Workflow

1. **Scheduler runs** every N minutes (default: 2)
2. **Ensures today's folders** exist in all four roots (inbox/success/error/backup)
3. **Lists files** in `inbox/{today}/`
4. **For each file:**
   - Download from inbox
   - Upload copy to `backup/{today}/{filename}_backup.csv`
   - Parse CSV → split into success rows + error rows
   - Upload `success/{today}/{filename}_success.csv` (all rows, NULL for missing)
   - Upload `error/{today}/{filename}_error.csv` (only if errors exist)
   - Insert all rows into `purchase_orders` (NULL for missing fields)
   - **Delete original** from inbox (even on failure via try/finally)
5. **Returns stats**: {processed, backed_up, errors}

## Dynamic Fields

### Config-Driven Schema

Fields defined in `server/config/fields_config.json`:
```json
{
  "purchase_order_fields": [
    {
      "name": "shipping_method",
      "type": "string",
      "mandatory": false,
      "allowed_values": ["Air", "Sea", "Land"],
      "editable": true,
      "editable_by_roles": ["admin", "it", "sales"],
      "allow_null_on_partial_success": true,
      "validation": "^(Air|Sea|Land)$"
    }
  ],
  "partial_success_settings": {
    "enabled": true
  }
}
```

### Field Properties
- `name`: Column name
- `type`: string, text, integer, decimal, date
- `mandatory`: Must be present (unless allow_null_on_partial_success = true)
- `validation`: Regex pattern
- `allowed_values`: Enum list
- `min_value`, `max_value`: Range validation
- `format`: Date format string
- `editable`: Can be modified after creation
- `editable_by_roles`: Which roles can edit this field
- `allow_null_on_partial_success`: If true, mandatory field can be NULL on partial success

### Schema Management

On startup, `dynamic_schema.ensure_purchase_order_columns()`:
- Reads `fields_config.json`
- Checks existing columns in `purchase_orders` table
- Adds missing columns: `ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS {name} {type}`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (returns access + refresh tokens)
- `POST /api/auth/refresh` - Refresh access token

### Users
- `POST /api/users` - Create user
- `GET /api/users` - List users
- `PATCH /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Purchase Orders
- `GET /api/purchase-orders` - List POs (with filters)
- `GET /api/purchase-orders/{id}` - Get PO details
- `PATCH /api/purchase-orders/{id}` - Update PO (role-based field editing)
- `DELETE /api/purchase-orders/{id}` - Delete PO

### Errors
- `GET /api/errors` - List error files
- `GET /api/errors/{id}` - Get error file details (row-level errors)
- `POST /api/errors/{id}/retry` - Retry processing error file

### Files
- `POST /api/files/upload` - Upload file to inbox/{today}
- `GET /api/files/success` - List success files
- `GET /api/files/errors` - List error files
- `GET /api/files/{id}/download` - Download file

### Scheduler
- `GET /api/scheduler/status` - Current interval, last run stats
- `POST /api/scheduler/interval?minutes=N` - Update interval

### Health
- `GET /health` - Health check

## Role-Based Access Control (RBAC)

### Roles
- **admin**: Full access to all endpoints and fields
- **it**: Full access to all endpoints and fields
- **sales**: Read all POs; edit supplier, items, delivery fields
- **accounts**: Read all POs; edit amounts, payment terms, invoice fields
- **third_party**: Read-only access

### Field Editing Rules
- Derived from JWT token `role` claim
- Enforced in `PATCH /api/purchase-orders/{id}`:
  - Extract role from token
  - Check `fields_config.json` → `editable_by_roles` for each field in request
  - Reject updates with 403 if role not allowed

### Frontend UI Rules
- Login required for all pages (except `/login`)
- Show user role in header
- Disable edit buttons for read-only roles
- Grey out non-editable fields using Tailwind

## Frontend Components

### Structure
```
client/src/
├── App.jsx                     # Main app with router
├── components/
│   ├── auth/
│   │   └── LoginPage.jsx       # Login form
│   ├── layout/
│   │   └── Layout.jsx          # Header with tabs
│   └── purchase-orders/
│       ├── SuccessTab.jsx      # Table with filters + edit modal
│       └── ErrorTab.jsx        # Error file list + details drawer
├── assets/
├── __tests__/
│   └── App.test.jsx
└── index.css                   # Tailwind imports
```

### Success Tab Features
- **Table**: All PO fields (base + dynamic)
- **Filters**:
  - Date range (order_date)
  - Supplier name (search)
  - Currency (select)
  - Amount range (min/max)
  - PO number (search)
- **Edit**: Click row → modal with fields
  - Fields disabled if role not allowed (from config)
  - Save → `PATCH /api/purchase-orders/{id}`

### Error Tab Features
- **Table**: Error files (name, date, #errors)
- **View Details**: Drawer/modal with error rows
  - Columns: row_number, missing_fields, error_details
- **Retry**: Button → `POST /api/errors/{id}/retry`

## File Naming Rules

Given input file `abc.csv`:
- Backup: `abc_backup.csv`
- Success: `abc_success.csv`
- Error: `abc_error.csv`

## Partial Success Rules

- **Success CSV**: ALWAYS written, includes ALL parsed rows
  - Missing values → literal string `"NULL"` (not empty string)
- **Error CSV**: Written ONLY if at least one row has errors
  - Columns: `row_number`, `missing_fields`, `error_details`
- **Database**: ALL parsed rows inserted
  - Missing values → Python `None` → SQL `NULL`

## Testing

### Backend
```bash
cd server
pytest
```

### Frontend
```bash
cd client
npm test
npm run test:coverage
```

## Deployment

See `docs/DEPLOYMENT_GUIDE.md` for production setup.

## Environment Variables

Key environment variables (see `server/.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_DRIVE_INBOX_FOLDER_ID`: Root inbox folder
- `GOOGLE_DRIVE_SUCCESS_FOLDER_ID`: Root success folder
- `GOOGLE_DRIVE_ERROR_FOLDER_ID`: Root error folder
- `GOOGLE_DRIVE_BACKUP_FOLDER_ID`: Root backup folder
- `GOOGLE_SERVICE_ACCOUNT_FILE`: Path to service account JSON
- `JWT_SECRET_KEY`: Secret for JWT signing
- `SCHEDULER_INTERVAL_MINUTES`: Processing interval (default: 2)
- `FIELDS_CONFIG_PATH`: Path to fields config JSON

## Migration from Credit Data Watch

### What Was Removed
- FileRecord model & schema
- Credit fields: account_no, name, address, mobile_no, pincode
- Old parsers: CSV, Excel, Word, Text, PDF, PNG, Image
- Old services: file_processing, google_drive, scheduler
- Old API endpoints: `/api/records`, `/api/records/stats`
- Two-folder system (process, exception)
- Old tests referencing legacy models

### What Was Added
- PurchaseOrder, User, FileProcessingLog models
- Purchase order CSV parser with partial success
- Google Drive v2 service with four folders + daily subfolders
- File pipeline service
- Scheduler v2
- JWT authentication + RBAC
- Dynamic schema management
- New API endpoints (auth, users, purchase-orders, errors, files, scheduler)
- New React frontend (login, success/error tabs)

## License

MIT
