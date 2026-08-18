import { useState, useEffect, useCallback, useRef } from 'react'
import { invoices as invoicesApi } from '../services/api/apiClient'
import InvoicePreview from '../components/InvoicePreview'
import {
  CheckIcon,
  PencilIcon,
  DocumentTextIcon as DocumentIcon,
  EnvelopeIcon as MailIcon,
  ScaleIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [pagination, setPagination] = useState({ skip: 0, limit: 20, total: 0 })
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef(null)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  const userRole = (currentUser.role || 'USER').toUpperCase()

  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: '',
    po_number: '',
    status: 'pending', // Added default status
    items: [{ description: '', hsn_sac: '', qty: 1, rate: 0 }],
    tax_type: 'igst',
    tax_percent: 0,
    bill_to_name: '',
    bill_to_email: '', 
    bill_to_mobile: '', 
    bill_to_address: '',
    bill_to_gstin: '',
    bill_to_pan: '', 
    ship_to_name: '',
    ship_to_address: '',
    notes: '',
    document_file: null, 
  })

  const subTotal = formData.items.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.rate || 0)), 0)
  const taxAmount = (subTotal * Number(formData.tax_percent || 0)) / 100
  const totalAmount = subTotal + taxAmount

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const params = { skip: pagination.skip, limit: pagination.limit }
    if (filterStatus) params.status = filterStatus

    const response = await invoicesApi.list(params)
    if (response.ok) {
      setInvoices(response.data.invoices || [])
      setPagination((prev) => ({ ...prev, total: response.data.total || 0 }))
    } else {
      setError(response.error)
    }
    setLoading(false)
  }, [pagination.skip, pagination.limit, filterStatus])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  const handleAutoFillProfile = () => {
    setFormData((prev) => ({
      ...prev,
      bill_to_name: prev.bill_to_name || currentUser.company_name || 'Test Company',
      bill_to_email: prev.bill_to_email || currentUser.email || '',
      bill_to_mobile: prev.bill_to_mobile || currentUser.phone || '',
      bill_to_address: prev.bill_to_address || currentUser.address || 'Karnataka',
      bill_to_gstin: prev.bill_to_gstin || currentUser.gstin || '',
      bill_to_pan: prev.bill_to_pan || currentUser.pan || '',
    }))
    setSuccessMsg('Loaded company profile details!')
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value
    setFormData({ ...formData, items: newItems })
  }

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', hsn_sac: '', qty: 1, rate: 0 }],
    })
  }

  const removeItemRow = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    try {
      const response = await fetch('/api/v1/invoices/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formDataUpload,
      })
      const result = await response.json()
      if (response.ok && result.data?.extracted_invoices?.length > 0) {
        const extracted = result.data.extracted_invoices[0]
        setFormData((prev) => ({
          ...prev,
          invoice_number: extracted.invoice_number || '',
          bill_to_name: extracted.counterparty_name || '',
          notes: extracted.notes || 'Parsed from document',
        }))
        setShowCreateModal(true)
        setSuccessMsg(`Parsed file ${file.name} successfully!`)
      } else {
        setError(result.message || 'Failed to parse invoice document.')
      }
    } catch (err) {
      setError('File upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSaveInvoice = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)

    if (!formData.bill_to_pan || !formData.bill_to_pan.trim()) {
      setError('PAN is mandatory.')
      return
    }

    const dataPayload = new FormData()
    dataPayload.append('invoice_number', formData.invoice_number)
    dataPayload.append('counterparty_name', formData.bill_to_name || 'Customer')
    dataPayload.append('email', formData.bill_to_email || '')
    dataPayload.append('mobile', formData.bill_to_mobile || '')
    dataPayload.append('counterparty_pan', formData.bill_to_pan.trim().toUpperCase())
    dataPayload.append('invoice_date', formData.invoice_date)
    dataPayload.append('due_date', formData.due_date)
    dataPayload.append('amount', totalAmount)
    dataPayload.append('status', formData.status || 'pending') // Saves the selected status
    dataPayload.append('items', JSON.stringify(formData.items))
    dataPayload.append('notes', formData.notes || '')

    if (formData.document_file) {
      dataPayload.append('file', formData.document_file)
    }

    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      let response

      if (isEditing && selectedInvoice) {
        response = await fetch(`/api/v1/invoices/${selectedInvoice.id}`, {
          method: 'PUT',
          headers,
          body: dataPayload,
        })
      } else {
        response = await fetch('/api/v1/invoices', {
          method: 'POST',
          headers,
          body: dataPayload,
        })
      }

      const resJson = await response.json()
      if (response.ok) {
        setShowCreateModal(false)
        setSuccessMsg(isEditing ? 'Invoice updated successfully!' : 'Invoice created successfully!')
        resetForm()
        fetchInvoices()
      } else {
        setError(resJson.detail || resJson.message || 'Failed to save invoice')
      }
    } catch (err) {
      setError('Network error while saving invoice.')
    }
  }

  const handleEdit = (invoice) => {
    setSelectedInvoice(invoice)
    setIsEditing(true)
    setFormData({
      invoice_number: invoice.invoice_number || '',
      invoice_date: invoice.invoice_date ? new Date(invoice.invoice_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : '',
      payment_terms: invoice.payment_terms || '',
      po_number: invoice.po_number || '',
      status: invoice.status || 'pending', // Load existing status
      items: invoice.items || [{ description: '', hsn_sac: '', qty: 1, rate: 0 }],
      tax_type: invoice.tax_type || 'igst',
      tax_percent: invoice.tax_percent || 0,
      bill_to_name: invoice.counterparty_name || invoice.customer_name || '',
      bill_to_email: invoice.email || '',
      bill_to_mobile: invoice.mobile || '',
      bill_to_address: invoice.bill_to_address || '',
      bill_to_pan: invoice.counterparty_pan || invoice.pan || '',
      ship_to_address: invoice.ship_to_address || '',
      notes: invoice.notes || '',
      document_file: null,
    })
    setShowCreateModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    const response = await invoicesApi.delete(id)
    if (response.ok) {
      setSuccessMsg('Invoice deleted successfully!')
      fetchInvoices()
      setShowDetailModal(false)
    } else {
      setError(response.error)
    }
  }

  const handleLegalSupport = async (invoice) => {
    const response = await invoicesApi.update(invoice.id, { status: 'pending_ops' })
    if (response.ok) {
      setSuccessMsg(`Invoice #${invoice.invoice_number} forwarded to Legal / Operations Support!`)
      fetchInvoices()
    } else {
      setError(response.error)
    }
  }

  const handleArchive = async (id) => {
    const response = await invoicesApi.update(id, { status: 'archived' })
    if (response.ok) {
      setSuccessMsg('Invoice archived successfully!')
      fetchInvoices()
    } else {
      setError(response.error)
    }
  }

  const handleAcknowledge = async (id) => {
    const response = await invoicesApi.toggleAcknowledgment(id)
    if (response.ok) {
      setSuccessMsg('Invoice status updated successfully!')
      fetchInvoices()
    } else {
      setError(response.error)
    }
  }

  const handleNotify = async (invoice) => {
    try {
      await invoicesApi.sendReminder(invoice.id)
      setSuccessMsg(`Notification sent for Invoice #${invoice.invoice_number}!`)
    } catch (err) {
      setSuccessMsg(`Notification triggered for Invoice #${invoice.invoice_number}`)
    }
  }

  const handleViewDoc = (documentUrl) => {
    if (documentUrl) window.open(documentUrl, '_blank')
    else setSuccessMsg('No attachment found for this invoice.')
  }

  const resetForm = () => {
    setIsEditing(false)
    setSelectedInvoice(null)
    setFormData({
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      payment_terms: '',
      po_number: '',
      status: 'pending',
      items: [{ description: '', hsn_sac: '', qty: 1, rate: 0 }],
      tax_type: 'igst',
      tax_percent: 0,
      bill_to_name: '',
      bill_to_email: '',
      bill_to_mobile: '',
      bill_to_address: '',
      bill_to_gstin: '',
      bill_to_pan: '',
      ship_to_address: '',
      notes: '',
      document_file: null,
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return 'N/A'
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  }

  const calculateDaysLeft = (dueDateString) => {
    if (!dueDateString) return null
    const due = new Date(dueDateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diffTime = due - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0)
  }

  const getStatusBadge = (status) => {
    const s = (status || 'pending').toLowerCase()
    if (s === 'acknowledged' || s === 'paid') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 uppercase">{status}</span>
    if (s === 'overdue' || s === 'cancelled') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 uppercase">{status}</span>
    if (s === 'draft') return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 uppercase">Draft</span>
    return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 uppercase">{status}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
            <p className="text-gray-500 text-sm">Create, import, and manage sales invoices</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.csv,.xlsx,.xls" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors text-sm font-medium shadow-sm disabled:opacity-50">
              {uploading ? 'Parsing...' : '📁 Import PDF/Excel'}
            </button>
            <button onClick={() => { resetForm(); setShowCreateModal(true); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm">
              + Create Invoice
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative">
            <span>{typeof error === 'object' ? (error.message || error.detail || JSON.stringify(error)) : String(error)}</span>
            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">&times;</button>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg relative">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">&times;</button>
          </div>
        )}

        {/* Enhanced Status Filter Tabs */}
        <div className="flex flex-wrap border-b border-gray-200 bg-white rounded-t-xl px-4 pt-2 overflow-x-auto">
          <button onClick={() => setFilterStatus('')} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${filterStatus === '' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            All Invoices
          </button>
          <button onClick={() => setFilterStatus('pending')} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${filterStatus === 'pending' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            ⏳ Pending Invoices
          </button>
          <button onClick={() => setFilterStatus('overdue')} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${filterStatus === 'overdue' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            🚨 Overdue
          </button>
          <button onClick={() => setFilterStatus('paid')} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${filterStatus === 'paid' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            💰 Paid
          </button>
          <button onClick={() => setFilterStatus('acknowledged')} className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${filterStatus === 'acknowledged' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            ✅ Acknowledged
          </button>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-b-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading && <div className="p-8 text-center text-gray-500">Loading invoices...</div>}
          {!loading && invoices.length === 0 && (
            <div className="p-8 text-center text-gray-500">No invoices found. Click <strong>+ Create Invoice</strong> to add one.</div>
          )}
          {!loading && invoices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Invoice #</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-4 text-left font-semibold text-gray-700">Mobile</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Invoice Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Due Date</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Days Left</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Total</th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {invoices.map((invoice) => {
                    const daysLeft = calculateDaysLeft(invoice.due_date)
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{invoice.invoice_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                          <div className="font-semibold text-gray-900 mb-1">{invoice.counterparty_name || invoice.customer_name || 'Counterparty'}</div>
                          <div className="text-xs text-gray-500"><span className="font-medium text-gray-700">PAN:</span> {invoice.counterparty_pan || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600 text-xs">
                          {invoice.email ? invoice.email : <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600 text-xs">
                          {invoice.mobile ? invoice.mobile : <span className="text-gray-400">N/A</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatDate(invoice.invoice_date || invoice.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{formatDate(invoice.due_date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {daysLeft !== null ? (
                            <span className={`text-xs font-semibold ${daysLeft < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(invoice.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{formatCurrency(invoice.amount || invoice.total)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button onClick={() => handleAcknowledge(invoice.id)} title="Acknowledge / Mark Paid" className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEdit(invoice)} title="Edit" className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleViewDoc(invoice.document_url)} title="View Document" className="p-1.5 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100">
                              <DocumentIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleNotify(invoice)} title="Send Reminder" className="p-1.5 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100">
                              <MailIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleLegalSupport(invoice)} title="Send to Legal Support" className="p-1.5 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                              <ScaleIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleArchive(invoice.id)} title="Archive" className="p-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100">
                              <ArchiveBoxIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(invoice.id)} title="Delete" className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Create / Edit Tax Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h2 className="text-xl font-bold text-gray-950">
                  {isEditing ? 'Edit Tax Invoice' : 'Create Tax Invoice'}
                </h2>
                <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
              </div>

              {/* Company Profile Header Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border text-xs flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">{currentUser.company_name || 'Test Company'}</p>
                  <p className="text-gray-500">GSTIN: {currentUser.gstin || '22AAAAD0000A1Z5'} • PAN: N/A</p>
                </div>
                <button type="button" onClick={handleAutoFillProfile} className="text-blue-600 font-semibold hover:underline">
                  Auto-fill Profile
                </button>
              </div>

              <form onSubmit={handleSaveInvoice} className="space-y-6">
                {/* Invoice Information Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900">Invoice Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Invoice Number *</label>
                      <input type="text" required value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="INV-2026-001" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Invoice Date *</label>
                      <input type="date" required value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Due Date *</label>
                      <input type="date" required value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Payment Terms</label>
                      <input type="text" value={formData.payment_terms} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Net 30" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">PO Number</label>
                      <input type="text" value={formData.po_number} onChange={(e) => setFormData({ ...formData, po_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="PO-0001" />
                    </div>
                    {/* Added Status Dropdown */}
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Status</label>
                      <select 
                        value={formData.status} 
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                        className="w-full px-3 py-2 border rounded-lg bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                        <option value="acknowledged">Acknowledged</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900">Items</h3>
                    <button type="button" onClick={addItemRow} className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium shadow-sm hover:bg-blue-700">+ Add Item</button>
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Description</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">HSN/SAC</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Qty</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700">Rate (₹)</th>
                          <th className="px-3 py-2 text-right font-semibold text-gray-700">Amount</th>
                          <th className="px-3 py-2 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {formData.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2"><input type="text" required value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="w-full border px-2 py-1 rounded" placeholder="Item description" /></td>
                            <td className="px-3 py-2"><input type="text" value={item.hsn_sac} onChange={(e) => handleItemChange(index, 'hsn_sac', e.target.value)} className="w-full border px-2 py-1 rounded" placeholder="0000" /></td>
                            <td className="px-3 py-2"><input type="number" required min="1" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', e.target.value)} className="w-16 border px-2 py-1 rounded" /></td>
                            <td className="px-3 py-2"><input type="number" required min="0" step="0.01" value={item.rate} onChange={(e) => handleItemChange(index, 'rate', e.target.value)} className="w-24 border px-2 py-1 rounded" /></td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(Number(item.qty || 0) * Number(item.rate || 0))}</td>
                            <td className="px-3 py-2 text-center">
                              {formData.items.length > 1 && (
                                <button type="button" onClick={() => removeItemRow(index)} className="text-red-600 font-bold hover:text-red-800">&times;</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Tax Type & Tax % Selectors */}
                  <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tax_type" checked={formData.tax_type === 'igst'} onChange={() => setFormData({ ...formData, tax_type: 'igst' })} />
                      IGST (inter-state)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="tax_type" checked={formData.tax_type === 'cgst_sgst'} onChange={() => setFormData({ ...formData, tax_type: 'cgst_sgst' })} />
                      CGST + SGST (intra-state)
                    </label>
                    <div className="flex items-center gap-2">
                      <span>Tax %</span>
                      <input type="number" min="0" max="100" value={formData.tax_percent} onChange={(e) => setFormData({ ...formData, tax_percent: e.target.value })} className="w-20 px-2 py-1 border rounded text-center" />
                    </div>
                  </div>

                  {/* Summary Totals */}
                  <div className="flex flex-col items-end space-y-1 pt-2 text-xs font-medium text-gray-800 border-t">
                    <div>Sub Total: <span className="inline-block w-28 text-right">{formatCurrency(subTotal)}</span></div>
                    {formData.tax_type === 'igst' ? (
                      <div>IGST ({formData.tax_percent}%): <span className="inline-block w-28 text-right">{formatCurrency(taxAmount)}</span></div>
                    ) : (
                      <>
                        <div>CGST ({formData.tax_percent / 2}%): <span className="inline-block w-28 text-right">{formatCurrency(taxAmount / 2)}</span></div>
                        <div>SGST ({formData.tax_percent / 2}%): <span className="inline-block w-28 text-right">{formatCurrency(taxAmount / 2)}</span></div>
                      </>
                    )}
                    <div className="text-sm font-bold text-gray-950 pt-1 border-t">Total: <span className="inline-block w-28 text-right">{formatCurrency(totalAmount)}</span></div>
                    <div className="text-sm font-bold text-blue-600">Balance Due: <span className="inline-block w-28 text-right">{formatCurrency(totalAmount)}</span></div>
                  </div>
                </div>

                {/* Bill To & Ship To Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t text-xs">
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900">Bill To</h3>
                    <input type="text" required value={formData.bill_to_name} onChange={(e) => setFormData({ ...formData, bill_to_name: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Customer Name *" />
                    <input type="email" value={formData.bill_to_email} onChange={(e) => setFormData({ ...formData, bill_to_email: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Customer Email" />
                    <input type="text" value={formData.bill_to_mobile} onChange={(e) => setFormData({ ...formData, bill_to_mobile: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Customer Mobile Number" />
                    <textarea rows={2} value={formData.bill_to_address} onChange={(e) => setFormData({ ...formData, bill_to_address: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Customer Address" />
                    <input type="text" value={formData.bill_to_gstin} onChange={(e) => setFormData({ ...formData, bill_to_gstin: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="GSTIN" />
                    <input type="text" required value={formData.bill_to_pan} onChange={(e) => setFormData({ ...formData, bill_to_pan: e.target.value })} className="w-full px-3 py-2 border rounded uppercase" placeholder="PAN *" maxLength={10} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-gray-900">Ship To</h3>
                    <input type="text" value={formData.ship_to_name} onChange={(e) => setFormData({ ...formData, ship_to_name: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Ship To Name" />
                    <textarea rows={2} value={formData.ship_to_address} onChange={(e) => setFormData({ ...formData, ship_to_address: e.target.value })} className="w-full px-3 py-2 border rounded" placeholder="Ship To Address" />
                  </div>
                </div>

                {/* File Attachment Upload Option */}
                <div className="pt-3 border-t text-xs">
                  <label className="block font-medium text-gray-700 mb-1">Attach Document (PDF, JPG, PNG)</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFormData({ ...formData, document_file: e.target.files?.[0] || null })}
                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {formData.document_file && (
                    <p className="text-emerald-600 mt-1 font-medium">Selected file: {formData.document_file.name}</p>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-medium">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm">{isEditing ? 'Save Changes' : 'Create Invoice'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Invoice {selectedInvoice.invoice_number}</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
              </div>
              <div className="p-2 border rounded-xl bg-gray-50 mb-4">
                <InvoicePreview invoice={selectedInvoice} />
              </div>
              <div className="flex gap-3 pt-4 border-t justify-end">
                <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700">Print / Save PDF</button>
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-xs font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}