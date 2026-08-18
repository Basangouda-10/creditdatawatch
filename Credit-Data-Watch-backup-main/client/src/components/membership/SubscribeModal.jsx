import { motion, AnimatePresence } from 'framer-motion'
import PropTypes from 'prop-types'
import { useState } from 'react'
import { api } from '../../services/api/apiClient'

export default function SubscribeModal({ plan, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!plan) return

    try {
      setLoading(true)
      setError(null)

      // Call subscription purchase endpoint
      const response = await api.post('/subscriptions', {
        plan_id: plan.id,
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 2000)
      } else {
        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/auth/login?redirect=/membership'
          return
        }
        setError(response.error || 'Failed to purchase subscription')
      }
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!plan) return null

  const formatPrice = (price) => {
    if (price === 0) return 'Free'
    return `₹${price.toLocaleString('en-IN')}`
  }

  return (
    <AnimatePresence>
      {plan && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✓</div>
                <h3 className="text-2xl font-heading font-bold text-gray-900 mb-2">
                  Subscription Active!
                </h3>
                <p className="text-gray-600">
                  You now have access to all {plan.display_name} plan features.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-heading font-bold">Subscribe to {plan.display_name}</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-lg font-semibold text-gray-900">{formatPrice(plan.price)}</p>
                <p className="text-sm text-gray-600 mb-2">
                  Validity: {plan.validity_days} days
                </p>

                {plan.description && (
                  <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                )}

                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
                  <p className="font-semibold mb-2">Includes:</p>
                  <ul className="space-y-1">
                    <li>✓ {plan.follow_up_limit} follow-ups</li>
                    <li>✓ {plan.legal_assistance_limit} legal escalations</li>
                    <li>✓ Full feature access</li>
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
                    {typeof error === 'object' ? (error.message || error.detail || JSON.stringify(error)) : String(error)}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Proceed to Payment'}
                </button>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Payment is stubbed for development. Your subscription is activated immediately.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

SubscribeModal.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    display_name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    validity_days: PropTypes.number.isRequired,
    follow_up_limit: PropTypes.number.isRequired,
    legal_assistance_limit: PropTypes.number.isRequired,
    description: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
}
