import uuid, json 
from sqlalchemy.ext.asyncio import AsyncSession 
from sqlalchemy import text 
from app.services.notification_service import NotificationService
from app.utils.role_settings import is_financial_enabled, is_legal_enabled 

MASTER_EMAIL = "payalshinde906@gmail.com" 

class WorkflowService: 

    @staticmethod 
    async def get_master_email(db: AsyncSession) -> str: 
        try: 
            r = await db.execute( 
                text("SELECT email FROM users WHERE role='MASTER_ADMIN' LIMIT 1") 
            ) 
            row = r.fetchone() 
            return row[0] if row else MASTER_EMAIL 
        except: 
            return MASTER_EMAIL 

    # ══════════════════════════════════════ 
    # SUBSCRIPTION WORKFLOW 
    # ══════════════════════════════════════ 

    @staticmethod 
    async def start_subscription( 
        db, user_id, user_email, company_name, plan_name, amount 
    ): 
        """Step 1: User requests subscription → notify correct team for payment verification""" 
        sub_id = str(uuid.uuid4()) 
        wf_id = str(uuid.uuid4()) 

        financial_enabled = await is_financial_enabled(db)
        initial_status = 'PENDING_FINANCIAL' if financial_enabled else 'PENDING_OPERATION'
        assigned_role = 'FINANCIAL' if financial_enabled else 'OPERATIONS'

        await db.execute(text( """ 
            INSERT INTO subscription_requests 
            (id, user_id, user_email, company_name, plan_name, amount, workflow_item_id, created_at) 
            VALUES (:id,:uid,:email,:company,:plan,:amount,:wfid,NOW()) 
        """), dict(id=sub_id, uid=user_id, email=user_email, 
                   company=company_name, plan=plan_name, 
                   amount=amount, wfid=wf_id)) 

        await db.execute(text( """ 
            INSERT INTO workflow_items 
            (id,type,status,title,description,entity_id,entity_type, 
             submitted_by_email,assigned_to_role,current_handler_role,created_at) 
             VALUES(:id,'SUBSCRIPTION',:status,:title,:desc,:eid,'subscription_request', 
                    :email,:role,:role,NOW()) 
        """), dict(id=wf_id, 
                   status=initial_status,
                   role=assigned_role,
                   title=f"Subscription Request — {company_name}", 
                   desc=f"{company_name} wants {plan_name} plan for ₹{amount}", 
                   eid=sub_id, email=user_email)) 

        await db.commit() 

        if financial_enabled:
            await NotificationService.send_to_role( 
                db, "FINANCIAL", 
                title="Subscription Payment Verification", 
                message=f"{company_name} has requested {plan_name} plan (₹{amount}).\n\nPlease verify the payment and forward to Master Admin.", 
                ntype="SUBSCRIPTION", 
                action_url="http://localhost:3001/dashboard/admin", 
                workflow_id=wf_id 
            )
        else:
            await NotificationService.send_to_role( 
                db, "OPERATIONS", 
                title="Subscription Payment Verification", 
                message=f"{company_name} has requested {plan_name} plan (₹{amount}).\n\nPlease verify the payment and forward to Master Admin.", 
                ntype="SUBSCRIPTION", 
                action_url="http://localhost:3001/dashboard/admin", 
                workflow_id=wf_id 
            )
        print(f"[WORKFLOW] Subscription started: {sub_id}, assigned to {assigned_role}") 
        return sub_id 

    @staticmethod 
    async def financial_verify_subscription(db, wf_id, approver_email, notes): 
        """Step 2: Financial/Operations verifies payment → notify Master Admin""" 
        master = await WorkflowService.get_master_email(db) 

        wf = (await db.execute( 
            text("SELECT title, submitted_by_email FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 

        financial_enabled = await is_financial_enabled(db)
        status = 'FINANCIAL_APPROVED' if financial_enabled else 'OPERATIONS_APPROVED'

        await db.execute(text( """ 
            UPDATE workflow_items SET 
                status=:status, 
                reviewed_by_email=:email, 
                review_notes=:notes, 
                reviewed_at=NOW(), 
                current_handler_role='MASTER_ADMIN', 
                updated_at=NOW() 
            WHERE id=:id 
        """), dict(id=wf_id, status=status, email=approver_email, notes=notes)) 
        await db.commit() 

        await NotificationService.send( 
            db, master, 
            title="Subscription Payment Verified", 
            message=f"{'Financial' if financial_enabled else 'Operations'} team has verified the payment for:\n{wf[0] if wf else 'Subscription Request'}\n\nNotes: {notes}\n\nPlease give final approval to activate.", 
            ntype="SUBSCRIPTION", 
            action_url="http://localhost:3001/dashboard/admin", 
            workflow_id=wf_id 
        ) 
        print(f"[WORKFLOW] {'Financial' if financial_enabled else 'Operations'} verified subscription {wf_id}, sent to Master Admin {master}")

    @staticmethod 
    async def master_approve_subscription(db, wf_id, approver_email, notes): 
        """Step 3: Master approves → activate subscription → notify user""" 
        sub = (await db.execute(text( """ 
            SELECT sr.* FROM subscription_requests sr 
            JOIN workflow_items wi ON wi.entity_id = sr.id 
            WHERE wi.id = :wf_id 
        """), {"wf_id": wf_id})).fetchone() 

        if sub: 
            sub_data = dict(sub._mapping) 
            # Activate subscription 
            await db.execute(text( """ 
                UPDATE subscription_requests SET 
                    workflow_status='APPROVED', approved_at=NOW() 
                WHERE id=:id 
            """), {"id": sub_data['id']}) 

            await db.execute(text( """ 
                UPDATE users SET 
                    subscription_status='ACTIVE', 
                    subscription_bypass=true, 
                    full_access=true 
                WHERE email=:email 
            """), {"email": sub_data['user_email']}) 

        await db.execute(text( """ 
            UPDATE workflow_items SET 
                status='MASTER_APPROVED', 
                approved_by_email=:email, 
                approval_notes=:notes, 
                approved_at=NOW(), 
                current_handler_role='COMPLETED', 
                updated_at=NOW() 
            WHERE id=:id 
        """), dict(id=wf_id, email=approver_email, notes=notes)) 
        await db.commit() 

        if sub: 
            sub_data = dict(sub._mapping) 
            await NotificationService.send( 
                db, sub_data['user_email'], 
                title="Your Subscription is Now ACTIVE!", 
                message=f"Congratulations! Your {sub_data['plan_name']} subscription has been approved.\n\nYou now have full access to CreditDataWatch.\n\nLogin: http://localhost:3001/auth/login", 
                ntype="SUCCESS" 
            ) 

    @staticmethod 
    async def reject_subscription(db, wf_id, rejector_email, reason): 
        """Any stage: reject subscription → notify user""" 
        sub = (await db.execute(text( """ 
            SELECT sr.* FROM subscription_requests sr 
            JOIN workflow_items wi ON wi.entity_id = sr.id 
            WHERE wi.id = :wf_id 
        """), {"wf_id": wf_id})).fetchone() 

        if sub: 
            sub_data = dict(sub._mapping) 
            await db.execute(text( """ 
                UPDATE subscription_requests SET 
                    workflow_status='REJECTED', 
                    rejected_at=NOW(), 
                    rejection_reason=:reason 
                WHERE id=:id 
            """), dict(id=sub_data['id'], reason=reason)) 

        await db.execute(text( """ 
            UPDATE workflow_items SET 
                status='REJECTED', 
                rejected_by_email=:email, 
                rejection_notes=:notes, 
                rejected_at=NOW(), 
                updated_at=NOW() 
            WHERE id=:id 
        """), dict(id=wf_id, email=rejector_email, notes=reason)) 
        await db.commit() 

        if sub: 
            sub_data = dict(sub._mapping) 
            await NotificationService.send( 
                db, sub_data['user_email'], 
                title="Subscription Request Not Approved", 
                message=f"Your subscription request was not approved.\n\nReason: {reason}\n\nFor help, contact support.", 
                ntype="ERROR" 
            ) 

    # ══════════════════════════════════════ 
    # PO APPROVAL WORKFLOW 
    # ══════════════════════════════════════ 

    @staticmethod 
    async def start_po_approval( 
        db, po_id, po_number, requester_email, 
        edit_data, evidence_url, evidence_filename, reason 
    ): 
        """Step 1: Admin edits PO with evidence → notify Operations for Truth Check""" 
        req_id = str(uuid.uuid4()) 
        wf_id = str(uuid.uuid4()) 

        await db.execute(text(""" 
            INSERT INTO po_approval_requests 
            (id,po_id,po_number,requested_by_email,edit_data, 
              evidence_url,evidence_filename,reason,created_at) 
            VALUES(:id,:po_id,:po_number,:email,:edit_data, 
                    :evidence_url,:evidence_filename,:reason,NOW()) 
        """), dict(id=req_id, po_id=po_id, po_number=po_number, 
                    email=requester_email, 
                    edit_data=json.dumps(edit_data), 
                    evidence_url=evidence_url, 
                    evidence_filename=evidence_filename, 
                    reason=reason)) 

        await db.execute(text(""" 
            INSERT INTO workflow_items 
            (id,type,status,title,description,entity_id,entity_type, 
              submitted_by_email,assigned_to_role,current_handler_role,created_at) 
            VALUES(:id,'PO_APPROVAL','PENDING_OPERATION',:title,:desc, 
                    :eid,'po_approval_request',:email,'OPERATIONS','OPERATIONS',NOW()) 
        """), dict(id=wf_id, 
                    title=f"PO Edit Approval — {po_number}", 
                    desc=f"{po_number} edited with evidence. Reason: {reason}", 
                    eid=req_id, email=requester_email)) 

        await db.commit() 

        await NotificationService.send_to_role( 
            db, "OPERATIONS", 
            title="PO Edit Truth Check Needed", 
            message=f"PO {po_number} has been edited. Please check activity logs and confirm truth/consistency before forwarding to Master Admin.", 
            ntype="PO_APPROVAL", 
            action_url="http://localhost:3001/dashboard/admin", 
            workflow_id=wf_id 
        ) 
        print(f"[WORKFLOW] PO Approval started: {req_id}, assigned to OPERATIONS")
        return req_id 

    @staticmethod 
    async def operations_verify_po(db, wf_id, approver_email, notes): 
        """Step 2: Operations verifies truth → notify Master Admin directly (skip Legal)""" 
        wf = (await db.execute( 
            text("SELECT title FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 

        await db.execute(text(""" 
            UPDATE workflow_items SET 
                status='OPERATIONS_APPROVED', 
                reviewed_by_email=:email, 
                review_notes=:notes, 
                reviewed_at=NOW(), 
                current_handler_role='MASTER_ADMIN', 
                updated_at=NOW() 
            WHERE id=:id 
        """), dict(id=wf_id, email=approver_email, notes=notes)) 
        await db.commit() 

        master_email = await WorkflowService.get_master_email(db)
        await NotificationService.send( 
            db, master_email, 
            title="PO Edit Ready for Final Approval", 
            message=f"Operations has verified: {wf[0] if wf else 'PO Edit'}\n\nNotes: {notes}\n\nPlease give final approval to apply changes.", 
            ntype="PO_APPROVAL", 
            action_url="http://localhost:3001/dashboard/admin", 
            workflow_id=wf_id 
        )
        print(f"[WORKFLOW] Operations verified PO {wf_id}, sent to Master Admin {master_email}")

    @staticmethod 
    async def financial_verify_po(db, wf_id, approver_email, notes): 
        """Step: Financial/Operations verifies → notify Master Admin""" 
        wf = (await db.execute( 
            text("SELECT title FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 

        financial_enabled = await is_financial_enabled(db)
        status = 'FINANCIAL_APPROVED' if financial_enabled else 'OPERATIONS_APPROVED'

        await db.execute(text(""" 
            UPDATE workflow_items SET 
                status=:status, 
                reviewed_by_email=:email, 
                review_notes=:notes, 
                reviewed_at=NOW(), 
                current_handler_role='MASTER_ADMIN', 
                updated_at=NOW() 
            WHERE id=:id 
        """), dict(id=wf_id, status=status, email=approver_email, notes=notes)) 
        await db.commit() 

        master_email = await WorkflowService.get_master_email(db)
        await NotificationService.send( 
            db, master_email, 
            title="PO Edit Ready for Final Approval", 
            message=f"{'Financial' if financial_enabled else 'Operations'} has verified for: {wf[0] if wf else 'PO Edit'}\n\nNotes: {notes}\n\nPlease give final approval to apply changes.", 
            ntype="PO_APPROVAL", 
            action_url="http://localhost:3001/dashboard/admin", 
            workflow_id=wf_id 
        ) 
        print(f"[WORKFLOW] {'Financial' if financial_enabled else 'Operations'} verified PO {wf_id}, sent to Master Admin {master_email}")
        
    @staticmethod 
    async def legal_verify_po(db, wf_id, approver_email, notes): 
        """Step 3: Legal verifies compliance → notify Master Admin""" 
        wf = (await db.execute( 
            text("SELECT title FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 

        await db.execute(text(""" 
            UPDATE workflow_items SET 
                status='LEGAL_APPROVED', 
                reviewed_by_email=:email, 
                review_notes=:notes, 
                reviewed_at=NOW(), 
                current_handler_role='MASTER_ADMIN', 
                updated_at=NOW() 
            WHERE id=:id 
        """), dict(id=wf_id, email=approver_email, notes=notes)) 
        await db.commit() 

        master_email = await WorkflowService.get_master_email(db)
        await NotificationService.send( 
            db, master_email, 
            title="PO Edit Ready for Final Approval", 
            message=f"Legal team has verified compliance for: {wf[0] if wf else 'PO Edit'}\n\nLegal notes: {notes}\n\nPlease give final approval to apply changes.", 
            ntype="PO_APPROVAL", 
            action_url="http://localhost:3001/dashboard/admin", 
            workflow_id=wf_id 
        ) 
        print(f"[WORKFLOW] Legal verified PO {wf_id}, sent to Master Admin {master_email}")

    @staticmethod 
    async def master_approve_po(db, wf_id, approver_email, notes): 
        """Step 3: Master approves → apply changes → notify requester""" 
        print(f"[WORKFLOW] Master approving PO workflow: {wf_id}")
        
        # 1. Fetch workflow item info
        wf_res = await db.execute( 
            text("SELECT entity_id, submitted_by_email FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )
        wf = wf_res.fetchone()
        
        if not wf:
            print(f"[WORKFLOW] ❌ Workflow item not found: {wf_id}")
            return False

        entity_id = wf[0]
        requester_email = wf[1]

        # 2. Update workflow status
        await db.execute(text(""" 
            UPDATE workflow_items SET 
                status='MASTER_APPROVED', 
                approved_by_email=:email, 
                approval_notes=:notes, 
                approved_at=NOW(), 
                updated_at=NOW() 
            WHERE id=:id 
        """), dict(id=wf_id, email=approver_email, notes=notes)) 

        # 3. Fetch request data
        req_res = await db.execute( 
            text("SELECT po_id, po_number, edit_data FROM po_approval_requests WHERE id=:id"), 
            {"id": entity_id} 
        )
        req = req_res.fetchone() 

        if req: 
            po_id = req[0]
            po_number = req[1]
            edit_data = json.loads(req[2] or '{}') 
            print(f"[WORKFLOW] PO ID from request: {po_id}")
            print(f"[WORKFLOW] Edit data to apply: {edit_data}")

            # 4. Apply edits to PO 
            if edit_data: 
                allowed_fields = ['vendor', 'amount', 'due_date', 'status', 
                                  'vendor_email', 'vendor_phone', 'gstin', 
                                  'payment_window_days', 'notes'] 
                safe_edits = {k: v for k, v in edit_data.items() if k in allowed_fields} 
                
                print(f"[WORKFLOW] Original safe_edits: {safe_edits}")
                
                # Fix data types for all fields
                processed_edits = {}
                for key, value in safe_edits.items():
                    if value is None or value == '':
                        continue
                        
                    try:
                        if key in ['vendor', 'vendor_email', 'vendor_phone', 'gstin', 'status', 'notes']:
                            # String fields
                            processed_edits[key] = str(value)
                        elif key in ['amount']:
                            # Float field
                            processed_edits[key] = float(value)
                        elif key in ['payment_window_days']:
                            # Integer field
                            processed_edits[key] = int(value)
                        elif key == 'due_date':
                            # Date/datetime field - handle separately
                            from datetime import datetime, date
                            due_date_val = value
                            if isinstance(due_date_val, str):
                                # Try multiple formats
                                for fmt in ['%Y-%m-%d', '%d-%m-%Y', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']:
                                    try:
                                        dt = datetime.strptime(due_date_val, fmt)
                                        processed_edits[key] = dt
                                        print(f"[WORKFLOW] Parsed due_date as {dt} using format {fmt}")
                                        break
                                    except ValueError:
                                        continue
                            elif isinstance(due_date_val, date) and not isinstance(due_date_val, datetime):
                                processed_edits[key] = datetime.combine(due_date_val, datetime.min.time())
                            elif isinstance(due_date_val, datetime):
                                processed_edits[key] = due_date_val
                    except Exception as e:
                        print(f"[WORKFLOW] Skipping field {key} due to type error: {e}")
                        continue
                
                safe_edits = processed_edits
                
                print(f"[WORKFLOW] Processed safe_edits: {safe_edits}")
                print(f"[WORKFLOW] Types in safe_edits: {[(k, type(v)) for k, v in safe_edits.items()]}")
                
                if safe_edits: 
                    set_sql = ', '.join([f"{k}=:{k}" for k in safe_edits]) 
                    safe_edits['po_id'] = po_id 
                    update_stmt = f"UPDATE purchase_orders SET {set_sql}, updated_at=NOW() WHERE id=:po_id"
                    print(f"[WORKFLOW] Applying PO update: {update_stmt} with params {safe_edits}")
                    result = await db.execute(text(update_stmt), safe_edits)
                    print(f"[WORKFLOW] Update row count: {result.rowcount}")
                else:
                    print("[WORKFLOW] No safe edits found in edit_data")
            else:
                print("[WORKFLOW] No edit_data found in request")
            
            # 5. Update request status
            await db.execute(text(""" 
                UPDATE po_approval_requests SET 
                    final_status='APPROVED' 
                WHERE id=:id 
            """), {"id": entity_id}) 

            # 6. Notify requester
            await NotificationService.send( 
                db, requester_email, 
                title="PO Edit Approved", 
                message=f"Your edit for PO {po_number} has been approved.\n\nNotes: {notes}", 
                ntype="SUCCESS" 
            ) 
        
        await db.commit()
        print(f"[WORKFLOW] Master approved PO workflow: {wf_id}")
        return True

    @staticmethod 
    async def reject_workflow(db, wf_id, rejector_email, reason): 
        """Reject any workflow item → notify submitter""" 
        wf = (await db.execute( 
            text("SELECT submitted_by_email, title, type FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 

        await db.execute(text(""" 
            UPDATE workflow_items SET 
                status='REJECTED', 
                rejected_by_email=:email, 
                rejection_notes=:notes, 
                rejected_at=NOW(), 
                updated_at=NOW() 
            WHERE id=:id 
        """), dict(id=wf_id, email=rejector_email, notes=reason)) 
        await db.commit() 

        if wf: 
            await NotificationService.send( 
                db, wf[0], 
                title=f"{wf[2].replace('_', ' ').title()} Rejected", 
                message=f"Your request '{wf[1]}' has been rejected.\n\nReason: {reason}", 
                ntype="ERROR" 
            )

    @staticmethod 
    async def process_legal_notice_workflow(db, admin_email, po_id, po_number, vendor, reason=None, evidence_url=None, evidence_filename=None): 
        """Create workflow item for legal notice request""" 
        wf_id = str(uuid.uuid4()) 
        legal_enabled = await is_legal_enabled(db)
        
        assigned_role = 'LEGAL' if legal_enabled else 'OPERATIONS'
        
        desc = f"Legal notice requested for {vendor} by {admin_email}"
        if reason:
            desc += f"\n\nReason: {reason}"
        
        import json
        metadata = {}
        if evidence_url:
            metadata["evidence_url"] = evidence_url
        if evidence_filename:
            metadata["evidence_filename"] = evidence_filename
        
        await db.execute(text(""" 
            INSERT INTO workflow_items 
            (id,type,status,title,description,entity_id,entity_type, 
              submitted_by_email,assigned_to_role,current_handler_role,metadata,created_at) 
            VALUES(:id,'LEGAL_NOTICE','PENDING_LEGAL',:title,:desc,:eid,'legal_notice', 
                    :email,:assigned_role,:assigned_role,:metadata,NOW()) 
        """), dict(id=wf_id, 
                    title=f"Legal Notice Request — {po_number}", 
                    desc=desc, 
                    eid=po_id, email=admin_email,
                    assigned_role=assigned_role,
                    metadata=json.dumps(metadata) if metadata else None)) 
        await db.commit()
        
        await NotificationService.send_to_role( 
            db, assigned_role, 
            title="Legal Notice Request", 
            message=f"Legal notice requested for PO {po_number} (Vendor: {vendor}). Please review and forward to Master Admin.", 
            ntype="LEGAL", 
            action_url="http://localhost:3001/dashboard/admin", 
            workflow_id=wf_id 
        )
        print(f"[WORKFLOW] Legal notice workflow started: {wf_id}, assigned to {assigned_role}")

    @staticmethod 
    async def ops_process_legal_notice(db, wf_id, ops_email, notes): 
        """Operations completes review and sends to Master Admin""" 
        wf = (await db.execute( 
            text("SELECT entity_id, submitted_by_email, title FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 
        
        if wf: 
            entity_id = wf[0]
            
            await db.execute(text(""" 
                UPDATE workflow_items SET 
                    status='OPERATIONS_APPROVED', 
                    reviewed_by_email=:email, 
                    review_notes=:notes, 
                    reviewed_at=NOW(), 
                    current_handler_role='MASTER_ADMIN', 
                    updated_at=NOW() 
                WHERE id=:id 
            """), dict(id=wf_id, email=ops_email, notes=notes)) 
            
            await db.execute(text(""" 
                UPDATE purchase_orders SET 
                    legal_support_status='OPS_APPROVED', 
                    legal_notes=:notes 
                WHERE id=:id 
            """), dict(id=entity_id, notes=notes)) 

            # Also update legal_notice_requests table for consistency
            await db.execute(text("""
                UPDATE legal_notice_requests
                SET status='OPS_APPROVED', ops_notes=:notes, ops_processed_by=:email, ops_processed_at=NOW(), updated_at=NOW()
                WHERE po_id=:po_id AND status='PENDING'
            """), {"po_id": entity_id, "notes": notes, "email": ops_email})
            
            await db.commit() 
            
            await NotificationService.send_to_role( 
                db, "MASTER_ADMIN", 
                title="Legal Notice Request Reviewed", 
                message=f"Operations team has completed review for {wf[2]}.\n\nNotes: {notes}\n\nPlease review and approve/reject.", 
                ntype="LEGAL", 
                action_url="http://localhost:3001/dashboard/admin", 
                workflow_id=wf_id 
            )

    @staticmethod 
    async def legal_review_complete(db, wf_id, legal_email, notes): 
        """Legal completes review and sends to Master Admin""" 
        wf = (await db.execute( 
            text("SELECT entity_id, submitted_by_email, title FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 
        
        if wf: 
            entity_id = wf[0]
            
            await db.execute(text(""" 
                UPDATE workflow_items SET 
                    status='LEGAL_REVIEWED', 
                    reviewed_by_email=:email, 
                    review_notes=:notes, 
                    reviewed_at=NOW(), 
                    current_handler_role='MASTER_ADMIN', 
                    updated_at=NOW() 
                WHERE id=:id 
            """), dict(id=wf_id, email=legal_email, notes=notes)) 
            
            await db.execute(text(""" 
                UPDATE purchase_orders SET 
                    legal_support_status='LEGAL_REVIEWED', 
                    legal_notes=:notes 
                WHERE id=:id 
            """), dict(id=entity_id, notes=notes)) 

            # Also update legal_notice_requests table for consistency
            await db.execute(text("""
                UPDATE legal_notice_requests
                SET status='OPS_APPROVED', ops_notes=:notes, ops_processed_by=:email, ops_processed_at=NOW(), updated_at=NOW()
                WHERE po_id=:po_id AND status='PENDING'
            """), {"po_id": entity_id, "notes": notes, "email": legal_email})
            
            await db.commit() 
            
            await NotificationService.send_to_role( 
                db, "MASTER_ADMIN", 
                title="Legal Notice Request Reviewed", 
                message=f"Legal team has completed review for {wf[2]}.\n\nNotes: {notes}\n\nPlease review and approve/reject.", 
                ntype="LEGAL", 
                action_url="http://localhost:3001/dashboard/admin", 
                workflow_id=wf_id 
            )

    @staticmethod 
    async def master_approve_legal_notice(db, wf_id, master_email, notes): 
        """Master Admin approves legal notice""" 
        wf = (await db.execute( 
            text("SELECT entity_id, submitted_by_email, title FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 
        
        if wf: 
            entity_id = wf[0]
            
            # 1. Fetch PO and company info
            po_res = await db.execute(text("SELECT * FROM purchase_orders WHERE id=:id"), {"id": entity_id}) 
            po = po_res.mappings().first() 
            if not po:
                return
            
            owner_res = await db.execute(text("SELECT company_name FROM companies WHERE id=:cid"), {"cid": po['company_id']}) 
            owner = owner_res.mappings().first()
            
            # 2. Generate and send legal notice
            from app.services.legal_notice_service import generate_legal_notice_pdf 
            from app.services.email_service import send_email_with_attachment 
            import os, uuid

            pdf_path = f"uploads/temp/Notice_{po['po_number']}_{uuid.uuid4().hex[:8]}.pdf" 
            os.makedirs("uploads/temp", exist_ok=True)

            po_data = { 
                "vendor": po['vendor'], 
                "po_number": po['po_number'], 
                "amount": po['amount'], 
                "due_date": str(po['due_date']), 
                "company_name": owner['company_name'] if owner else "CreditDataWatch Client" 
            }
            
            generate_legal_notice_pdf(po_data, pdf_path)
            
            if po['vendor_email']: 
                await send_email_with_attachment( 
                    to_email=po['vendor_email'], 
                    subject=f"LEGAL NOTICE: Outstanding Payment for PO {po['po_number']}", 
                    body=f"Please find the attached legal notice regarding outstanding payment for PO {po['po_number']}.", 
                    attachment_path=pdf_path, 
                    attachment_name=f"Legal_Notice_{po['po_number']}.pdf" 
                )
            
            if os.path.exists(pdf_path): 
                os.remove(pdf_path)
            
            # 3. Update workflow and PO
            await db.execute(text(""" 
                UPDATE workflow_items SET 
                    status='APPROVED', 
                    approved_by_email=:email, 
                    approval_notes=:notes, 
                    approved_at=NOW(), 
                    current_handler_role='COMPLETED', 
                    updated_at=NOW() 
                WHERE id=:id 
            """), dict(id=wf_id, email=master_email, notes=notes)) 
            
            await db.execute(text(""" 
                UPDATE purchase_orders SET 
                    legal_support_status='NOTICE_SENT', 
                    legal_notice_sent_at=NOW(), 
                    legal_notice_status='SENT' 
                WHERE id=:id 
            """), dict(id=entity_id)) 

            # Also update legal_notice_requests table for consistency
            await db.execute(text("""
                UPDATE legal_notice_requests
                SET status='MASTER_APPROVED', master_notes=:notes, master_approved_by=:email, master_approved_at=NOW(), updated_at=NOW()
                WHERE po_id=:po_id AND status='OPS_APPROVED'
            """), {"po_id": entity_id, "notes": notes, "email": master_email})
            
            await db.commit() 
            
            await NotificationService.send( 
                db, wf[1], 
                title="Legal Notice Approved", 
                message=f"Your legal notice request for {wf[2]} has been approved and sent to the vendor.", 
                ntype="SUCCESS" 
            )

    @staticmethod 
    async def master_reject_legal_notice(db, wf_id, master_email, reason): 
        """Master Admin rejects legal notice""" 
        wf = (await db.execute( 
            text("SELECT entity_id, submitted_by_email, title FROM workflow_items WHERE id=:id"), 
            {"id": wf_id} 
        )).fetchone() 
        
        if wf: 
            entity_id = wf[0]
            
            await db.execute(text(""" 
                UPDATE workflow_items SET 
                    status='REJECTED', 
                    rejected_by_email=:email, 
                    rejection_notes=:reason, 
                    rejected_at=NOW(), 
                    updated_at=NOW() 
                WHERE id=:id 
            """), dict(id=wf_id, email=master_email, reason=reason)) 
            
            await db.execute(text(""" 
                UPDATE purchase_orders SET 
                    legal_support_status='REJECTED' 
                WHERE id=:id 
            """), dict(id=entity_id)) 

            # Also update legal_notice_requests table for consistency
            await db.execute(text("""
                UPDATE legal_notice_requests
                SET status='REJECTED', master_notes=:reason, updated_at=NOW()
                WHERE po_id=:po_id AND status='OPS_APPROVED'
            """), {"po_id": entity_id, "reason": reason})
            
            await db.commit() 
            
            await NotificationService.send( 
                db, wf[1], 
                title="Legal Notice Rejected", 
                message=f"Your legal notice request for {wf[2]} has been rejected. Reason: {reason}", 
                ntype="ERROR" 
            ) 
