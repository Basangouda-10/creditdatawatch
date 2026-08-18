
import { motion } from 'framer-motion'

const TrustGauge = ({ score = 0 }) => {
  const normalized = Math.min(Math.max(score, 0), 5)
  const percentage = (normalized / 5) * 100

  const getColor = (percent) => {
    if (percent >= 80) return '#10B981'
    if (percent >= 60) return '#F59E0B'
    return '#EF4444'
  }

  const color = getColor(percentage)
  const circumference = 2 * Math.PI * 40
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#E0E7FF"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-heading font-bold" style={{ color }}>
            {normalized.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        /5 Trust Score
      </div>
    </div>
  )
}

export default TrustGauge
