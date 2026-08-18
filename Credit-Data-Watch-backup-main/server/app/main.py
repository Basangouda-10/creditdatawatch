"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import re
import os

from app.config import settings
from app.database import engine, Base
from sqlalchemy import text
from app.middleware import (
    ErrorHandlerMiddleware,
    RequestIDMiddleware,
    RateLimitMiddleware,
)
from app.routes import (
    auth,
    drive,
    core,
    admin,
    subscriptions,
    business_profile,
    appointments,
    contact,
    wallet,
    payments,
    user_settings,
    legal,
    workflow,
    credibility_index,
    business_check,
)
from app.routes.workflow import router as workflow_router
from app.routes.invoice_routes import invoice_router

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


import subprocess
import requests
import time

def ensure_ollama_running():
    """Auto-start Ollama if not running."""
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=3)
        if r.status_code == 200:
            print("[OLLAMA] Already running ✅")
            return True
    except:
        pass
    
    try:
        print("[OLLAMA] Starting Ollama server...")
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0)
        )
        for i in range(10):
            time.sleep(2)
            try:
                r = requests.get("http://localhost:11434/api/tags", timeout=3)
                if r.status_code == 200:
                    print("[OLLAMA] Started successfully ✅")
                    return True
            except:
                print(f"[OLLAMA] Waiting for startup... ({i+1}/10)")
        print("[OLLAMA] Failed to start after 20 seconds ❌")
        return False
    except FileNotFoundError:
        print("[OLLAMA] Ollama not installed or not in PATH ❌")
        return False
    except Exception as e:
        print(f"[OLLAMA] Error starting: {e}")
        return False


def ensure_model_available(model: str = "llama3"):
    """Auto-pull model if not already downloaded."""
    try:
        r = requests.get("http://localhost:11434/api/tags", timeout=5)
        if r.status_code == 200:
            models = [m['name'] for m in r.json().get('models', [])]
            model_names = [m.split(':')[0] for m in models]
            if model in model_names:
                print(f"[OLLAMA] Model '{model}' already available ✅")
                return True
            else:
                print(f"[OLLAMA] Pulling '{model}' model... (may take a few minutes)")
                result = subprocess.run(
                    ["ollama", "pull", model],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    print(f"[OLLAMA] Model '{model}' downloaded ✅")
                    return True
                else:
                    print(f"[OLLAMA] Pull failed: {result.stderr}")
                    return False
    except Exception as e:
        print(f"[OLLAMA] Model check failed: {e}")
        return False

# Create tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting CreditDataWatch API...")
    
    import asyncio
    asyncio.create_task(asyncio.to_thread(lambda: (
        print("[STARTUP] Checking Ollama in background..."),
        ensure_ollama_running() and ensure_model_available("llama3")
    )))

    try:
        logger.info(f"DATABASE_URL={str(engine.url)}")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            try:
                sel = await conn.execute(text("SELECT 1"))
                logger.info(f"DB SELECT 1 result={sel.scalar()}")
            except Exception as e:
                import traceback; logger.error("DB SELECT 1 failed"); traceback.print_exc(); raise
            
            dburl = str(engine.url)
            is_sqlite = dburl.startswith("sqlite")

            try:
                if is_sqlite:
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN supplier_address TEXT"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN delivery_address TEXT"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN invoice_address TEXT"))
                    except Exception: pass
                else:
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_address TEXT"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_address TEXT"))
                logger.info("PO address columns migrated/verified")
            except Exception as e:
                logger.info(f"PO address migration step skipped or already applied: {e}")

            try:
                if not is_sqlite:
                    await conn.execute(text("""
                        DO $$
                        DECLARE idxname text;
                        DECLARE rec RECORD;
                        BEGIN
                            SELECT i.relname INTO idxname
                            FROM pg_class t
                            JOIN pg_index x ON t.oid = x.indrelid
                            JOIN pg_class i ON i.oid = x.indexrelid
                            JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(x.indkey)
                            WHERE t.relname = 'users' AND i.relname LIKE 'users_gstin%';
                            IF idxname IS NOT NULL THEN
                                EXECUTE 'DROP INDEX IF EXISTS ' || idxname;
                            END IF;
                            FOR rec IN
                                SELECT indexname FROM pg_indexes 
                                WHERE schemaname = ANY(current_schemas(false))
                                  AND tablename = 'users'
                                  AND indexdef ILIKE '%%unique%%'
                                  AND indexdef ILIKE '%%(gstin%%'
                            LOOP
                                EXECUTE 'DROP INDEX IF EXISTS ' || quote_ident(rec.indexname);
                            END LOOP;
                        END $$;
                    """))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR(36)"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE'"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'USER'"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(36)"))
                    await conn.execute(text("DROP INDEX IF EXISTS users_gstin_company_unique"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_users_gstin_company ON users (gstin, company_id)"))
                    await conn.execute(text("ALTER TABLE users ALTER COLUMN gstin SET NOT NULL"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_bypass BOOLEAN DEFAULT FALSE"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_access BOOLEAN DEFAULT FALSE"))
                    await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'INACTIVE'"))
                else:
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN company_id VARCHAR(36)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN name VARCHAR(255)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE'"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(30) DEFAULT 'USER'"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN created_by VARCHAR(36)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN subscription_bypass BOOLEAN DEFAULT FALSE"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN full_access BOOLEAN DEFAULT FALSE"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE users ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'INACTIVE'"))
                    except Exception: pass
                logger.info("Users table migrated/verified")
            except Exception as e:
                logger.info(f"Users migration step skipped or already applied: {e}")

            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS audit_logs (
                        id VARCHAR(36) PRIMARY KEY,
                        user_id VARCHAR(36),
                        user_email VARCHAR(255),
                        user_name VARCHAR(255),
                        action VARCHAR(50) NOT NULL,
                        entity_type VARCHAR(50) DEFAULT 'PO',
                        entity_id VARCHAR(36),
                        po_number VARCHAR(100),
                        vendor_name VARCHAR(255),
                        reason TEXT,
                        old_data TEXT,
                        new_data TEXT,
                        metadata_json TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                
                if is_sqlite:
                    try: await conn.execute(text("ALTER TABLE audit_logs ADD COLUMN metadata_json TEXT"))
                    except: pass
                else:
                    try: await conn.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS metadata_json TEXT"))
                    except: pass
                
                logger.info("Audit logs table verified/created")
            except Exception as e:
                logger.info(f"Audit logs migration failed: {e}")

            try:
                if not is_sqlite:
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITHOUT TIME ZONE"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE"))
                    await conn.execute(text("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='number') THEN ALTER TABLE purchase_orders RENAME COLUMN number TO po_number; END IF; END $$;"))
                    await conn.execute(text("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='vendor_name') THEN ALTER TABLE purchase_orders RENAME COLUMN vendor_name TO vendor; END IF; END $$;"))
                    await conn.execute(text("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='vendor_gstin') THEN ALTER TABLE purchase_orders RENAME COLUMN vendor_gstin TO gstin; END IF; END $$;"))
                    await conn.execute(text("DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_orders' AND column_name='is_archived') THEN ALTER TABLE purchase_orders RENAME COLUMN is_archived TO archived; END IF; END $$;"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS company_id VARCHAR(36)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_email VARCHAR(255)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_phone VARCHAR(20)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS legal_notice_sent_at TIMESTAMP WITHOUT TIME ZONE"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS legal_notice_status VARCHAR(50)"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_po_company_status ON purchase_orders (company_id, status)"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_po_gstin ON purchase_orders (gstin)"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_po_payment ON purchase_orders (payment_completed_at)"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_po_created ON purchase_orders (created_at)"))
                    await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_po_updated ON purchase_orders (updated_at)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_window_days INTEGER DEFAULT 50"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS legal_support_requested_at TIMESTAMP WITHOUT TIME ZONE"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS evidence_url VARCHAR(500)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS evidence_filename VARCHAR(255)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_receipt_url VARCHAR(500)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_receipt_filename VARCHAR(255)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_by VARCHAR(36)"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITHOUT TIME ZONE"))
                    await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT"))
                    await conn.execute(text("DROP INDEX IF EXISTS ix_purchase_orders_po_number"))
                else:
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN payment_completed_at TIMESTAMP"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN updated_at TIMESTAMP"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN company_id VARCHAR(36)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN vendor_email VARCHAR(255)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN vendor_phone VARCHAR(20)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN legal_notice_status VARCHAR(50)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN payment_window_days INTEGER DEFAULT 50"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN evidence_url VARCHAR(500)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN evidence_filename VARCHAR(255)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN payment_receipt_url VARCHAR(500)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN payment_receipt_filename VARCHAR(255)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN approved_by VARCHAR(36)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN approved_at TIMESTAMP"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE purchase_orders ADD COLUMN rejection_reason TEXT"))
                    except Exception: pass
                
                await conn.execute(text("UPDATE purchase_orders SET archived = FALSE WHERE archived IS NULL"))
                logger.info("PurchaseOrder table columns migrated/verified")
            except Exception as e:
                logger.info(f"PurchaseOrder migration failed: {e}")

            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS scheduled_reminders (
                        id VARCHAR(36) PRIMARY KEY,
                        purchase_order_id VARCHAR(36) NOT NULL,
                        user_id VARCHAR(36) NOT NULL,
                        subject VARCHAR(255) NOT NULL,
                        body TEXT NOT NULL,
                        scheduled_at TIMESTAMP NOT NULL,
                        sent_at TIMESTAMP,
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                logger.info("scheduled_reminders table verified")
            except Exception as e:
                logger.info(f"scheduled_reminders migration failed: {e}")

            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS app_settings (
                        id VARCHAR(36) PRIMARY KEY,
                        payment_window_days INTEGER DEFAULT 50,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                res = await conn.execute(text("SELECT id FROM app_settings LIMIT 1"))
                if res.first() is None:
                    await conn.execute(text("INSERT INTO app_settings (id, payment_window_days) VALUES ('default', 50)"))
                logger.info("app_settings table verified")
            except Exception as e:
                logger.info(f"app_settings migration failed: {e}")

            try:
                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS workflow_items (
                        id VARCHAR(36) PRIMARY KEY,
                        type VARCHAR(50) NOT NULL,
                        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                        entity_id VARCHAR(255),
                        entity_type VARCHAR(50),
                        requested_by_email VARCHAR(255),
                        requested_by_id VARCHAR(36),
                        reason TEXT,
                        evidence_url VARCHAR(500),
                        evidence_filename VARCHAR(255),
                        review_notes TEXT,
                        reviewed_by_email VARCHAR(255),
                        rejection_reason TEXT,
                        report_text TEXT,
                        verdict VARCHAR(50),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                logger.info("workflow_items table verified")

                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS role_settings (
                        id SERIAL PRIMARY KEY,
                        role_name VARCHAR(50) UNIQUE NOT NULL,
                        is_enabled BOOLEAN DEFAULT true,
                        updated_by VARCHAR(255),
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                if is_sqlite:
                    await conn.execute(text("""
                        INSERT OR IGNORE INTO role_settings (role_name, is_enabled)
                        VALUES ('FINANCIAL', true), ('LEGAL', true)
                    """))
                else:
                    await conn.execute(text("""
                        INSERT INTO role_settings (role_name, is_enabled)
                        VALUES ('FINANCIAL', true), ('LEGAL', true)
                        ON CONFLICT (role_name) DO NOTHING
                    """))
                logger.info("role_settings table verified")

                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id VARCHAR(36) PRIMARY KEY,
                        user_id VARCHAR(36),
                        recipient_role VARCHAR(50),
                        title VARCHAR(255) NOT NULL,
                        message TEXT,
                        type VARCHAR(50),
                        link VARCHAR(500),
                        is_read BOOLEAN DEFAULT false,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                logger.info("notifications table verified")

                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS support_requests (
                        id VARCHAR(36) PRIMARY KEY,
                        user_id VARCHAR(36) NOT NULL,
                        user_email VARCHAR(255),
                        title VARCHAR(255),
                        description TEXT,
                        status VARCHAR(50) DEFAULT 'PENDING_OPERATION',
                        ops_notes TEXT,
                        ops_reviewed_by VARCHAR(255),
                        master_notes TEXT,
                        master_reviewed_by VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                logger.info("support_requests table verified")

                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS business_check_requests (
                        id VARCHAR(36) PRIMARY KEY,
                        user_id VARCHAR(36) NOT NULL,
                        user_email VARCHAR(255),
                        company_name VARCHAR(255) NOT NULL,
                        gstin VARCHAR(50) NOT NULL,
                        reason VARCHAR(255),
                        additional_info TEXT,
                        status VARCHAR(50) DEFAULT 'PENDING_OPERATION',
                        report_text TEXT,
                        verdict VARCHAR(50),
                        ops_reviewed_by VARCHAR(255),
                        master_approved_by VARCHAR(255),
                        is_new_company BOOLEAN DEFAULT false,
                        saved_to_network BOOLEAN DEFAULT false,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                logger.info("business_check_requests table verified")

                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS company_user_edit_requests (
                        id VARCHAR(36) PRIMARY KEY,
                        entity_type VARCHAR(50) NOT NULL,
                        entity_id VARCHAR(36) NOT NULL,
                        old_data JSON,
                        new_data JSON,
                        reason TEXT NOT NULL,
                        requested_by_email VARCHAR(255) NOT NULL,
                        status VARCHAR(50) DEFAULT 'PENDING',
                        reviewed_by_email VARCHAR(255),
                        review_notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                logger.info("company_user_edit_requests table ready")

                await conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS system_settings (
                        id VARCHAR(36) PRIMARY KEY,
                        key VARCHAR(100) UNIQUE NOT NULL,
                        value TEXT,
                        description TEXT,
                        updated_by VARCHAR(255),
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """))
                if is_sqlite:
                    await conn.execute(text("""
                        INSERT OR IGNORE INTO system_settings (id, key, value, description)
                        VALUES (hex(randomblob(16)), 'financial_role_enabled', 'false', 'When enabled, Financial team members see their own dashboard and handle payment tasks'),
                               (hex(randomblob(16)), 'legal_role_enabled', 'false', 'When enabled, Legal team members see their own dashboard and handle legal tasks')
                    """))
                else:
                    await conn.execute(text("""
                        INSERT INTO system_settings (id, key, value, description)
                        VALUES (gen_random_uuid(), 'financial_role_enabled', 'false', 'When enabled, Financial team members see their own dashboard and handle payment tasks'),
                               (gen_random_uuid(), 'legal_role_enabled', 'false', 'When enabled, Legal team members see their own dashboard and handle legal tasks')
                        ON CONFLICT (key) DO NOTHING
                    """))
                logger.info("system_settings table initialized")

            except Exception as e:
                logger.info(f"Phase 2 tables migration step skipped/error: {e}")

            try:
                if not is_sqlite:
                    await conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)"))
                    await conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_mobile VARCHAR(50)"))
                else:
                    try: await conn.execute(text("ALTER TABLE invoices ADD COLUMN customer_email VARCHAR(255)"))
                    except Exception: pass
                    try: await conn.execute(text("ALTER TABLE invoices ADD COLUMN customer_mobile VARCHAR(50)"))
                    except Exception: pass
                logger.info("Invoices table email/mobile columns verified")
            except Exception as e:
                logger.info(f"Invoices email/mobile migration step skipped: {e}")

            await conn.commit()
            logger.info("All startup migrations completed")
            
            try:
                await _ensure_dev_admin()
                logger.info("Developer admin ensured")
            except Exception as e:
                logger.info(f"Developer admin bootstrap failed: {e}")

    except Exception as e:
        logger.warning(f"Database connection failed during startup: {e}")
        logger.info("Continuing without database initialization...")

    import asyncio
    if getattr(settings, "ENABLE_SCHEDULER", True):
        asyncio.create_task(_daily_tasks_runner())
        asyncio.create_task(_scheduled_reminders_runner())
        asyncio.create_task(_overdue_legal_notifier_runner())

    yield

    logger.info("Shutting down...")
    try:
        await engine.dispose()
    except Exception as e:
        logger.warning(f"Error disposing database engine: {e}")


app = FastAPI(
    title="CreditDataWatch API",
    description="Credit intelligence and B2B transaction management",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    openapi_url="/openapi.json",
)

@app.get("/")
async def root():
    return {"message": "CreditDataWatch API is running!", "status": "ok"}

import os 
from pathlib import Path
from fastapi.staticfiles import StaticFiles 

uploads_dir = Path(__file__).parent.parent / "uploads"
os.makedirs(uploads_dir, exist_ok=True) 
app.mount( 
    "/uploads", 
    StaticFiles(directory=str(uploads_dir)), 
    name="uploads" 
) 

_cors_origins = [
    "http://localhost:3000", "http://127.0.0.1:3000",
    "http://localhost:3001", "http://127.0.0.1:3001",
    "http://localhost:3002", "http://127.0.0.1:3002",
    "http://localhost:3003", "http://127.0.0.1:3003",
    "http://localhost:3004", "http://127.0.0.1:3004",
    "http://localhost:5173", "http://127.0.0.1:5173",
    "http://localhost:8080", "http://127.0.0.1:8080",
    "http://localhost:8082", "http://127.0.0.1:8082"
]
if settings.CORS_ORIGINS:
    for origin in settings.CORS_ORIGINS:
        if origin not in _cors_origins:
            _cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(ErrorHandlerMiddleware)

API_PREFIX = "/api/v1"

# Routes
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Authentication"])
app.include_router(core.upload_router, prefix=API_PREFIX, tags=["Upload"])
app.include_router(core.user_router, prefix=f"{API_PREFIX}/user", tags=["User"])
app.include_router(core.audit_router, prefix=API_PREFIX, tags=["Audit"])
app.include_router(core.po_router, prefix=f"{API_PREFIX}/purchase-orders", tags=["Purchase Orders"])
app.include_router(core.pos_router, prefix=f"{API_PREFIX}/pos", tags=["Purchase Orders (Legacy)"])
app.include_router(core.purchase_history_router, prefix=API_PREFIX, tags=["Purchase History"])
app.include_router(core.notifications_router, prefix=f"{API_PREFIX}/notifications", tags=["Notifications"])
app.include_router(invoice_router)
app.include_router(core.defaulter_router, prefix=f"{API_PREFIX}/defaulters", tags=["Defaulters"])
app.include_router(core.gstin_router, prefix=f"{API_PREFIX}/gstin", tags=["GSTIN"])
app.include_router(core.credit_router, prefix=f"{API_PREFIX}/credit-reports", tags=["Credit Reports"])
app.include_router(core.settlement_router, prefix=f"{API_PREFIX}/settlement", tags=["Settlement"])
app.include_router(appointments.router, prefix=API_PREFIX, tags=["Appointments"])
app.include_router(contact.router, prefix=API_PREFIX, tags=["Contact"])
app.include_router(subscriptions.router, prefix=API_PREFIX, tags=["Subscriptions"])
app.include_router(business_profile.router, prefix=API_PREFIX, tags=["Account"])
app.include_router(drive.router, prefix=f"{API_PREFIX}/drive", tags=["Google Drive"])
app.include_router(wallet.router, prefix=API_PREFIX, tags=["Wallet"])
app.include_router(admin.router, prefix=f"{API_PREFIX}/admin", tags=["Admin"])
app.include_router(payments.router, prefix=f"{API_PREFIX}/payments", tags=["Payments"])
app.include_router(user_settings.router, prefix=f"{API_PREFIX}/user/settings", tags=["User Settings"])
app.include_router(legal.router, prefix=API_PREFIX, tags=["Legal"])
app.include_router(workflow_router, prefix=f"{API_PREFIX}/workflow", tags=["workflow"])
from app.routes import ratings, invitations
app.include_router(ratings.router, prefix=f"{API_PREFIX}", tags=["Ratings"])
app.include_router(invitations.router, prefix=f"{API_PREFIX}", tags=["Invitations"])
from app.routes import credibility
app.include_router(credibility.router, prefix=f"{API_PREFIX}", tags=["Credibility"])
from app.routes import chat, activity
app.include_router(chat.router, prefix=f"{API_PREFIX}", tags=["Chat"])
app.include_router(activity.router, prefix=f"{API_PREFIX}/activity", tags=["Activity"])
app.include_router(core.business_requests_router, prefix=f"{API_PREFIX}", tags=["Business Requests"])
app.include_router(credibility_index.router)
app.include_router(business_check.router, prefix=API_PREFIX)


import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from uuid import uuid4
from .database import AsyncSessionLocal
from app.services.credibility_service import CredibilityService
from .models import PurchaseOrder, Notification, User
from app.services.email_service import EmailService
from app.services.notification_service import NotificationService

async def _daily_tasks_runner():
    while True:
        now = datetime.utcnow()
        next_run = now.replace(hour=2, minute=0, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        delay = (next_run - now).total_seconds()
        await asyncio.sleep(delay)
        try:
            async with AsyncSessionLocal() as session:
                await CredibilityService.recalc_all(session)
                await session.commit()
                cutoff_start = datetime.utcnow()
                cutoff_end = cutoff_start + timedelta(days=3)
                stmt = select(PurchaseOrder, User).join(User, PurchaseOrder.user_id == User.id).where(
                    (PurchaseOrder.payment_completed_at.is_(None)) &
                    (PurchaseOrder.due_date >= cutoff_start) &
                    (PurchaseOrder.due_date < cutoff_end)
                )
                res = await session.execute(stmt)
                for po, user in res.all():
                    await NotificationService.send(
                        db=session,
                        to_email=user.email,
                        title=f"⚠️ PO {po.po_number} Due Soon",
                        message=f"PO {po.po_number} is due on {po.due_date.date()}",
                        ntype="PO_DUE_SOON",
                        action_url="http://localhost:3001/dashboard/user",
                        related_po_id=po.id
                    )
                stmt2 = select(PurchaseOrder, User).join(User, PurchaseOrder.user_id == User.id).where(
                    (PurchaseOrder.payment_completed_at.is_(None)) &
                    (PurchaseOrder.due_date < datetime.utcnow())
                )
                res2 = await session.execute(stmt2)
                for po, user in res2.all():
                    await NotificationService.send(
                        db=session,
                        to_email=user.email,
                        title=f"🚨 PO {po.po_number} Overdue",
                        message=f"PO {po.po_number} is overdue since {po.due_date.date()}",
                        ntype="PO_OVERDUE",
                        action_url="http://localhost:3001/dashboard/user",
                        related_po_id=po.id
                    )
                try:
                    from app.models import POReminderConfig
                    cfg_res = await session.execute(select(POReminderConfig))
                    cfg = cfg_res.scalars().first()
                    before_days = (cfg.before_days or []) if cfg else []
                    after_daily = bool(cfg.after_due_daily_enabled) if cfg else False
                    
                    custom_subject = cfg.reminder_subject if cfg else None
                    custom_body = cfg.reminder_body if cfg else None

                    def format_vendor_email(template, po, default_val):
                        if not template:
                            return default_val
                        return template.replace("{vendor_name}", po.vendor or "") \
                                       .replace("{amount}", f"₹{po.amount:,.2f}") \
                                       .replace("{due_date}", str(po.due_date.date())) \
                                       .replace("{po_number}", po.po_number or "")

                    if before_days:
                        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                        for d in before_days:
                            try:
                                delta = int(d)
                            except Exception:
                                continue
                            target_start = today + timedelta(days=delta)
                            target_end = target_start + timedelta(days=1)
                            q = select(PurchaseOrder).where(
                                (PurchaseOrder.payment_completed_at.is_(None)) &
                                (PurchaseOrder.due_date >= target_start) &
                                (PurchaseOrder.due_date < target_end)
                            )
                            po_res = await session.execute(q)
                            for po in po_res.scalars().all():
                                if po.vendor_email:
                                    subject = format_vendor_email(custom_subject, po, f"Reminder: PO {po.po_number} due in {delta} day(s)")
                                    body = format_vendor_email(custom_body, po, f"PO {po.po_number} to {po.vendor} amount {po.amount} is due on {po.due_date.date()}.")
                                    try:
                                        await EmailService().send_email(po.vendor_email, subject, body)
                                    except Exception:
                                        pass
                    if after_daily:
                        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                        q2 = select(PurchaseOrder).where(
                            (PurchaseOrder.payment_completed_at.is_(None)) &
                            (PurchaseOrder.due_date < today_start) &
                            (PurchaseOrder.status != "Closed")
                        )
                        po_res2 = await session.execute(q2)
                        for po in po_res2.scalars().all():
                            if po.vendor_email:
                                subject = format_vendor_email(custom_subject, po, f"Overdue: PO {po.po_number}")
                                body = format_vendor_email(custom_body, po, f"PO {po.po_number} has been overdue since {po.due_date.date()}. Kindly process immediately.")
                                try:
                                    await EmailService().send_email(po.vendor_email, subject, body)
                                except Exception:
                                    pass
                except Exception as e:
                    logger.error(f"Error in background reminder tasks: {e}")
                await session.commit()
        except Exception as e:
            logger.error(f"Daily tasks failed: {e}")

async def _scheduled_reminders_runner():
    logger.info("Starting frequent scheduled reminders runner (1m interval)")
    while True:
        try:
            async with AsyncSessionLocal() as session:
                from app.models import ScheduledReminder, PurchaseOrder
                now = datetime.utcnow()
                q_sched = select(ScheduledReminder, PurchaseOrder).join(
                    PurchaseOrder, ScheduledReminder.purchase_order_id == PurchaseOrder.id
                ).where(
                    (ScheduledReminder.scheduled_at <= now) &
                    (ScheduledReminder.sent_at.is_(None))
                )
                sched_res = await session.execute(q_sched)
                tasks = sched_res.all()
                for sr, po in tasks:
                    if po.vendor_email:
                        try:
                            await EmailService().send_email(po.vendor_email, sr.subject, sr.body)
                            sr.sent_at = datetime.utcnow()
                            await session.commit()
                        except Exception as e:
                            logger.error(f"Failed to send scheduled reminder {sr.id}: {e}")
                await session.commit()
        except Exception as e:
            logger.error(f"Error in scheduled reminders runner: {e}")
        await asyncio.sleep(60)

async def _overdue_legal_notifier_runner():
    logger.info("Starting frequent overdue legal notifier runner (1m interval)")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                from datetime import datetime, date
                today = date.today()
                
                stmt = select(PurchaseOrder).where(
                    PurchaseOrder.due_date < datetime.combine(today, datetime.min.time()),
                    PurchaseOrder.status == "Open"
                )
                overdue_pos_res = await db.execute(stmt)
                overdue_pos = overdue_pos_res.scalars().all()
                
                for po in overdue_pos:
                    subject = f"⚠️ AUTO ALERT: PO Overdue - {po.po_number} - {po.vendor}"
                    body = f"AUTOMATIC OVERDUE ALERT\nPO Number: {po.po_number}\nVendor: {po.vendor}\nAmount: Rs.{po.amount}\nDue Date: {po.due_date}\nStatus: {po.status}\nPlease review."
                    try: 
                        await NotificationService.send_to_role(
                            db=db,
                            role="LEGAL",
                            title=subject,
                            message=body,
                            ntype="LEGAL_ALERT",
                            action_url="http://localhost:3001/dashboard/admin"
                        )
                        logger.info(f"[LEGAL] Auto alert sent for overdue PO: {po.po_number}")
                    except Exception as e: 
                        logger.error(f"[LEGAL ERROR] Failed to send auto alert: {e}") 
                await db.commit()
        except Exception as e:
            logger.error(f"Error in overdue legal notifier runner: {e}")
        await asyncio.sleep(60)

try:
    from sqlalchemy import select
    from uuid import uuid4
    from .database import AsyncSessionLocal
    from .models import User, Company
    from app.utils.password import hash_password
    from app.utils.phone import format_phone_e164, is_valid_phone
    from .utils.gstin import is_valid_gstin
    async def _ensure_dev_admin():
        dev_email = "payalshinde906@gmail.com"
        dev_gstin = "22AAAAD0000A1Z5"
        dev_phone = "+919112896827"
        dev_role = "MASTER_ADMIN"
        dev_company_name = "Test Company"
        dev_password = "AdminPass123!"
        dev_domain = "gmail.com"

        if not is_valid_gstin(dev_gstin):
            return

        async with AsyncSessionLocal() as _db:
            res_company = await _db.execute(select(Company).where(Company.gstin == dev_gstin))
            company = res_company.scalars().first()
            if not company:
                company = Company(id=str(uuid4()), company_name=dev_company_name, gstin=dev_gstin, domain_name=dev_domain, is_verified=True)
                _db.add(company)
                await _db.flush()

            res_user = await _db.execute(select(User).where(User.email == dev_email))
            user = res_user.scalars().first()
            if user:
                user.role = dev_role
                user.is_active = True
                user.subscription_bypass = True
                user.full_access = True
                user.gstin = dev_gstin
                user.company_id = company.id
                user.phone = dev_phone
                user.status = "ACTIVE"
                user.company_name = dev_company_name
                user.subscription_status = "ACTIVE"
                user.password_hash = hash_password(dev_password)
                await _db.commit()
            else:
                user = User(id=str(uuid4()), company_id=company.id, name=dev_company_name, email=dev_email, password_hash=hash_password(dev_password), role=dev_role, status="ACTIVE", phone=dev_phone, gstin=dev_gstin, company_name=dev_company_name, subscription_bypass=True, full_access=True, is_active=True, subscription_status="ACTIVE")
                _db.add(user)
                await _db.commit()
except Exception:
    pass


@app.get("/health")
async def health_check():
    db_status = "ok"
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unavailable: {str(e)}"
    return {"status": "ok", "service": "creditdatawatch-api", "version": "1.0.0", "db": db_status}


@app.get("/")
async def root():
    return {"message": "CreditDataWatch API", "version": "1.0.0", "docs": "/docs", "health": "/health"}