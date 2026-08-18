import React from "react";

export default function InvoicePreview({ invoice }) {
  if (!invoice) return null;

  const items = invoice.items || [];
  const currency = invoice.currency || "USD";
  const conversionRate = invoice.exchange_rate || 83.5;

  // Formatting helpers
  const formatDate = (dateStr, defaultStr) => {
    if (!dateStr) return defaultStr;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? defaultStr : d.toLocaleDateString("en-GB");
  };

  const formatNumber = (val, fallback = 0, digits = 2) => {
    const num = val !== undefined && val !== null ? Number(val) : fallback;
    return isNaN(num) ? fallback.toFixed(digits) : num.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  };

  // Financial calculations with fallbacks
  const subtotalVal = invoice.subtotal !== undefined && invoice.subtotal !== null ? Number(invoice.subtotal) : 112000;
  const discountVal = invoice.discount_amount !== undefined && invoice.discount_amount !== null ? Number(invoice.discount_amount) : (invoice.discount || 2000);
  const taxVal = invoice.tax_amount !== undefined && invoice.tax_amount !== null ? Number(invoice.tax_amount) : (invoice.igst || 3240);
  const roundOffVal = invoice.round_off !== undefined && invoice.round_off !== null ? Number(invoice.round_off) : -0.40;
  const totalVal = invoice.total || invoice.amount || 115239.60;
  const balanceDueVal = invoice.balance_due !== undefined && invoice.balance_due !== null ? Number(invoice.balance_due) : totalVal;

  return (
    <div className="print:fixed print:inset-0 print:m-0 print:p-6 print:w-full print:h-auto print:bg-white print:z-[9999] max-w-4xl mx-auto p-8 bg-white border shadow-md font-sans text-gray-800 text-xs leading-relaxed">
      {/* Header Block */}
      <div className="flex justify-between items-start border-b pb-4 mb-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{invoice.company_name || "Your Company"}</h1>
          <p>{invoice.company_address || "123 Main St, Chennai"}</p>
          <p>GSTIN: {invoice.company_gstin || "N/A"}</p>
          {invoice.cin && <p>CIN: {invoice.cin}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-wide">TAX INVOICE</h2>
          <p className="font-semibold text-gray-600">Invoice# {invoice.invoice_number || "YC/INV/26/08/643"}</p>
          <span className="inline-block bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase mt-1 print:border print:border-blue-400">
            {invoice.status || "SENT"}
          </span>
        </div>
      </div>

      {/* Primary 8-Column Details Bar */}
      <div className="grid grid-cols-8 gap-2 bg-gray-50 border p-2 mb-4 text-[11px] text-center">
        <div>
          <span className="block font-semibold text-gray-500">Company Name</span>
          <p className="font-bold truncate">{invoice.company_name || "Your Company"}</p>
        </div>
        <div>
          <span className="block font-semibold text-gray-500">Invoice #</span>
          <p className="font-bold">{invoice.invoice_number || "YC/INV/26/08/643"}</p>
        </div>
        <div>
          <span className="block font-semibold text-gray-500">Invoice Date</span>
          <p>{formatDate(invoice.invoice_date, "09/08/2026")}</p>
        </div>
        <div>
          <span className="block font-semibold text-gray-500">Payment Due Date</span>
          <p>{formatDate(invoice.payment_due_date || invoice.due_date, "09/09/2026")}</p>
        </div>
        <div>
          <span className="block font-semibold text-gray-500">PO#</span>
          <p>{invoice.po_number || "PO-0001"}</p>
        </div>
        <div>
          <span className="block font-semibold text-gray-500">PO Date</span>
          <p>{formatDate(invoice.po_date, "08/08/2026")}</p>
        </div>
        <div>
          <span className="block font-semibold text-gray-500">PAN</span>
          <p>{invoice.company_pan || "N/A"}</p>
        </div>
        <div>
          <span className="block font-semibold text-gray-500">MSME No</span>
          <p>{invoice.msme_no || "12345"}</p>
        </div>
      </div>

      {/* Bill To / Ship To / Export Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="border p-3 rounded">
          <h3 className="font-bold border-b pb-1 mb-1.5 text-gray-700">Bill To</h3>
          <p className="font-bold">{invoice.bill_to?.name || invoice.counterparty_name || invoice.customer_name || "ABC"}</p>
          <p>{invoice.bill_to?.address || invoice.customer_address || "Tamil Nadu, 57008"}</p>
          <p>GSTIN: {invoice.counterparty_gstin || "29ABCDE1234F1Z5"}</p>
          <p>PAN: {invoice.counterparty_pan || "ABCDE1234F"}</p>
        </div>
        <div className="border p-3 rounded">
          <h3 className="font-bold border-b pb-1 mb-1.5 text-gray-700">Ship To</h3>
          <p className="font-bold">{invoice.ship_to?.name || invoice.counterparty_name || invoice.customer_name || "ABC"}</p>
          <p>{invoice.ship_to?.address || invoice.ship_to_address || "Tamil Nadu, 57008"}</p>
          <p>Place Of Supply: {invoice.place_of_supply || "Tamil Nadu"}</p>
          <p>LUT ARN: {invoice.lut_arn || "123"}</p>
          <p>Date of Filing LUT: {formatDate(invoice.lut_filing_date, "09/08/2026")}</p>
        </div>
      </div>

      {/* SEZ Declaration Banner */}
      {(invoice.is_sez_export || invoice.is_sez_export === undefined) && (
        <div className="bg-gray-100 border-l-4 border-gray-500 p-2 mb-4 text-[10px] text-gray-700 font-semibold uppercase">
          SUPPLY MEANT FOR EXPORT/SUPPLY TO SEZ UNIT/SEZ DEVELOPER FOR AUTHORIZED OPERATIONS UNDER BOND OR LETTER OF UNDERTAKING WITHOUT PAYMENT OF INTEGRATED TAX
        </div>
      )}

      {/* Items Table */}
      <table className="w-full text-left border-collapse border mb-4">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-1.5 border">#</th>
            <th className="p-1.5 border">Item & Description</th>
            <th className="p-1.5 border">HSN/SAC</th>
            <th className="p-1.5 border text-right">Qty</th>
            <th className="p-1.5 border text-right">Rate</th>
            <th className="p-1.5 border text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.length > 0 ? (
            items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-1.5 border">{idx + 1}</td>
                <td className="p-1.5 border font-medium">{item.desc || item.description}</td>
                <td className="p-1.5 border">{item.hsn || item.hsn_sac || "0008"}</td>
                <td className="p-1.5 border text-right">{item.qty || item.quantity || 1}</td>
                <td className="p-1.5 border text-right">{formatNumber(item.rate, 60000)}</td>
                <td className="p-1.5 border text-right">{formatNumber(item.amount, 60000)}</td>
              </tr>
            ))
          ) : (
            <tr className="border-b">
              <td className="p-1.5 border">1</td>
              <td className="p-1.5 border font-medium">Software License</td>
              <td className="p-1.5 border">0008</td>
              <td className="p-1.5 border text-right">1</td>
              <td className="p-1.5 border text-right">60,000.00</td>
              <td className="p-1.5 border text-right">60,000.00</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Footer Details & Totals */}
      <div className="flex justify-between items-start gap-4">
        <div className="w-1/2 space-y-3">
          <div className="bg-gray-50 p-2.5 rounded border">
            <p>E-Way Bill No: <span className="font-semibold">{invoice.eway_bill_number || invoice.eway_bill_no || "EWB1234567890"}</span></p>
            <p>Payment Terms: <span className="font-semibold">{invoice.payment_terms || "Net 30"}</span></p>
            {invoice.reverse_charge && <p>Reverse Charge: <span className="font-semibold">Yes</span></p>}
          </div>

          <div className="bg-gray-50 p-2.5 rounded border">
            <h4 className="font-bold border-b pb-1 mb-1 text-gray-700">Payment Details</h4>
            <p>Bank: {invoice.bank_name || "HDFC Bank"}</p>
            <p>Account Name: {invoice.bank_account_name || "Your Company Pvt Ltd"}</p>
            <p>Account No: {invoice.bank_account_number || "1234567890"}</p>
            <p>IFSC: {invoice.bank_ifsc || "HDFC0001234"}</p>
            <p>UPI ID: {invoice.bank_upi_id || "yourcompany@hdfc"}</p>
          </div>

          <div>
            <p className="font-bold text-gray-700">Notes:</p>
            <p>{invoice.notes || "Thank you for your business."}</p>
          </div>
        </div>

        {/* Financial Totals Block */}
        <div className="w-1/2 border p-3 rounded bg-gray-50 space-y-1.5 text-right">
          <div className="flex justify-between">
            <span className="text-gray-600">Sub Total:</span>
            <span className="font-semibold">{currency} {formatNumber(subtotalVal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Discount:</span>
            <span>- {currency} {formatNumber(discountVal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>IGST:</span>
            <span>{currency} {formatNumber(taxVal)}</span>
          </div>
          <div className="flex justify-between text-gray-600 border-b pb-1">
            <span>Round Off:</span>
            <span>{roundOffVal < 0 ? `- ${currency} ${Math.abs(roundOffVal).toFixed(2)}` : `${currency} ${roundOffVal.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
            <span>Total:</span>
            <span>{currency} {formatNumber(totalVal)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-800 border-b pb-1">
            <span>Total (INR @ {conversionRate}):</span>
            <span>INR {formatNumber(totalVal * conversionRate)}</span>
          </div>
          <div className="flex justify-between font-bold text-blue-900 bg-blue-50 p-1.5 rounded mt-2">
            <span>Balance Due:</span>
            <span>{currency} {formatNumber(balanceDueVal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}