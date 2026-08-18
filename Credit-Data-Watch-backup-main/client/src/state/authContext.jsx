/**
 * Authentication Context & Hook
 * 
 * Manages:
 * - Current logged-in user state
 * - User subscription and plan
 * - Feature access control
 * - Authentication status
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import authService from '../services/authService'

// Create auth context
const AuthContext = createContext(null)

/**
 * AuthProvider Component - Wrap your app with this
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('access_token') || localStorage.getItem('token') || null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load user on mount (if already authenticated)
  const loadUser = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      if (!token) {
        setUser(null)
        setLoading(false)
        return null
      }

      // Try to fetch current user (will fail if not authenticated)
      const userResponse = await authService.getCurrentUser()
      if (userResponse.ok && userResponse.data) {
        setUser(userResponse.data)
        setToken(token)
        
        // Also fetch subscription info
        const subResponse = await authService.getSubscription()
        if (subResponse.ok && subResponse.data) {
          setSubscription(subResponse.data)
        }
        return userResponse.data
      } else {
        // Not authenticated
        setUser(null)
        setToken(null)
        setSubscription(null)
        return null
      }
    } catch (err) {
      console.error('Failed to load user:', err)
      setError(err.message)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = useCallback(async (credentials) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authService.login(credentials)
      if (!response.ok) {
        setError(response.error)
        setLoading(false)
        return false
      }
      
      // Reload user data immediately
      const userData = await loadUser()
      return !!userData
    } catch (err) {
      setError(err.message)
      setLoading(false)
      return false
    }
  }, [loadUser])

  const register = useCallback(async (userData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authService.register(userData)
      if (!response.ok) {
        setError(response.error)
        return false
      }
      
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setUser(null)
      setToken(null)
      setSubscription(null)
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    try {
      setError(null)
      const response = await authService.updateProfile(updates)
      if (!response.ok) {
        setError(response.error)
        return false
      }
      
      // Update local user state
      if (response.data) {
        setUser(response.data)
      }
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  /**
   * Check if user can access a specific feature
   * @param {string} feature - Feature name (PO_MANAGEMENT, REPORT_OVERDUE, etc.)
   * @returns {boolean}
   */
  const canAccessFeature = useCallback((feature) => {
    if (!user) return false
    const role = String(user.role || '').toUpperCase()
    if (role === 'MASTER_ADMIN') return true
    // Check user-level bypass flags first
    if (user.subscription_bypass || user.full_access) return true
    // Then check subscription data
    return Boolean(subscription?.is_active)
  }, [user, subscription])

  /**
   * Get remaining days in subscription
   * @returns {number|null}
   */
  const getDaysRemaining = useCallback(() => {
    if (!subscription?.expiry_date) return null
    
    const expiryDate = new Date(subscription.expiry_date)
    const today = new Date()
    const diffTime = expiryDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return Math.max(0, diffDays)
  }, [subscription])

  const value = useMemo(() => ({
    // State
    user,
    token,
    subscription,
    isAuthenticated: !!user,
    loading,
    error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    loadUser,
    
    // Helpers
    canAccessFeature,
    getDaysRemaining,
  }), [
    user,
    token,
    subscription,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    loadUser,
    canAccessFeature,
    getDaysRemaining,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * Hook to use auth context
 * @throws {Error} if used outside AuthProvider
 * @returns {object} auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
