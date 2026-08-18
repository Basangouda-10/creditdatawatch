import { useState, useEffect } from 'react'
import { credibilityIndex } from '../services/api/apiClient'

export default function CredibilityPendingList({ type, title, description, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [reviews, setReviews] = useState([])
  const [selectedReview, setSelectedReview] = useState(null)
  const [formData, setFormData] = useState({ partner_trust_score: 4 })

  const loadReviews = async () => {
    setLoading(true)
    try {
      let res
      if (type === 'financial') {
        res = await credibilityIndex.getPendingFinancial()
      } else if (type === 'legal') {
        res = await credibilityIndex.getPendingLegal()
      } else if (type === 'operations') {
        res = await credibilityIndex.getPendingOperations()
      } else if (type === 'master-admin') {
        res = await credibilityIndex.getPendingMasterAdmin()
      }
      
      if (res && res.ok && Array.isArray(res.data)) {
        setReviews(res.data)
      } else if (Array.isArray(res)) {
        setReviews(res)
      }
    } catch (e) {
      console.error('Failed to load reviews:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (reviewId, approve) => {
    setLoading(true)
    try {
      let payload = { approve, ...formData }
      if (type === 'financial') {
        await credibilityIndex.submitFinancialReview(reviewId, payload)
      } else if (type === 'legal') {
        await credibilityIndex.submitLegalReview(reviewId, payload)
      } else if (type === 'operations') {
        await credibilityIndex.submitOperationsReview(reviewId, payload)
      } else if (type === 'master-admin') {
        await credibilityIndex.submitMasterAdminDecision(reviewId, payload)
      }
      await loadReviews()
      if (onRefresh) onRefresh()
      setSelectedReview(null)
      setFormData({ partner_trust_score: 4 })
    } catch (e) {
      console.error('Failed to submit review:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [type])

  return (
    <div className="card mb-6 bg-white p-5 rounded-xl shadow-sm border">
      <h3 className="text-lg font-heading font-bold mb-1 text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mb-4">{description}</p>

      {loading ? (
        <div className="text-center py-4 text-xs text-gray-500">Loading pending items...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center text-gray-500 py-4 text-xs">No pending reviews.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">{review.company_name}</h4>
                  {review.company_registration_no && (
                    <p className="text-xs text-gray-600">GSTIN / Reg No: {review.company_registration_no}</p>
                  )}
                  {review.user_email && (
                    <p className="text-xs text-gray-500">Requested By: {review.user_email}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    Submitted: {new Date(review.created_at || Date.now()).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReview(selectedReview?.id === review.id ? null : review)
                    setFormData({ partner_trust_score: 4, ai_credit_risk_verdict: 'Low Risk' })
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                >
                  {selectedReview?.id === review.id ? 'Close' : 'Review & Rate'}
                </button>
              </div>

              {selectedReview?.id === review.id && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* Financial Review Section */}
                  {type === 'financial' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Financial Health Score (1-10)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.financial_health_score || ''}
                          onChange={(e) => setFormData({...formData, financial_health_score: parseInt(e.target.value)})}
                          className="w-full px-3 py-1.5 border rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Payment History</label>
                        <select
                          value={formData.payment_history || ''}
                          onChange={(e) => setFormData({...formData, payment_history: e.target.value})}
                          className="w-full px-3 py-1.5 border rounded text-xs"
                        >
                          <option value="">Select</option>
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good</option>
                          <option value="Average">Average</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Operations Review Section with Interactive Star Rating & Verdict */}
                  {(type === 'operations' || type === 'master-admin') && (
                    <div className="space-y-4 bg-gray-50 p-3 rounded-lg border">
                      {/* Interactive 1-5 Star Rating Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Credibility Star Rating ({formData.partner_trust_score || 4} / 5 Stars)
                        </label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setFormData({ ...formData, partner_trust_score: star })}
                              className={`text-2xl transition-transform hover:scale-110 ${
                                star <= (formData.partner_trust_score || 0) ? 'text-amber-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* AI / Risk Verdict Badge Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Credit Risk Verdict
                        </label>
                        <div className="flex gap-2">
                          {[
                            { label: 'Low Risk', value: 'Low Risk', style: 'bg-emerald-600 text-white' },
                            { label: 'Medium Risk', value: 'Medium Risk', style: 'bg-amber-500 text-white' },
                            { label: 'High Risk', value: 'High Risk', style: 'bg-rose-600 text-white' },
                          ].map((v) => (
                            <button
                              key={v.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, ai_credit_risk_verdict: v.value })}
                              className={`flex-1 py-1.5 text-xs font-bold rounded border transition-colors ${
                                formData.ai_credit_risk_verdict === v.value
                                  ? v.style
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {type === 'master-admin' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Credibility Verification Status
                          </label>
                          <select
                            value={formData.credibility_status || 'Credibility Verified'}
                            onChange={(e) => setFormData({ ...formData, credibility_status: e.target.value })}
                            className="w-full px-3 py-1.5 border rounded text-xs bg-white"
                          >
                            <option value="Standard">Standard</option>
                            <option value="Credibility Verified">Credibility Verified</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Analysis / Review Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Analysis Notes *</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Provide reasoning for rating, GST compliance status, or payment history details..."
                      className="w-full px-3 py-2 border rounded text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  {/* Submission Action Buttons */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSubmit(review.id, false)}
                      className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded text-xs font-medium"
                      disabled={loading}
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit(review.id, true)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? 'Submitting...' : 'Approve & Publish to Global CIB'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={loadReviews} className="text-xs text-blue-600 hover:text-blue-800 mt-3 font-medium">
        ↻ Refresh List
      </button>
    </div>
  )
}