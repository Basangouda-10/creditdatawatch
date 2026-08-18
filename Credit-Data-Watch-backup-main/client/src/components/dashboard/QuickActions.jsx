import { Link } from 'react-router-dom'
import { useAuth } from '../../state/authContext'

const actions = [
  { 
    emoji: '📋', 
    label: 'Report Overdue Payer', 
    to: '/defaulters/report', 
    feature: 'REPORT_OVERDUE',
    color: 'blue'
  },
  { 
    emoji: '👥', 
    label: 'View Defaulters', 
    to: '/defaulters', 
    feature: 'REPORT_OVERDUE',
    color: 'purple'
  },
  { 
    emoji: '🤝', 
    label: 'Settlement', 
    to: '/settlement', 
    feature: 'SETTLEMENT',
    color: 'orange'
  },
]

export default function QuickActions() {
  const { canAccessFeature, user } = useAuth()
  const role = String(user?.role || '').toUpperCase()
  const isMasterAdmin = role === 'MASTER_ADMIN'
  const allActions = [
    ...actions,
    ...((role === 'MASTER_ADMIN' || role === 'COMPANY_ADMIN') ? [{ 
      emoji: '👥', 
      label: 'Team Management', 
      to: '/admin/team',
      color: 'indigo'
    }] : []),
  ]

  return (
    <div className="flex flex-wrap gap-4">
      {allActions.map((item) => (
        <Link 
          key={item.label} 
          to={item.to} 
          className="flex items-center gap-3 px-5 py-4 rounded-[12px] border border-[#E2E8F0] bg-white hover:bg-[#EFF6FF] hover:border-[#3B82F6] transition-all duration-200 group"
        >
          <span className="text-2xl group-hover:text-[#3B82F6] transition-colors">{item.emoji}</span>
          <span className="text-base font-semibold text-[#0F172A] group-hover:text-[#1E3A8A]">{item.label}</span>
          {item.feature && !isMasterAdmin && !canAccessFeature(item.feature) && (
            <span className="text-[11px] font-semibold bg-[#FEF3C7] text-[#D97706] border border-[#F59E0B] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Upgrade
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
