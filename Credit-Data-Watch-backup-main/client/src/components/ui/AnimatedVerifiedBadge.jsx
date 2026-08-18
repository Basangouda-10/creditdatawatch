
import { motion } from 'framer-motion'

const AnimatedVerifiedBadge = () => {
  return (
    <motion.span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400 }}
    >
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
      >
        ✅
      </motion.span>
      Credibility Verified
    </motion.span>
  )
}

export default AnimatedVerifiedBadge
