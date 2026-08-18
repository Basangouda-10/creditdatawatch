
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../state/authContext'
import { credibility, sendChatMessage, ratings } from '../services/api/apiClient'

const GRADE_COLOR = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100 text-red-700',
}

const RISK_COLOR = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
}

function StarRating({ stars, onRate = null, size = "text-xl" }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i}
          onClick={() => onRate && onRate(i)}
          className={`${size} ${onRate ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
            i <= stars
              ? 'text-yellow-400'
              : 'text-gray-200'
          }`}>★</span>
      ))}
    </div>
  )
}

function ScoreRing({ score, grade }) {
  const radius = 40
  const circ = 2 * Math.PI * radius
  const offset = circ -
    (score / 100) * circ
  const color =
    score >= 75 ? '#22c55e' :
    score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative
      flex items-center
      justify-center w-28 h-28">
      <svg className="absolute
        -rotate-90"
        width="112" height="112">
        <circle cx="56" cy="56"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"/>
        <circle cx="56" cy="56"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"/>
      </svg>
      <div className="text-center
        z-10">
        <div className="text-2xl
          font-bold text-gray-800">
          {score}
        </div>
        <div className={`text-xs
          font-bold px-2 py-0.5
          rounded-full mt-1
          ${GRADE_COLOR[grade] ||
            'bg-gray-100 text-gray-600'
          }`}>
          {grade}
        </div>
      </div>
    </div>
  )
}

export default function
CredibilityDetail() {
  const { companyId } = useParams()
  const { loading: authLoading } =
    useAuth()
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] =
    useState('overview')
  const [aiAnalysis, setAiAnalysis] =
    useState(null)
  const [loadingAi, setLoadingAi] =
    useState(false)
  const [aiRec, setAiRec] =
    useState(null)
  const [loadingRec, setLoadingRec] =
    useState(false)
  const [manualRatings, setManualRatings] = useState([])
  const [canRate, setCanRate] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [userReview, setUserReview] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [aiCbiAnalysis, setAiCbiAnalysis] = useState(null)
  const [loadingAiCbi, setLoadingAiCbi] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await credibility.get(companyId)
        if (res.ok) {
          setData(res.data || null)
          
          // Check if allowed to rate
          const checkRes = await ratings.check(res.data.gstin)
          if (checkRes.ok && checkRes.data.allowed) {
            setCanRate(true)
          }
        }
        
        // Load manual ratings
        const ratingsRes = await ratings.listForCompany(companyId)
        if (ratingsRes.ok) {
          setManualRatings(ratingsRes.data)
        }

        // Load AI CBI analysis
        setLoadingAiCbi(true)
        const aiCbiRes = await ratings.getAiAnalysis(companyId)
        if (aiCbiRes.ok) {
          setAiCbiAnalysis(aiCbiRes.data.analysis)
        }
        setLoadingAiCbi(false)
      } catch (err) {
        console.error('Load error:', err)
      }
    }
    load()
  }, [companyId])

  const handleRatingSubmit = async () => {
    if (userRating === 0) return
    setSubmittingRating(true)
    try {
      const res = await ratings.submit({
        to_company_id: companyId,
        rating: userRating,
        review: userReview
      })
      if (res.ok) {
        // Reload ratings and data
        const ratingsRes = await ratings.listForCompany(companyId)
        if (ratingsRes.ok) setManualRatings(ratingsRes.data)
        const credRes = await credibility.get(companyId)
        if (credRes.ok) setData(credRes.data)
        alert('Rating submitted successfully!')
      }
    } catch (err) {
      console.error('Rating submit error:', err)
    } finally {
      setSubmittingRating(false)
    }
  }

  const fetchAiAnalysis = async () => {
    if (aiAnalysis) return
    setLoadingAi(true)
    try {
      const res = await credibility.getAiAnalysis(companyId)
      if (res.ok) {
        setAiAnalysis(res.data)
      }
    } catch (err) {
      console.error('AI error:', err)
    } finally {
      setLoadingAi(false)
    }
  }

  const fetchAiRecommendation =
    async (d) => {
    if (aiRec || !d) return
    setLoadingRec(true)
    try {
      const res = await sendChatMessage(`Should I deal with ${
            d.company_name
          }? They have a credit score of ${
            d.score
          } and a risk level of ${
            d.risk_level
          }. Their PO fulfillment rate is ${(
            d.metrics.fulfillment_rate
          ).toFixed(2)}%`)
      
      const json = res.data
      const text = json?.response ||
        json?.message ||
        json?.reply || ''

      // Try JSON parse first
      try {
        const match = text.match(
           /\{[\s\S]*\}/
         )
        if (match) {
          const parsed = JSON.parse(
            match[0]
          )
          if (parsed.verdict) {
            setAiRec(parsed)
            return
          }
        }
      } catch(e) {
        console.error('JSON parse error for AI recommendation:', e)
      }

      // Build smart recommendation 
      const score = data?.score || 0 
      const grade = data?.grade || 'N/A' 
      const risk = data?.risk_level || 'N/A' 
      const stars = data?.stars || 0 
      const fulfillment = data?.metrics?.fulfillment_rate || 0 
      const totalPos = data?.metrics?.total_pos || 0 
      const paidPos = data?.metrics?.paid_on_time || 0 
      const unpaid = data?.metrics?.unpaid || 0 
 
      const verdict = 
        score >= 75 
          ? 'RECOMMENDED TO DEAL WITH' 
          : score >= 50 
          ? 'PROCEED WITH CAUTION' 
          : 'NOT RECOMMENDED' 
 
      const reasons = [] 
 
      // Score reason 
      if (score >= 90) { 
        reasons.push( 
          `Excellent credit score of ${score}/100 — among the highest rated vendors` 
        ) 
      } else if (score >= 75) { 
        reasons.push( 
          `Good credit score of ${score}/100 — reliable payment history` 
        ) 
      } else if (score >= 50) { 
        reasons.push( 
          `Moderate credit score of ${score}/100 — some payment concerns` 
        ) 
      } else { 
        reasons.push( 
          `Low credit score of ${score}/100 — high payment risk` 
        ) 
      } 
 
      // Fulfillment reason 
      if (fulfillment === 100) { 
        reasons.push( 
          `Perfect PO fulfillment — all ${totalPos} purchase orders paid on time` 
        ) 
      } else if (fulfillment >= 75) { 
        reasons.push( 
          `${paidPos} out of ${totalPos} POs paid on time (${fulfillment}% fulfillment rate)` 
        ) 
      } else { 
        reasons.push( 
          `Only ${paidPos} out of ${totalPos} POs paid — ${unpaid} unpaid orders outstanding` 
        ) 
      } 
 
      // Grade reason 
      if (grade === 'A') { 
        reasons.push( 
          `Grade A — highest credibility rating as per CreditDataWatch scoring` 
        ) 
      } else if (grade === 'B') { 
        reasons.push( 
          `Grade B — good credibility with minor payment delays` 
        ) 
      } else if (grade === 'C') { 
        reasons.push( 
          `Grade C — average credibility, proceed with payment terms caution` 
        ) 
      } else { 
        reasons.push( 
          `Grade D — poor credibility, high risk of payment default` 
        ) 
      } 
 
      // Risk reason 
      if (risk === 'Low') { 
        reasons.push( 
          `Low risk profile — safe to extend credit and standard payment terms` 
        ) 
      } else if (risk === 'Medium') { 
        reasons.push( 
          `Medium risk — consider shorter payment terms or partial advance` 
        ) 
      } else { 
        reasons.push( 
          `High risk — recommend advance payment or secured transactions only` 
        ) 
      } 
 
      // Stars reason 
      if (stars >= 4) { 
        reasons.push( 
          `${stars}/5 star performance rating — vendor consistently meets payment obligations` 
        ) 
      } else if (stars === 3) { 
        reasons.push( 
          `${stars}/5 star performance — average vendor reliability` 
        ) 
      } else { 
        reasons.push( 
          `${stars}/5 star performance — vendor has history of delayed or missed payments` 
        ) 
      } 
 
      setAiRec({ 
        verdict: verdict, 
        reasons: reasons 
      })
    } catch (err) {
      console.error('AI Recommendation fetch error:', err.message);
    } finally {
      setLoadingRec(false)
    }
  }

  useEffect(() => {
    if (data) {
      fetchAiRecommendation(data)
    }
  }, [data])

  useEffect(() => {
    if (activeTab === 'ai-report') {
      fetchAiAnalysis()
    }
  }, [activeTab])

  if (authLoading || !data) return (
    <div className="flex items-center
      justify-center min-h-[400px]">
      <div className="h-12 w-12
        animate-spin rounded-full
        border-4 border-blue-100
        border-t-blue-600" />
    </div>
  )

  const m = data.metrics
  const fulfillPct = m.fulfillment_rate

  const VERDICT_STYLE = {
    'RECOMMENDED TO DEAL WITH':
      'bg-green-50 border-green-300 text-green-700',
    'PROCEED WITH CAUTION':
      'bg-yellow-50 border-yellow-300 text-yellow-700',
    'NOT RECOMMENDED':
      'bg-red-50 border-red-300 text-red-700',
  }

  return (
    <div className="max-w-5xl mx-auto
      px-4 py-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl
          font-bold text-gray-800">
          {data.company_name}
        </h1>
        <p className="text-gray-500
          text-sm mt-1">
          Credibility Detail Report
        </p>
      </div>

      {/* 5 Metric Cards */}
      <div className="grid grid-cols-2
        md:grid-cols-5 gap-4 mb-6">

        {/* Card 1 — Credit Score */}
        <div className="bg-white
          rounded-xl shadow-sm border
          p-4 flex flex-col
          items-center">
          <p className="text-xs
            text-gray-500 mb-2
            font-medium">
            Credit Score
          </p>
          <ScoreRing
            score={data.score}
            grade={data.grade}
          />
        </div>

        {/* Card 2 — Risk Level */}
        <div className="bg-white
          rounded-xl shadow-sm border
          p-4 flex flex-col
          items-center justify-center">
          <p className="text-xs
            text-gray-500 mb-2
            font-medium">
            Risk Level
          </p>
          <span className={`px-3 py-1
            rounded-full text-sm
            font-bold ${
              RISK_COLOR[
                data.risk_level
              ] ||
              'bg-gray-100 text-gray-600'
            }`}>
            {data.risk_level}
          </span>
          <p className="text-xs
            text-gray-400 mt-2
            text-center">
            Based on payment history
          </p>
        </div>

        {/* Card 3 — PO Fulfillment */}
        <div className="bg-white
          rounded-xl shadow-sm border
          p-4 flex flex-col
          items-center justify-center">
          <p className="text-xs
            text-gray-500 mb-2
            font-medium">
            PO Fulfillment
          </p>
          <p className="text-xl
            font-bold text-gray-800">
            {m.paid_on_time}/
            {m.total_pos}
          </p>
          <div className="w-full
            bg-gray-100 rounded-full
            h-2 mt-2">
            <div
              className="bg-green-500
                h-2 rounded-full"
              style={{
                width: `${fulfillPct}%`
              }}
            />
          </div>
          <p className="text-xs
            text-gray-400 mt-1">
            {fulfillPct}% paid on time
          </p>
        </div>

        {/* Card 4 — Performance */}
        <div className="bg-white
          rounded-xl shadow-sm border
          p-4 flex flex-col
          items-center justify-center">
          <p className="text-xs
            text-gray-500 mb-2
            font-medium">
            Global CBI
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-amber-500">
              {data.global_cbi_stars || '0.0'}
            </span>
            <StarRating
              stars={Math.round(data.global_cbi_stars || 0)}
            />
          </div>
          <p className="text-xs
            text-gray-400 mt-2">
            Average of {manualRatings.length} partner ratings
          </p>
        </div>

        {/* Card 5 — Credit Limit */}
        <div className="bg-white
          rounded-xl shadow-sm border
          p-4 flex flex-col
          items-center justify-center">
          <p className="text-xs
            text-gray-500 mb-2
            font-medium">
            Credit Limit
          </p>
          <p className="text-lg
            font-bold text-gray-800">
            {data.score >= 75
              ? '₹5,00,000'
              : data.score >= 50
              ? '₹2,00,000'
              : '₹50,000'}
          </p>
          <p className="text-xs
            text-gray-400 mt-1">
            {data.score >= 75
              ? 'Net 30'
              : data.score >= 50
              ? 'Net 15'
              : 'Advance Only'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2
        mb-4 border-b">
        {['overview',
          'financials',
          'ratings',
          'ai-report'
        ].map(tab => (
          <button
            key={tab}
            onClick={() =>
              setActiveTab(tab)}
            className={`px-4 py-2
              text-sm font-medium
              capitalize border-b-2
              transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'ai-report'
              ? 'AI Report'
              : tab === 'ratings'
              ? 'Business Rating'
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white
        rounded-xl shadow-sm border
        p-6 mb-6">

        {/* Ratings Tab */}
        {activeTab === 'ratings' && ( 
          <div className="space-y-6"> 
            {/* Star Rating Display */} 
            <div className="flex flex-col items-center py-6 border-b"> 
              <p className="text-sm text-gray-500 mb-3 font-medium">Partner Rating Score</p> 
              <div className="flex items-center gap-3 mb-2"> 
                <span className="text-5xl font-bold text-amber-500"> 
                  {(data.global_cbi_stars || 0).toFixed(1)} 
                </span> 
                <div className="flex flex-col gap-1"> 
                  <div className="flex gap-1"> 
                    {[1, 2, 3, 4, 5].map(i => { 
                      const val = data.global_cbi_stars || 0 
                      const full = i <= Math.floor(val) 
                      const half = !full && i === Math.ceil(val) && val % 1 >= 0.25 
                      return ( 
                        <span key={i} className="text-2xl relative" style={{display:'inline-block', width:'1.2em'}}> 
                          <span className="text-gray-200">★</span> 
                          {(full || half) && ( 
                            <span 
                              className="absolute left-0 top-0 text-amber-400 overflow-hidden" 
                              style={{width: full ? '100%' : '50%'}} 
                            >★</span> 
                          )} 
                        </span> 
                      ) 
                    })} 
                  </div> 
                  <p className="text-xs text-gray-400">{manualRatings.length} partner {manualRatings.length === 1 ? 'rating' : 'ratings'}</p> 
                </div> 
              </div> 
            </div> 
        
            {/* AI Recommendation based on stars */} 
            <div className={`rounded-xl p-5 border-l-4 ${ 
              (data.global_cbi_stars || 0) >= 4 
                ? 'bg-green-50 border-green-500' 
                : (data.global_cbi_stars || 0) >= 3 
                ? 'bg-yellow-50 border-yellow-500' 
                : (data.global_cbi_stars || 0) >= 2 
                ? 'bg-orange-50 border-orange-500' 
                : 'bg-red-50 border-red-500' 
            }`}> 
              <div className="flex items-center gap-3 mb-2"> 
                <span className="text-2xl"> 
                  {(data.global_cbi_stars || 0) >= 4 ? '✅' : (data.global_cbi_stars || 0) >= 3 ? '⚠️' : '❌'} 
                </span> 
                <p className={`font-bold text-base ${ 
                  (data.global_cbi_stars || 0) >= 4 
                    ? 'text-green-700' 
                    : (data.global_cbi_stars || 0) >= 3 
                    ? 'text-yellow-700' 
                    : 'text-red-700' 
                }`}> 
                  {(data.global_cbi_stars || 0) >= 4 
                    ? 'Safe to do business' 
                    : (data.global_cbi_stars || 0) >= 3 
                    ? 'Proceed with caution' 
                    : (data.global_cbi_stars || 0) >= 2 
                    ? 'High risk — verify before proceeding' 
                    : manualRatings.length === 0 
                    ? 'No ratings yet — insufficient data' 
                    : 'Not recommended'} 
                </p> 
              </div> 
              <p className={`text-sm ${ 
                (data.global_cbi_stars || 0) >= 4 
                  ? 'text-green-600' 
                  : (data.global_cbi_stars || 0) >= 3 
                  ? 'text-yellow-600' 
                  : 'text-red-600' 
              }`}> 
                {(data.global_cbi_stars || 0) >= 4 
                  ? `${data.company_name} has an excellent partner rating of ${(data.global_cbi_stars || 0).toFixed(1)}/5. Business partners consistently report positive experiences. Low risk of payment delays.` 
                  : (data.global_cbi_stars || 0) >= 3 
                  ? `${data.company_name} has an average partner rating of ${(data.global_cbi_stars || 0).toFixed(1)}/5. Some partners have reported minor issues. Consider shorter payment terms.` 
                  : (data.global_cbi_stars || 0) >= 2 
                  ? `${data.company_name} has a below average rating of ${(data.global_cbi_stars || 0).toFixed(1)}/5. Multiple partners have flagged concerns. Recommend advance payment only.` 
                  : manualRatings.length === 0 
                  ? `${data.company_name} has not been rated by any business partners yet. Use credit score and PO fulfillment data to assess risk.` 
                  : `${data.company_name} has a poor partner rating of ${(data.global_cbi_stars || 0).toFixed(1)}/5. High risk of payment default. Not recommended for credit transactions.`} 
              </p> 
            </div> 
        
            {/* Rating breakdown if ratings exist */} 
            {manualRatings.length > 0 && ( 
              <div className="text-sm text-gray-500 text-center"> 
                Based on {manualRatings.length} verified business {manualRatings.length === 1 ? 'partner' : 'partners'} who have transacted with {data.company_name} 
              </div> 
            )} 
          </div> 
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid
            md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold
                text-gray-700 mb-3">
                Company Details
              </h3>
              <div className="space-y-2
                text-sm">
                <div className="flex
                  justify-between">
                  <span className=
                    "text-gray-500">
                    Company
                  </span>
                  <span className=
                    "font-medium">
                    {data.company_name}
                  </span>
                </div>
                <div className="flex
                  justify-between">
                  <span className=
                    "text-gray-500">
                    Grade
                  </span>
                  <span className={`
                    px-2 py-0.5
                    rounded-full
                    text-xs font-bold
                    ${GRADE_COLOR[
                      data.grade
                    ]}`}>
                    {data.grade}
                  </span>
                </div>
                <div className="flex
                  justify-between">
                  <span className=
                    "text-gray-500">
                    Risk
                  </span>
                  <span className={`
                    px-2 py-0.5
                    rounded-full
                    text-xs font-bold
                    ${RISK_COLOR[
                      data.risk_level
                    ]}`}>
                    {data.risk_level}
                  </span>
                </div>
                <div className="flex
                  justify-between">
                  <span className=
                    "text-gray-500">
                    Last Updated
                  </span>
                  <span className=
                    "font-medium">
                    {data
                      .last_calculated_at
                      ? new Date(
                          data.last_calculated_at
                        ).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-bold
                text-gray-700 mb-3">
                Credit Summary
              </h3>
              <div className="space-y-2
                text-sm">
                <div className="flex
                  justify-between">
                  <span className=
                    "text-gray-500">
                    Total POs
                  </span>
                  <span className=
                    "font-medium">
                    {m.total_pos}
                  </span>
                </div>
                <div className="flex
                  justify-between">
                  <span className=
                    "text-gray-500">
                    Paid On Time
                  </span>
                  <span className=
                    "font-medium
                    text-green-600">
                    {m.paid_on_time}
                  </span>
                </div>
                <div className="flex
                  justify-between">
                  <span className=
                    "text-gray-500">
                    Unpaid
                  </span>
                  <span className=
                    "font-medium
                    text-red-500">
                    {m.unpaid}
                  </span>
                </div>
                <div className="flex
                  justify-between">
                  <span className=
                    "text-gray-500">
                    Avg Delay
                  </span>
                  <span className=
                    "font-medium">
                    {m.avg_delay_days
                      || 0} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && (
          <div>
            <h3 className="font-bold
              text-gray-700 mb-4">
              Financial Overview
            </h3>
            <div className="grid
              grid-cols-2 gap-4
              text-sm">
              <div className="bg-gray-50
                p-3 rounded-lg">
                <p className="text-gray-500">
                  Total PO Value
                </p>
                <p className="font-bold
                  text-lg">
                  ₹{(m.total_value || 0)
                    .toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-gray-50
                p-3 rounded-lg">
                <p className="text-gray-500">
                  Value Paid
                </p>
                <p className="font-bold
                  text-lg text-green-600">
                  ₹{(m.paid_value || 0)
                    .toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-gray-50
                p-3 rounded-lg">
                <p className="text-gray-500">
                  Value Unpaid
                </p>
                <p className="font-bold
                  text-lg text-red-500">
                  ₹{(m.unpaid_value || 0)
                    .toLocaleString('en-IN')}
                </p>
              </div>
              <div className="bg-gray-50
                p-3 rounded-lg">
                <p className="text-gray-500">
                  Avg. PO Value
                </p>
                <p className="font-bold
                  text-lg">
                  ₹{(m.avg_value || 0)
                    .toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Report Tab */}
        {activeTab === 'ai-report' && (
          <div>
            {loadingAi && (
              <div className="text-center
                py-8">
                <div className="h-8 w-8
                  mx-auto animate-spin
                  rounded-full border-2
                  border-blue-100
                  border-t-blue-600" />
                <p className="text-sm
                  text-gray-500 mt-3">
                  Generating AI Analysis...
                </p>
              </div>
            )}
            {aiAnalysis && (
              <div>
                <h3 className="font-bold
                  text-gray-700 mb-4">
                  AI Generated Report
                </h3>
                <p className="text-sm
                  text-gray-600
                  whitespace-pre-wrap
                  leading-relaxed">
                  {aiAnalysis.summary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Recommendation */}
      <div className="bg-white
        rounded-xl shadow-sm border
        p-6">
        <h3 className="font-bold
          text-gray-700 mb-4">
          AI Recommendation
        </h3>
        {loadingRec && (
          <div className="text-center
            py-4">
            <div className="h-6 w-6
              mx-auto animate-spin
              rounded-full border-2
              border-blue-100
              border-t-blue-600" />
            <p className="text-xs
              text-gray-500 mt-2">
              Getting recommendation...
            </p>
          </div>
        )}
        {aiRec && (
          <div>
            <div className={`p-4
              rounded-lg border-l-4
              mb-4 ${
                VERDICT_STYLE[
                  aiRec.verdict
                ] ||
                'bg-gray-50 border-gray-300'
              }`}>
              <p className="font-bold
                text-sm">
                {aiRec.verdict}
              </p>
            </div>
            <ul className="space-y-2
              text-sm list-disc
              list-inside
              text-gray-600">
              {aiRec.reasons.map(
                (r, i) => <li key={i}>{r}</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
