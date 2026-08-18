import { useState, useEffect } from 'react'
import { STATIC_BASE_URL } from '../services/api/apiClient'

// Helper to get full static URL
const getStaticUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${STATIC_BASE_URL}${url.startsWith('/') ? url : '/' + url}`
}

export default function PaymentActivityLog({ token }) {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/v1/purchase-orders/financial/payment-activity', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => { 
      setPayments(d.data || []); 
      setLoading(false); 
    })
    .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="p-8 text-center text-gray-400">
        <div className="text-4xl mb-2">💳</div>
        <p>No payment activity yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {payments.map(p => (
        <div key={p.id} className="p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900">
                  {p.po_number}
                </span>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                  PAID ✅
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                Vendor: {p.vendor} —
                <span className="font-semibold text-gray-800">
                  {' '}₹{Number(p.amount || 0).toLocaleString('en-IN')}
                </span>
              </p>
              <p className="text-xs text-gray-400">
                Paid by: {p.user_email} •{' '}
                {p.paid_at ? new Date(p.paid_at).toLocaleString('en-IN') : ''}
              </p>
              {p.reason && (
                <p className="text-xs text-gray-500 mt-1">
                  Reason: {p.reason}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              {p.payment_receipt_url ? (
                <a
                  href={getStaticUrl(p.payment_receipt_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  📎 View Receipt
                  {p.payment_receipt_filename && (
                    <span className="text-blue-400">
                      ({p.payment_receipt_filename})
                    </span>
                  )}
                </a>
              ) : (
                <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                  ⚠️ No receipt
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
