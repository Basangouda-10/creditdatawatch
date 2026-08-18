
import { motion } from 'framer-motion'

const CompanyHoverCard = ({ company, registrationNo, children }) => {
  return (
    <div className="relative inline-block">
      {children}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4 hidden group-hover:block z-50"
      >
        <h4 className="font-heading font-bold text-gray-900 mb-1">{company}</h4>
        <p className="text-xs text-gray-500 mb-2">Reg. No: {registrationNo}</p>
        <div className="w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
      </motion.div>
    </div>
  )
}

export default CompanyHoverCard
