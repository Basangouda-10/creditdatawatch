import { useEffect, useState } from 'react'
import { settlements, drive } from '../services/api/apiClient'
import { useAuth } from '../state/authContext'

export default function Settlement() {
  const { canAccessFeature } = useAuth()
  const allowed = canAccessFeature('SETTLEMENT')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [caseRef, setCaseRef] = useState('')
  const [selectedSettlement, setSelectedSettlement] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [form, setForm] = useState({ file: null })
  const [editData, setEditData] = useState({
    case_reference: '',
    status: '',
    notes: '',
    documents_drive_folder: '',
  })

  useEffect(() => {
    fetchSettlements()
  }, [])

  const fetchSettlements = async () => {
    setLoading(true)
    const res = await settlements.list()
    if (res.ok && Array.isArray(res.data?.items)) setRows(res.data.items)
    else if (res.ok && Array.isArray(res.data)) setRows(res.data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allowed) {
      setMessage('Upgrade plan to record settlements.')
      return
    }
    if (!note.trim() || !caseRef.trim()) {
      setMessage('Add a case reference and note.')
      return
    }

    setUploading(true)
    let docUrl = ''
    try {
      if (form.file) {
        const fd = new FormData()
        fd.append('file', form.file)
        const upRes = await drive.upload(fd)
        if (upRes.ok) docUrl = upRes.data.webViewLink
        else throw new Error('Failed to upload document: ' + upRes.error)
      }
    } catch (err) {
      setUploading(false)
      setMessage(err.message)
      return
    }

    const payload = {
      case_reference: caseRef.trim(),
      status: 'open',
      notes: note.trim(),
      documents_drive_folder: docUrl,
    }
    setUploading(false)
    const res = await settlements.create(payload)
    if (!res.ok) {
      setMessage(res.error || 'Failed to record settlement')
      return
    }
    fetchSettlements()
    setMessage('Settlement recorded.')
    setNote('')
    setCaseRef('')
  }

  const handleViewSettlement = async (settlementId) => {
    const res = await settlements.get(settlementId)
    if (res.ok) {
      setSelectedSettlement(res.data)
      setEditData({
        case_reference: res.data.case_reference,
        status: res.data.status,
        notes: res.data.notes || '',
        documents_drive_folder: res.data.documents_drive_folder || '',
      })
      setShowDetailModal(true)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUploading(true)
    let docUrl = editData.documents_drive_folder

    try {
      if (editData.file) {
        const fd = new FormData()
        fd.append('file', editData.file)
        const upRes = await drive.upload(fd)
        if (upRes.ok) docUrl = upRes.data.webViewLink
        else throw new Error('Update upload failed: ' + upRes.error)
      }
    } catch (err) {
      setUploading(false)
      setMessage(err.message)
      return
    }

    const payload = { ...editData, documents_drive_folder: docUrl }
    delete payload.file // don't send file obj to API

    const res = await settlements.update(selectedSettlement.id, payload)

    setUploading(false)
    if (res.ok) {
      fetchSettlements()
      setShowDetailModal(false)
      setMessage('Settlement updated successfully')
    } else {
      setMessage(res.error || 'Failed to update settlement')
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'closed':
      case 'settled':
        return 'bg-green-100 text-green-800'
      case 'open':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <section className="py-6 md:py-8">
      <div className="container-custom space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Finalization</p>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Settlement & Closure</h1>
          <p className="text-gray-600 max-w-3xl text-sm">Track closing terms, acknowledgments, and documents. Client-only for now; backend will persist records.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2 space-y-4 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-heading font-semibold text-gray-700">Settlements</h2>
              {!allowed && <span className="text-xs text-amber-700">Gated</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Case Ref</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Notes</th>
                    <th className="py-2 pr-3">Updated</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-gray-500 py-4">Loading...</td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-gray-500 py-4">No settlements yet.</td>
                    </tr>
                  )}
                  {rows.map((row) => (
                    <tr key={row.id} className="text-gray-800 hover:bg-gray-50">
                      <td className="py-2 pr-3 font-semibold">{row.case_reference}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{row.notes?.substring(0, 50)}{row.notes?.length > 50 ? '...' : ''}</td>
                      <td className="py-2 pr-3">{row.updated_at?.slice(0, 10) || '—'}</td>
                      <td className="py-2">
                        <button
                          onClick={() => handleViewSettlement(row.id)}
                          className="text-blue-600 hover:text-blue-900 text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card p-4 space-y-3 shadow-sm rounded-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold text-gray-700">Add settlement</h2>
              {!allowed && <span className="text-xs text-amber-700">Gated</span>}
            </div>
            {message && (
              <div className={`rounded-lg px-3 py-2 text-xs border ${String(message).toLowerCase().includes('success') || String(message).toLowerCase().includes('recorded') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                {typeof message === 'object' ? (message.message || message.detail || JSON.stringify(message)) : message}
              </div>
            )}
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                value={caseRef}
                onChange={(e) => setCaseRef(e.target.value)}
                placeholder="Case reference"
                required
              />
              <textarea
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Settlement note"
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600">Settlement Document (PDF/ZIP)</label>
                <input
                  type="file"
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  onChange={(e) => setForm(prev => ({ ...prev, file: e.target.files[0] }))}
                />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={!allowed || uploading}>
                {(() => {
                  if (uploading) return 'Uploading...'
                  return allowed ? 'Record settlement' : 'Upgrade to record'
                })()}
              </button>
            </form>
            <p className="text-xs text-gray-500">Backend stores documents and acknowledgments.</p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Settlement Details</h2>
                  <p className="text-gray-600 mt-1">Case: {selectedSettlement.case_reference}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label htmlFor="case-reference" className="block text-sm font-medium text-gray-700 mb-1">
                    Case Reference
                  </label>
                  <input
                    id="case-reference"
                    type="text"
                    value={editData.case_reference}
                    onChange={(e) => setEditData({ ...editData, case_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="settlement-status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="settlement-status"
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="settled">Settled</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="settlement-notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="settlement-notes"
                    rows={4}
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="drive-folder" className="block text-sm font-medium text-gray-700 mb-1">
                    Drive Folder ID
                  </label>
                  <input
                    id="drive-folder"
                    type="text"
                    value={editData.documents_drive_folder}
                    onChange={(e) => setEditData({ ...editData, documents_drive_folder: e.target.value })}
                    placeholder="Document URL"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Document</label>
                  <input
                    type="file"
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    onChange={(e) => setEditData({ ...editData, file: e.target.files[0] })}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Settlement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Created: {selectedSettlement.created_at?.slice(0, 10) || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Last Updated: {selectedSettlement.updated_at?.slice(0, 10) || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
