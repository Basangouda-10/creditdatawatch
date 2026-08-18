import uuid as uuid_lib
import logging
from typing import Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import AuditLog

logger = logging.getLogger(__name__)

async def log_audit(
    db: AsyncSession,
    user: Any = None,
    action: str = None,
    entity_obj: Any = None,
    **kwargs
):
    """
    Log an action to the audit_logs table.
    """
    try:
        from app.models import User, PurchaseOrder, Company, Subscription, Payment, DefaulterCase, CreditReport, Settlement, Invitation
        
        # 1. Extract user info
        user_id = None
        user_email = kwargs.pop("user_email", None)
        user_name = kwargs.pop("user_name", None)

        if user:
            if hasattr(user, "id"):
                user_id = str(user.id)
                if hasattr(user, "email"): user_email = user.email
                if hasattr(user, "name"): user_name = user.name
            elif isinstance(user, str):
                user_id = user
        elif "user_id" in kwargs:
            user_id = str(kwargs.pop("user_id"))

        # 2. Extract action
        action = action or kwargs.pop("action", "UNKNOWN")

        # 3. Extract entity info
        entity_type = kwargs.pop("entity_type", kwargs.pop("entity", "PO"))
        entity_id = kwargs.pop("entity_id", None)
        po_number = kwargs.pop("po_number", None)
        vendor_name = kwargs.pop("vendor_name", None)
        reason = kwargs.pop("reason", None)
        old_data = kwargs.pop("old_data", None)
        new_data = kwargs.pop("new_data", None)
        
        if entity_obj is not None:
            if hasattr(entity_obj, "id"):
                entity_id = str(entity_obj.id)
                entity_type = entity_obj.__class__.__name__
                if hasattr(entity_obj, "po_number"): po_number = entity_obj.po_number
                if hasattr(entity_obj, "vendor"): vendor_name = entity_obj.vendor
            elif isinstance(entity_obj, str):
                entity_type = entity_obj

        # Handle specific object keywords
        for key in ["po", "target_user", "company", "plan", "invitation", "defaulter_case", "settlement", "credit_report", "payment", "subscription", "business_request"]:
            if key in kwargs and kwargs[key] is not None:
                obj = kwargs.pop(key)
                if hasattr(obj, "id"):
                    entity_id = str(obj.id)
                    entity_type = obj.__class__.__name__ if key != "target_user" else "User"
                    if key == "po":
                        if hasattr(obj, "po_number"): po_number = obj.po_number
                        if hasattr(obj, "vendor"): vendor_name = obj.vendor
                    if key == "business_request":
                        if hasattr(obj, "company_name"): vendor_name = obj.company_name
                elif isinstance(obj, str) and not entity_id:
                    entity_id = obj
                    entity_type = key.capitalize()

        # Handle metadata/extra_data
        metadata = kwargs.pop("metadata", kwargs.pop("extra_data", {}))
        if not isinstance(metadata, dict):
            metadata = {"info": str(metadata)}
            
        if metadata:
            if not reason: reason = metadata.get("reason") or metadata.get("notes")
            if not po_number: po_number = metadata.get("po_number")
            if not vendor_name: vendor_name = metadata.get("vendor_name") or metadata.get("vendor")
            if not old_data and "old_data" in metadata: old_data = metadata.get("old_data")
            if not new_data and "new_data" in metadata: new_data = metadata.get("new_data")
            # If still no reason, use the whole dict as string
            if not reason and metadata: reason = str(metadata)

        audit_entry = AuditLog(
            id=str(uuid_lib.uuid4()),
            user_id=user_id,
            user_email=user_email,
            user_name=user_name,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            po_number=po_number,
            vendor_name=vendor_name,
            reason=str(reason) if reason else None,
            old_data=str(old_data) if old_data else None,
            new_data=str(new_data) if new_data else None,
            metadata_json=metadata if metadata else None
        )
        db.add(audit_entry)
        logger.info(f"[AUDIT] {action} on {entity_type} ({entity_id}) by user {user_id}")
    except Exception as e:
        logger.error(f"[AUDIT ERROR] Failed to log audit entry: {str(e)}")
        import traceback
        traceback.print_exc()
