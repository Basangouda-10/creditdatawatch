
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../state/authContext'

const MobileBottomNav = () => {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/credibility-index', label: 'Credibility', icon: '⭐' },
    { path: isAuthenticated ? '/dashboard' : '/auth', label: isAuthenticated ? 'Dashboard' : 'Login', icon: '👤' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              location.pathname === item.path ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default MobileBottomNav
