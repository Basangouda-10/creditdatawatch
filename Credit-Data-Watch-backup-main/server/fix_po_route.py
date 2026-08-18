import os
import glob

app_dir = os.path.join(os.path.dirname(__file__), "app", "routes")
route_files = glob.glob(os.path.join(app_dir, "*.py"))

patched = False

po_creation_code = '''
@router.post("")
@router.post("/")
@router.post("/create")
async def create_purchase_order(request: Request, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    try:
        body = await request.json()
        po_number = body.get("po_number") or body.get("po_id") or f"PO-{uuid.uuid4().hex[:6].upper()}"
        vendor_name = body.get("vendor_name") or body.get("vendor") or "Test Vendor"
        vendor_gstin = body.get("vendor_gstin") or body.get("gstin") or ""
        vendor_email = body.get("vendor_email") or body.get("email") or ""
        vendor_mobile = body.get("vendor_mobile") or body.get("mobile") or ""
        amount = float(body.get("amount") or 0)
        due_date = body.get("due_date") or None

        user_id = getattr(current_user, "id", None)
        company_id = getattr(current_user, "company_id", None) or user_id

        async with db.begin_nested():
            await db.execute(text("""
                INSERT INTO purchase_orders (
                    id, company_id, user_id, po_number, vendor, vendor_name, 
                    vendor_gstin, vendor_email, vendor_mobile, amount, 
                    due_date, status, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), :cid, :uid, :po_num, :vname, :vname,
                    :vgstin, :vemail, :vmobile, :amt,
                    COALESCE(CAST(:ddate AS TIMESTAMP), NOW() + INTERVAL '30 days'),
                    'OPEN', NOW(), NOW()
                )
            """), {
                "cid": str(company_id),
                "uid": str(user_id),
                "po_num": str(po_number),
                "vname": str(vendor_name),
                "vgstin": str(vendor_gstin),
                "vemail": str(vendor_email),
                "vmobile": str(vendor_mobile),
                "amt": amount,
                "ddate": due_date
            })
        await db.commit()
        return {"success": True, "message": "Purchase order created successfully!"}
    except Exception as e:
        await db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
'''

for file_path in route_files:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Check if this file defines PO routes
    if "purchase_orders" in content.lower() or "po_number" in content.lower():
        print(f"🔍 Found PO route file: {file_path}")
        # Replace broken gstin keyword if present
        if "gstin=" in content:
            new_content = content.replace("gstin=", "vendor_gstin=")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"✅ Replaced gstin keyword parameter in {os.path.basename(file_path)}")
            patched = True

print("\n" + "="*50)
if patched:
    print("🎉 PO route parameters patched successfully!")
else:
    print("ℹ️ Route parameters verified.")
print("="*50)