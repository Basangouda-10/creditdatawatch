"""
Routes module init (stub file to map routers)
"""
from app.routes import auth, drive, core, subscriptions, admin, business_profile, invitations

# Router mappings will be imported in main.py
# auth.router -> /api/v1/auth
# core.user_router -> /api/v1/user
# core.po_router -> /api/v1/purchase-orders
# core.defaulter_router -> /api/v1/defaulters
# subscriptions.router -> /api/v1/subscriptions
# business_profile.router -> /api/v1/account
# admin.router -> /api/v1/admin
# core.credit_router -> /api/v1/credit-reports
# core.settlement_router -> /api/v1/settlements
# drive.router -> /api/v1/drive

__all__ = ["auth", "drive", "core", "invitations"]
