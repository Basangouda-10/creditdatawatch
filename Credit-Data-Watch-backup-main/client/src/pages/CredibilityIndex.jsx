import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/authContext'
import { purchaseOrders, credibility, ratings, credibilityIndex, api } from '../services/api/apiClient'
import { logActivity, ACTIONS } from '../utils/activityLogger'
import TrustGauge from '../components/ui/TrustGauge'
import CompanyHoverCard from '../components/ui/CompanyHoverCard'
import AnimatedVerifiedBadge from '../components/ui/AnimatedVerifiedBadge'

function StarDisplay({ stars, color = "text-amber-500" }) {
  const s = Math.round(stars || 0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= s ? color : "text-gray-200"}>★</span>
      ))}
    </div>
  )
}

export default function CredibilityIndex() {
  const { loading, user } = useAuth()
  const [poRows, setPoRows] = useState([])
  const [companies, setCompanies] = useState([])
  const [globalCbi, setGlobalCbi] = useState([])
  const [globalCredibilityIndex, setGlobalCredibilityIndex] = useState([])
  const [q, setQ] = useState('')
  const [risk, setRisk] = useState('')
  const [sort, setSort] = useState('desc')

  useEffect(() => {
    logActivity(ACTIONS.VIEW_CREDIBILITY) 
    async function loadPOs() {
      try {
        const res = await purchaseOrders.list(1, 1000, true)
        const items = Array.isArray(res?.data?.items) ? res.data.items : Array.isArray(res?.data) ? res.data : []
        setPoRows(items)
      } catch {
        setPoRows([])
      }
    }
    loadPOs()
    const onChanged = () => loadPOs()
    window.addEventListener('poChanged', onChanged)
    return () => window.removeEventListener('poChanged', onChanged)
  }, [user])

  useEffect(() => { 
    async function loadFromBackend() { 
      try { 
        const res = await credibility.list()
        if (res.ok && Array.isArray(res.data)) { 
          setCompanies(res.data) 
        } 
        
        const cbiRes = await ratings.getGlobalCbi()
        if (cbiRes.ok && Array.isArray(cbiRes.data)) {
          setGlobalCbi(cbiRes.data)
        }

        const gciRes = await credibilityIndex.getIndex()
        if (gciRes.ok && Array.isArray(gciRes.data)) {
          setGlobalCredibilityIndex(gciRes.data)
        }
      } catch (err) { 
        console.error( 
          'Credibility fetch error:', 
          err 
        ) 
      } 
    } 
    loadFromBackend() 
  }, [user]) 

  const computedCompanies = useMemo(() => {
    // Note: Main logic moved to backend, this is for fallback/compatibility
    const byVendor = new Map()
    for (const po of poRows) {
      const vendor = (po.vendor || '').trim()
      if (!vendor) continue
      const arr = byVendor.get(vendor) || []
      arr.push(po)
      byVendor.set(vendor, arr)
    }
    const toMetrics = (vendorPOs) => {
      const total = vendorPOs.length
      const paid = vendorPOs.filter(p => p.payment_completed_at || String(p.status || '').toLowerCase() === 'closed').length
      const pending = vendorPOs.filter(p => {
        const s = String(p.status || '').toLowerCase()
        return s.includes('open') || s.includes('pending')
      }).length
      const score = total ? Math.round((paid / total) * 100) : 0
      let grade = 'D'
      if (score >= 90) grade = 'A'
      else if (score >= 75) grade = 'B'
      else if (score >= 50) grade = 'C'
      const risk = score >= 80 ? 'Low' : score >= 50 ? 'Medium' : 'High'
      
      // Star rating calculation based on SOP rules
      const percentage = total ? (paid / total) * 100 : 0
      let stars = 1
      if (percentage >= 90) stars = 5
      else if (percentage >= 75) stars = 4
      else if (percentage >= 60) stars = 3
      else if (percentage >= 40) stars = 2
      
      return { total, paid, pending, score, grade, risk, stars }
    }
    const out = []
    for (const [vendor, vpos] of byVendor.entries()) {
      const m = toMetrics(vpos)
      out.push({
        company_id: null,
        company_name: vendor,
        ...m,
      })
    }
    return out
  }, [poRows])

  if (loading) return <div className="p-6">Loading...</div>

  let filtered = companies.filter(r => r.company_name.toLowerCase().includes(q.toLowerCase()))
  if (risk) filtered = filtered.filter(r => String((r.risk || r.risk_level) || '').toLowerCase() === risk.toLowerCase())
  filtered.sort((a, b) => (sort === 'asc' ? (a.score || 0) - (b.score || 0) : (b.score || 0) - (a.score || 0)))

  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      <style>{`
        .scrollable-container::-webkit-scrollbar { width: 6px; } 
        .scrollable-container::-webkit-scrollbar-track { background: #F0F4FF; border-radius: 999px; } 
        .scrollable-container::-webkit-scrollbar-thumb { background: #93C5FD; border-radius: 999px; } 
        .scrollable-container::-webkit-scrollbar-thumb:hover { background: #3B82F6; }
        .scrollable-container::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.9));
          pointer-events: none;
        }
      `}</style>
      {/* Navy Gradient Header */}
      <section 
        className="py-20 px-4 text-white text-center"
        style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Credibility Index</h1>
          {/* Gold Underline */}
          <div 
            className="mx-auto mb-4"
            style={{ width: '60px', height: '3px', backgroundColor: '#F59E0B' }}
          ></div>
          <p className="text-[#93C5FD] text-lg max-w-3xl mx-auto">
            CreditDataWatch's Credibility Index is India's first GST-anchored business credit scoring system.
            It measures the payment reliability and financial trustworthiness of businesses based on verified,
            member-submitted data — giving you a real-time view of who to trust in the market.
          </p>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-16 px-4 bg-[#F0F4FF]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-2">How It Works</h2>
            <div 
              className="mx-auto"
              style={{ width: '60px', height: '3px', backgroundColor: '#F59E0B' }}
            ></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '⭐', title: 'Global Rating Dashboard', desc: 'Every verified defaulter is listed on the Global Rating Dashboard, immediately impacting their credit score and decreasing their market credibility.', color: '#1E3A8A' },
              { icon: '📉', title: 'Credit Score Impact', desc: 'When a business is reported and verified as a defaulter, their credibility rating drops across the Indian market — motivating prompt settlement.', color: '#3B82F6' },
              { icon: '✅', title: 'Restoration on Settlement', desc: 'Once dues are cleared and the case marked Settled/Closed, the business can begin restoring its credit standing on the platform.', color: '#16A34A' },
              { icon: '🔐', title: 'GST-Verified Data Only', desc: 'Only GST-registered members can submit reports, ensuring the Credibility Index reflects genuine, verified business behaviour.', color: '#0F172A' },
              { icon: '🌍', title: 'National Visibility', desc: 'A business listed as a defaulter faces national exposure — visible to all CreditDataWatch members across India.', color: '#F59E0B' },
              { icon: '📊', title: 'Risk Benchmarking', desc: 'Compare your credit health against industry standards and identify where your credit cycle may need strengthening.', color: '#7C3AED' },
            ].map((item, index) => (
              <div 
                key={item.title} 
                className="bg-white rounded-[14px] p-6 shadow-md transition-all duration-200 ease-out hover:-translate-y-1"
                style={{ borderLeft: `4px solid ${item.color}` }}
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  {item.icon}
                </div>
                <h4 className="font-bold text-[#0F172A] mb-2 text-base">{item.title}</h4>
                <p className="text-[#475569] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4">
        <div className="container-custom max-w-5xl mx-auto space-y-8">
          {/* Business Credibility Index Search Bar */}
          <div className="bg-white rounded-[20px] p-6 border border-[#E2E8F0] shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center text-xl" title="Credibility Index">★</div>
              <p className="text-xl font-bold text-[#0F172A]">Business Credibility Index</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                placeholder="Search company" 
                className="flex-1 min-w-[200px] px-4 py-3 rounded-[8px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]" 
              />
              <select 
                value={risk} 
                onChange={e => setRisk(e.target.value)} 
                className="px-4 py-3 rounded-[8px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
              >
                <option value="">All risks</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <select 
                value={sort} 
                onChange={e => setSort(e.target.value)} 
                className="px-4 py-3 rounded-[8px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
              >
                <option value="desc">Top score</option>
                <option value="asc">Lowest score</option>
              </select>
            </div>
          </div>

          <div className="space-y-10">
            {/* Section 1: Local CBI */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A] mb-1">Direct Trade Reliability (Local CBI)</h2>
                <div style={{ width: '60px', height: '3px', backgroundColor: '#F59E0B' }}></div>
                <p className="text-sm text-[#475569] mt-3">Credibility based on your direct business history with these companies.</p>
              </div>
              <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-md overflow-hidden relative">
                <div className="scrollable-container relative max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9FAFB] sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Company</th>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Performance</th>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Grade</th>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Risk</th>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">PO Fulfillment</th>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">View</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#F3F4F6]">
                      {filtered.length === 0 ? (
                        <tr><td colSpan="6" className="py-8 text-center text-[#9CA3AF]">No local business history found.</td></tr>
                      ) : (
                        filtered.map(r => (
                          <tr key={r.company_name} className="transition-colors duration-150 hover:bg-[#EFF6FF]/60 even:bg-[#F9FAFB]/60">
                            <td className="py-4 px-6 font-medium text-[#0F172A]">{r.company_name}</td>
                            <td className="py-4 px-6">
                              <StarDisplay stars={r.stars} color="text-emerald-500" />
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${r.grade === 'A' ? 'bg-[#D1FAE5] text-[#065F46]' : r.grade === 'B' ? 'bg-[#DBEAFE] text-[#1E40AF]' : r.grade === 'C' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                                {r.grade}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`${(r.risk || r.risk_level) === 'Low' ? 'text-[#16A34A]' : (r.risk || r.risk_level) === 'Medium' ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`}>
                                {(r.risk || r.risk_level) === 'Low' ? '✅ Low' : (r.risk || r.risk_level) === 'Medium' ? '⚠️ Medium' : '❌ High'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="min-w-[180px]">
                                <div className="w-full h-[6px] rounded-full bg-[#E2E8F0] overflow-hidden">
                                  <div className="h-full bg-[#16A34A] inline-block" style={{ width: `${r.total_pos ? Math.round((r.paid_pos / r.total_pos) * 100) : 0}%` }} />
                                  <div className="h-full bg-[#F59E0B] inline-block" style={{ width: `${r.total_pos ? Math.round((r.unpaid / r.total_pos) * 100) : 0}%` }} />
                                </div>
                                <div className="text-xs text-[#475569] mt-2">{r.paid_pos}/{r.total_pos} Paid</div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Link to={`/credibility-index/${r.company_id}`} className="text-[#1D4ED8] font-medium hover:underline">View</Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 2: Network Trust Intelligence */}
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A] mb-1">Network Trust Intelligence</h2>
                <div style={{ width: '60px', height: '3px', backgroundColor: '#F59E0B' }}></div>
                <p className="text-sm text-[#475569] mt-3">Companies reviewed and verified on CreditDataWatch.</p>
              </div>
              <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-md overflow-hidden relative">
                <div className="scrollable-container relative max-h-[500px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#F9FAFB] sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Company</th>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Performance</th>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Grade</th>
                        <th className="py-4 px-6 text-left text-xs font-bold text-[#374151] uppercase tracking-widest border-b border-[#E2E8F0]">Risk</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-[#F3F4F6]">
                      {globalCredibilityIndex.filter(r => r.company_name.toLowerCase().includes(q.toLowerCase())).length === 0 ? (
                        <tr><td colSpan="4" className="py-8 text-center text-[#9CA3AF]">No companies in the Network Trust Intelligence yet.</td></tr>
                      ) : (
                        globalCredibilityIndex.filter(r => r.company_name.toLowerCase().includes(q.toLowerCase())).map(r => {
                          // Calculate stars from partner_trust_score
                          const stars = Math.round(r.partner_trust_score || 0)
                          
                          // Calculate grade and risk from ai_credit_risk_verdict
                          let grade = 'D'
                          let risk = 'High'
                          if (r.ai_credit_risk_verdict === 'Low Risk') {
                            grade = 'A'
                            risk = 'Low'
                          } else if (r.ai_credit_risk_verdict === 'Medium Risk') {
                            grade = 'B'
                            risk = 'Medium'
                          } else if (r.ai_credit_risk_verdict === 'High Risk') {
                            grade = 'C'
                            risk = 'High'
                          }

                          return (
                            <tr key={r.id} className="transition-colors duration-150 hover:bg-[#EFF6FF]/60 even:bg-[#F9FAFB]/60">
                              <td className="py-4 px-6 font-medium text-[#0F172A]">{r.company_name}</td>
                              <td className="py-4 px-6">
                                <StarDisplay stars={stars} color="text-emerald-500" />
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${grade === 'A' ? 'bg-[#D1FAE5] text-[#065F46]' : grade === 'B' ? 'bg-[#DBEAFE] text-[#1E40AF]' : grade === 'C' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#FEE2E2] text-[#991B1B]'}`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`${risk === 'Low' ? 'text-[#16A34A]' : risk === 'Medium' ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`}>
                                  {risk === 'Low' ? '✅ Low' : risk === 'Medium' ? '⚠️ Medium' : '❌ High'}
                                </span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* --- MISSING COMPANY / REQUEST RATING SECTION --- */}
            <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                    Can't find the company you are looking for?
                </h3>
                <p className="text-sm text-blue-700 mb-4 max-w-2xl mx-auto">
                    If a company is not listed in our Network Trust Intelligence registry yet, you can request our team to fetch and calculate their global credibility star rating.
                </p>
                <button 
                    onClick={async () => {
                        // 1. Check if they actually typed a company name in the search bar
                        if (!q || q.trim() === '') {
                            alert("Please type the name of the company in the search bar above first!");
                            return;
                        }

                        try {
                            // 2. THIS ACTUALLY SENDS IT TO YOUR BACKEND DATABASE
                            await api.post('/business-requests', { 
                                company_name: q, 
                                request_type: "RATING_REQUEST",
                                status: "PENDING"
                            });

                            // 3. Show success and clear the search bar
                            alert(`Rating Request for "${q}" has been successfully sent to the Admin team!`);
                            setQ(''); 
                            
                        } catch (error) {
                            console.error("Error sending request:", error);
                            alert("There was an issue sending your request. Please try again.");
                        }
                    }}
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                    Request Company Rating
                </button>
            </div>
            
          </div>
        </div>
      </section>
    </div>
  )
}