import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center px-4">
        <h1 className="text-7xl md:text-8xl font-heading font-bold text-primary-600 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">We could not find that page.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </motion.div>
    </div>
  )
}
