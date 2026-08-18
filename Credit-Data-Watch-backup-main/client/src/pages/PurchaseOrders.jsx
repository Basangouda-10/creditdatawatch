import { useEffect, useMemo, useState } from 'react'
import { purchaseOrders, sendPOReminder, admin } from '../services/api/apiClient'
import { isValidGstin } from '../utils/validation'
import { useAuth } from '../state/authContext'
import EditPOModal from '../components/po/EditPOModal'
import CSVImportModal from '../components/po/CSVImportModal'
import ReminderModal from '../components/po/ReminderModal'
import { formatE164 } from '../utils/phone'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { logActivity, ACTIONS } from '../utils/activityLogger'

export default function PurchaseOrders() {
  const { canAccessFeature, user, loadUser } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const isMasterAdmin = role === 'MASTER_ADMIN'
  const isCompanyAdmin = role === 'COMPANY_ADMIN'
  const isLegal = role === 'LEGAL'
  const allowed = canAccessFeature('PO_MANAGEMENT') || isMasterAdmin || isCompanyAdmin || user?.subscription_bypass || user?.full_access

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingId, setLoadingId] = useState(null)
  const [form, setForm] = useState({ po_number: '', vendor: '', gstin: '', vendor_email: '', vendor_phone: '', amount: '', due_date: '', status: 'open', payment_window_days: 50 })
  const [poFile, setPoFile] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [cred, setCred] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const handleStatusFilterChange = (val) => {
    setStatusFilter(val)
    setCurrentPage(1)
  }
  const handleShowArchivedChange = (val) => {
    setShowArchived(val)
    setCurrentPage(1)
  }
  const [editingPO, setEditingPO] = useState(null)
  const [reminderPO, setReminderPO] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [reasonModal, setReasonModal] = useState({ open: false, action: '', po: null, onConfirm: null }) 
  const [reasonText, setReasonText] = useState('') 
  const [paymentReceipt, setPaymentReceipt] = useState(null)
  const [legalSupportReason, setLegalSupportReason] = useState('')
  const [legalSupportFile, setLegalSupportFile] = useState(null)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [showLegalNotice, setShowLegalNotice] = useState(false)
  const [showLegalConfirm, setShowLegalNoticeConfirm] = useState(null)
  const [showLegalSupportConfirm, setShowLegalSupportConfirm] = useState(null)
  const [editingRow, setEditingRow] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 5

  const activeRows = useMemo(() => rows.filter(r => !r.archived), [rows])
  const archivedRows = useMemo(() => rows.filter(r => r.archived), [rows])
  const filteredRows = useMemo(() => {
    if (!statusFilter) return activeRows
    const sf = statusFilter.toLowerCase()
    return activeRows.filter(r => (String(r.status || '').toLowerCase().includes(sf)))
  }, [activeRows, statusFilter])
  const displayRows = showArchived ? rows : filteredRows
  const paginatedRows = useMemo(() => {
    return displayRows.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    )
  }, [displayRows, currentPage, rowsPerPage])

  // Immutability Guard Helper: Lock modifications on verified or approved POs
  const isLocked = (row) => {
    const statusUpper = String(row?.status || '').toUpperCase()
    const lockedStatuses = ['OPERATIONS_APPROVED', 'LEGAL_REVIEWED', 'MASTER_APPROVED', 'COMPLETED', 'NOTICE_SENT']
    return Boolean(row?.is_verified) || lockedStatuses.includes(statusUpper)
  }

  const calculateDaysLeft = (dueDateStr, paymentWindowDays = 0) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dueDate = new Date(dueDateStr)
    dueDate.setHours(0, 0, 0, 0)
    
    const effectiveDueDate = new Date(dueDate)
    effectiveDueDate.setDate(effectiveDueDate.getDate() + parseInt(paymentWindowDays || 0))
    
    const daysLeft = Math.floor((effectiveDueDate - today) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const getDaysLeftBadge = (row) => {
    const isPaid = row.payment_completed_at || String(row.status || '').toLowerCase() === 'closed' || String(row.status || '').toLowerCase() === 'paid';
    if (isPaid) return <span className="text-gray-400">—</span>;

    const daysLeft = calculateDaysLeft(row.due_date, row.payment_window_days);

    if (daysLeft > 7) {
      return <span className="text-emerald-600 font-medium">{daysLeft} days left</span>;
    }
    if (daysLeft >= 1 && daysLeft <= 7) {
      return <span className="text-amber-600 font-medium">{daysLeft} days left ⚠️</span>;
    }
    if (daysLeft === 0) {
      return <span className="text-red-600 font-bold">Due Today!</span>;
    }
    return <span className="text-red-600 font-bold">{Math.abs(daysLeft)} days overdue</span>;
  };

  const getStatusBadge = (row) => {
    const statusLower = String(row.status || '').toLowerCase()
    const isPaid = row.payment_completed_at || statusLower === 'closed' || statusLower === 'paid'
    
    if (isPaid) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>
          Paid
        </span>
      )
    }

    const daysLeft = calculateDaysLeft(row.due_date, row.payment_window_days)

    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-500"></span>
          Overdue
        </span>
      )
    }

    if (daysLeft === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
          Due Today
        </span>
      )
    }

    const isPending = statusLower.includes('pending')
    if (isPending) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>
          Pending
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
        <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-500"></span>
        {row.status || 'Open'}
      </span>
    )
  }

  const totalPages = Math.ceil(displayRows.length / rowsPerPage)
  const total = useMemo(() => activeRows.reduce((sum, r) => sum + Number(r.amount || 0), 0), [activeRows])
  const stats = useMemo(() => {
    const completed = activeRows.filter(r => r.payment_completed_at || String(r.status || '').toLowerCase() === 'closed').length
    const pending = activeRows.filter(r => String(r.status || '').toLowerCase().includes('pending')).length
    const totalCount = activeRows.length
    return { totalCount, completed, pending }
  }, [activeRows])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setStatusMessage('')
      try {
        const res = await purchaseOrders.list(1, 100, true)
        if (res.ok) {
          if (Array.isArray(res.data?.items)) {
            setRows(res.data.items)
          } else if (Array.isArray(res.data)) {
            setRows(res.data)
          }
        } else {
          setStatusMessage(res.error?.message || res.error?.detail || String(res.error || 'Failed to load purchase orders.'))
        }
      } catch (err) {
        setStatusMessage('Network error loading purchase orders.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    async function fetchCred() {
      try {
        const cid = user?.company_id
        if (!cid) return
        const resp = await fetch(`/api/v1/credibility/${cid}`, { credentials: 'include' })
        if (resp.ok) {
          const j = await resp.json()
          if (j?.success && j.data) setCred(j.data)
        }
      } catch (err) { String(err) }
    }
    fetchCred()
    const onChanged = () => {
      fetchCred()
    }
    window.addEventListener('poChanged', onChanged)
    return () => window.removeEventListener('poChanged', onChanged)
  }, [user?.company_id])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusMessage('')
    if (!allowed) {
      setStatusMessage('Upgrade plan to add purchase orders.')
      return
    }
    if (!form.po_number || !form.vendor || !form.amount || !form.due_date) {
      setStatusMessage('Fill all required fields.')
      return
    }

    if (form.vendor_email && (!form.vendor_email.includes('@') || !form.vendor_email.includes('.'))) {
      setStatusMessage('Enter a valid vendor email address')
      return
    }
    if (form.vendor_phone) {
      const e164 = formatE164(form.vendor_phone)
      if (!e164) {
        setStatusMessage('Enter a valid vendor phone number (e.g., +91XXXXXXXXXX)')
        return
      }
    }

    const payload = {
      po_number: form.po_number.trim(),
      vendor: form.vendor.trim(),
      gstin: form.gstin ? form.gstin.trim().toUpperCase() : '',
      vendor_email: form.vendor_email?.trim() || '',
      vendor_phone: form.vendor_phone ? formatE164(form.vendor_phone) : '',
      amount: Number(form.amount),
      due_date: form.due_date,
      status: form.status,
      payment_window_days: parseInt(form.payment_window_days || 50),
    }

    setReasonModal({
      open: true,
      action: 'CREATE',
      po: { po_number: form.po_number },
      onConfirm: async (reason) => {
        setIsLoading(true)
        try {
          const res = await purchaseOrders.create({ ...payload, reason, file: poFile })
          if (!res.ok) {
            setStatusMessage(res.error || 'Failed to save PO')
            return
          }
          setLoading(true)
          const resList = await purchaseOrders.list(1, 100, true)
          if (resList.ok && Array.isArray(resList.data?.items)) {
            setRows(resList.data.items)
          } else if (resList.ok && Array.isArray(resList.data)) {
            setRows(resList.data)
          }
          setLoading(false)
          setForm({ po_number: '', vendor: '', gstin: '', vendor_email: '', vendor_phone: '', amount: '', due_date: '', status: 'open', payment_window_days: 50 })
          setPoFile(null)
          setStatusMessage('PO saved to backend successfully.')
          logActivity(ACTIONS.ADD_PO, { entity_type: 'PO', entity_id: form.po_number, details: `Added PO ${form.po_number} for vendor ${form.vendor}` })
          window.dispatchEvent(new Event('poChanged'))
        } catch (err) {
          setStatusMessage(err?.message || 'Failed to save PO')
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  const handleEdit = (po) => {
    if (isLocked(po)) {
      alert('Locked: Verified or approved Purchase Orders cannot be edited.')
      return
    }
    setEditingPO(po)
  }

  const handleSaveEdit = async (payload) => {
    const targetId = editingPO ? editingPO.id : editingRow;
    if (!targetId) return false;

    setRows((prev) => prev.map(r => r.id === targetId ? { ...r, ...payload } : r));

    const res = await purchaseOrders.update(targetId, payload)
    if (res.ok) {
      const resList = await purchaseOrders.list(1, 100, true)
      if (resList.ok && Array.isArray(resList.data?.items)) {
        setRows(resList.data.items)
      } else if (resList.ok && Array.isArray(resList.data)) {
        setRows(resList.data)
      }
      setStatusMessage('PO updated successfully.')
      window.dispatchEvent(new Event('poChanged'))
      setEditingRow(null)
      setEditingPO(null)
      return true
    } else {
      setStatusMessage(res.error || 'Failed to update PO')
      const resList = await purchaseOrders.list(1, 100, true)
      if (resList.ok && Array.isArray(resList.data?.items)) {
        setRows(resList.data.items)
      } else if (resList.ok && Array.isArray(resList.data)) {
        setRows(resList.data)
      }
      return false
    }
  }

  const handleDelete = (po) => {
    if (isLocked(po)) {
      alert('Locked: Verified or approved Purchase Orders cannot be deleted.')
      return
    }
    setReasonModal({
      open: true,
      action: 'DELETE',
      po: po,
      onConfirm: async (reason) => {
        setIsLoading(true)
        const res = await purchaseOrders.delete(po.id, { reason })
        setIsLoading(false)
        if (res.ok) {
          setRows((prev) => prev.filter(r => r.id !== po.id))
          setStatusMessage('PO deleted permanently.')
          logActivity(ACTIONS.DELETE_PO, { entity_type: 'PO', entity_id: po.po_number, details: `Deleted PO ${po.po_number}` })
          window.dispatchEvent(new Event('poChanged'))
        } else {
          setStatusMessage(res.error || 'Failed to delete PO')
        }
      }
    })
  }

  const handleArchive = async (po) => {
    setReasonModal({
      open: true,
      action: po.archived ? 'UNARCHIVE' : 'ARCHIVE',
      po: po,
      onConfirm: async (reason) => {
        const res = await purchaseOrders.archive(po.id, { reason })
        if (res.ok) {
          setRows((prev) => prev.map(r => r.id === po.id ? { ...r, archived: !r.archived } : r))
          setStatusMessage(po.archived ? 'PO restored from archive.' : 'PO archived.')
          window.dispatchEvent(new Event('poChanged'))
        } else {
          setStatusMessage(res.error || 'Failed to archive PO')
        }
      }
    })
  }

  const handleSendToLegal = async (po) => {
    if (!legalSupportReason.trim() || !legalSupportFile) {
      setStatusMessage('Please provide both a reason and evidence file');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await purchaseOrders.sendToLegal(po.id, legalSupportReason, legalSupportFile);
      if (res.ok) {
        setStatusMessage('Legal support request submitted successfully');
        setRows(prev => prev.map(r => r.id === po.id ? { ...r, legal_support_requested_at: new Date().toISOString(), legal_support_status: 'PENDING_LEGAL' } : r));
        setLegalSupportReason('');
        setLegalSupportFile(null);
      } else {
        setStatusMessage(res.error || 'Failed to submit legal support request');
      }
    } catch (err) {
      setStatusMessage('Network error submitting legal support request');
    } finally {
      setIsLoading(false);
      setShowLegalSupportConfirm(null);
    }
  };

  const handleSendReminder = (po) => {
    setReminderPO(po);
  }

  const handleConfirmReminder = async (payload) => {
    if (payload.include_legal_notice && !payload.confirmed) {
      setShowLegalNoticeConfirm({ po: reminderPO, payload });
      return false;
    }

    setIsLoading(true);
    const res = await sendPOReminder(reminderPO.id, payload)
    setIsLoading(false);

    if (res.ok) {
      logActivity(ACTIONS.SEND_REMINDER, { entity_type: 'PO', entity_id: reminderPO.po_number, details: `Sent reminder for PO ${reminderPO.po_number}` })
      if (payload.scheduled_at) {
        const dt = new Date(payload.scheduled_at).toLocaleString()
        setStatusMessage(`Reminder scheduled for ${dt}`)
      } else {
        setStatusMessage(payload.include_legal_notice ? 'Reminder with Legal Notice sent to vendor' : 'Reminder sent to vendor')
        if (payload.include_legal_notice) {
          const resList = await purchaseOrders.list(1, 100, true);
          if (resList.ok && Array.isArray(resList.data?.items)) {
            setRows(resList.data.items);
          } else if (resList.ok && Array.isArray(resList.data)) {
            setRows(resList.data);
          }
        }
      }
      return true
    } else {
      setStatusMessage(res.error || 'Failed to process reminder')
      return false
    }
  }

  const handleMarkPaid = async (po) => {
    setReasonModal({
      open: true,
      action: 'MARK_PAID',
      po: po,
      onConfirm: async (reason, file) => {
        setLoadingId(po.id)
        const res = await purchaseOrders.markPaid(po.id, reason, file)
        if (res.ok) {
          setStatusMessage('PO marked as paid.')
          setLoading(true)
          const resList = await purchaseOrders.list(1, 100, true)
          if (resList.ok && Array.isArray(resList.data?.items)) {
            setRows(resList.data.items)
          } else if (resList.ok && Array.isArray(resList.data)) {
            setRows(resList.data)
          }
          setLoading(false)
          setStatusMessage('PO marked as paid.')
          logActivity(ACTIONS.MARK_PO_PAID, { entity_type: 'PO', entity_id: po.po_number, details: `Marked PO ${po.po_number} as paid` })
          window.dispatchEvent(new Event('poChanged'))
        } else {
          setStatusMessage(res.error || 'Failed to mark as paid')
        }
        setLoadingId(null)
      }
    })
  }

  const handleImportComplete = async () => {
    setLoading(true)
    const res = await purchaseOrders.list(1, 100, true)
    if (res.ok && Array.isArray(res.data?.items)) {
      setRows(res.data.items)
    } else if (res.ok && Array.isArray(res.data)) {
      setRows(res.data)
    }
    setLoading(false)
    setStatusMessage('Import completed.')
    window.dispatchEvent(new Event('poChanged'))
  }

  const downloadTemplate = () => {
    const headers = [
      'PO #', 'Vendor', 'Email', 'Mobile', 'GSTIN', 'Amount', 'Due', 'Payment Window', 'Status'
    ]
    const example = [
      'PO-2026-01', 'Test Vendor', 'vendor@email.com', '9876543210', '22AAAAA0000A1Z5',
      '50000', '2026-04-01', '50', 'Open'
    ]
    const csv = [headers.join(','), example.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PO_Upload_Template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadPOsAsCSV = () => {
    const headers = ['PO #', 'Vendor', 'Email', 'Mobile', 'GSTIN', 'Amount', 'Due Date', 'Days Left', 'Status', 'Document URL']
    const rows = displayRows.map(row => [
      row.po_number,
      row.vendor,
      row.vendor_email || '',
      row.vendor_phone || '',
      row.gstin,
      `₹${Number(row.amount).toLocaleString('en-IN')}`,
      row.due_date?.slice(0, 10) || row.due_date,
      calculateDaysLeft(row.due_date, row.payment_window_days),
      row.status,
      row.document_url || ''
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'PurchaseOrders.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="py-6 md:py-8">
      {isLoading && <LoadingSpinner />}
      <div className="container-custom space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">PO Management</p>
              <h1 className="text-2xl font-heading font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-gray-600 max-w-3xl text-sm">Log and track purchase orders; attach documents for audit trails.</p>
            </div>
            <button
              onClick={downloadPOsAsCSV}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>📥</span> Download CSV
            </button>
          </div>
        </div>

        {/* Credibility Index Highlight */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-heading font-semibold text-amber-900">Business Credibility Index</h2>
                {cred && (
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${cred.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : cred.grade === 'B' ? 'bg-blue-100 text-blue-800' : cred.grade === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}
                    title="Grade reflects on-time payments and delays"
                  >
                    Grade {cred.grade}
                  </span>
                )}
              </div>
              <p className="text-amber-800/90 text-sm mt-1 max-w-2xl">
                A higher score indicates more consistent on‑time payments and lower credit risk.
              </p>
            </div>
            {cred && (
              <div className="flex items-center gap-2" title="Risk level derived from score and payment behavior">
                <span className="text-sm text-amber-800">Risk</span>
                <span className={`text-lg ${cred.risk_level === 'Low' ? 'text-emerald-600' : cred.risk_level === 'Medium' ? 'text-amber-600' : 'text-red-600'}`}>
                  {cred.risk_level === 'Low' ? '✅' : cred.risk_level === 'Medium' ? '⚠️' : '❌'}
                </span>
                <span className="text-sm font-medium text-amber-900">{cred.risk_level}</span>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-amber-800">Score</span>
              <span className="text-sm font-semibold text-amber-900">{cred?.score ?? '—'}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-amber-100 overflow-hidden">
              <div
                className={`h-full ${((cred?.score || 0) >= 70) ? 'bg-emerald-500' : ((cred?.score || 0) >= 40) ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, cred?.score || 0))}%` }}
              />
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-3 gap-3" title="Fulfillment stats from your active purchase orders">
            <div className="p-3 rounded-lg bg-white/60 border border-amber-100">
              <p className="text-xs text-amber-700">Total POs</p>
              <p className="font-semibold text-amber-900">{stats.totalCount}</p>
              <div className="h-1 mt-1 bg-amber-100 rounded">
                <div className="h-full bg-amber-400 rounded" style={{ width: `${stats.totalCount ? 100 : 0}%` }} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/60 border border-amber-100">
              <p className="text-xs text-amber-700">Completed POs</p>
              <p className="font-semibold text-emerald-700">{stats.completed}</p>
              <div className="h-1 mt-1 bg-emerald-100 rounded" title="Ratio of completed to total">
                <div className="h-full bg-emerald-500 rounded" style={{ width: `${stats.totalCount ? Math.round((stats.completed / stats.totalCount) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/60 border border-amber-100">
              <p className="text-xs text-amber-700">Pending POs</p>
              <p className="font-semibold text-amber-700">{stats.pending}</p>
              <div className="h-1 mt-1 bg-amber-100 rounded" title="Ratio of pending to total">
                <div className="h-full bg-amber-500 rounded" style={{ width: `${stats.totalCount ? Math.round((stats.pending / stats.totalCount) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="card flex-[2] shadow-sm rounded-xl overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-heading font-semibold text-gray-900">Open POs</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <button onClick={() => handleStatusFilterChange('')} className={`text-xs px-2.5 py-1 rounded-lg ${!statusFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
                  <button onClick={() => handleStatusFilterChange('Open')} className={`text-xs px-2.5 py-1 rounded-lg ${statusFilter === 'Open' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>Open</button>
                  <button onClick={() => handleStatusFilterChange('Pending')} className={`text-xs px-2.5 py-1 rounded-lg ${statusFilter === 'Pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700'}`}>Pending</button>
                  <button onClick={() => handleStatusFilterChange('Closed')} className={`text-xs px-2.5 py-1 rounded-lg ${statusFilter === 'Closed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>Closed</button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => handleShowArchivedChange(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  {' '}
                  Show Archived
                </label>
                <p className="text-sm text-gray-500">Total: ₹{total.toLocaleString('en-IN')}</p>
              </div>
            </div>
            {archivedRows.length > 0 && (
              <p className="text-xs text-gray-500 mb-3">{archivedRows.length} archived PO(s)</p>
            )}
            <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">PO #</th>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Document</th>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Vendor</th>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Email</th>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Mobile</th>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">GSTIN</th>
                    <th className="py-5 px-6 text-right text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Amount</th>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Due</th>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Days Left</th>
                    <th className="py-5 px-6 text-left text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Status</th>
                    <th className="py-5 px-6 text-right text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
                          <p className="text-sm font-medium">Loading orders...</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && displayRows.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl">📋</span>
                          <p className="text-sm font-medium">{showArchived ? 'No purchase orders yet.' : 'No active purchase orders.'}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {paginatedRows.map((row) => {
                    const statusLower = String(row.status || '').toLowerCase()
                    const isPending = statusLower.includes('pending')
                    const isPaid = row.payment_completed_at || statusLower === 'closed' || statusLower === 'paid'
                    const locked = isLocked(row)

                    return (
                      <tr 
                        key={row.id} 
                        className={`group transition-colors duration-150 even:bg-gray-50/30 hover:bg-blue-50/50 ${row.is_archived ? 'opacity-50 grayscale-[0.5]' : ''} ${isPending ? 'bg-amber-50/40' : ''}`}
                      >
                        <td className="py-5 px-6 whitespace-nowrap">
                          <span className="font-bold text-gray-900">{row.po_number}</span>
                          {row.legal_notice_sent_at && <span className="ml-2">⚖️</span>}
                          {row.is_verified && <span className="ml-1 text-xs text-emerald-600 font-bold" title="Verified PO">🔒</span>}
                        </td>
                        <td className="py-5 px-6 whitespace-nowrap">
                          {row.document_url ? (
                            <a
                              href={row.document_url.startsWith('http') ? row.document_url : `http://localhost:8000${row.document_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <span>📄</span> View
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-5 px-6">
                          <div className="text-sm font-medium text-gray-900">{row.vendor}</div>
                        </td>
                        <td className="py-5 px-6 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{(row.vendor_email || '').trim() ? row.vendor_email : '—'}</div>
                        </td>
                        <td className="py-5 px-6 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{(row.vendor_phone || '').trim() ? row.vendor_phone : '—'}</div>
                        </td>
                        <td className="py-5 px-6 whitespace-nowrap">
                          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200 text-gray-700">{row.gstin}</span>
                        </td>
                        <td className="py-5 px-6 text-right whitespace-nowrap">
                          <span className="font-semibold text-gray-900">₹{Number(row.amount).toLocaleString('en-IN')}</span>
                        </td>
                        <td className="py-5 px-6 whitespace-nowrap">
                          <span className="text-sm text-gray-600 font-medium">{row.due_date?.slice(0, 10) || row.due_date}</span>
                        </td>
                        <td className="py-5 px-6 whitespace-nowrap">
                          {getDaysLeftBadge(row)}
                        </td>
                        <td className="py-5 px-6 whitespace-nowrap">
                          {getStatusBadge(row)}
                        </td>
                        <td className="py-5 px-6 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            {loadingId === row.id ? (
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
                            ) : (
                              <>
                                <button
                                  onClick={() => handleMarkPaid(row)}
                                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors shadow-sm"
                                  title="Mark as paid"
                                >
                                  <span className="text-sm">✅</span>
                                </button>
                                {/* Edit Button with Lock Check */}
                                <button
                                  onClick={() => handleEdit(row)}
                                  disabled={locked}
                                  className={`p-1.5 rounded-lg transition-colors shadow-sm ${
                                    locked
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                                  }`}
                                  title={locked ? 'Locked: Verified POs cannot be edited' : 'Edit'}
                                >
                                  <span className="text-sm">✏️</span>
                                </button>
                                <button
                                  onClick={() => handleSendReminder(row)}
                                  disabled={isPaid}
                                  className={`p-1.5 rounded-lg transition-colors shadow-sm ${
                                    isPaid 
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50' 
                                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700'
                                  }`}
                                  title={isPaid ? 'Reminder not available for paid PO' : 'Send Reminder'}
                                >
                                  <span className="text-sm">📧</span>
                                </button>
                                <button
                                  onClick={() => handleArchive(row)}
                                  className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 transition-colors shadow-sm"
                                  title={row.archived ? 'Restore' : 'Archive'}
                                >
                                  <span className="text-sm">🗄️</span>
                                </button>
                                <button
                                  onClick={() => !isPaid && setShowLegalSupportConfirm(row)}
                                  disabled={isPaid}
                                  className={`p-1 transition-colors ${
                                    row.legal_support_requested_at 
                                      ? 'text-emerald-600' 
                                      : isPaid ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-indigo-600 opacity-60 hover:opacity-100'
                                  }`}
                                  style={{ background: 'none', border: 'none', cursor: isPaid ? 'not-allowed' : 'pointer', opacity: isPaid ? 0.3 : 1 }}
                                  title={isPaid ? 'Not available for paid POs' : 'Send to Legal Support'}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"> 
                                    <path d="M12 2L8 6H4v2l2 1-4 10h20L18 9l2-1V6h-4L12 2z"/> 
                                    <path d="M8 6l4 4 4-4"/> 
                                    <line x1="12" y1="10" x2="12" y2="20"/> 
                                  </svg> 
                                </button>
                                {/* Delete Button with Lock Check */}
                                <button
                                  onClick={() => handleDelete(row)}
                                  disabled={locked}
                                  className={`p-1.5 rounded-lg transition-colors shadow-sm ${
                                    locked
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                                  }`}
                                  title={locked ? 'Locked: Verified POs cannot be deleted' : 'Delete'}
                                >
                                  <span className="text-sm">🗑️</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-2">
                <p className="text-sm text-gray-500">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {!allowed && (
              <p className="text-xs text-amber-700 mt-3">Upgrade plan to manage purchase orders.</p>
            )}
          </div>

          <div className="card flex-[1] space-y-3 self-start sticky top-4 rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-gray-700">Add PO</h2>
                {!allowed && <span className="text-xs text-amber-700">Gated</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {allowed && (
                  <button
                    onClick={() => setShowCSVImport(true)}
                    className="flex-1 text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-1"
                  >
                    📥 Import POs
                  </button>
                )}
                <button 
                  onClick={downloadTemplate} 
                  className="flex-1 text-xs text-blue-600 border border-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors font-medium flex items-center justify-center gap-1" 
                > 
                  📄 Template 
                </button>
              </div>
            </div>
            {statusMessage && (
              <div className={`rounded-lg px-3 py-2 text-xs border ${String(statusMessage).toLowerCase().includes('success') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                {typeof statusMessage === 'object' ? (statusMessage.message || statusMessage.detail || JSON.stringify(statusMessage)) : String(statusMessage)}
              </div>
            )}
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="po_number"
                value={form.po_number || ''}
                onChange={handleChange}
                placeholder="PO Number"
                required
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="vendor"
                value={form.vendor || ''}
                onChange={handleChange}
                placeholder="Vendor Name"
                required
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="gstin"
                value={form.gstin || ''}
                onChange={handleChange}
                placeholder="Vendor GSTIN (optional)"
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                type="email"
                name="vendor_email"
                value={form.vendor_email || ''}
                onChange={handleChange}
                placeholder="Vendor Email ID"
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="vendor_phone"
                value={form.vendor_phone || ''}
                onChange={handleChange}
                placeholder="Vendor Mobile Number"
              />
              <div className="flex gap-3">
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  name="amount"
                  type="number"
                  value={form.amount || ''}
                  onChange={handleChange}
                  placeholder="Amount"
                  required
                />
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  name="due_date"
                  type="date"
                  value={form.due_date || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex gap-3">
                <input
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  name="payment_window_days"
                  type="number"
                  value={form.payment_window_days || ''}
                  onChange={handleChange}
                  placeholder="Payment Window (days)"
                  required
                />
              </div>
              <select
                name="status"
                value={form.status || 'Open'}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              >
                <option value="Open">Open</option>
                <option value="Pending Docs">Pending Docs</option>
                <option value="Closed">Closed</option>
              </select>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Document (optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setPoFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {poFile && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                    ✅ Selected: {poFile.name}
                  </div>
                )}
              </div>
              <button type="submit" className="btn-primary w-full" disabled={!allowed}>
                {allowed ? 'Save PO' : 'Upgrade to enable'}
              </button>
            </form>
          </div>
        </div>

        {editingPO && (
          <EditPOModal
            po={editingPO}
            onClose={() => setEditingPO(null)}
            onSave={handleSaveEdit}
          />
        )}

        {showLegalNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Legal Notice</h3>
              <textarea
                className="w-full h-64 rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 font-mono text-sm bg-gray-50"
                defaultValue={`LEGAL NOTICE\n\nTo: ${form.vendor || ''}\nRE: Outstanding Payment - PO ${form.po_number || ''}\n\nDear ${form.vendor || ''},\n\nThis is a formal legal notice that payment of ₹${form.amount || ''} for Purchase Order ${form.po_number || ''} due on ${form.due_date || ''} remains unpaid/pending.\n\nYou are required to clear this payment within 7 days of receiving this notice, failing which legal proceedings will be initiated without further notice.\n\nIssued by: ${user?.company_name || ''}\nDate: ${new Date().toLocaleDateString()}`}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    const ta = document.querySelector('textarea');
                    if (ta) navigator.clipboard.writeText(ta.value);
                  }}
                  className="btn-secondary"
                >
                  📋 Copy Notice
                </button>
                <button
                  onClick={() => {
                    setShowLegalNotice(false);
                    setStatusMessage('Save this PO first to send it via email.');
                  }}
                  className="btn-primary"
                >
                  📧 Send via Email
                </button>
                <button
                  onClick={() => setShowLegalNotice(false)}
                  className="flex-1 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ❌ Close
                </button>
              </div>
            </div>
          </div>
        )}

        {reminderPO && (
          <ReminderModal
            po={reminderPO}
            onClose={() => setReminderPO(null)}
            onSend={handleConfirmReminder}
          />
        )}

        {showCSVImport && (
          <CSVImportModal
            onClose={() => setShowCSVImport(false)}
            onImportComplete={handleImportComplete}
          />
        )}

        {/* Reason Modal */} 
        {reasonModal.open && ( 
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"> 
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl"> 
              <h3 className="text-lg font-bold text-gray-800 mb-1"> 
                ⚠️ Confirm {reasonModal.action} 
              </h3> 
              <p className="text-gray-500 text-sm mb-4"> 
                Action: <strong>{reasonModal.action}</strong> {reasonModal.po && <>on <strong>{reasonModal.po.po_number}</strong></>} 
              </p> 
              <label className="block text-sm font-medium text-gray-700 mb-2"> 
                Reason <span className="text-red-500">*</span> 
              </label> 
              <textarea 
                value={reasonText} 
                onChange={e => setReasonText(e.target.value)} 
                placeholder="Please enter a reason for this action..." 
                rows={3} 
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                autoFocus
              /> 
              {reasonModal.action === 'MARK_PAID' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Payment Receipt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setPaymentReceipt(e.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">Accepted formats: PDF, JPG, PNG</p>
                  {paymentReceipt && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                      ✅ Selected: {paymentReceipt.name}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 mt-4"> 
                <button 
                  onClick={() => { 
                    setReasonModal({ open: false }); 
                    setReasonText(''); 
                    setPaymentReceipt(null); 
                  }} 
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50" 
                > 
                  Cancel 
                </button> 
                <button 
                  onClick={() => { 
                    if (!reasonText.trim()) { alert('Please enter a reason'); return } 
                    if (reasonModal.action === 'MARK_PAID' && !paymentReceipt) { 
                      alert('Please upload a payment receipt'); 
                      return; 
                    } 
                    reasonModal.onConfirm(reasonText, paymentReceipt) 
                    setReasonModal({ open: false }) 
                    setReasonText('') 
                    setPaymentReceipt(null) 
                  }} 
                  disabled={!reasonText.trim() || (reasonModal.action === 'MARK_PAID' && !paymentReceipt)}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                    !reasonText.trim() || (reasonModal.action === 'MARK_PAID' && !paymentReceipt)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                > 
                  Confirm 
                </button> 
              </div> 
            </div> 
          </div> 
        )}

        {showLegalConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center">
              <div className="text-4xl mb-4">⚖️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Send Legal Notice?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to send a legal notice to:<br/>
                <strong>{showLegalConfirm.po.vendor} ({showLegalConfirm.po.vendor_email})</strong><br/><br/>
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLegalNoticeConfirm(null)}
                  className="flex-1 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmReminder({ ...showLegalConfirm.payload, confirmed: true })}
                  className="flex-1 px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium shadow-md"
                >
                  Yes, Send
                </button>
              </div>
            </div>
          </div>
        )}

        {showLegalSupportConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <div className="text-4xl mb-4 text-center">🏛️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Send to Legal Support Team?</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left text-sm space-y-1">
                <p><strong>PO:</strong> {showLegalSupportConfirm.po_number}</p>
                <p><strong>Vendor:</strong> {showLegalSupportConfirm.vendor}</p>
                <p><strong>Amount:</strong> ₹{showLegalSupportConfirm.amount}</p>
                <p><strong>Status:</strong> {showLegalSupportConfirm.status}</p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason/Note *
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={legalSupportReason}
                    onChange={(e) => setLegalSupportReason(e.target.value)}
                    placeholder="Why do you need legal support?"
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Evidence *
                    <span className="text-red-500 ml-1">*</span>
                    <span className="text-gray-400 text-xs ml-1">(PDF, JPG, PNG)</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setLegalSupportFile(e.target.files?.[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {legalSupportFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Selected: {legalSupportFile.name}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLegalSupportConfirm(null);
                    setLegalSupportReason('');
                    setLegalSupportFile(null);
                  }}
                  className="flex-1 px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSendToLegal(showLegalSupportConfirm)}
                  disabled={!legalSupportReason.trim() || !legalSupportFile}
                  className="flex-1 px-6 py-2 rounded-lg bg-[#1a237e] text-white hover:bg-[#0d1440] transition-colors font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send to Legal Team
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}