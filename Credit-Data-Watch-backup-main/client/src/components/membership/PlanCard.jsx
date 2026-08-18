import { motion } from 'framer-motion'
import PropTypes from 'prop-types'

export default function PlanCard({ plan, onSelect }) {
  const formatPrice = (price) => {
    if (price === 0) return 'Free'
    return `₹${price.toLocaleString('en-IN')}`
  }

  const formatValidity = (days) => {
    if (days === 365) return '1 Year'
    if (days === 180) return '6 Months'
    if (days === 30) return '1 Month'
    return `${days} Days`
  }

  const isPopular = plan.name === 'royal' || plan.name === 'groups'

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`card h-full relative overflow-hidden ${
        isPopular 
          ? 'border-2 border-primary-500 shadow-2xl ring-2 ring-primary-500/20' 
          : 'border border-primary-100'
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-primary text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
          MOST POPULAR
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-heading font-extrabold text-text-primary">{plan.display_name}</h3>
          <span className={`text-xs px-3 py-1 rounded-full font-bold ${
            isPopular 
              ? 'bg-primary-100 text-primary-700' 
              : 'bg-primary-50 text-primary-700'
          }`}>
            {formatValidity(plan.validity_days)}
          </span>
        </div>
        
        <p className="text-4xl font-heading font-extrabold text-text-primary mb-2">{formatPrice(plan.price)}</p>
        <p className="text-sm text-text-secondary mb-5">{plan.description}</p>
        
        <ul className="text-base text-text-secondary space-y-3 mb-7">
          <li className="flex items-start gap-3">
            <span className="text-success mt-1 text-xl">✓</span>
            <span>Validity: <strong className="text-text-primary">{formatValidity(plan.validity_days)}</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-success mt-1 text-xl">✓</span>
            <span>CIR Generation: <strong className="text-text-primary">{plan.cir_generation_fee || 'Included'}</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-success mt-1 text-xl">✓</span>
            <span>Legal Assistance: <strong className="text-text-primary">{plan.legal_assistance || plan.legal_assistance_limit || 'NO'}</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-success mt-1 text-xl">✓</span>
            <span>Reminder Follow-ups: <strong className="text-text-primary">{plan.reminder_followups || 'Yes'}</strong></span>
          </li>
        </ul>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-3 px-4 rounded-xl font-bold text-base transition-all ${
            isPopular 
              ? 'bg-gradient-primary text-white shadow-lg hover:shadow-xl' 
              : 'btn-primary'
          }`}
          onClick={() => onSelect(plan)}
        >
          Choose Plan
        </motion.button>
      </div>
    </motion.div>
  )
}

PlanCard.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    display_name: PropTypes.string.isRequired,
    validity_days: PropTypes.number.isRequired,
    price: PropTypes.number.isRequired,
    follow_up_limit: PropTypes.number,
    legal_assistance_limit: PropTypes.number,
    description: PropTypes.string,
    cir_generation_fee: PropTypes.string,
    legal_assistance: PropTypes.string,
    reminder_followups: PropTypes.string,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
}
