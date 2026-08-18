import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../state/authContext'

export default function CTASection() {
  const { subscription, user } = useAuth()
  
  const isSubscribed = subscription?.is_active || user?.subscription_bypass || user?.full_access
  
  if (isSubscribed) {
    return null
  }
  
  return (
    <section 
      className="py-16 px-4 text-white text-center"
      style={{ 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
      }}
    >
      <div className="container-custom text-center max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to begin?</h2>
          <p className="text-[#93C5FD] text-lg mb-6">
            Formalize your trade acknowledgments, reduce risk, and accelerate collections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/appointment" className="bg-white text-[#0F172A] font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Book Appointment
            </Link>
            <Link to="/auth/register" className="border border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Login / Register
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
