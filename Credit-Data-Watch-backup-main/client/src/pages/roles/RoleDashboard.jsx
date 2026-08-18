import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../state/authContext'
import { api, adminApi } from '../../services/api/apiClient'
import RoleToggleSection from '../../components/RoleToggleSection'
import CreateUserForm from '../../components/CreateUserForm'

export default function RoleDashboard() {
  const { user, token } = useAuth()
  const [tasks, setTasks] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [selectedBizRequest, setSelectedBizRequest] = useState(null)
  const [reportText, setReportText] = useState('')
  const [verdict, setVerdict] = useState('NEUTRAL')
  const [saveToNetwork, setSaveToNetwork] = useState({})
  const [activeNav, setActiveNav] = useState('role-toggle')
  const [companies, setCompanies] = useState([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [companySearch, setCompanySearch] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [companyDetails, setCompanyDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
    
  const handleMasterBusinessCheck = async (id, action, shouldSaveToNetwork) => {
    try {
      const endpoint = action === 'approve' 
        ? `/business-check/${id}/master-approve`
        : `/business-check/${id}/reject`
      
      const res = await api.post(endpoint, {
        save_to_network: shouldSaveToNetwork,
        notes: action === 'approve' 
          ? 'Approved by Master Admin' 
          : prompt('Reason for rejection:')
      })
      
      if (res.ok) {
        fetchTasks()
        alert(action === 'approve' 
          ? `✅ Approved! Report sent to user. ${shouldSaveToNetwork ? 'Company saved to Network Trust Intelligence.' : ''}`
          : '❌ Rejected and user notified.'
        )
      } else {
        alert(res.error || 'Action failed')
      }
    } catch (err) {
      alert('Action failed')
    }
  }

  const role = String(user?.role || '').toUpperCase()
  const isMaster = role === 'MASTER_ADMIN'
  const isOps = role === 'OPERATION' || role === 'OPERATIONS'
  const isFin = role === 'FINANCIAL' || role === 'FINANCE'
  const isLegal = role === 'LEGAL'

  useEffect(() => {
    fetchTasks()
    loadCompanies()
    let timer = null
    // Only refresh tasks every 10 seconds if NOT on create-user page
    if (activeNav !== 'create-user') {
      timer = setInterval(fetchTasks, 10000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [activeNav])

  const fetchTasks = async () => {
    try {
      const res = await api.get('/workflow/my-tasks')
      console.log("📡 API response for /workflow/my-tasks:", res)
      if (res.ok) {
        const newTasks = res.data || {}
        setTasks(newTasks)
        console.log("📦 Tasks set to state:", newTasks)
      }
    } catch(e) {
      console.error('Failed to fetch tasks:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanies = async () => {
    setCompaniesLoading(true)
    try {
      const res = await adminApi.listCompanies()
      if (res.ok && Array.isArray(res.data)) {
        setCompanies(res.data)
      }
    } catch (e) {
      console.error('Failed to load companies:', e)
    } finally {
      setCompaniesLoading(false)
    }
  }

  const loadCompanyDetails = async (companyId) => {
    setLoadingDetails(true)
    try {
      const res = await adminApi.getCompanyDetails(companyId)
      if (res.ok) {
        setCompanyDetails(res.data)
      }
    } catch (e) {
      console.error('Failed to load company details:', e)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleCompanyClick = (company) => {
    setSelectedCompany(company)
    loadCompanyDetails(company.id)
  }

  const handleBack = () => {
    setSelectedCompany(null)
    setCompanyDetails(null)
  }

  const filteredCompanies = companies.filter(company =>
    (company.company_name?.toLowerCase() || '').includes(companySearch.toLowerCase()) ||
    (company.gstin?.toLowerCase() || '').includes(companySearch.toLowerCase())
  )

  const doAction = async (endpoint, body, successMsg) => {
    setProcessing(endpoint)
    try {
      const res = await api.post(endpoint, body)
      if (res.ok) {
        alert(`✅ ${successMsg || res.message || 'Done!'}`)
        fetchTasks()
      } else {
        alert(`❌ ${res.error || res.message || 'Action failed'}`)
      }
    } catch(e) {
      alert('Connection error')
    }
    setProcessing(null)
  }

  const getRejectReason = () => {
    const r = prompt('Reason for rejection (required):')
    return r || null
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-3">⚙️</div>
        <p className="text-gray-500">Loading your tasks...</p>
      </div>
    </div>
  )

  // Show disabled screen for Financial/Legal when role is OFF
  if (tasks.role_disabled) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-8xl mb-6">🔒</div>
          <h2 className="text-2xl font-black text-gray-800 mb-3">
            {tasks.role_disabled_title || 'Role Currently Disabled'}
          </h2>
          <p className="text-gray-500 leading-relaxed">
            {tasks.role_disabled_message || 'This role has been temporarily disabled by Master Admin.'}
          </p>
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-700 text-sm font-medium">
              ⚠️ Your tasks are being handled by the Operations team until this role is re-enabled.
            </p>
          </div>
          <p className="text-gray-400 text-xs mt-4">
            Contact your Master Admin for assistance.
          </p>
        </div>
      </div>
    )
  }

  const Section = ({ title, icon, children, count, color = "blue", subtitle }) => {
    const colorClasses = {
      blue: "border-l-blue-500",
      red: "border-l-red-500",
      amber: "border-l-amber-500",
      purple: "border-l-purple-500",
      green: "border-l-green-500",
      indigo: "border-l-indigo-500",
      gray: "border-l-gray-500"
    }
    
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 hover:shadow-md transition-shadow duration-300 border-l-4 ${colorClasses[color] || colorClasses.gray}`}>
        <div className={`px-6 py-5 border-b bg-gradient-to-r from-${color}-50 to-white flex justify-between items-center`}>
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-extrabold text-gray-800 flex items-center gap-2">
              <span className="text-xl">{icon}</span> {title}
            </h2>
            {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          </div>
          {count !== undefined && (
            <span className={`bg-gradient-to-r from-${color}-500 to-${color}-600 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-sm`}>
              {count}
            </span>
          )}
        </div>
        <div 
          data-section-scroll 
          className="bg-gray-50/30"
          style={{ 
            maxHeight: '400px', 
            overflowY: 'auto', 
            overflowX: 'hidden' 
          }} 
        > 
          {children} 
        </div>
      </div>
    )
  }

  const Empty = ({ msg }) => (
    <div className="p-8 text-center text-gray-400 text-sm">
      <div className="text-3xl mb-2">✅</div>
      {msg || "No pending items"}
    </div>
  )

  const ApproveRejectBtns = ({ onApprove, onReject, approveLabel, rejectLabel }) => (
    <div className="flex gap-3 flex-shrink-0">
      <button onClick={onApprove} disabled={!!processing}
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-extrabold disabled:opacity-50 shadow-sm">
        {approveLabel || "✅ Approve"}
      </button>
      <button onClick={onReject} disabled={!!processing}
        className="bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 px-5 py-2.5 rounded-xl text-xs font-extrabold disabled:opacity-50">
        {rejectLabel || "❌ Reject"}
      </button>
    </div>
  )

  const CompanyCardsList = () => (
    <div className="p-5 space-y-4">
      {/* Search input */}
      <input
        type="text"
        placeholder="Search companies by name or GSTIN..."
        value={companySearch}
        onChange={(e) => setCompanySearch(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
      />
      
      {/* Loading state */}
      {companiesLoading && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Loading companies...
        </div>
      )}
      
      {/* Empty state */}
      {!companiesLoading && companies.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No companies found
        </div>
      )}
      
      {/* No search results */}
      {!companiesLoading && companies.length > 0 && filteredCompanies.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No results for your search
        </div>
      )}
      
      {/* Company cards */}
      {!companiesLoading && filteredCompanies.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filteredCompanies.map(company => (
            <div
              key={company.id}
              onClick={() => handleCompanyClick(company)}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
            >
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{company.company_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">GSTIN: {company.gstin}</p>
                  <div className="flex gap-4 text-sm text-gray-500 mb-2">
                    <span>👥 {company.user_count} Users</span>
                    <span>📦 {company.po_count} POs</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Registered: {company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${company.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {company.is_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const CompanyDetailsView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
        >
          ← Back to Companies
        </button>
        <h1 className="text-3xl font-black text-gray-900">
          {companyDetails?.company?.company_name || selectedCompany.company_name}
        </h1>
      </div>
      
      {loadingDetails ? (
        <div className="text-center py-10 text-gray-500">Loading company details...</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Company Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold mb-4">Company Info</h3>
              <div className="space-y-2">
                <p><strong>Name:</strong> {companyDetails?.company?.company_name}</p>
                <p><strong>GSTIN:</strong> {companyDetails?.company?.gstin}</p>
                <p><strong>Domain:</strong> {companyDetails?.company?.domain_name}</p>
                <p><strong>Status:</strong> {companyDetails?.company?.is_verified ? 'Verified' : 'Unverified'}</p>
                <p><strong>Registered on:</strong> {companyDetails?.company?.created_at ? new Date(companyDetails.company.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>

            {/* Credibility */}
            {companyDetails?.credibility && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold mb-4">Credibility</h3>
                <div className="space-y-2">
                  <p><strong>Score:</strong> {companyDetails.credibility.score}</p>
                  <p><strong>Grade:</strong> {companyDetails.credibility.grade}</p>
                  <p><strong>Risk Level:</strong> {companyDetails.credibility.risk_level}</p>
                  <p><strong>Total POs:</strong> {companyDetails.credibility.total_pos}</p>
                  <p><strong>Paid on time:</strong> {companyDetails.credibility.paid_on_time}</p>
                  <p><strong>Unpaid:</strong> {companyDetails.credibility.unpaid}</p>
                </div>
              </div>
            )}
          </div>

          {/* Users and POs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold mb-4">Users ({companyDetails?.users?.length || 0})</h3>
              {companyDetails?.users?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b">
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Role</th>
                        <th className="py-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {companyDetails.users.map(user => (
                        <tr key={user.id} className="text-gray-800">
                          <td className="py-2 pr-3">{user.name || user.email}</td>
                          <td className="py-2 pr-3">{user.email}</td>
                          <td className="py-2 pr-3">{user.role}</td>
                          <td className="py-2 pr-3">{user.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No users found</p>
              )}
            </div>

            {/* POs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold mb-4">Purchase Orders ({companyDetails?.purchase_orders?.length || 0})</h3>
              {companyDetails?.purchase_orders?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-600 border-b">
                        <th className="py-2 pr-3">PO Number</th>
                        <th className="py-2 pr-3">Vendor</th>
                        <th className="py-2 pr-3">Amount</th>
                        <th className="py-2 pr-3">Due Date</th>
                        <th className="py-2 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {companyDetails.purchase_orders.map(po => (
                        <tr key={po.id} className="text-gray-800">
                          <td className="py-2 pr-3">{po.po_number}</td>
                          <td className="py-2 pr-3">{po.vendor}</td>
                          <td className="py-2 pr-3">₹{Number(po.amount).toLocaleString()}</td>
                          <td className="py-2 pr-3">{po.due_date ? new Date(po.due_date).toLocaleDateString() : 'N/A'}</td>
                          <td className="py-2 pr-3">{po.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">No purchase orders found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ══════════════════════════════════════════════
  // FINANCIAL DASHBOARD (when enabled)
  // ══════════════════════════════════════════════
  if (isFin) {
    if (selectedCompany) {
      return <CompanyDetailsView />
    }
    return (
      <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg">
        <h1 className="text-3xl font-black text-white flex items-center gap-2">💰 Financial Team Dashboard</h1>
        <p className="text-sm text-blue-100 mt-2">Handle subscription payment verifications and forward to Master Admin</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
          <span className="text-white font-bold text-sm">Pending Subscriptions:</span>
          <span className="bg-white text-blue-600 font-black text-lg px-3 py-1 rounded-full">{tasks.pending_subscriptions?.length || 0}</span>
        </div>
      </div>

      {/* 1. Subscription Requests */}
      <Section title="Subscription Requests" icon="💳"
        count={tasks.pending_subscriptions?.length}
        subtitle="Verify subscription payments and forward to Master Admin"
        color="blue">
        {!tasks.pending_subscriptions?.length ? <Empty /> :
          tasks.pending_subscriptions.map(sub => (
            <div key={sub.workflow_id} className="p-6 border-b border-gray-200 flex justify-between items-start flex-wrap gap-4 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1">
                <p className="font-extrabold text-gray-900 text-lg">{sub.company_name}</p>
                <p className="text-base text-gray-700 mt-1">{sub.plan_name} — <span className="font-black text-blue-700">₹{Number(sub.amount).toLocaleString('en-IN')}</span></p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <span>📧</span> {sub.user_email}
                </p>
              </div>
              <ApproveRejectBtns
                approveLabel="✅ Verify & Forward to Master"
                onApprove={() => doAction(
                  `/workflow/subscription/${sub.workflow_id}/operations-approve`,
                  { notes: 'Payment verified by Financial team' },
                  'Sent to Master Admin for final approval!'
                )}
                onReject={() => {
                  const r = getRejectReason()
                  if (r) doAction(`/workflow/subscription/${sub.workflow_id}/reject`, { reason: r }, 'Subscription rejected')
                }}
              />
            </div>
          ))
        }
      </Section>

      {/* User Management */}
      <Section title="User Management" icon="👥" color="blue"
        subtitle="View all registered companies">
        <CompanyCardsList />
      </Section>

      <Section title="Activity Logs" icon="📋" color="gray"
        subtitle="View all system activity">
        <div className="p-5">
          <Link to="/admin/activity" className="text-blue-600 hover:underline text-sm">
            → View Activity Logs
          </Link>
        </div>
      </Section>
    </div>
    )
  }

  // ══════════════════════════════════════════════
  // LEGAL DASHBOARD (when enabled)
  // ══════════════════════════════════════════════
  if (isLegal) {
    if (selectedCompany) {
      return <CompanyDetailsView />
    }
    return ( 
      <div className="space-y-6"> 
      <div className="bg-gradient-to-r from-red-600 to-rose-700 p-6 rounded-2xl text-white shadow-lg"> 
        <h1 className="text-3xl font-black text-white flex items-center gap-2">⚖️ Legal Team Dashboard</h1> 
        <p className="text-sm text-red-100 mt-2"> 
          Handle legal support requests from users 
        </p> 
        <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
          <span className="text-white font-bold text-sm">Pending Legal Requests:</span>
          <span className="bg-white text-red-600 font-black text-lg px-3 py-1 rounded-full">{tasks.legal_support_requests?.length || 0}</span>
        </div>
      </div> 

      {/* Legal Support Requests from users */} 
      <Section 
        title="Legal Notice Requests" 
        icon="⚖️" 
        count={tasks.legal_support_requests?.length || 0} 
        subtitle="Legal support requests sent by users on overdue POs" 
        color="red" 
      > 
        {!tasks.legal_support_requests?.length ? ( 
          <div className="p-8 text-center text-gray-400"> 
            <div className="text-4xl mb-2">✅</div> 
            <p>No pending legal support requests</p> 
          </div> 
        ) : ( 
          tasks.legal_support_requests.map(req => ( 
            <div key={req.id} 
              className="p-6 border-b border-gray-200 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow"
            > 
              <div className="flex justify-between items-start flex-wrap gap-4"> 
                <div className="flex-1"> 
                  <div className="flex items-center gap-3 mb-2"> 
                    <span className="font-mono font-black text-gray-900 text-lg"> 
                      {req.po_number} 
                    </span> 
                    <span className="text-xs bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 rounded-full font-black"> 
                      Legal Notice Request
                    </span> 
                  </div> 
                  <p className="text-sm text-gray-700"> 
                    Vendor: <span className="font-extrabold">{req.vendor}</span> 
                  </p> 
                  <p className="text-lg font-black text-red-700 mt-1"> 
                    ₹{Number(req.amount || 0).toLocaleString('en-IN')} 
                  </p> 
                  {req.legal_support_reason && (
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-extrabold">Reason:</span> {req.legal_support_reason}
                    </p>
                  )}
                  {req.legal_support_evidence_url && (
                    <a 
                      href={req.legal_support_evidence_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-700 underline text-sm mt-2 block flex items-center gap-1"
                    >
                      📎 View Evidence: {req.legal_support_evidence_filename || 'Document'}
                    </a>
                  )}
                  {req.due_date && ( 
                    <p className="text-xs text-gray-500 mt-2"> 
                      Due Date: {new Date(req.due_date).toLocaleDateString('en-IN')} 
                    </p> 
                  )} 
                  <p className="text-xs text-gray-500 mt-1"> 
                    Requested by: {req.requested_by_email} on {req.legal_support_requested_at 
                      ? new Date(req.legal_support_requested_at).toLocaleString('en-IN') 
                      : ''} 
                  </p> 
                </div> 
                <button 
                  onClick={async () => { 
                    const notes = prompt('Add notes for this legal notice (optional):') || '' 
                    try { 
                      if (!req.workflow_id) {
                        alert('Workflow item not found! Please refresh.');
                        return;
                      }
                      const r = await api.post( 
                        `/workflow/legal-notice/${req.workflow_id}/legal-review-complete`, 
                        { notes: notes || 'Processed by Legal team' } 
                      ) 
                      if (r.ok) { 
                        alert('✅ Legal notice processed! Master Admin has been notified.') 
                        fetchTasks() 
                      } else { 
                        alert(r.error || 'Failed to process') 
                      } 
                    } catch(e) { 
                      alert('Action failed: ' + (e?.message || e)) 
                    } 
                  }} 
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs px-6 py-3 rounded-xl font-extrabold shadow-sm transition-all" 
                > 
                  ⚖️ Process & Notify Master
                </button> 
              </div> 
            </div> 
          )) 
        )} 
      </Section> 

      {/* User Management */} 
      <Section title="User Management" icon="👥" color="red" 
        subtitle="View all registered companies"> 
        <CompanyCardsList /> 
      </Section> 

      {/* Activity Logs */} 
      <Section title="Activity Logs" icon="📋" color="gray" 
        subtitle="View all system activity"> 
        <div className="p-5"> 
          <Link to="/admin/activity" 
             className="text-blue-600 hover:underline text-sm font-medium"> 
            → View Activity Logs 
          </Link> 
        </div> 
      </Section> 
    </div> 
    )
  }

  // ══════════════════════════════════════════════
  // OPERATIONS DASHBOARD
  // ══════════════════════════════════════════════
  if (isOps) {
    if (selectedCompany) {
      return <CompanyDetailsView />
    }
    return (
      <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg">
        <h1 className="text-3xl font-black text-white flex items-center gap-2">⚙️ Operations Dashboard</h1>
        <p className="text-sm text-amber-100 mt-2">Manage all pending requests</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl">
            <span className="text-white font-bold text-sm">Pending PO Verifications:</span>
            <span className="bg-white text-amber-600 font-black text-lg px-3 py-1 rounded-full">{tasks.po_edit_verification?.length || 0}</span>
          </div>
          {tasks.handling_legal && (
            <span className="text-xs bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-3 py-1 rounded-full font-extrabold">⚖️ Also handling Legal tasks</span>
          )}
          {tasks.handling_financial && (
            <span className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full font-extrabold">💰 Also handling Financial tasks</span>
          )}
        </div>
      </div>

      {/* 1. Subscription Requests (only when Financial disabled) */}
      {tasks.handling_financial && (
        <Section title="Subscription Requests" icon="💳"
          count={tasks.pending_subscriptions?.length}
          subtitle="Financial role is disabled — you are handling subscription verifications"
          color="blue">
          {!tasks.pending_subscriptions?.length ? <Empty /> :
            tasks.pending_subscriptions.map(sub => (
              <div key={sub.workflow_id} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="font-bold text-gray-900">{sub.company_name}</p>
                  <p className="text-sm text-gray-600">{sub.plan_name} — <span className="font-bold text-blue-600">₹{sub.amount}</span></p>
                  <p className="text-xs text-gray-400">{sub.user_email}</p>
                </div>
                <ApproveRejectBtns
                  approveLabel="✅ Approve for Master"
                  onApprove={() => doAction(
                    `/workflow/subscription/${sub.workflow_id}/operations-approve`,
                    { notes: 'Reviewed by Operations team' },
                    'Sent to Master Admin!'
                  )}
                  onReject={() => {
                    const r = getRejectReason()
                    if (r) doAction(`/workflow/subscription/${sub.workflow_id}/reject`, { reason: r }, 'Rejected')
                  }}
                />
              </div>
            ))
          }
        </Section>
      )}

      {/* 2. PO Edit Verification */}
      <Section title="PO Edit Verification" icon="🔍"
        count={tasks.po_edit_verification?.length}
        subtitle="Verify PO edit requests with evidence before sending to Master Admin"
        color="amber">
        {!tasks.po_edit_verification?.length ? <Empty /> :
          tasks.po_edit_verification.map(po => (
            <div key={po.workflow_id} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="font-mono font-bold text-gray-900">{po.po_number}</p>
                <p className="text-xs text-gray-500">Requested by: {po.requested_by_email}</p>
                {po.reason && <p className="text-sm text-gray-600">Reason: {po.reason}</p>}
                {po.evidence_url ? (
                  <a href={po.evidence_url} target="_blank" rel="noreferrer"
                    className="text-blue-600 underline text-xs mt-1 block">
                    📎 View Evidence: {po.evidence_filename || 'document'}
                  </a>
                ) : (
                  <p className="text-xs text-orange-500 mt-1">⚠️ No evidence attached</p>
                )}
              </div>
              <ApproveRejectBtns
                approveLabel="✅ Verify & Send to Master"
                onApprove={() => doAction(
                  `/workflow/po/${po.workflow_id}/operations-approve`,
                  { notes: 'Verified by Operations team' },
                  'Sent to Master Admin!'
                )}
                onReject={() => {
                  const r = getRejectReason()
                  if (r) doAction(`/workflow/po/${po.workflow_id}/reject`, { reason: r }, 'PO edit rejected')
                }}
              />
            </div>
          ))
        }
      </Section>

      {/* 3. Company Safety Check Requests */}
      <Section title="Company Safety Check Requests" icon="🏢"
        count={tasks.business_check_requests?.length}
        subtitle="Review company safety requests and generate reports for users"
        color="purple">
        {!tasks.business_check_requests?.length ? <Empty /> :
          tasks.business_check_requests.map(req => (
            <div key={req.id} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900">{req.target_company_name || req.company_name}</p>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    Target Company
                  </span>
                </div>
                <p className="font-mono text-xs text-gray-500">{req.gstin}</p>
                <div className="mt-1">
                  <p className="text-xs text-gray-700 font-medium">
                    Requested by: {req.requested_by_email}
                  </p>
                  {req.requesting_company_name && (
                    <p className="text-xs text-gray-600">
                      {req.requesting_company_name}
                    </p>
                  )}
                </div>
                {req.reason && <p className="text-xs text-gray-500 mt-1">Reason: {req.reason}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {req.created_at ? new Date(req.created_at).toLocaleString('en-IN') : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedBizRequest(req)
                  setReportText('')
                  setVerdict('NEUTRAL')
                }}
                className="bg-purple-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-purple-700"
              >
                📊 Generate Report
              </button>
            </div>
          ))
        }
      </Section>

      {/* 4. Support Requests */}
      <Section title="Support Requests" icon="📋"
        count={tasks.support_requests?.length}
        subtitle="Handle user support requests"
        color="green">
        {!tasks.support_requests?.length ? <Empty /> :
          tasks.support_requests.map(req => (
            <div key={req.id || `support-${Date.now()}`} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="font-bold text-gray-900">{req.title || 'Support Request'}</p>
                <p className="text-sm text-gray-600">{req.description?.substring(0, 100)}</p>
                <p className="text-xs text-gray-400">By: {req.requested_by_email}</p>
              </div>
              <button
                onClick={() => {
                  const response = prompt('Response to user:') || 'Resolved by Operations team';
                  doAction(
                    `/support-requests/${req.id}/resolve`,
                    { response },
                    'Support request resolved! User notified.'
                  );
                }}
                className="bg-green-600 text-white text-xs px-4 py-2 rounded-xl hover:bg-green-700"
              >
                ✅ Mark Resolved
              </button>
            </div>
          ))
        }
      </Section>

      {/* 5. Legal Notice Requests (only when Legal disabled) */}
      {tasks.handling_legal && (
        <Section title="Legal Notice Requests" icon="⚖️"
          count={tasks.legal_notice_requests?.length || 0}
          subtitle="Legal role disabled — you are handling these requests"
          color="indigo">
          {!tasks.legal_notice_requests?.length ? <Empty msg="No pending legal requests ✅" /> :
            tasks.legal_notice_requests.map(req => (
              <div key={req.workflow_id} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <p className="font-mono font-bold text-gray-900">{req.po_number}</p>
                  <p className="text-sm text-gray-600">{req.vendor}</p>
                  <p className="text-sm font-bold text-red-600">₹{Number(req.amount || 0).toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400">{req.requested_by_email}</p>
                  <p className="text-xs text-gray-400">
                    {req.created_at ? new Date(req.created_at).toLocaleString('en-IN') : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const notes = prompt('Notes:') || 'Processed by Operations'
                    doAction(`/workflow/legal-notice/${req.workflow_id}/process`, { notes }, 'Sent to Master Admin!')
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  ⚖️ Process & Send to Master
                </button>
              </div>
            ))
          }
        </Section>
      )}

      {/* 6. User Management */}
      <Section title="User Management" icon="👥" color="amber"
        subtitle="View all registered companies">
        <CompanyCardsList />
      </Section>

      {/* 7. Activity Logs */}
      <Section title="Activity Logs" icon="📋" color="gray"
        subtitle="View all system activity">
        <div className="p-5">
          <Link to="/admin/activity" className="text-blue-600 hover:underline text-sm font-medium">
            → View Activity Logs
          </Link>
        </div>
      </Section>

      {/* Business Report Generation Modal */}
      {selectedBizRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">📊 Generate Safety Report</h3>
              <p className="text-sm text-gray-500">
                {selectedBizRequest.company_name} ({selectedBizRequest.gstin})
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verdict</label>
                <div className="flex gap-3">
                  {[
                    { v: 'SAFE', label: '✅ Safe', cls: 'border-green-500 bg-green-50 text-green-700' },
                    { v: 'NEUTRAL', label: '⚠️ Neutral', cls: 'border-orange-500 bg-orange-50 text-orange-700' },
                    { v: 'RISKY', label: '❌ Risky', cls: 'border-red-500 bg-red-50 text-red-700' },
                  ].map(opt => (
                    <button key={opt.v}
                      onClick={() => setVerdict(opt.v)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 ${verdict === opt.v ? opt.cls : 'border-gray-200 text-gray-400'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Analysis <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reportText}
                  onChange={e => setReportText(e.target.value)}
                  placeholder="Write your analysis of this company. Include payment history, business reputation, any red flags..."
                  rows={5}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={() => setSelectedBizRequest(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm">
                Cancel
              </button>
              <button
                disabled={!reportText || !!processing}
                onClick={async () => {
                  setProcessing('biz')
                  try {
                    const res = await api.post(
                      `/business-check/${selectedBizRequest.id}/operations-review`,
                      { verdict, report: reportText, report_notes: reportText, send_to_master: true }
                    )
                    if (res.ok) {
                      alert('✅ Report sent to Master Admin for approval!')
                      setSelectedBizRequest(null)
                      fetchTasks()
                    } else {
                      alert(res.error || 'Failed')
                    }
                  } catch(e) {
                    alert('Failed to submit report')
                  }
                  setProcessing(null)
                }}
                className="flex-1 bg-purple-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50"
              >
                {processing === 'biz' ? '⏳ Generating PDF...' : '📊 Send to Master Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    )
  }

  // ══════════════════════════════════════════════
  // MASTER ADMIN DASHBOARD
  // ══════════════════════════════════════════════
  if (isMaster) {
    if (selectedCompany) {
      return <CompanyDetailsView />
    }
    return (
      <div className="flex gap-6 p-6">
      {/* LEFT COLUMN: Navigation & My Company */}
      <div className="w-96 flex-shrink-0 space-y-6">
        {/* Master Admin Header */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-7 rounded-2xl border border-indigo-100 shadow-md">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">👑 Master Admin Control Center</h1>
          <p className="text-sm text-gray-600 mt-2">Final approvals and system management</p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div style={{ backgroundColor: '#2563eb' }} className="text-white px-4 py-3 rounded-xl text-center">
              <div className="text-xl font-black">{tasks.summary?.pending_subscriptions || 0}</div>
              <div className="text-[10px] opacity-80">Subscriptions</div>
            </div>
            <div style={{ backgroundColor: '#d97706' }} className="text-white px-4 py-3 rounded-xl text-center">
              <div className="text-xl font-black">{tasks.summary?.pending_po_approvals || 0}</div>
              <div className="text-[10px] opacity-80">PO Approvals</div>
            </div>
            <div style={{ backgroundColor: '#7c3aed' }} className="text-white px-4 py-3 rounded-xl text-center">
              <div className="text-xl font-black">{tasks.summary?.pending_business || 0}</div>
              <div className="text-[10px] opacity-80">Business</div>
            </div>
            <div style={{ backgroundColor: '#dc2626' }} className="text-white px-4 py-3 rounded-xl text-center">
              <div className="text-xl font-black">{tasks.summary?.pending_legal || 0}</div>
              <div className="text-[10px] opacity-80">Legal</div>
            </div>
            <div style={{ backgroundColor: '#059669' }} className="col-span-2 text-white px-4 py-3 rounded-xl text-center">
              <div className="text-xl font-black">{tasks.summary?.total || 0}</div>
              <div className="text-[10px] opacity-80">Total Tasks</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-4">Quick Navigation</h3>
          <div className="space-y-2">
            <Link to="/dashboard/user" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-50 text-gray-700">
              🏢 My Company
            </Link>
            <button onClick={() => setActiveNav('role-toggle')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeNav === 'role-toggle' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}>
              ⚙️ Role Management
            </button>
            <button onClick={() => setActiveNav('subscriptions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeNav === 'subscriptions' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}>
              💳 Final Subscription Approvals
            </button>
            <button onClick={() => setActiveNav('po-approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeNav === 'po-approvals' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}>
              📋 Final PO Edit Approvals
            </button>
            <button onClick={() => setActiveNav('business-approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeNav === 'business-approvals' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}>
              🏢 Business Check Report Approvals
            </button>
            <button onClick={() => setActiveNav('legal-approvals')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeNav === 'legal-approvals' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}>
              ⚖️ Legal Notice Approvals
            </button>
            <button onClick={() => setActiveNav('create-user')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeNav === 'create-user' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}>
              👤 Create Internal User
            </button>
            <button onClick={() => setActiveNav('user-management')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${activeNav === 'user-management' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'}`}>
              👥 User Management
            </button>
            <Link to="/admin/activity" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-50 text-gray-700">
              📋 Activity Logs
            </Link>
          </div>
        </div>


      </div>

      {/* RIGHT COLUMN: Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {activeNav === 'role-toggle' && <RoleToggleSection token={token} />}

        {activeNav === 'subscriptions' && (
          <Section title="Final Subscription Approvals" icon="💳"
            count={tasks.pending_subscriptions?.length}
            subtitle="These have been reviewed by Operations/Financial team"
            color="blue">
            {!tasks.pending_subscriptions?.length ? <Empty msg="No subscriptions waiting for your approval ✅" /> :
              tasks.pending_subscriptions.map(sub => (
                <div key={sub.workflow_id} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{sub.company_name}</p>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{sub.plan_name}</span>
                    </div>
                    <p className="text-sm text-gray-600">₹{sub.amount} — {sub.user_email}</p>
                    {sub.review_notes && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                        <strong>Operations notes:</strong> {sub.review_notes}
                      </div>
                    )}
                  </div>
                  <ApproveRejectBtns
                    approveLabel="👑 Final Approve"
                    onApprove={() => doAction(
                      `/workflow/subscription/${sub.workflow_id}/master-approve`,
                      { notes: 'Final approval by Master Admin' },
                      'Subscription activated! User has been notified.'
                    )}
                    onReject={() => {
                      const r = getRejectReason()
                      if (r) doAction(`/workflow/subscription/${sub.workflow_id}/reject`, { reason: r }, 'Rejected. User notified.')
                    }}
                  />
                </div>
              ))
            }
          </Section>
        )}

        {activeNav === 'po-approvals' && (
          <Section title="Final PO Edit Approvals" icon="📋"
            count={tasks.pending_po_approvals?.length}
            subtitle="These have been verified by Operations team"
            color="amber">
            {!tasks.pending_po_approvals?.length ? <Empty msg="No PO edits waiting for your approval ✅" /> :
              tasks.pending_po_approvals.map(po => (
                <div key={po.workflow_id} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-mono font-bold text-gray-900">{po.po_number}</p>
                    {po.reason && <p className="text-sm text-gray-600">Reason: {po.reason}</p>}
                    {po.evidence_url && (
                      <a href={po.evidence_url} target="_blank" rel="noreferrer"
                        className="text-blue-600 underline text-xs">📎 View Evidence</a>
                    )}
                    {po.review_notes && (
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                        <strong>Operations notes:</strong> {po.review_notes}
                      </div>
                    )}
                  </div>
                  <ApproveRejectBtns
                    approveLabel="👑 Final Apply"
                    onApprove={() => doAction(
                      `/workflow/po/${po.workflow_id}/master-approve`,
                      { notes: 'Final approval by Master Admin' },
                      'PO edit applied! User notified.'
                    )}
                    onReject={() => {
                      const r = getRejectReason()
                      if (r) doAction(`/workflow/po/${po.workflow_id}/reject`, { reason: r }, 'Rejected. User notified.')
                    }}
                  />
                </div>
              ))
            }
          </Section>
        )}

        {activeNav === 'business-approvals' && (
          <Section title="Business Check Report Approvals" icon="🏢"
            count={tasks.pending_business_requests?.length || 0}
            subtitle="Operations reviewed — approve to generate PDF and send to user">
            {!tasks.pending_business_requests?.length ? <Empty msg="No business reports waiting ✅" /> :
              tasks.pending_business_requests.map(req => {
                const verdictBadge = {
                  'SAFE': <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">✅ SAFE</span>,
                  'RISKY': <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">❌ RISKY</span>,
                  'NEUTRAL': <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">⚠️ NEUTRAL</span>,
                }[req.verdict || 'NEUTRAL'];
                return (
                  <div key={req.id} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900">{req.target_company_name || req.company_name}</p>
                        {verdictBadge}
                      </div>
                      <p className="font-mono text-xs text-gray-500">{req.gstin}</p>
                      {req.report_text && <p className="text-xs text-gray-500 mt-2">{req.report_text.substring(0, 150)}...</p>}
                      {req.report_url && (
                        <a href={req.report_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs mt-1 block">
                          📄 Preview Report
                        </a>
                      )}
                      <p className="text-xs text-gray-400 mt-2">{req.requested_by_email}</p>
                      {req.is_new_company && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm font-bold text-amber-700 mb-1">⚠️ This company is NOT in Network Trust Intelligence</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {req.is_new_company && (
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input type="checkbox" id={"sn-"+req.id} className="rounded" />
                          💾 Save this company to Network Trust Intelligence after approval
                        </label>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const sn = req.is_new_company ? (document.getElementById('sn-'+req.id)?.checked || false) : false;
                            const notes = prompt('Notes:') || 'Approved by Master Admin';
                            doAction('/business-check/'+req.id+'/master-approve', { save_to_network: sn, notes }, 'Report sent to user!' + (sn ? ' Saved to Network Trust.' : ''));
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          👑 Approve & Send PDF
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason:');
                            if (reason) doAction('/business-check/'+req.id+'/reject', { reason }, 'Rejected.');
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </Section>
        )}

        {activeNav === 'legal-approvals' && (
          <Section title="Legal Notice Approvals" icon="⚖️"
            count={tasks.pending_legal_notices?.length || 0}
            subtitle="Processed by team — give final approval to send legal notice">
            {!tasks.pending_legal_notices?.length ? <Empty msg="No legal notices pending ✅" /> :
              tasks.pending_legal_notices.map(item => (
                <div key={item.workflow_id} className="p-5 border-b flex justify-between items-start flex-wrap gap-3 hover:bg-gray-50 transition-colors shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-mono font-bold text-gray-900">{item.po_number}</p>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">⚖️ Legal Notice</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.vendor}</p>
                    {item.vendor_email && <p className="text-xs text-gray-500">{item.vendor_email}</p>}
                    <p className="text-sm font-bold text-red-600 mt-1">₹{Number(item.amount || 0).toLocaleString('en-IN')}</p>
                    {item.legal_support_reason && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Reason:</span> {item.legal_support_reason}
                      </p>
                    )}
                    {item.legal_support_evidence_url && (
                      <a 
                        href={item.legal_support_evidence_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-blue-600 underline text-xs mt-1 block"
                      >
                        📎 View Evidence: {item.legal_support_evidence_filename || 'Document'}
                      </a>
                    )}
                    {item.ops_notes && (
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                        Ops notes: {item.ops_notes}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{item.requested_by_email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const notes = prompt('Notes:') || 'Approved by Master Admin';
                        doAction('/workflow/legal-notice/' + item.workflow_id + '/master-approve', { notes }, 'Legal notice approved!');
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      👑 Approve Notice
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) doAction('/workflow/legal-notice/' + item.workflow_id + '/reject', { reason }, 'Rejected.');
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ))}
          </Section>
        )}

        {activeNav === 'create-user' && (
          <Section title="Create Internal User" icon="👤" color="emerald"
            subtitle="Create accounts for Operations, Financial, or Legal team members">
            <div className="p-6">
              <CreateUserForm />
            </div>
          </Section>
        )}

        {activeNav === 'user-management' && (
          <Section title="User Management" icon="👥" color="indigo"
            subtitle="View all registered companies">
            <CompanyCardsList />
          </Section>
        )}
      </div>
    </div>
    )
  }

  return <div className="p-8 text-center text-gray-400">Unknown role: {role}</div>
}