import { useEffect, useState } from 'react'
import { creditReports } from '../services/api/apiClient'
import { isValidGstin } from '../utils/validation'
import { useAuth } from '../state/authContext'

export default function CreditReports() {
  const { canAccessFeature } = useAuth()
  const allowed = canAccessFeature('CREDIT_REPORTS')
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [form, setForm] = useState({ entity_name: '', entity_gstin: '', email: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const res = await creditReports.list()
    if (res.ok && Array.isArray(res.data?.items)) setReports(res.data.items)
    else if (res.ok && Array.isArray(res.data)) setReports(res.data)
    setLoading(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    if (!allowed) {
      setMessage('Upgrade plan to request credit reports.')
      return
    }
    if (form.entity_gstin && !isValidGstin(form.entity_gstin)) {
      setMessage('Enter a valid GSTIN, or leave it blank.')
      return
    }
    if (!form.entity_name || !form.email) {
      setMessage('Fill all required fields.')
      return
    }

    const payload = {
      entity_name: form.entity_name.trim(),
      entity_gstin: form.entity_gstin ? form.entity_gstin.trim().toUpperCase() : '',
      report_url: '',
    }

    const res = await creditReports.create(payload)
    if (!res.ok) {
      setMessage(res.error || 'Failed to request report')
      return
    }
    fetchReports()
    setForm({ entity_name: '', entity_gstin: '', email: '' })
    setMessage('Credit report requested successfully.')
  }

  const handleViewReport = async (reportId) => {
    const res = await creditReports.get(reportId)
    if (res.ok) {
      setSelectedReport(res.data)
      setShowDetailModal(true)
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'requested':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <section className="py-6 md:py-8">
      <div className="container-custom space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-gray-500">Credit intelligence</p>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Credit Reports</h1>
          <p className="text-gray-600 max-w-3xl text-sm">Request GST-linked credit reports and view statuses. This page is client-only; backend will fetch and cache reports.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-semibold text-gray-700">Recent reports</h2>
              {!allowed && <span className="text-xs text-amber-700">Gated</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Entity</th>
                    <th className="py-2 pr-3">GSTIN</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">Updated</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    <tr>
                      <td colSpan={6} className="py-3 text-center text-gray-500 py-4">Loading...</td>
                    </tr>
                  )}
                  {!loading && reports.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-3 text-center text-gray-500 py-4">No reports yet.</td>
                    </tr>
                  )}
                  {reports.map((r) => (
                    <tr key={r.id} className="text-gray-800 hover:bg-gray-50">
                      <td className="py-2 pr-3 font-semibold">{r.entity_name}</td>
                      <td className="py-2 pr-3">{r.entity_gstin}</td>
                      <td className="py-2 pr-3">{r.credit_score ?? '—'}</td>
                      <td className="py-2 pr-3">{r.last_updated?.slice(0, 10) || r.requested_at?.slice(0, 10) || '—'}</td>
                      <td className="py-2 pr-3">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(r.status)}`}>
                          {r.status || 'requested'}
                        </span>
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => handleViewReport(r.id)}
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
              <h2 className="text-lg font-heading font-semibold text-gray-700">Request report</h2>
              {!allowed && <span className="text-xs text-amber-700">Gated</span>}
            </div>
            {message && (() => {
              const msgText = typeof message === 'object' ? (message.message || message.detail || JSON.stringify(message)) : String(message);
              const isSuccess = msgText.toLowerCase().includes('success');
              return (
                <div className={`rounded-lg px-3 py-2 text-xs border ${isSuccess ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                  {msgText}
                </div>
              );
            })()}
            <form className="space-y-3" onSubmit={handleSubmit}>
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="entity_name"
                value={form.entity_name}
                onChange={handleChange}
                placeholder="Entity name"
                required
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                name="entity_gstin"
                value={form.entity_gstin}
                onChange={handleChange}
                placeholder="GSTIN (optional)"
              />
              <input
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Delivery email"
                required
              />
              <button type="submit" className="btn-primary w-full" disabled={!allowed}>
                {allowed ? 'Request report' : 'Upgrade to request'}
              </button>
            </form>
            <p className="text-xs text-gray-500">Backend delivers PDFs and status updates.</p>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedReport.entity_name}</h2>
                  <p className="text-gray-600 mt-1">GSTIN: {selectedReport.entity_gstin}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Credit Score</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedReport.credit_score || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested</p>
                  <p className="text-sm font-semibold">{selectedReport.requested_at?.slice(0, 10) || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-sm font-semibold">{selectedReport.last_updated?.slice(0, 10) || 'N/A'}</p>
                </div>
              </div>

              {selectedReport.report_url && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">Report Document</p>
                  <a
                    href={selectedReport.report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Report
                  </a>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
