import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/authContext'
import { api } from '../services/api/apiClient'

export default function UserProfile() {
  const { userId } = useParams()
  const { token: _token } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [pos, setPOs] = useState([])
  const [credibility, setCredibility] = useState(null)
  const [activityLog, setActivityLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    loadAll()
  }, [userId])

  const loadAll = async () => {
    setLoading(true)
    
    try {
      const [profileRes, posRes, credRes, logRes] = await Promise.all([
        api.get(`/admin/users/${userId}`),
        api.get(`/admin/users/${userId}/pos`),
        api.get(`/admin/users/${userId}/credibility`),
        api.get(`/admin/users/${userId}/activity`)
      ])

      if (profileRes.ok) {
        setProfile(profileRes.data)
      }

      if (posRes.ok) {
        setPOs(posRes.data || [])
      }

      if (credRes.ok) {
        setCredibility(credRes.data)
      }

      if (logRes.ok) {
        setActivityLog(logRes.data || [])
      }

    } catch(e) {
      console.error('Failed to load user profile:', e)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">⏳</div>
        <p className="text-gray-500">Loading user profile...</p>
      </div>
    </div>
  )

  if (!profile) return (
    <div className="p-8 text-center text-gray-500">
      User not found
    </div>
  )

  const ROLE_COLORS = {
    MASTER_ADMIN: 'bg-purple-100 text-purple-700',
    OPERATIONS: 'bg-blue-100 text-blue-700',
    FINANCIAL: 'bg-green-100 text-green-700',
    LEGAL: 'bg-red-100 text-red-700',
    COMPANY_ADMIN: 'bg-orange-100 text-orange-700',
    USER: 'bg-gray-100 text-gray-700',
  }

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'pos', label: `📋 POs (${pos.length})` },
    { id: 'credibility', label: '⭐ Credibility' },
    { id: 'activity', label: `📜 Activity (${activityLog.length})` },
  ]

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm"
      >
        ← Back to User Management
      </button>

      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
              {(profile.name || profile.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.name || 'Unknown'}
              </h1>
              <p className="text-gray-500">{profile.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${ROLE_COLORS[profile.role] || 'bg-gray-100 text-gray-700'}`}>
                  {profile.role}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  profile.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  profile.subscription_status === 'ACTIVE'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {profile.subscription_status || 'No Subscription'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{pos.length}</p>
              <p className="text-xs text-gray-500">Total POs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {pos.filter(p => p.status === 'Closed').length}
              </p>
              <p className="text-xs text-gray-500">Paid</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {pos.filter(p => p.status === 'open').length}
              </p>
              <p className="text-xs text-gray-500">Open</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-bold text-lg mb-4">Complete Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Full Name', value: profile.name },
              { label: 'Email', value: profile.email },
              { label: 'Role', value: profile.role },
              { label: 'GSTIN', value: profile.gstin || '—' },
              { label: 'Company', value: profile.company_name || '—' },
              { label: 'Phone', value: profile.phone || '—' },
              { label: 'Status', value: profile.status || '—' },
              { label: 'Subscription', value: profile.subscription_status || 'INACTIVE' },
              { label: 'Member Since', value: profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN') : '—' },
              { label: 'Last Updated', value: profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-IN') : '—' },
            ].map(item => (
              <div key={item.label} className="border rounded-lg p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
                <p className="font-medium text-gray-800 mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pos' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Purchase Orders</h2>
          </div>
          {pos.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>No purchase orders found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold text-gray-600">PO #</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Vendor</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Due Date</th>
                  <th className="text-left p-3 font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pos.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-blue-600">{po.po_number}</td>
                    <td className="p-3">{po.vendor}</td>
                    <td className="p-3 font-semibold">₹{Number(po.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-gray-500">
                      {po.due_date ? new Date(po.due_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        po.status === 'Closed' ? 'bg-green-100 text-green-700' :
                        po.status === 'open' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {po.status === 'Closed' ? 'Paid' : po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'credibility' && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-bold text-lg mb-4">Credibility Score</h2>
          {credibility ? (
            <div className="space-y-4">
              <div className="flex items-center gap-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ${
                  credibility.score >= 80 ? 'bg-green-500' :
                  credibility.score >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {credibility.score || 0}
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900">Grade: {credibility.grade}</p>
                  <p className="text-gray-500">Risk Level: {credibility.risk_level}</p>
                  <div className="flex gap-1 mt-1">
                    {[1,2,3,4,5].map(star => (
                      <span key={star} className={star <= (credibility.stars || 0) ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                {[
                  { label: 'Total POs', value: credibility.total_pos || 0 },
                  { label: 'Paid on Time', value: credibility.paid_on_time || 0 },
                  { label: 'Unpaid', value: credibility.unpaid || 0 },
                  { label: 'Avg Delay', value: `${credibility.avg_delay_days || 0} days` },
                ].map(m => (
                  <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                    <p className="text-xs text-gray-500">{m.label}</p>
                  </div>
                ))}
              </div>

              {credibility.ai_summary && (
                <div className="bg-blue-50 rounded-lg p-4 mt-3">
                  <p className="text-sm font-medium text-blue-800">🤖 AI Summary</p>
                  <p className="text-sm text-blue-700 mt-1">{credibility.ai_summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">📊</div>
              <p>No credibility data available</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg">Activity Log</h2>
          </div>
          {activityLog.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">📜</div>
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {activityLog.map(log => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold mr-2 ${
                        (() => {
                          if (log.action?.includes('DELETE')) return 'bg-red-100 text-red-700'
                          if (log.action?.includes('CREATE')) return 'bg-green-100 text-green-700'
                          if (log.action?.includes('UPDATE')) return 'bg-blue-100 text-blue-700'
                          return 'bg-gray-100 text-gray-700'
                        })()
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-600">
                        {log.po_number && `PO: ${log.po_number}`}
                        {log.vendor_name && ` | Vendor: ${log.vendor_name}`}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : ''}
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-xs text-gray-500 mt-1 ml-1">Reason: {log.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
