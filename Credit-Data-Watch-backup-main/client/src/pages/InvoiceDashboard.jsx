import { useState, useEffect } from 'react'
import { invoices as invoicesApi } from '../services/api/apiClient'
import Invoices from './Invoices'
import StatsChart from '../components/ui/StatsChart' // <--- Added the Graph Component
import {
  CurrencyRupeeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function InvoiceDashboard() {
  const [stats, setStats] = useState({
    totalCount: 0,
    totalAmount: 0,
    pendingCount: 0,
    pendingAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
    paidCount: 0,
    paidAmount: 0,
  })
  const [credibilityScore, setCredibilityScore] = useState(850)
  const [chartData, setChartData] = useState([]) // <--- State for the Graph
  const [loading, setLoading] = useState(true)

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    fetchInvoiceStats()
  }, [])

  const fetchInvoiceStats = async () => {
    setLoading(true)
    try {
      const response = await invoicesApi.list({ limit: 1000 })
      if (response.ok && response.data.invoices) {
        const invoicesList = response.data.invoices
        let tCount = 0, tAmount = 0
        let pCount = 0, pAmount = 0
        let oCount = 0, oAmount = 0
        let pdCount = 0, pdAmount = 0

        const today = new Date()
        today.setHours(0,0,0,0)
        const currentYear = today.getFullYear()

        // Prepare monthly data for the chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const monthlyData = months.map(name => ({ name, total: 0, paid: 0, pending: 0 }))

        invoicesList.forEach(inv => {
          const amt = Number(inv.amount || inv.total || 0)
          const due = new Date(inv.due_date)
          due.setHours(0,0,0,0)
          const status = (inv.status || 'pending').toLowerCase()

          // 1. Overall Metrics Logic
          tCount++
          tAmount += amt

          if (status === 'paid' || status === 'acknowledged') {
            pdCount++
            pdAmount += amt
          } else if (due < today && status !== 'paid' && status !== 'acknowledged') {
            oCount++
            oAmount += amt
          } else {
            pCount++
            pAmount += amt
          }

          // 2. Chart Logic (Group by Month)
          const invDate = new Date(inv.invoice_date || inv.created_at || new Date())
          if (invDate.getFullYear() === currentYear) {
            const monthIndex = invDate.getMonth()
            monthlyData[monthIndex].total += amt
            
            if (status === 'paid' || status === 'acknowledged') {
              monthlyData[monthIndex].paid += amt
            } else {
              monthlyData[monthIndex].pending += amt
            }
          }
        })

        setStats({
          totalCount: tCount, totalAmount: tAmount,
          pendingCount: pCount, pendingAmount: pAmount,
          overdueCount: oCount, overdueAmount: oAmount,
          paidCount: pdCount, paidAmount: pdAmount
        })
        setChartData(monthlyData)

        // --- CREDIBILITY INDEX LOGIC ---
        let calculatedScore = 850
        if (tCount > 0) {
            const overduePenalty = (oCount / tCount) * 200 
            const paidBonus = (pdCount / tCount) * 100     
            calculatedScore = Math.min(1000, Math.max(300, 850 - overduePenalty + paidBonus))
        }
        setCredibilityScore(Math.round(calculatedScore))
      }
    } catch (error) {
      console.error("Error fetching invoice stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
  }

  const getCredibilityColor = (score) => {
    if (score >= 800) return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    if (score >= 600) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-rose-600 bg-rose-50 border-rose-200'
  }

  const getCredibilityLabel = (score) => {
    if (score >= 800) return 'Excellent'
    if (score >= 600) return 'Fair'
    return 'High Risk'
  }

  if (loading) return <div className="p-8 text-center text-gray-500 mt-10">Loading Invoice Dashboard...</div>

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome back, {currentUser.company_name || currentUser.name || 'User'}</p>
          </div>
        </div>

        {/* --- CREDIBILITY INDEX WIDGET --- */}
        <div className={`p-6 rounded-2xl border ${getCredibilityColor(credibilityScore)} flex items-center justify-between shadow-sm`}>
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-full shadow-sm">
                    <ShieldCheckIcon className="w-8 h-8 opacity-80" />
                </div>
                <div>
                    <h2 className="text-lg font-bold">Business Credibility Index</h2>
                    <p className="text-sm opacity-80">Based on your invoice payment and collection history.</p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-4xl font-black">{credibilityScore} <span className="text-lg font-medium opacity-60">/ 1000</span></div>
                <div className="text-sm font-bold uppercase tracking-wider mt-1">{getCredibilityLabel(credibilityScore)}</div>
            </div>
        </div>

        {/* --- METRICS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Invoice Value</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalAmount)}</h3>
              </div>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <CurrencyRupeeIcon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600">{stats.totalCount} Invoices Total</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid / Acknowledged</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.paidAmount)}</h3>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckBadgeIcon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-emerald-600">{stats.paidCount} Invoices Paid</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Value</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.pendingAmount)}</h3>
              </div>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <ClockIcon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-amber-600">{stats.pendingCount} Invoices Awaiting</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue Value</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.overdueAmount)}</h3>
              </div>
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-sm font-medium text-rose-600">{stats.overdueCount} Invoices Overdue</p>
          </div>

        </div>

        {/* --- ACTUAL CHART / GRAPH RENDERED HERE --- */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mt-4">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Invoice Analytics ({new Date().getFullYear()})</h3>
            <p className="text-sm text-gray-500">Monthly breakdown of invoice values</p>
          </div>
          <div className="h-80 w-full">
            <StatsChart data={chartData} />
          </div>
        </div>

        {/* --- ACTUAL INVOICES TABLE RENDERED HERE --- */}
        <div className="mt-8 border-t border-gray-200 pt-2 -mx-4 md:-mx-8">
            <Invoices />
        </div>

      </div>
    </div>
  )
}