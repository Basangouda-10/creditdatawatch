import { useState, useEffect } from 'react' 
import { useAuth } from '../state/authContext' 
import { subscriptions, api } from '../services/api/apiClient' 

const PLANS = [ 
  { 
    id: 'BASE', 
    name: 'Base', 
    price: 500, 
    validity: '1 Month', 
    features: ['Basic PO tracking', 'Email reminders', 'Defaulter reporting', 'Legal assistance'] 
  }, 
  { 
    id: 'ROYAL', 
    name: 'Royal', 
    price: 1000, 
    validity: '6 Months', 
    features: ['5 CIR reports', 'Legal assistance', 'Follow-up reminders', 'All Base features'], 
    popular: true 
  }, 
  { 
    id: 'GROUPS', 
    name: 'Groups', 
    price: 2000, 
    validity: '1 Year', 
    features: ['20 CIR reports', 'Legal assistance', 'Follow-up reminders', 'Team access'] 
  }, 
  { 
    id: 'ENTERPRISE', 
    name: 'Enterprise', 
    price: 100000, 
    validity: '1 Year', 
    features: ['100 CIR reports', 'Priority legal support', 'API access', 'Dedicated account manager'] 
  }, 
] 

export default function Membership() { 
  const { subscription, loading, user, loadUser } = useAuth() 
  // Default step set to 'plans' to display selection cards directly
  const [step, setStep] = useState('plans') 
  const [plansList, setPlansList] = useState(PLANS)
  const [selectedPlan, setSelectedPlan] = useState(null) 
  const [paymentData, setPaymentData] = useState(null) 
  const [upiRef, setUpiRef] = useState('') 
  const [screenshotFile, setScreenshotFile] = useState(null) 
  const [submitting, setSubmitting] = useState(false) 
  const [initiating, setInitiating] = useState(false) 
  const [message, setMessage] = useState('') 

  const role = String(user?.role || '').toUpperCase() 
  const isMasterAdmin = role === 'MASTER_ADMIN' 
  const isDeveloper = role === 'DEVELOPER'

  const planName = subscription?.plan ? String(subscription.plan).toUpperCase() : 'BASE' 
  const validity = subscription?.expiry_date 
    ? new Date(subscription.expiry_date).toLocaleDateString('en-IN') 
    : 'Lifetime' 
  const isActive = subscription?.is_active 

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await subscriptions.listPlans()
        if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(p => ({
            id: p.id || String(p.name).toUpperCase(),
            name: p.display_name || p.name,
            price: p.price,
            validity: p.validity_days ? `${p.validity_days} Days` : '1 Year',
            features: [
              `Follow-up Limit: ${p.features?.follow_up_limit || 'Unlimited'}`,
              `Legal Assistance: ${p.features?.legal_assistance_limit || 'Available'}`
            ],
            popular: String(p.name).toUpperCase() === 'ROYAL'
          }))
          setPlansList(mapped)
        }
      } catch (err) {
        // Fallback to static PLANS array
      }
    }
    fetchPlans()
  }, [])

  const handleSelectPlan = async (plan) => { 
    setInitiating(true) 
    setMessage('') 
    try { 
      const planId = String(plan.id || plan.name).toUpperCase().trim()
      
      // Match backend PaymentInitiateRequest schema: { plan_id: "ROYAL", payment_method: "qr_code" }
      const res = await api.post('/payments/initiate', {
        plan_id: planId,
        payment_method: 'qr_code'
      })

      if (res.ok || res.status === 200) { 
        const data = res.data?.data || res.data || {}
        const refId = data.payment_id || data.reference_id || `REF-${Date.now()}`
        
        setPaymentData({
          payment_id: refId,
          reference_id: data.reference_id || refId,
          ...data
        }) 
        setSelectedPlan(plan) 
        setStep('payment') 
      } else { 
        setMessage(res.error || res.data?.detail || res.message || 'Failed to initiate payment. Please try again.') 
      } 
    } catch (e) { 
      setMessage(e.response?.data?.detail || 'Network error. Please try again.') 
    } 
    setInitiating(false) 
  } 

  const uploadProof = async (paymentId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return await api.post(`/payments/${paymentId}/upload-proof`, formData)
  }
  
  const handleSubmitProof = async () => { 
    if (!upiRef.trim()) { setMessage('Please enter UPI transaction reference number'); return } 
    if (!screenshotFile) { setMessage('Please upload your payment screenshot'); return } 
    setSubmitting(true) 
    setMessage('') 
    try { 
      const paymentId = paymentData?.payment_id || paymentData?.reference_id

      // 1. Upload Payment Screenshot Proof
      const uploadRes = await uploadProof(paymentId, screenshotFile)
      if (!uploadRes.ok && uploadRes.status !== 200) {
        setMessage(uploadRes.error || uploadRes.data?.detail || 'Failed to upload payment proof screenshot.')
        setSubmitting(false)
        return
      }

      // 2. Submit Transaction Reference to Verification Endpoint
      const verifyRes = await api.post(`/payments/${paymentId}/verify`, {
        transaction_id: upiRef.trim()
      })

      if (verifyRes.ok || verifyRes.status === 200) { 
        await loadUser()
        setStep('submitted') 
      } else { 
        setMessage(verifyRes.error || verifyRes.data?.detail || 'Failed to submit verification details.') 
      } 
    } catch (e) { 
      setMessage(e.response?.data?.detail || 'Network error. Please try again.') 
    } 
    setSubmitting(false) 
  } 
 
  if (loading) return <div className="p-10 text-center">Loading membership details...</div> 
 
  return ( 
    <section className="py-0"> 
      {/* Navy Gradient Header */}
      <div 
        className="py-12 px-4 text-white text-center"
        style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
        }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="text-sm text-[#93C5FD] mb-2">My Account</p>
          <h1 className="text-3xl md:text-4xl font-bold">Membership</h1>
        </div>
      </div>

      <div className="container-custom max-w-5xl mx-auto px-4 space-y-6 pt-8 pb-8"> 
        {/* Current Plan Overview Card */} 
        <div className="bg-white rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"> 
          <div> 
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Plan</p> 
            <h2 className="text-2xl font-bold text-blue-700">{planName}</h2> 
            <p className="text-sm text-gray-500 mt-1">Valid until: {validity}</p> 
          </div> 
          <div className="flex items-center gap-3"> 
            <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase ${ 
              isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' 
            }`}> 
              {isActive ? '✅ Active' : '❌ Inactive'} 
            </span> 
            {!isMasterAdmin && !isDeveloper && step === 'current' && ( 
              <button 
                onClick={() => setStep('plans')} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors" 
              > 
                Upgrade Plan 
              </button> 
            )} 
          </div> 
        </div> 

        {/* Master Admin / Developer Badge */} 
        {(isMasterAdmin || isDeveloper) && ( 
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 text-center"> 
            <p className="text-3xl mb-2">👑</p> 
            <h3 className="font-bold text-blue-800 text-lg">Full Access Account</h3> 
            <p className="text-blue-600 text-sm mt-1"> 
              Your account has unrestricted access to all CreditDataWatch features. 
            </p> 
          </div> 
        )} 

        {/* Plans Grid */} 
        {step === 'plans' && ( 
          <div> 
            <div className="flex items-center justify-between mb-4"> 
              <h2 className="text-xl font-bold text-gray-900">Choose a Plan</h2> 
            </div> 
            {message && ( 
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600"> 
                {message} 
              </div> 
            )} 
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"> 
              {plansList.map(plan => ( 
                <div 
                  key={plan.id} 
                  className="relative group flex flex-col bg-white rounded-[20px] p-6 shadow-[0_4px_24px_rgba(30,58,138,0.08)] border-2 transition-all duration-250 ease-out hover:-translate-y-1"
                  style={{
                    borderColor: plan.popular ? '#1E3A8A' : 'transparent'
                  }}
                  onMouseOver={(e) => {
                    if (!plan.popular) e.currentTarget.style.borderColor = '#1E3A8A';
                  }}
                  onMouseOut={(e) => {
                    if (!plan.popular) e.currentTarget.style.borderColor = 'transparent';
                  }}
                > 
                  {plan.popular && ( 
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1E3A8A] text-white text-[11px] px-3 py-1 rounded-full font-bold whitespace-nowrap"> 
                      Most Popular 
                    </span> 
                  )} 
                  <h3 className="text-lg font-bold text-[#0F172A]">{plan.name}</h3> 
                  <p className="my-3"> 
                    <span className="text-[2.5rem] font-bold text-[#1E3A8A]">
                      ₹{plan.price.toLocaleString('en-IN')} 
                    </span> 
                    <span className="text-sm text-[#475569] font-normal ml-1">/{plan.validity}</span> 
                  </p> 
                  <ul className="space-y-2 mb-6 flex-1"> 
                    {plan.features.map(f => ( 
                      <li key={f} className="text-sm text-[#374151] flex items-start gap-2"> 
                        <span className="text-[#16A34A]">✓</span> {f} 
                      </li> 
                    ))} 
                  </ul> 
                  <button 
                    onClick={() => handleSelectPlan(plan)} 
                    disabled={initiating} 
                    className="w-full bg-[#1E3A8A] hover:bg-[#16306B] disabled:opacity-60 text-white text-sm font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2" 
                  > 
                    {initiating ? ( 
                      <> 
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"> 
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/> 
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/> 
                        </svg> 
                        Please wait... 
                      </> 
                    ) : 'Select Plan'} 
                  </button> 
                </div> 
              ))} 
            </div> 
          </div> 
        )} 

        {/* QR Code & Proof Submission Form */} 
        {step === 'payment' && paymentData && selectedPlan && ( 
          <div className="max-w-[520px] mx-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(30,58,138,0.08)] p-8"> 
            <button 
              onClick={() => { setStep('plans'); setMessage('') }} 
              className="text-sm text-gray-500 hover:underline mb-4 block" 
            > 
              ← Back to plans 
            </button> 
            <h2 className="text-xl font-bold text-center mb-1 text-[#0F172A]"> 
              Pay ₹{selectedPlan.price.toLocaleString('en-IN')} 
            </h2> 
            <p className="text-[#475569] text-sm text-center mb-6"> 
              {selectedPlan.name} Plan — {selectedPlan.validity} 
            </p> 

            {/* QR Code */} 
            <div className="flex flex-col items-center mb-6"> 
              <div className="bg-white p-3 rounded-xl border-[8px] border-[#EFF6FF] shadow-sm mb-3"> 
                <img 
                  src={ 
                    paymentData?.payment_options?.upi?.qr_code_url || 
                    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=payalshinde906@okicici%26pn=CreditDataWatch%26am=${selectedPlan.price}%26cu=INR%26tn=${paymentData?.reference_id}`
                  } 
                  alt="UPI QR Code" 
                  className="w-48 h-48" 
                /> 
              </div> 
              <p className="text-xs text-[#475569] mt-1"> 
                UPI ID: <span className="font-mono font-bold text-[#374151]"> 
                  {paymentData?.payment_options?.upi?.upi_id || 'payalshinde906@okicici'} 
                </span> 
              </p> 
              <p className="text-xs text-[#3B82F6] font-semibold mt-1"> 
                Scan with GPay · PhonePe · Paytm · Any UPI app 
              </p> 
            </div> 

            {/* Payment Reference */} 
            <div className="bg-[#F8FAFF] rounded-xl px-4 py-3 text-center mb-5 border border-dashed border-[#93C5FD]"> 
              <p className="text-xs text-[#475569] mb-1">Payment Reference ID</p> 
              <p className="font-mono font-bold text-[#0F172A] text-sm tracking-wide"> 
                {paymentData?.reference_id} 
              </p> 
              <p className="text-xs text-[#475569] mt-1"> 
                Use this as the note/remark when paying 
              </p> 
            </div> 

            {/* Proof Input Fields */} 
            <div className="space-y-4"> 
              <div> 
                <label className="text-sm font-medium text-[#374151] block mb-1"> 
                  UPI Transaction ID / UTR Number * 
                </label> 
                <input 
                  type="text" 
                  value={upiRef} 
                  onChange={e => setUpiRef(e.target.value)} 
                  placeholder="e.g. 123456789012" 
                  className="w-full border-[1.5px] border-[#E2E8F0] rounded-[10px] px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#3B82F6] transition-all duration-200"
                /> 
              </div> 
              <div> 
                <label className="text-sm font-medium text-[#374151] block mb-1"> 
                  Upload Payment Screenshot * 
                </label> 
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setScreenshotFile(e.target.files[0])} 
                  className="w-full border-[1.5px] border-[#E2E8F0] rounded-[10px] px-4 py-3 text-sm text-[#0F172A] focus:outline-none focus:border-[#3B82F6] transition-all duration-200"
                /> 
              </div> 
              {message && ( 
                <p className="text-[#DC2626] text-sm bg-[#FEE2E2] border border-[#FECACA] rounded-lg px-3 py-2"> 
                  {message} 
                </p> 
              )} 
              <button 
                onClick={handleSubmitProof} 
                disabled={submitting} 
                className="w-full bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 text-white font-semibold py-3.5 rounded-[12px] flex items-center justify-center gap-2 transition-colors" 
              > 
                {submitting ? ( 
                  <> 
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"> 
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/> 
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/> 
                    </svg> 
                    Submitting... 
                  </> 
                ) : '✅ Submit Payment Proof'} 
              </button> 
            </div> 
          </div> 
        )} 

        {/* Confirmation Screen */} 
        {step === 'submitted' && ( 
          <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-2xl p-10 text-center"> 
            <p className="text-5xl mb-4">✅</p> 
            <h2 className="text-xl font-bold text-green-800 mb-2">Payment Proof Submitted!</h2> 
            <p className="text-green-700 text-sm mb-2"> 
              Your payment has been submitted for verification. 
            </p> 
            <p className="text-gray-500 text-xs mb-6"> 
              Our team will verify within 24 hours and activate your subscription. You will receive a confirmation email. 
            </p> 
            <button 
              onClick={() => setStep('plans')} 
              className="text-blue-600 text-sm hover:underline" 
            > 
              ← Back to plans 
            </button> 
          </div> 
        )} 
      </div> 
    </section> 
  ) 
}