import { useMemo, useEffect, useState } from 'react'
import QuickActions from '../components/dashboard/QuickActions'
import NotificationsPanel from '../components/dashboard/NotificationsPanel'
import StatsChart from '../components/ui/StatsChart'
import { useAuth } from '../state/authContext'
import { purchaseOrders, invoices, defaulters, settlements, appointments, wallet, adminApi, subscriptions, legal, businessCheck } from '../services/api/apiClient'
import { Link } from 'react-router-dom'
import EditPOModal from '../components/po/EditPOModal'
import PurchaseOrders from './PurchaseOrders'
import RoleDashboard from './roles/RoleDashboard'
import { logActivity, ACTIONS } from '../utils/activityLogger'
import BusinessRequestModal from '../components/BusinessRequestModal'
import SupportRequestModal from '../components/SupportRequestModal'

export default function PoDashboard() {
  const { user, subscription, loading } = useAuth()
  
  const role = String(user?.role || '').toUpperCase()

  // Internal roles are handled by WorkflowDashboard
  // if (role === 'OPERATIONS' || role === 'OPERATION' || role === 'FINANCIAL' || role === 'FINANCE' || role === 'LEGAL') { 
  //   return <RoleDashboard /> 
  // }
  
  const isCompanyAdmin = role === 'COMPANY_ADMIN'
  const isUser = role === 'USER'
  const isMasterAdmin = role === 'MASTER_ADMIN'
  const isFinancial = role === 'FINANCIAL' || role === 'FINANCE'
  const isOperations = role === 'OPERATION' || role === 'OPERATIONS'
  const isLegal = role === 'LEGAL'
  const isInternal = ['MASTER_ADMIN', 'OPERATION', 'OPERATIONS', 'FINANCIAL', 'FINANCE', 'LEGAL'].includes(role)

  const [stats, setStats] = useState({
    purchaseOrders: 0,
    invoices: 0,
    defaulters: 0,
    settlements: 0,
    appointments: 0,
    wallet: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [dueReminders, setDueReminders] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [purchaseRows, setPurchaseRows] = useState([])
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [editingPO, setEditingPO] = useState(null)
  const [showBizRequest, setShowBizRequest] = useState(false)
  const [showSupportRequest, setShowSupportRequest] = useState(false)

  useEffect(() => {
    if (user) {
      logActivity(ACTIONS.VIEW_DASHBOARD) 
      fetchDashboardData()
      loadPurchaseHistory()
    }
  }, [user])

  const calculateDaysLeft = (dueDateStr, paymentWindowDays = 0) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dueDate = new Date(dueDateStr)
    dueDate.setHours(0, 0, 0, 0)
    
    // Add payment window days to due date
    const effectiveDueDate = new Date(dueDate)
    effectiveDueDate.setDate(effectiveDueDate.getDate() + parseInt(paymentWindowDays || 0))
    
    const daysLeft = Math.floor((effectiveDueDate - today) / (1000 * 60 * 60 * 24))
    return daysLeft
  }

  const fetchDashboardData = async () => {
    setLoadingData(true)
    try {
      // Use longer timeouts for dashboard summary stats
      const opt = { timeout: 20000 }
      const [posRes, invoicesRes, defaultersRes, settlementsRes, appointmentsRes, remindersRes, walletRes] = await Promise.all([
        purchaseOrders.list(1, 10, false, opt),
        invoices.list({ limit: 10 }, opt),
        defaulters.list(1, 10, opt),
        settlements.list(1, 10, opt),
        appointments.list(null, opt),
        invoices.getDueReminders(opt),
        wallet.getBalance(opt),
      ])

      // Set stats
      setStats({
        purchaseOrders: posRes.ok ? (Array.isArray(posRes.data) ? posRes.data.length : (posRes.data?.items?.length || 0)) : 0,
        invoices: invoicesRes.ok ? (Array.isArray(invoicesRes.data) ? invoicesRes.data.length : (invoicesRes.data?.invoices?.length || 0)) : 0,
        defaulters: defaultersRes.ok ? (Array.isArray(defaultersRes.data) ? defaultersRes.data.length : (defaultersRes.data?.items?.length || 0)) : 0,
        settlements: settlementsRes.ok ? (Array.isArray(settlementsRes.data) ? settlementsRes.data.length : (settlementsRes.data?.items?.length || 0)) : 0,
        appointments: appointmentsRes.ok ? (Array.isArray(appointmentsRes.data) ? appointmentsRes.data.length : 0) : 0,
        wallet: walletRes.ok ? (walletRes.data?.balance || 0) : 0,
      })

      // Build recent activity from all sources
      const activity = []

      if (posRes.ok && posRes.data?.items) {
        posRes.data.items.slice(0, 3).forEach(po => {
          activity.push({
            type: 'purchase_order',
            title: `PO: ${po.number}`,
            description: `${po.vendor_name} - ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(po.amount)}`,
            date: po.created_at,
            link: '/purchase-orders',
          })
        })
      }

      if (invoicesRes.ok && invoicesRes.data?.invoices) {
        invoicesRes.data.invoices.slice(0, 3).forEach(inv => {
          activity.push({
            type: 'invoice',
            title: `Invoice: ${inv.invoice_number}`,
            description: `${inv.counterparty_name} - ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inv.amount)}`,
            date: inv.created_at,
            link: '/invoices',
          })
        })
      }

      if (defaultersRes.ok && defaultersRes.data?.items) {
        defaultersRes.data.items.slice(0, 2).forEach(def => {
          activity.push({
            type: 'defaulter',
            title: `Defaulter Case: ${def.business_name}`,
            description: `GSTIN: ${def.business_gstin}`,
            date: def.created_at,
            link: '/defaulters',
          })
        })
      }

      // Sort by date and take top 8
      activity.sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentActivity(activity.slice(0, 8))

      // Set due reminders
      if (remindersRes.ok && remindersRes.data?.invoices) {
        setDueReminders(remindersRes.data.invoices.slice(0, 5))
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
    setLoadingData(false)
  }

  const loadPurchaseHistory = async () => {
    setPurchaseLoading(true)
    const res = await purchaseOrders.list(1, 100, true)
    if (res.ok && Array.isArray(res.data?.items)) {
      setPurchaseRows(res.data.items)
    } else if (res.ok && Array.isArray(res.data)) {
      setPurchaseRows(res.data)
    } else {
      setPurchaseRows([])
    }
    setPurchaseLoading(false)
  }

  const handleArchivePO = async (po) => {
    const res = await purchaseOrders.archive(po.id)
    if (res.ok) {
      setPurchaseRows((prev) => prev.map(r => r.id === po.id ? { ...r, is_archived: !r.is_archived } : r))
    }
  }

  const handleDeletePO = async (po) => {
    const res = await purchaseOrders.delete(po.id)
    if (res.ok) {
      setPurchaseRows((prev) => prev.filter(r => r.id !== po.id))
    }
  }

  const handleSaveEditPO = async (payload) => {
    if (!editingPO) return false
    const res = await purchaseOrders.update(editingPO.id, payload)
    if (res.ok) {
      setPurchaseRows((prev) => prev.map(r => r.id === editingPO.id ? { ...r, ...payload } : r))
      return true
    }
    return false
  }

  const planLabel = useMemo(() => {
    if (!subscription) return 'No Plan'
    // Check if subscription has plan, plan_id, or is the admin free plan
    if (subscription.plan) return String(subscription.plan).toUpperCase()
    if (subscription.plan_id) return String(subscription.plan_id).toUpperCase()
    const subObj = subscription.subscription
    if (subObj?.plan_id) return String(subObj.plan_id).toUpperCase()
    if (subObj?.plan) return String(subObj.plan).toUpperCase()
    return 'BASE'
  }, [subscription])

  const planStatus = useMemo(() => {
    if (user?.subscription_bypass || user?.full_access) return 'Active'
    if (!subscription) return 'Inactive'
    if (subscription.is_active) return 'Active'
    const subObj = subscription.subscription
    if (subObj?.status) return String(subObj.status).charAt(0).toUpperCase() + String(subObj.status).slice(1)
    return 'Inactive'
  }, [subscription, user])

  const getExpiryDisplay = (subscription) => {
    // Plan durations in days
    const planDurations = { 
      'BASE': 30,        // 1 month in days 
      'ROYAL': 180,      // 6 months 
      'GROUPS': 365,     // 1 year 
      'ENTERPRISE': 365, // 1 year 
      'ADMIN_FREE': 30,  // Default to 30 days for admin free
      'LIFETIME': 36500  // 100 years for lifetime (shows as Never expires)
    } 
 
    const planName = subscription?.plan_name 
      || subscription?.subscription_plan 
      || subscription?.plan 
      || 'BASE'
 
    // If truly lifetime — show Never expires, else calculate days
    if (planName === 'LIFETIME') { 
      return { text: 'Never expires', color: 'text-green-500', percent: 100 } 
    } 
 
    // Use end date from DB if available 
    const endDateRaw = subscription?.subscription_end_date 
      || subscription?.expires_at 
      || subscription?.valid_until 
      || subscription?.subscription_expires_at 
      || subscription?.expiry_date
 
    // Get start date
    const startRaw = subscription?.subscription_start_date 
      || subscription?.plan_activated_at 
      || subscription?.created_at 
      || subscription?.start_date
 
    if (!startRaw) {
      return { text: 'No expiry info', color: 'text-gray-400', percent: 50 }
    }

    const start = new Date(startRaw)
    let end = null
    let durationDays = planDurations[planName] || 30

    if (endDateRaw) {
      end = new Date(endDateRaw)
      const calculatedDuration = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      durationDays = calculatedDuration > 0 ? calculatedDuration : durationDays
    } else {
      end = new Date(start)
      end.setDate(end.getDate() + durationDays)
    }
      
    const today = new Date() 
    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24)) 
    const totalDays = durationDays
    const usedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24)) 
    const percent = Math.min(100, Math.max(0, Math.round((usedDays / totalDays) * 100))) 
 
    if (daysLeft <= 0) {
      return { text: `Expired ${Math.abs(daysLeft)} days ago`, color: 'text-red-500', percent: 100 } 
    }
      
    const months = Math.floor(daysLeft / 30) 
    const days = daysLeft % 30 
    const text = months > 0 
      ? `Expires in ${months} month${months > 1 ? 's' : ''} ${days} days` 
      : `Expires in ${days} days` 
      
    return { text, color: daysLeft < 7 ? 'text-red-500' : 'text-gray-500', percent } 
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'purchase_order':
        return '📋'
      case 'invoice':
        return '💰'
      case 'defaulter':
        return '⚠️'
      case 'credit_report':
        return '📊'
      case 'settlement':
        return '✅'
      default:
        return '📄'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <section className="py-8 md:py-12">
      <div className="container-custom space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs text-gray-500">
              {loading ? 'Loading profile...' : `Welcome back, ${user?.company_name || user?.email || 'Member'}`}
            </p>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Dashboard</h1>
          </div>
          
          {/* My Wallet - Slim Inline Strip */}
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50/50 border border-indigo-100 rounded-full">
            <span className="text-xs font-medium text-indigo-700 flex items-center gap-1.5">
              💳 Wallet: <span className="font-bold">{stats.wallet}</span> pts
            </span>
            <Link to="/wallet" className="text-[11px] font-semibold text-indigo-600 hover:underline">
              Redeem →
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* All users see Purchase Orders and Invoices */}
          <>
            <Link to="/purchase-orders" className="flex items-center justify-between px-6 py-5 rounded-[16px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] bg-white border-l-[4px] border-[#3B82F6] hover:shadow-[0_8px_32px_rgba(30,58,138,0.12)] transition-all group w-full sm:w-auto">
              <div className="flex flex-col">
                <p className="text-xs text-[#475569]">Purchase Orders</p>
                <span className="text-xs text-[#3B82F6] group-hover:underline inline-block">
                  View all →
                </span>
              </div>
              <div className="flex items-center gap-3">
                {loadingData ? (
                  <div className="w-10 h-10 rounded-full skeleton-shimmer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                    <span className="text-[#3B82F6] text-lg">📋</span>
                  </div>
                )}
                {loadingData ? (
                  <div className="w-12 h-8 rounded skeleton-shimmer" />
                ) : (
                  <p className="text-2xl font-bold text-[#0F172A]">{stats.purchaseOrders}</p>
                )}
              </div>
            </Link>
            <Link to="/invoices" className="flex items-center justify-between px-6 py-5 rounded-[16px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] bg-white border-l-[4px] border-[#16A34A] hover:shadow-[0_8px_32px_rgba(30,58,138,0.12)] transition-all group w-full sm:w-auto">
              <div className="flex flex-col">
                <p className="text-xs text-[#475569]">Invoices</p>
                <span className="text-xs text-[#16A34A] group-hover:underline inline-block">
                  View all →
                </span>
              </div>
              <div className="flex items-center gap-3">
                {loadingData ? (
                  <div className="w-10 h-10 rounded-full skeleton-shimmer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center">
                    <span className="text-[#16A34A] text-lg">💰</span>
                  </div>
                )}
                {loadingData ? (
                  <div className="w-12 h-8 rounded skeleton-shimmer" />
                ) : (
                  <p className="text-2xl font-bold text-[#0F172A]">{stats.invoices}</p>
                )}
              </div>
            </Link>
          </>

          {/* All users see Defaulters */}
          <Link to="/defaulters" className="flex items-center justify-between px-6 py-5 rounded-[16px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] bg-white border-l-[4px] border-[#D97706] hover:shadow-[0_8px_32px_rgba(30,58,138,0.12)] transition-all group w-full sm:w-auto">
            <div className="flex flex-col">
              <p className="text-xs text-[#475569]">Defaulters</p>
              <span className="text-xs text-[#D97706] group-hover:underline inline-block">
                View all →
              </span>
            </div>
            <div className="flex items-center gap-3">
              {loadingData ? (
                <div className="w-10 h-10 rounded-full skeleton-shimmer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center">
                  <span className="text-[#D97706] text-lg">⚠️</span>
                </div>
              )}
              {loadingData ? (
                <div className="w-12 h-8 rounded skeleton-shimmer" />
              ) : (
                <p className="text-2xl font-bold text-[#0F172A]">{stats.defaulters}</p>
              )}
            </div>
          </Link>

          {/* Additional stats for admins */}
          <Link to="/settlement" className="flex items-center justify-between px-6 py-5 rounded-[16px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] bg-white border-l-[4px] border-[#1E3A8A] hover:shadow-[0_8px_32px_rgba(30,58,138,0.12)] transition-all group w-full sm:w-auto">
            <div className="flex flex-col">
              <p className="text-xs text-[#475569]">Settlements</p>
              <span className="text-xs text-[#1E3A8A] group-hover:underline inline-block">
                View all →
              </span>
            </div>
            <div className="flex items-center gap-3">
              {loadingData ? (
                <div className="w-10 h-10 rounded-full skeleton-shimmer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                  <span className="text-[#1E3A8A] text-lg">✅</span>
                </div>
              )}
              {loadingData ? (
                <div className="w-12 h-8 rounded skeleton-shimmer" />
              ) : (
                <p className="text-2xl font-bold text-[#0F172A]">{stats.settlements}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-[#0F172A] uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <QuickActions />
            <button
              onClick={() => setShowBizRequest(true)}
              className="flex items-center gap-3 px-5 py-4 rounded-[12px] border border-[#E2E8F0] bg-white hover:bg-[#EFF6FF] hover:border-[#3B82F6] transition-all duration-200 group"
            >
              <span className="text-2xl group-hover:text-[#3B82F6] transition-colors">🔍</span>
              <span className="text-base font-semibold text-[#0F172A] group-hover:text-[#1E3A8A]">Check Company Safety</span>
            </button>
            <button
              onClick={() => setShowSupportRequest(true)}
              className="flex items-center gap-3 px-5 py-4 rounded-[12px] border border-[#E2E8F0] bg-white hover:bg-[#EFF6FF] hover:border-[#3B82F6] transition-all duration-200 group"
            >
              <span className="text-2xl group-hover:text-[#3B82F6] transition-colors">📋</span>
              <span className="text-base font-semibold text-[#0F172A] group-hover:text-[#1E3A8A]">Support Request</span>
            </button>
          </div>
        </div>



        {/* Stats Chart */}
        <div>
          <StatsChart />
        </div>



        {/* COMPANY ADMIN SPECIFIC SECTIONS */}
        {isCompanyAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div style={{background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #3B82F6 100%)'}} className="rounded-[20px] p-6 text-white shadow-xl">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Company Credibility Score</h3>
                  <p className="text-blue-200 text-xs">Based on your payment history and vendor reports</p>
                </div>
                <div className="bg-white/20 p-2 rounded-lg">📊</div>
              </div>
              <div className="flex items-center gap-6 mt-6">
                <div className="text-6xl font-black text-white">82</div>
                <div>
                  <div className="bg-[#F59E0B] text-[#0F172A] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">A Grade</div>
                  <div className="text-sm mt-2 text-blue-200">Risk Level: <span className="text-white font-bold">Low</span></div>
                </div>
              </div>
              <Link to="/credibility-index" className="mt-6 block text-center bg-white text-[#1E3A8A] hover:bg-[#EFF6FF] py-3 rounded-xl text-sm font-bold transition-all">
                View Full Analysis →
              </Link>
            </div>

            <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_4px_24px_rgba(30,58,138,0.08)]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">Subscription Status</h3>
                  <p className="text-[#475569] text-xs">Your current platform plan</p>
                </div>
                <div className="bg-[#EFF6FF] p-2 rounded-lg">💎</div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#475569] font-semibold">{planLabel}</span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${planStatus === 'Active' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                    {planStatus}
                  </span>
                </div>
                {(() => {
                  const expiry = getExpiryDisplay(subscription)
                  return (
                    <>
                      <div className="w-full h-3 bg-[#F0F4FF] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1E3A8A] rounded-full transition-all duration-500" 
                          style={{ width: `${expiry.percent}%` }}
                        />
                      </div>
                      <p className={`text-[11px] mt-2 ${expiry.color}`}>
                        {expiry.text}
                      </p>
                    </>
                  )
                })()}
              </div>
              <Link to="/membership" className="mt-6 block text-center hover:opacity-90 py-3 rounded-[12px] text-[#0F172A] text-sm font-bold transition-all shadow-md" style={{background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'}}>
                Upgrade Plan
              </Link>
            </div>
          </div>
        )}

        {/* PO Management Table for Company Admin & Master Admin */}
        {(isCompanyAdmin || isMasterAdmin) && (
          <div className="space-y-3 mt-8">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-[#0F172A] uppercase tracking-wide">Recent Purchase Orders</h2>
              <Link to="/purchase-orders" className="text-xs text-[#3B82F6] font-bold hover:underline">View All POs →</Link>
            </div>
            <div className="bg-white rounded-[16px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8FAFF] text-[#0F172A] font-bold uppercase text-[11px] tracking-wide">
                  <tr>
                    <th className="px-6 py-4">PO#</th>
                    <th className="px-6 py-4">Vendor</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {purchaseRows.slice(0, 5).map((po, index) => (
                    <tr key={po.id} className="hover:bg-[#F0F4FF] transition-colors duration-150" style={{backgroundColor: index % 2 === 0 ? 'white' : '#FAFBFF'}}>
                      <td className="px-6 py-4 font-semibold text-[#1E3A8A] hover:underline cursor-pointer">{po.po_number}</td>
                      <td className="px-6 py-4 text-[#475569]">{po.vendor_name || po.vendor}</td>
                      <td className="px-6 py-4 font-semibold text-[#0F172A]">{formatCurrency(po.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${po.status === 'Closed' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#DBEAFE] text-[#1D4ED8]'}`}>
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {purchaseRows.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-[#475569] italic">No purchase orders found. Create your first PO to see it here.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Smaller Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Recent Activity */}
          <div className="flex items-center gap-4 px-6 py-5 rounded-[16px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] bg-white border-l-[4px] border-l-[#3B82F6] hover:shadow-[0_8px_32px_rgba(30,58,138,0.12)] transition-shadow">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🕐</span>
                <h2 className="text-xs text-[#475569] uppercase font-semibold">Recent Activity</h2>
              </div>
              {loadingData && (
                <p className="text-xs text-[#475569]">Loading activity...</p>
              )}
              {!loadingData && recentActivity.length === 0 && (
                <p className="text-xs text-[#475569] py-1">No recent activity</p>
              )}
              {!loadingData && recentActivity.length > 0 && (
                <div className="space-y-1 overflow-y-auto max-h-24 pr-1">
                  {recentActivity.slice(0, 3).map((activity) => (
                    <Link
                      key={`${activity.type}-${activity.title}`}
                      to={activity.link}
                      className="flex items-start gap-2 p-1 rounded hover:bg-[#F0F4FF] transition-colors"
                    >
                      <span className="text-sm">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-[#0F172A] truncate">{activity.title}</p>
                        <p className="text-[9px] text-[#475569] truncate">{activity.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Due Reminders */}
          <div className="flex items-center gap-4 px-6 py-5 rounded-[16px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] bg-white border-l-[4px] border-l-[#D97706] hover:shadow-[0_8px_32px_rgba(30,58,138,0.12)] transition-shadow">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">🔔</span>
                <h2 className="text-xs text-[#475569] uppercase font-semibold">Due Reminders</h2>
              </div>
              {loadingData && (
                <p className="text-xs text-[#475569]">Loading...</p>
              )}
              {!loadingData && dueReminders.length === 0 && (
                <p className="text-xs text-[#475569] py-1">No reminders due</p>
              )}
              {!loadingData && dueReminders.length > 0 && (
                <div className="space-y-1 overflow-y-auto max-h-24 pr-1">
                  {dueReminders.slice(0, 2).map((invoice) => (
                    <div key={invoice.id} className="p-1 bg-[#FEF3C7]/50 border border-[#F59E0B]/30 rounded">
                      <p className="text-[10px] font-semibold text-[#0F172A] truncate">{invoice.invoice_number}</p>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-[9px] font-bold text-[#D97706]">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <p className="text-[8px] text-[#475569]">Due: {formatDate(invoice.due_date)}</p>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/invoices"
                    className="text-[9px] text-[#3B82F6] hover:underline inline-block"
                  >
                    View all →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <NotificationsPanel dueReminders={dueReminders} />

          {/* Plan Info */}
          <div className="flex items-center gap-4 px-6 py-5 rounded-[16px] shadow-[0_4px_24px_rgba(30,58,138,0.08)] bg-white border-l-[4px] border-l-[#1E3A8A] hover:shadow-[0_8px_32px_rgba(30,58,138,0.12)] transition-shadow">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">💳</span>
                <h2 className="text-xs text-[#475569] uppercase font-semibold">Subscription</h2>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-[#0F172A]">{planLabel}</span>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${planStatus === 'Active' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                    {planStatus}
                  </span>
                </div>
                {(() => {
                  const expiry = getExpiryDisplay(subscription)
                  return (
                    <p className={`text-[9px] ${expiry.color}`}>
                      {expiry.text}
                    </p>
                  )
                })()}
                <Link to="/membership" className="inline-flex items-center justify-center bg-[#F0F4FF] border border-[#E2E8F0] text-[#1E3A8A] py-2 rounded text-[10px] font-semibold hover:bg-[#EFF6FF] transition-colors">
                  Manage Plan
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div>
          <PurchaseOrders />
        </div>

        {editingPO && (
          <EditPOModal
            po={editingPO}
            onClose={() => setEditingPO(null)}
            onSave={handleSaveEditPO}
          />
        )}
        {showBizRequest && (
          <BusinessRequestModal
            onClose={() => setShowBizRequest(false)}
            onSuccess={() => {
              setShowBizRequest(false)
            }}
          />
        )}
        {showSupportRequest && (
          <SupportRequestModal
            onClose={() => setShowSupportRequest(false)}
            onSuccess={() => {
              setShowSupportRequest(false)
            }}
          />
        )}
      </div>
    </section>
  )
}
