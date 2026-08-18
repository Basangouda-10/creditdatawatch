import uuid 
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

class NotificationService:

    @staticmethod
    async def send(
        db: AsyncSession,
        to_email: str,
        title: str,
        message: str,
        ntype: str = "INFO",
        action_url: str = None,
        workflow_id: str = None,
        related_po_id: str = None,
        send_email: bool = True
    ):
        """Send notification IMMEDIATELY - no queue, no delay"""
        try:
            # 1. Save in-app notification to DB RIGHT NOW
            user_result = await db.execute(
                text("SELECT id FROM users WHERE email = :e"), {"e": to_email}
            )
            user_row = user_result.fetchone()
            
            if not user_row:
                print(f"[NOTIFY] Warning: No user found for email {to_email}, skipping notification")
                return
            
            notif_id = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO notifications 
                (id, user_id, user_email, title, message, type, 
                 action_url, workflow_item_id, related_po_id, is_read, created_at) 
                VALUES (:id, :uid, :email, :title, :msg, :type, 
                 :url, :wid, :po_id, false, NOW())
            """), {
                "id": notif_id,
                "uid": str(user_row[0]),
                "email": to_email,
                "title": title,
                "msg": message,
                "type": ntype,
                "url": action_url or "http://localhost:3001/dashboard",
                "wid": workflow_id,
                "po_id": related_po_id
            })
            await db.commit()
            print(f"[NOTIFY] Saved in-app notification: {to_email} — {title}")
            
            # 2. Send email IMMEDIATELY in background (don't await - non-blocking)
            if send_email:
                import asyncio
                task = asyncio.create_task(
                    NotificationService._send_email_background(to_email, title, message, action_url)
                )
                # Add a callback to log any exceptions from the task
                def log_task_result(task):
                    try:
                        task.result()
                    except Exception as e:
                        print(f"[NOTIFY] Background email task failed: {e}")
                        import traceback
                        traceback.print_exc()
                task.add_done_callback(log_task_result)
                print(f"[NOTIFY] Created background email task for {to_email}")
                
        except Exception as e:
            print(f"[NOTIFY] Error: {e}")
            import traceback
            traceback.print_exc()

    @staticmethod
    async def _send_email_background(to_email: str, title: str, message: str, action_url: str = None):
        """Send email in background - won't block the main request"""
        try:
            from app.services.email_service import send_email
            body = f"""{title}

{message}

{f'View in app: {action_url}' if action_url else 'Login: http://localhost:3001/auth/login'}

---
CreditDataWatch Notification
"""
            await send_email(
                to_email=to_email,
                subject=f"[CreditDataWatch] {title}",
                body=body
            )
            print(f"[NOTIFY] Email sent to {to_email}")
        except Exception as e:
            print(f"[NOTIFY] Email failed (notification already saved): {e}")
            import traceback
            traceback.print_exc()

    @staticmethod
    async def send_to_role(
        db: AsyncSession,
        role: str,
        title: str,
        message: str,
        ntype: str = "INFO",
        action_url: str = None,
        workflow_id: str = None,
        related_po_id: str = None
    ):
        try:
            # Build alias list
            roles_to_check = [role]
            if role == 'OPERATIONS': roles_to_check.append('OPERATION')
            if role == 'OPERATION': roles_to_check.append('OPERATIONS')
            if role == 'FINANCE': roles_to_check.append('FINANCIAL')
            if role == 'FINANCIAL': roles_to_check.append('FINANCE')

            # Handle both SQLite and PostgreSQL
            # For SQLite, use IN clause with positional params or string format with proper escaping
            placeholders = ', '.join([f':role{i}' for i in range(len(roles_to_check))])
            params = {f'role{i}': r for i, r in enumerate(roles_to_check)}
            
            users = await db.execute(
                text(f"SELECT email FROM users WHERE role IN ({placeholders}) AND is_active = true"),
                params
            )
            emails = [row[0] for row in users.fetchall()]
            print(f"[NOTIFY] Sending to {len(emails)} {role} users ({emails})")
            for email in emails:
                await NotificationService.send(
                    db, email, title, message, ntype, action_url, workflow_id, related_po_id
                )
        except Exception as e:
            print(f"[NOTIFY] Role notify failed: {e}")
            import traceback
            traceback.print_exc()

    @staticmethod
    async def get_for_user(db: AsyncSession, email: str):
        try:
            result = await db.execute(text("""
                SELECT id, title, message, type, is_read, action_url, created_at
                FROM notifications WHERE user_email = :e
                ORDER BY created_at DESC LIMIT 50
            """), {"e": email})
            rows = result.mappings().all()
            return [dict(r) for r in rows]
        except:
            return []

    @staticmethod
    async def get_unread_count(db: AsyncSession, email: str):
        try:
            result = await db.execute(
                text("SELECT COUNT(*) FROM notifications WHERE user_email = :e AND is_read = false"),
                {"e": email}
            )
            return result.scalar() or 0
        except:
            return 0

    @staticmethod
    async def mark_read(db: AsyncSession, notif_id: str, email: str):
        try:
            await db.execute(
                text("UPDATE notifications SET is_read = true WHERE id = :id AND user_email = :e"),
                {"id": notif_id, "e": email}
            )
            await db.commit()
        except Exception as e:
            print(f"[NOTIFY] Mark read failed: {e}")

    @staticmethod
    async def mark_all_read(db: AsyncSession, email: str):
        try:
            await db.execute(
                text("UPDATE notifications SET is_read = true WHERE user_email = :e"),
                {"e": email}
            )
            await db.commit()
        except Exception as e:
            print(f"[NOTIFY] Mark all read failed: {e}")

    @staticmethod
    async def notify_po_created_for_vendor(
        db: AsyncSession,
        vendor_company_id: str,
        po_number: str,
        buyer_company_name: str,
        vendor_name: str,
        amount: float,
        due_date: str,
        order_date: str,
        gstin: str,
        buyer_credibility: dict = None
    ):
        from app.models import User
        from sqlalchemy import select
        
        try:
            admin_stmt = select(User).where(
                (User.company_id == vendor_company_id) &
                (User.is_active == True) &
                (User.role.in_(["MASTER_ADMIN", "COMPANY_ADMIN"]))
            )
            admin_res = await db.execute(admin_stmt)
            admins = admin_res.scalars().all()
            
            for admin in admins:
                await db.execute(text("""
                    INSERT INTO notifications (id, user_email, title, message, type, action_url)
                    VALUES (:id, :email, :title, :message, 'PO_CREATED', :url)
                """), {
                    "id": str(uuid.uuid4()),
                    "email": admin.email,
                    "title": f"New PO {po_number} from {buyer_company_name}",
                    "message": f"PO {po_number} from {buyer_company_name} to {vendor_name} - Amount: ₹{amount}, Due Date: {due_date}",
                    "url": "/dashboard/user"
                })
            
            await db.commit()
            print(f"[NOTIFY] PO {po_number} vendor notifications sent")
            
            email_svc = EmailService()
            subj = f"New PO {po_number} from {buyer_company_name}"
            body_lines = [
                f"PO Number: {po_number}",
                f"Vendor: {vendor_name}",
                f"Buyer Company: {buyer_company_name}",
                f"GSTIN: {gstin}",
                f"Amount: ₹{amount}",
                f"Order Date: {order_date}",
                f"Due Date: {due_date}"
            ]
            if buyer_credibility:
                body_lines.append(f"Buyer Credibility Index: {buyer_credibility.get('score')} (Grade {buyer_credibility.get('grade')}, Risk {buyer_credibility.get('risk_level')})")
            
            body = "\n".join(body_lines)
            
            for admin in admins:
                if admin.email:
                    await email_svc.send_email(admin.email, subj, body)
            
        except Exception as e:
            print(f"[NOTIFY] PO vendor notification failed: {e}")