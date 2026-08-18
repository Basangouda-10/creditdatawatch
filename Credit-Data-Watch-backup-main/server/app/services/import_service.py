
import pandas as pd
import io
import re
from datetime import datetime, timezone
import uuid
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import PurchaseOrder
from app.utils.phone import format_phone_e164, is_valid_phone

class POImportService:
    # Define mappings
    MAPPINGS = {
        "zoho": {
            "po_number": ["PO #", "Purchase Order No", "Order Number"],
            "vendor": ["Vendor", "Vendor Name", "Supplier", "Supplier Name"],
            "vendor_email": ["Email", "Vendor Email", "Supplier Email"],
            "vendor_phone": ["Mobile", "Phone", "Vendor Phone", "Supplier Phone"],
            "gstin": ["GSTIN", "GST No", "Vendor GSTIN"],
            "amount": ["Amount", "Total", "Order Amount"],
            "due_date": ["Due", "Due Date", "Expected Delivery Date"],
            "status": ["Status"],
            "notes": ["Notes", "Comments"],
            "payment_window_days": ["Payment Window", "Credit Period"]
        },
        "tally": {
            "po_number": ["Voucher No", "Order No"],
            "vendor": ["Party Name", "Ledger Name"],
            "vendor_email": ["Email"],
            "vendor_phone": ["Contact No", "Mobile"],
            "gstin": ["GSTIN/UIN"],
            "amount": ["Amount", "Voucher Amount"],
            "due_date": ["Due Date"],
            "status": ["Status"],
            "notes": ["Narration"],
            "payment_window_days": ["Credit Period", "Payment Days"]
        },
        "default": {
            "po_number": ["number", "po_number", "po #"],
            "vendor": ["vendor_name", "vendor"],
            "vendor_email": ["vendor_email", "email"],
            "vendor_phone": ["vendor_phone", "mobile", "phone"],
            "gstin": ["vendor_gstin", "gstin"],
            "amount": ["amount"],
            "due_date": ["due_date", "due"],
            "status": ["status"],
            "notes": ["notes"],
            "payment_window_days": ["payment_window_days", "payment window"]
        }
    }

    @staticmethod
    async def process_file(file_content: bytes, file_type: str, source: str, db: AsyncSession, current_user):
        """
        Process uploaded file (CSV/Excel) and map to PurchaseOrder
        """
        try:
            if file_type == "csv":
                df = pd.read_csv(io.BytesIO(file_content))
            else:
                df = pd.read_excel(io.BytesIO(file_content))
            
            # 1. Preprocessing Layer
            df = POImportService._preprocess_df(df)
            
            # 2. Column Mapping
            mapping = POImportService.MAPPINGS.get(source.lower(), POImportService.MAPPINGS["default"])
            mapped_df = POImportService._map_columns(df, mapping)
            
            # 3. Data Transformation & Validation
            results = await POImportService._transform_and_save(mapped_df, db, current_user)
            return results

        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

    @staticmethod
    def _preprocess_df(df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean the dataframe before processing
        """
        # Remove completely empty rows and columns
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        # Detect actual header row (if there are extra top rows)
        # Strategy: find row with most matches for common PO terms
        common_terms = ["po", "vendor", "amount", "date", "gstin"]
        best_row = 0
        max_matches = 0
        
        for i in range(min(10, len(df))):
            row_values = [str(val).lower() for val in df.iloc[i].values]
            matches = sum(1 for val in row_values if any(term in val for term in common_terms))
            if matches > max_matches:
                max_matches = matches
                best_row = i
        
        if best_row > 0:
            df.columns = df.iloc[best_row]
            df = df.iloc[best_row+1:].reset_index(drop=True)
            
        return df

    @staticmethod
    def _map_columns(df: pd.DataFrame, mapping: dict) -> pd.DataFrame:
        """
        Map dataframe columns to internal field names
        """
        new_cols = {}
        for internal_field, aliases in mapping.items():
            for alias in aliases:
                # Case insensitive match
                match = next((col for col in df.columns if str(col).strip().lower() == alias.lower()), None)
                if match:
                    new_cols[match] = internal_field
                    break
        
        return df.rename(columns=new_cols)

    @staticmethod
    async def _transform_and_save(df: pd.DataFrame, db: AsyncSession, current_user):
        """
        Transform data types and save to DB
        """
        success_count = 0
        failed_count = 0
        errors = []
        
        required_fields = ["po_number", "vendor", "gstin", "amount", "due_date"]
        
        for index, row in df.iterrows():
            try:
                # Skip empty rows
                if pd.isna(row.get("po_number")) and pd.isna(row.get("vendor")):
                    continue

                # Prepare payload
                data = row.to_dict()
                
                # Check required fields
                missing = [f for f in required_fields if pd.isna(data.get(f)) or str(data.get(f)).strip() == ""]
                if missing:
                    failed_count += 1
                    errors.append(f"Row {index+1}: Missing {', '.join(missing)}")
                    continue

                # 1. GSTIN Normalization & Validation
                gstin = str(data["gstin"]).strip().upper()
                GSTIN_REGEX = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$'
                if not re.match(GSTIN_REGEX, gstin):
                    failed_count += 1
                    errors.append(f"Row {index+1}: Invalid GSTIN format ({gstin})")
                    continue

                # 2. Amount Cleaning
                amt_str = str(data["amount"]).replace("₹", "").replace(",", "").strip()
                try:
                    amount = float(amt_str)
                except:
                    failed_count += 1
                    errors.append(f"Row {index+1}: Invalid amount ({amt_str})")
                    continue

                # 3. Date Parsing
                due_date_raw = str(data["due_date"])
                try:
                    due_date = pd.to_datetime(due_date_raw).to_pydatetime().replace(tzinfo=None)
                except:
                    failed_count += 1
                    errors.append(f"Row {index+1}: Invalid date format ({due_date_raw})")
                    continue

                # 4. Status derivation if not provided or "Open"
                status = str(data.get("status", "")).strip().capitalize()
                if not status or status == "Nan" or status == "Open":
                    today = datetime.now(timezone.utc).replace(tzinfo=None, hour=0, minute=0, second=0, microsecond=0)
                    if due_date < today:
                        status = "Overdue"
                    else:
                        status = "Open"

                # 5. Phone Normalization
                phone_raw = str(data.get("vendor_phone", "")).strip()
                phone = None
                if phone_raw and phone_raw != "nan":
                    if phone_raw.isdigit() and len(phone_raw) == 10:
                        phone_raw = "+91" + phone_raw
                    phone = format_phone_e164(phone_raw) or phone_raw
                    if not is_valid_phone(phone):
                        phone = None # Don't fail the whole row for phone

                # 6. Payment Window
                pw_days = 50
                try:
                    val = data.get("payment_window_days")
                    if not pd.isna(val):
                        pw_days = int(float(str(val).strip()))
                except:
                    pass

                # Create PO
                po = PurchaseOrder(
                    id=str(uuid.uuid4()),
                    user_id=current_user.id,
                    company_id=current_user.company_id,
                    po_number=str(data["po_number"]),
                    vendor=str(data["vendor"]),
                    vendor_gstin=gstin,
                    vendor_email=str(data.get("vendor_email")) if not pd.isna(data.get("vendor_email")) else None,
                    vendor_phone=phone,
                    amount=amount,
                    due_date=due_date,
                    status=status,
                    notes=str(data.get("notes", "")) if not pd.isna(data.get("notes")) else None,
                    payment_window_days=pw_days
                )
                
                db.add(po)
                success_count += 1

            except Exception as row_err:
                failed_count += 1
                errors.append(f"Row {index+1}: {str(row_err)}")

        if success_count > 0:
            await db.commit()
            
        return {
            "total": len(df),
            "success": success_count,
            "failed": failed_count,
            "errors": errors[:10] # Return first 10 errors
        }
