import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { isValidGstin } from '../../utils/validation'
import { api } from '../../services/api/apiClient'

export default function EditPOModal({ po, onClose, onSave }) {
  const [form, setForm] = useState({
    po_number: '',
    vendor: '',
    gstin: '',
    amount: '',
    due_date: '',
    status: 'open',
    notes: '',
    document_url: '',
    reason: '',
    payment_window_days: 50,
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [submitForApproval, setSubmitForApproval] = useState(false)

  useEffect(() => {
    if (po) {
      setForm({
        po_number: po.po_number || '',
        vendor: po.vendor || '',
        gstin: po.gstin || '',
        amount: po.amount || '',
        due_date: po.due_date?.slice(0, 10) || '',
        status: po.status || 'open',
        notes: po.notes || '',
        document_url: po.document_url || '',
        reason: '',
        payment_window_days: po.payment_window_days || 50,
      })
    }
  }, [po])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenceFile(e.target.files[0])
      setSubmitForApproval(true)
    }
  }

  const handleSave = async () => {
    if (submitForApproval || evidenceFile) {
      if (!evidenceFile) {
        setError('Please attach evidence document for approval flow')
        return
      }
      if (!form.reason) {
        setError('Please enter reason for edit')
        return
      }

      setSaving(true)
      try {
        // 1. Upload evidence file first
        const formData = new FormData()
        formData.append('file', evidenceFile)
        
        const uploadRes = await api.post('/upload/evidence', formData)
        if (!uploadRes.ok) {
          setError(uploadRes.error || 'Failed to upload evidence')
          setSaving(false)
          return
        }
        const evidenceUrl = uploadRes.data?.url
        const evidenceFilename = uploadRes.data?.filename

        // 2. Create PO approval request
        const res = await api.post(`/purchase-orders/${po.id}/request-approval`, {
          edit_data: form,
          evidence_url: evidenceUrl,
          evidence_filename: evidenceFilename,
          reason: form.reason
        })

        if (res.ok) {
          alert('✅ Edit submitted for approval! operation team will review it.')
          onClose()
        } else {
          setError(res.error || 'Failed to submit for approval')
        }
      } catch (err) {
        setError('An error occurred during submission')
      } finally {
        setSaving(false)
      }
    } else {
      // Normal save without approval
      setSaving(true)
      const success = await onSave(form)
      setSaving(false)
      if (success) onClose()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.gstin && !isValidGstin(form.gstin)) {
      setError('Enter a valid vendor GSTIN, or leave it blank.')
      return
    }

    if (!form.po_number || !form.vendor || !form.amount || !form.due_date || (!submitForApproval && !form.reason)) {
      setError('Fill all required fields.')
      return
    }

    await handleSave()
  }

  if (!po) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-heading font-bold text-gray-900">Edit Purchase Order</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {typeof error === 'object' ? (error.message || error.detail || JSON.stringify(error)) : String(error)}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="po-number" className="block text-sm font-medium text-gray-700 mb-1">
                PO Number <span className="text-red-500">*</span>
              </label>
              <input
                id="po-number"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="po_number"
                value={form.po_number}
                onChange={handleChange}
                placeholder="PO-2024-001"
                required
              />
            </div>

            <div>
              <label htmlFor="po-status" className="block text-sm font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="po-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                required
              >
                <option value="open">Open</option>
                <option value="pending">Pending Docs</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              id="vendor"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              name="vendor"
              value={form.vendor}
              onChange={handleChange}
              placeholder="ABC Suppliers Pvt Ltd"
              required
            />
          </div>

          <div>
            <label htmlFor="gstin" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor GSTIN
            </label>
            <input
              id="gstin"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              name="gstin"
              value={form.gstin}
              onChange={handleChange}
              placeholder="27AABCU9603R1ZM (optional)"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="po-amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                id="po-amount"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="amount"
                type="number"
                step="0.01"
                value={form.amount}
                onChange={handleChange}
                placeholder="50000"
                required
              />
            </div>

            <div>
              <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                id="due-date"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="due_date"
                type="date"
                value={form.due_date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="payment-window" className="block text-sm font-medium text-gray-700 mb-1">
                Payment Window (Days)
              </label>
              <input
                id="payment-window"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="payment_window_days"
                type="number"
                min="0"
                value={form.payment_window_days}
                onChange={handleChange}
                placeholder="50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="po-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="po-notes"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 min-h-[80px]"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional notes or comments..."
            />
          </div>

          <div>
            <label htmlFor="po-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Update <span className="text-red-500">*</span>
            </label>
            <textarea
              id="po-reason"
              className="w-full rounded-lg border border-red-300 px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-200 min-h-[80px]"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              placeholder="Explain why you are modifying this purchase order..."
              required
            />
          </div>

          {/* Evidence Attachment Section */}
          <div className="border-t border-gray-100 pt-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              📎 Attach Evidence (Required for Operations Review)
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Upload payment proof or invoice — this will trigger a review by the operation team.
            </p>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 mb-4"
            />
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={submitForApproval}
                onChange={e => setSubmitForApproval(e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600 font-medium">Submit for internal approval flow</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary shadow-lg"
              disabled={saving}
            >
              {saving ? 'Processing...' : (submitForApproval ? '📤 Submit for Approval' : '💾 Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

EditPOModal.propTypes = {
  po: PropTypes.shape({
    id: PropTypes.string,
    po_number: PropTypes.string,
    vendor: PropTypes.string,
    gstin: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    due_date: PropTypes.string,
    status: PropTypes.string,
    notes: PropTypes.string,
    document_url: PropTypes.string,
    payment_window_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}
