import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../state/authContext'
import { api } from '../../services/api/apiClient'
import NotificationBell from '../NotificationBell'

export default function Header() {
  const [open, setOpen] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState(null)

  const role = String(user?.role || '').toUpperCase()
  const isMasterAdmin = role === 'MASTER_ADMIN'

  // Dynamic Dashboard Link based on role
  const getDashboardLink = () => {
    if (!isAuthenticated) return '/dashboard'
    
    if (isMasterAdmin) return '/dashboard/admin'
    if (role === 'FINANCIAL' || role === 'FINANCE') return '/dashboard/financial'
    if (role === 'OPERATION' || role === 'OPERATIONS') return '/dashboard/operation'
    if (role === 'LEGAL') return '/dashboard/legal'
    return '/dashboard/user'
  }

  // UPDATED: Replaced the single "Dashboard" link with your two new Dashboards
  const navLinks = [
    { label: 'About', to: '/about' },
    { label: 'Services', to: '/services' },
    { label: 'Solutions', to: '/solutions' },
    { label: 'Offerings', to: '/offerings' },
    { label: 'Membership', to: '/membership' },
    { label: 'Wallet', to: '/wallet' },
    { label: 'Contact', to: '/contact' },
    { label: 'PO Dashboard', to: '/dashboard/po' },
    { label: 'Invoice Dashboard', to: '/dashboard/invoice' },
    { label: 'PO Credibility index', to: '/credibility-index/po' },          // <--- Added
    { label: 'Invoice Credibility index', to: '/credibility-index/invoice' }, // <--- Added
  ]

  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile()
    }
  }, [isAuthenticated, user])

  // Refresh profile when window gains focus (user returns from another tab/page)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user) {
        loadProfile()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [isAuthenticated, user])

  // Listen for custom event to refresh profile (triggered from Account page after upload)
  useEffect(() => {
    const handleProfileUpdate = () => {
      if (isAuthenticated && user) {
        loadProfile()
      }
    }
    window.addEventListener('profileUpdated', handleProfileUpdate)
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate)
  }, [isAuthenticated, user])

  const loadProfile = async () => {
    try {
      const response = await api.get('/account/profile')
      if (response.ok && response.data?.data) {
        setProfile(response.data.data)
      } else {
        // If profile doesn't exist, create an empty profile object
        setProfile(null)
      }
    } catch (err) {
      // Profile might not exist yet, that's okay
      setProfile(null)
    }
  }

  return (
    <header 
      className="sticky top-0 z-[100] bg-white/92 backdrop-blur-[12px] border-b border-[#E2E8F0] shadow-[0_2px_16px_rgba(30,58,138,0.06)]"
    >
      <div className="container-custom h-[72px] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 mr-8">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }}>
            {profile?.company_logo_url ? (
              <img 
                src={profile.company_logo_url} 
                alt="Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-cover shadow-lg"
              />
            ) : (
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-primary text-white font-heading font-bold text-base sm:text-xl flex items-center justify-center shadow-lg">
                CD
              </div>
            )}
          </motion.div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#1E3A8A]">CreditDataWatch</span>
            <span className="text-[10px] sm:text-xs text-[#64748B]">India's Credit Intelligence Hub</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative text-sm font-medium transition-all duration-200 ${
                  isActive ? 'text-[#1E3A8A] font-bold' : 'text-[#374151] hover:text-[#1E3A8A]'
                }`
              }
            >
              {({ isActive }) => (
                <motion.span whileHover={{ y: -1 }}>
                  {link.label}
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6] rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 hover:w-full'}`}></span>
                </motion.span>
              )}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-3">
              <NotificationBell />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/account"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-50 border-2 border-[#DBEAFE] hover:shadow-md transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-primary text-white font-heading font-bold text-xs flex items-center justify-center overflow-hidden shadow-md">
                    {profile?.profile_photo_url ? (
                      <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : user?.company_name ? (
                      user.company_name.charAt(0).toUpperCase()
                    ) : (
                      '👤'
                    )}
                  </div>
                  <span className="text-xs font-semibold text-text-primary truncate max-w-[120px]">
                    {user?.company_name || user?.email || 'User'}
                  </span>
                </Link>
              </motion.div>
            </div>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium text-[#374151] hover:text-[#1E3A8A] transition-colors duration-200">
                Login / Register
              </Link>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/appointment" className="btn-primary text-xs">
                  Book Appointment
                </Link>
              </motion.div>
            </>
          )}
        </nav>
        
        {/* Tablet nav */}
        <nav className="hidden md:flex lg:hidden items-center gap-4">
          {navLinks.slice(0, 3).map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative text-sm font-medium transition-all duration-200 ${
                  isActive ? 'text-[#1E3A8A] font-bold' : 'text-[#374151] hover:text-[#1E3A8A]'
                }`
              }
            >
              {({ isActive }) => (
                <motion.span whileHover={{ y: -1 }}>
                  {link.label}
                  <span className={`absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6] rounded-full transition-all duration-200 ${isActive ? 'w-full' : 'w-0 hover:w-full'}`}></span>
                </motion.span>
              )}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-2">
              <NotificationBell />
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link 
                  to="/account" 
                  className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-primary-50 border-2 border-[#DBEAFE] hover:shadow-md transition-all duration-200"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-primary text-white font-heading font-bold text-xs flex items-center justify-center overflow-hidden shadow-md">
                    {profile?.profile_photo_url ? (
                      <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : user?.company_name ? (
                      user.company_name.charAt(0).toUpperCase()
                    ) : (
                      '👤'
                    )}
                  </div>
                </Link>
              </motion.div>
            </div>
          ) : (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/auth" className="btn-primary text-xs">
                Login
              </Link>
            </motion.div>
          )}
        </nav>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="md:hidden p-2 rounded-xl border border-[#E2E8F0] bg-white text-text-primary shadow-sm transition-all duration-200"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-[#E2E8F0] shadow-md"
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="container-custom py-6 space-y-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `block text-base font-semibold py-2 ${isActive ? 'text-[#1E3A8A] bg-primary-50 rounded-lg px-3' : 'text-text-secondary hover:text-[#1E3A8A] hover:bg-primary-50/50 rounded-lg px-3'}`
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              
              {isAuthenticated ? (
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 border border-[#DBEAFE]"
                  onClick={() => setOpen(false)}
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-primary text-white font-heading font-bold text-sm flex items-center justify-center overflow-hidden">
                    {profile?.profile_photo_url ? (
                      <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : user?.company_name ? (
                      user.company_name.charAt(0).toUpperCase()
                    ) : (
                      '👤'
                    )}
                  </div>
                  <span className="text-sm font-semibold text-text-primary">
                    {user?.company_name || user?.email || 'User'}
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth"
                    className="block text-base font-semibold text-text-secondary hover:text-[#1E3A8A] py-2"
                    onClick={() => setOpen(false)}
                  >
                    Login / Register
                  </Link>
                  <Link
                    to="/appointment"
                    className="btn-primary w-full text-center"
                    onClick={() => setOpen(false)}
                  >
                    Book Appointment
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}