import io
import re
from typing import Dict, List, Union
import pandas as pd
import pdfplumber


def extract_from_pdf(file_bytes: bytes) -> Dict[str, Union[str, float]]:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"

    inv_match = re.search(
        r"(?:Invoice\s*#|Invoice\s*Number|INV[-#]?)\s*:?\s*([A-Za-z0-9/-]+)",
        text,
        re.IGNORECASE,
    )
    invoice_number = inv_match.group(1).strip() if inv_match else ""

    customer_match = re.search(
        r"(?:Bill\s*To|Customer\s*Name|Customer|Buyer)\s*:?\s*([^\n]+)",
        text,
        re.IGNORECASE,
    )
    counterparty_name = customer_match.group(1).strip() if customer_match else ""

    amount_match = re.search(
        r"(?:Total|Grand\s*Total|Balance\s*Due|Amount)\s*:?\s*(?:INR|₹|USD|\$)?\s*([\d,]+\.?\d*)",
        text,
        re.IGNORECASE,
    )
    amount = 0.0
    if amount_match:
        try:
            amount = float(amount_match.group(1).replace(",", ""))
        except ValueError:
            amount = 0.0

    due_match = re.search(
        r"(?:Due\s*Date|Payment\s*Due)\s*:?\s*([\d{1,2}[/-]\d{1,2}[/-]\d{2,4}])",
        text,
        re.IGNORECASE,
    )
    due_date = due_match.group(1).strip() if due_match else ""

    return {
        "invoice_number": invoice_number,
        "counterparty_name": counterparty_name,
        "amount": amount,
        "due_date": due_date,
        "notes": "Extracted automatically from uploaded PDF",
    }


def extract_from_tabular(
    file_bytes: bytes, filename: str
) -> List[Dict[str, Union[str, float]]]:
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    else:
        df = pd.read_excel(io.BytesIO(file_bytes))

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    records = []
    for _, row in df.iterrows():
        inv_no = str(
            row.get("invoice_number")
            or row.get("invoice_#")
            or row.get("inv_no")
            or ""
        ).strip()
        customer = str(
            row.get("counterparty_name")
            or row.get("customer")
            or row.get("vendor")
            or ""
        ).strip()

        try:
            amt = float(row.get("amount") or row.get("total") or 0.0)
        except (ValueError, TypeError):
            amt = 0.0

        due_dt = str(
            row.get("due_date") or row.get("payment_due_date") or ""
        ).strip()

        if inv_no or customer or amt > 0:
            records.append(
                {
                    "invoice_number": inv_no,
                    "counterparty_name": customer,
                    "amount": amt,
                    "due_date": due_dt,
                    "notes": "Imported from spreadsheet batch upload",
                }
            )

    return records