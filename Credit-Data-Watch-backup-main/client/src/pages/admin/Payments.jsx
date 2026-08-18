import { useState, useEffect } from 'react'
import { api } from '../../services/api/apiClient'
import { useAuth } from '../../state/authContext'

export default function Payments() {
  const { user } = useAuth()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await api.get('/workflow/my-tasks')
      if (res.ok) {
        setPayments(res.data?.pending_payments || [])
      }
    } catch (err) {
      console.error("Failed to fetch payments", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id, action) => {
    const notes = action === 'approve' ? 'Payment verified' : prompt('Reason for rejection:')
    if (action === 'reject' && !notes) return

    try {
      const endpoint = action === 'approve' ? `/workflow/approve/${id}` : `/workflow/reject/${id}`
      const res = await api.post(endpoint, { type: 'payment', notes })
      if (res.ok) {
        fetchPayments()
      } else {
        alert(res.error || "Action failed")
      }
    } catch (err) {
      alert("Action failed")
    }
  }

  if (loading) return <div className="p-10 text-center">Loading payments...</div>

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-black mb-6">💳 Subscription Payment Verifications</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {!payments.length ? (
          <div className="p-10 text-center text-gray-400 italic">No pending payments to verify ✅</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map(p => (
              <div key={p.id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-lg">{p.company_name}</p>
                    <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">{p.status}</span>
                  </div>
                  <p className="text-gray-600">{p.plan_name} — <span className="font-bold text-primary-600">₹{p.amount}</span></p>
                  <p className="text-xs text-gray-400 mt-1">{p.user_email} • {new Date(p.created_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => handleAction(p.id, 'approve')}
                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-md shadow-green-100 transition-all"
                  >
                    Verify Payment
                  </button>
                  <button 
                    onClick={() => handleAction(p.id, 'reject')}
                    className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
