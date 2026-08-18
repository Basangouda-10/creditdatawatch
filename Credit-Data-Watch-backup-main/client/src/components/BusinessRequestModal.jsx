import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useAuth } from '../state/authContext'
import { businessCheck, credibilityIndex } from '../services/api/apiClient'

export default function BusinessRequestModal({ onClose, onSuccess }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('new') // 'new' or 'my'
  const [form, setForm] = useState({
    company_name: '',
    gstin: '',
    reason: '',
    additional_info: '',
    company_registration_no: ''
  })
  const [loading, setLoading] = useState(false)
  const [myRequests, setMyRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadMyRequests = async () => {
    setRequestsLoading(true)
    try {
      await businessCheck.getMy().then(res => {
        if (res.ok) {
          setMyRequests(res.data || [])
        }
      })
    } catch(e) {
      console.error("Failed to load business requests:", e)
    }
    setRequestsLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'my') {
      loadMyRequests()
    }
  }, [activeTab])

  const handleSubmit = async () => {
    if (!form.company_name || !form.gstin) {
      setError('Company name and GSTIN are required')
      return
    }
    setLoading(true)
    setError(null)
    
    try {
      const payload = {
        company_name: form.company_name,
        gstin: form.gstin,
        reason: form.reason,
        additional_info: form.additional_info
      }
      const res = await businessCheck.create(payload)
      
      // If we reach here without throwing an error, assume success
      onSuccess?.()
      setForm({ company_name: '', gstin: '', reason: '', additional_info: '', company_registration_no: '' })
      setActiveTab('my')
      alert('✅ Request submitted! Operations team will review and send you a report.')
      
    } catch(e) {
      console.error('Business request error:', e)
      setError('Connection failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            🏢 Company Safety Check
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Request a new check or view your existing requests and reports.
          </p>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'new' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              New Request
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'my' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              My Requests
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'new' && (
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={e => setForm({...form, company_name: e.target.value})}
                  placeholder="e.g. ABC Solutions Pvt Ltd"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company GSTIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={e => setForm({...form, gstin: e.target.value.toUpperCase()})}
                  placeholder="e.g. 22AAAAD0000A1Z5"
                  maxLength={15}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Registration Number (CIN) (Optional)
                </label>
                <input
                  type="text"
                  value={form.company_registration_no}
                  onChange={e => setForm({...form, company_registration_no: e.target.value})}
                  placeholder="e.g. U01234XX2020PTC123456"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to know? (Optional)
                </label>
                <select
                  value={form.reason}
                  onChange={e => setForm({...form, reason: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select reason...</option>
                  <option value="new_vendor">Considering as new vendor</option>
                  <option value="large_order">Planning large purchase order</option>
                  <option value="partnership">Potential business partnership</option>
                  <option value="credit_check">Credit worthiness check</option>
                  <option value="due_diligence">Due diligence before contract</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Information (Optional)
                </label>
                <textarea
                  value={form.additional_info}
                  onChange={e => setForm({...form, additional_info: e.target.value})}
                  placeholder="Any specific concerns or questions about this company..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-800">📋 What happens next:</p>
                <ol className="text-xs text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                  <li>Your request goes to Operations team</li>
                  <li>They review the company's business history</li>
                  <li>A detailed PDF report is generated</li>
                  <li>You receive it in your notifications + email</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'my' && (
            <div className="space-y-4">
              {requestsLoading && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Loading your requests...
                </div>
              )}

              {!requestsLoading && myRequests.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm text-gray-500">No business check requests yet</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Request a Check
                  </button>
                </div>
              )}

              {!requestsLoading && myRequests.length > 0 && (
                <div className="space-y-4">
                  {myRequests.map((req) => (
                    <div key={req.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{req.company_name}</h3>
                          <p className="text-xs text-gray-500 mt-1">GSTIN: {req.gstin}</p>
                          <p className="text-xs text-gray-400 mt-1">Requested: {new Date(req.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            req.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {req.verdict && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm font-bold text-blue-800 mb-2">
                            Verdict: {req.verdict}
                          </p>
                          {req.report_text && (
                            <p className="text-xs text-blue-700 mb-3 line-clamp-3">{req.report_text}</p>
                          )}
                          {req.report_url && (
                            <a
                              href={req.report_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              📄 Download Report
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Close
          </button>
          {activeTab === 'new' && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Submitting...' : '🔍 Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

BusinessRequestModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
}
