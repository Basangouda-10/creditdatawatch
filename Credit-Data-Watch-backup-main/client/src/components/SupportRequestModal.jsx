import { useState, useEffect } from 'react'
import { useAuth } from '../state/authContext'
import { supportRequests } from '../services/api/apiClient'

export default function SupportRequestModal({ onClose, onSuccess }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('new') // 'new' or 'my'
  const [form, setForm] = useState({
    request_type: 'General',
    request_details: ''
  })
  const [loading, setLoading] = useState(false)
  const [myRequests, setMyRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadMyRequests = async () => {
    setRequestsLoading(true)
    try {
      const res = await supportRequests.getMy()
      if (res.ok) {
        setMyRequests(res.data || [])
      }
    } catch(e) {
      console.error("Failed to load support requests:", e)
    }
    setRequestsLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'my') {
      loadMyRequests()
    }
  }, [activeTab])

  const handleSubmit = async () => {
    if (!form.request_details) {
      setError('Request details are required')
      return
    }
    setLoading(true)
    setError(null)
    
    try {
      const payload = {
        request_type: form.request_type,
        request_details: form.request_details
      }
      const res = await supportRequests.create(payload)
      
      onSuccess?.()
      setForm({ request_type: 'General', request_details: '' })
      setActiveTab('my')
      alert('✅ Support request submitted successfully! We will get back to you soon.')
      
    } catch(e) {
      console.error('Support request error:', e)
      setError('Connection failed. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            📋 Support & Additional Requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Submit a new support request or view your existing requests.
          </p>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'new' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              New Request
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'my' 
                  ? 'bg-purple-600 text-white' 
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
                  Request Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.request_type}
                  onChange={e => setForm({...form, request_type: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="General">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Billing">Billing / Payment</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Account Issue">Account Issue</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.request_details}
                  onChange={e => setForm({...form, request_details: e.target.value})}
                  placeholder="Describe your request or issue in detail..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
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
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-sm text-gray-500">No support requests yet</p>
                  <button
                    onClick={() => setActiveTab('new')}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Submit a Request
                  </button>
                </div>
              )}

              {!requestsLoading && myRequests.length > 0 && (
                <div className="space-y-4">
                  {myRequests.map((req) => (
                    <div key={req.id} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{req.request_type}</h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              req.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                              req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{req.request_details}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Submitted: {req.created_at ? new Date(req.created_at).toLocaleString('en-IN') : ''}
                          </p>
                        </div>
                      </div>

                      {req.admin_response && (
                        <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <p className="text-sm font-bold text-purple-800 mb-2">
                            Admin Response
                          </p>
                          <p className="text-sm text-purple-700">{req.admin_response}</p>
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
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '⏳ Submitting...' : '📋 Submit Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
