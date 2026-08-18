import { motion } from 'framer-motion'

export default function ScamAlert() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-gradient-to-r from-red-50 to-amber-50 border-l-4 border-red-500 py-6"
    >
      <div className="container-custom flex gap-4">
        <div className="mt-1">
          <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-red-900 mb-1">Scam Alert</h3>
          <p className="text-red-800 text-sm md:text-base font-medium">
            Important Fraud Alert: We have received reports of unauthorized individuals impersonating Preflex Solutions Pvt Ltd. For your security, please strictly verify the Account Number and Account Holder’s Name before processing any payments.
          </p>
        </div>
      </div>
    </motion.section>
  )
}
