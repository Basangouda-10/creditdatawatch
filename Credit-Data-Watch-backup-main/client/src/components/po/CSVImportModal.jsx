
import { useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { purchaseOrders } from '../../services/api/apiClient'
import * as XLSX from 'xlsx'

const IMPORT_TYPES = {
  DEFAULT: 'DEFAULT',
  ZOHO: 'ZOHO',
  TALLY: 'TALLY'
}

const MAPPINGS = {
  [IMPORT_TYPES.DEFAULT]: {
    po_number: ["PO #", "PO Number", "Voucher No.", "Invoice No", "Bill No", "Purchase Order#", "Reference"],
    vendor_name: ["Vendor", "Vendor Name", "Particulars", "Party Name", "Supplier", "Ledger"],
    gstin: ["GSTIN", "GSTIN/UIN", "Tax ID", "GST No", "Registration"],
    amount: ["Amount", "Gross Total", "Net Amount", "Total", "Value"],
    due_date: ["Due", "Date", "Bill Date", "Invoice Date", "Due Date", "Voucher Date"],
    email: ["Email", "Vendor Email", "Mail", "Contact Email"],
    mobile: ["Mobile", "Phone", "Contact", "Number"],
    payment_window: ["Window", "Days", "Terms", "Credit Period", "Payment Days"]
  },
  [IMPORT_TYPES.ZOHO]: {
    po_number: ["PO Number"],
    vendor_name: ["Vendor Name"],
    due_date: ["PO Date"],
    item_name: ["Item Name"],
    quantity: ["Quantity"],
    rate: ["Rate"],
    amount: ["Amount"]
  },
  [IMPORT_TYPES.TALLY]: {
    po_number: ["Voucher Number", "PO Number"],
    vendor_name: ["Party Name"],
    due_date: ["Date"],
    item_name: ["Stock Item"],
    quantity: ["Billed Qty"],
    rate: ["Rate"],
    amount: ["Amount"]
  }
}

const FIELD_LABELS = {
  po_number: 'PO Number',
  vendor_name: 'Vendor Name',
  gstin: 'GSTIN',
  amount: 'Amount',
  due_date: 'Due Date',
  email: 'Email',
  mobile: 'Mobile',
  payment_window: 'Payment Window'
}

const formatDateToISO = (dateStr) => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  
  // Try YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  
  // Try DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyy) {
    const [_, d, m, y] = ddmmyyyy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  
  // Try DD MMM YYYY
  const ddmmmyyyy = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (ddmmmyyyy) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  
  return null;
}

const parseAmount = (val) => {
  if (val === undefined || val === null) return 0;
  const s = String(val).replace(/[₹Rs.,\s]/g, '');
  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

export default function CSVImportModal({ onClose, onImportComplete }) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState(null)
  const [importType, setImportType] = useState(IMPORT_TYPES.DEFAULT)
  const [rawData, setRawData] = useState([])
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const applyMapping = (fileHeaders, type) => {
    const newMapping = {};
    const normalizedHeaders = fileHeaders.map(h => String(h).toLowerCase().trim());
    const typeMapping = MAPPINGS[type];

    Object.entries(typeMapping).forEach(([field, aliases]) => {
      const matchIdx = normalizedHeaders.findIndex(h => 
        aliases.some(alias => h === alias.toLowerCase() || h.includes(alias.toLowerCase()))
      );
      if (matchIdx !== -1) {
        newMapping[field] = fileHeaders[matchIdx];
      }
    });

    return newMapping;
  }

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const isAllowed = selectedFile.name.endsWith('.csv') || 
                      selectedFile.name.endsWith('.xlsx') || 
                      selectedFile.name.endsWith('.xls')
    
    if (!isAllowed) {
      setError('Please select a CSV or Excel file (.csv, .xlsx, .xls)')
      return
    }

    setFile(selectedFile)
    setError('')
    
    try {
      const data = await readFile(selectedFile)
      if (data && data.length > 0) {
        const fileHeaders = Object.keys(data[0])
        setRawData(data)
        setHeaders(fileHeaders)
        
        const detectedMapping = applyMapping(fileHeaders, importType);
        setMapping(detectedMapping);
        setStep(2)
      } else {
        setError('The file appears to be empty.')
      }
    } catch (err) {
      setError('Error reading file: ' + err.message)
    }
  }

  const readFile = (file) => {
     return new Promise((resolve, reject) => {
       const reader = new FileReader()
       reader.onload = (e) => {
         try {
           const data = new Uint8Array(e.target.result)
           const workbook = XLSX.read(data, { type: 'array', cellDates: true })
           const sheetName = workbook.SheetNames.find(name => {
             const sheet = workbook.Sheets[name]
             return XLSX.utils.sheet_to_json(sheet).length > 0
           }) || workbook.SheetNames[0]
           const sheet = workbook.Sheets[sheetName]
           const json = XLSX.utils.sheet_to_json(sheet, { raw: false })
           resolve(json)
         } catch (err) {
           reject(err)
         }
       }
       reader.onerror = reject
       reader.readAsArrayBuffer(file)
     })
   }

  const handleConfirmImport = async () => {
    setImporting(true)
    setError('')
    setImportProgress(0)
    
    const processedData = rawData.map(row => {
      const notesParts = [];
      if (mapping.item_name && row[mapping.item_name]) notesParts.push(`Item: ${row[mapping.item_name]}`);
      if (mapping.quantity && row[mapping.quantity]) notesParts.push(`Qty: ${row[mapping.quantity]}`);
      if (mapping.rate && row[mapping.rate]) notesParts.push(`Rate: ${row[mapping.rate]}`);

      return {
        po_number: String(row[mapping.po_number] || '').trim(),
        vendor: String(row[mapping.vendor_name] || '').trim(),
        gstin: String(row[mapping.gstin] || 'PENDING').trim().toUpperCase(),
        amount: parseAmount(row[mapping.amount]),
        due_date: formatDateToISO(row[mapping.due_date]) || new Date().toISOString().split('T')[0],
        vendor_email: String(row[mapping.email] || '').trim(),
        vendor_phone: String(row[mapping.mobile] || '').replace(/[\s-]/g, ''),
        payment_window_days: parseInt(row[mapping.payment_window]) || 50,
        status: 'Open',
        notes: notesParts.join(' | ')
      };
    }).filter(r => r.vendor || r.po_number);

    const skippedRows = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < processedData.length; i++) {
        const row = processedData[i];
        try {
          const res = await purchaseOrders.create(row);
          if (res.ok) {
            successCount++;
          } else {
            failedCount++;
            skippedRows.push({ ...row, error: res.error });
          }
        } catch (err) {
          failedCount++;
          skippedRows.push({ ...row, error: err.message });
        }
        setImportProgress(Math.round(((i + 1) / processedData.length) * 100));
      }

      setResults({
        total: processedData.length,
        success: successCount,
        failed: failedCount,
        skippedData: skippedRows
      });
      
      if (successCount > 0) {
        onImportComplete();
      }
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to process import');
    } finally {
      setImporting(false);
    }
  }

  const downloadSkippedRows = () => {
    if (!results?.skippedData?.length) return;
    const headers = Object.keys(results.skippedData[0]).join(',');
    const rows = results.skippedData.map(r => Object.values(r).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skipped_pos_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold text-gray-900">Import Purchase Orders</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
              disabled={importing}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Steps Indicator */}
          <div className="flex items-center mt-4 gap-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? 'bg-primary-600 text-white' : 
                  step > s ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-xs font-medium ${step === s ? 'text-primary-700' : 'text-gray-500'}`}>
                  {s === 1 ? 'Upload' : s === 2 ? 'Review' : 'Results'}
                </span>
                {s < 3 && <div className="w-8 h-px bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {typeof error === 'object' ? (error.message || error.detail || JSON.stringify(error)) : String(error)}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h3 className="font-semibold text-primary-900 mb-2">Structured Import</h3>
                <ul className="text-sm text-primary-800 space-y-1">
                  <li>• Select your Excel format (Default, Zoho, or Tally)</li>
                  <li>• Upload your file to automatically map columns</li>
                  <li>• Review and confirm before final import</li>
                </ul>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Import Type
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {Object.values(IMPORT_TYPES).map((type) => (
                    <button
                      key={type}
                      onClick={() => setImportType(type)}
                      className={`py-3 px-4 rounded-lg border-2 font-bold text-sm transition-all ${
                        importType === type
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="import-file" className="block text-sm font-medium text-gray-700 mb-2">
                  Select File (CSV or Excel)
                </label>
                <div className="relative group">
                  <input
                    id="import-file"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full py-12 px-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-colors ${
                    file ? 'border-primary-300 bg-primary-50' : 'border-gray-300 group-hover:border-primary-400'
                  }`}>
                    <svg className={`w-12 h-12 mb-3 ${file ? 'text-primary-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-base font-medium text-gray-600">
                      {file ? file.name : 'Click or drag file to upload'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Step 2: Column Mapping ({importType})</h3>
                  <p className="text-sm text-gray-500">Verify how your Excel columns map to PO fields.</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">PO Field</th>
                      <th className="px-4 py-3">Excel Column</th>
                      <th className="px-4 py-3">Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(FIELD_LABELS).map(([field, label]) => {
                      const isMapped = !!mapping[field];
                      const isRequired = ['po_number', 'vendor_name', 'amount'].includes(field);
                      return (
                        <tr key={field} className={isRequired ? 'bg-white' : 'bg-gray-50/30'}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-700">{label}</span>
                              {isRequired && <span className="text-red-500">*</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={mapping[field] || ''} 
                              onChange={(e) => setMapping(prev => ({ ...prev, [field]: e.target.value }))}
                              className={`w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-primary-200 focus:border-primary-500 outline-none ${
                                !isMapped ? 'border-red-200 bg-red-50 text-red-400' : 'border-gray-300 text-gray-900'
                              }`}
                            >
                              <option value="">(Not Mapped)</option>
                              {headers.map(h => (
                                <option key={h} value={h}>{h}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isMapped ? (
                              <span className="text-green-500">✅</span>
                            ) : (
                              <span className="text-amber-500">⚠️</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Pro Tip:</strong> Ensure PO Number, Vendor Name, and Amount are correctly mapped for accurate processing.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm font-bold text-gray-700">
                  {rawData.length} rows will be processed
                </p>
              </div>
            </div>
          )}

          {step === 3 && results && (
            <div className="space-y-6">
              <div className={`rounded-xl border p-6 ${results.failed > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${results.failed > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {results.failed === 0 ? '✅' : '⚠️'}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${results.failed > 0 ? 'text-orange-900' : 'text-green-900'}`}>Import Finished</h3>
                    <p className={`text-sm ${results.failed > 0 ? 'text-orange-800' : 'text-green-800'}`}>
                      Successfully processed {results.total} rows.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 p-4 rounded-lg border border-white/50 text-center">
                    <p className="text-xs text-green-600 uppercase font-bold">Imported</p>
                    <p className="text-3xl font-bold text-green-600">{results.success}</p>
                  </div>
                  <div className="bg-white/60 p-4 rounded-lg border border-white/50 text-center">
                    <p className="text-xs text-red-600 uppercase font-bold">Skipped/Failed</p>
                    <p className="text-3xl font-bold text-red-600">{results.failed}</p>
                  </div>
                </div>

                {results.failed > 0 && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={downloadSkippedRows}
                      className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center gap-2"
                    >
                      📥 Download Skipped Rows (.csv)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
            disabled={importing}
          >
            {step === 3 ? 'Close' : 'Cancel'}
          </button>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium"
              disabled={importing}
            >
              Back
            </button>
          )}
          {step === 2 && (
            <div className="flex-1 flex flex-col gap-2">
              {importing && (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-primary-700 uppercase">Importing Rows...</span>
                    <span className="text-[10px] font-bold text-primary-700">{importProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-primary-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <button
                onClick={handleConfirmImport}
                className="w-full btn-primary disabled:opacity-50"
                disabled={importing}
              >
                {importing ? 'Processing...' : 'Confirm & Import'}
              </button>
            </div>
          )}
          {step === 3 && (
            <button
              onClick={onClose}
              className="flex-1 btn-primary"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

CSVImportModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onImportComplete: PropTypes.func.isRequired,
}
