import { useState } from 'react'

export default function GenerateReportModal({ request, onClose, onSuccess }) {
  const [verdict, setVerdict] = useState('Safe')
  const [starRating, setStarRating] = useState(4)
  const [reportText, setReportText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch(`/api/v1/business-checks/${request.id}/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          verdict,
          star_rating: starRating,
          report_text: reportText,
        }),
      })

      if (res.ok) {
        onSuccess?.()
        onClose()
      } else {
        const errorData = await res.json()
        alert(errorData.detail || 'Failed to submit report')
      }
    } catch (err) {
      console.error('Failed to submit report', err)
      alert('Network error while generating report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[200]">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Generate Business Report</h3>
        <p className="text-xs text-gray-500 mb-4">Target: {request.company_name} ({request.gstin})</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Verdict Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Verdict Status</label>
            <div className="flex gap-2">
              {['Safe', 'Neutral', 'Risky'].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVerdict(v)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                    verdict === v
                      ? v === 'Safe'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : v === 'Neutral'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-rose-600 text-white border-rose-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {v === 'Safe' ? '✅ Safe' : v === 'Neutral' ? '⚠️ Neutral' : '🚨 Risky'}
                </button>
              ))}
            </div>
          </div>

          {/* 1 to 5 Star Rating Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Credit Score Rating ({starRating} / 5 Stars)
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setStarRating(star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    star <= starRating ? 'text-amber-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Report Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Analysis Report *</label>
            <textarea
              required
              rows={4}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Enter company payment history, GST filing record, or risk indicators..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reportText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish to Global CIB'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}