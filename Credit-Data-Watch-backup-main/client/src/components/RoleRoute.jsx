/**
 * RoleRoute Component
 * 
 * Wraps routes that require specific roles and authentication.
 * Blocks unauthorized access and redirects to login if not authenticated.
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/authContext.jsx'
import PropTypes from 'prop-types'

export default function RoleRoute({ children, allowedRoles = [], requiredFeature = null }) {
  const { isAuthenticated, loading, canAccessFeature, user } = useAuth()
  const location = useLocation()

  // Still loading user state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Check GSTIN is present (mandatory requirement for most dashboard features)
  // Some roles might not need GSTIN if they are purely administrative, 
  // but keeping it as per existing logic for now.
  if (!user?.gstin && user?.role !== 'MASTER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GSTIN Required</h1>
          <p className="text-gray-600 mb-6">
            Your account must have a valid GSTIN to access this service.
          </p>
          <a href="/contact" className="btn-primary inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  const role = String(user?.role || '').toUpperCase()
  const isMasterAdmin = role === 'MASTER_ADMIN'

  // If MASTER_ADMIN, they have access to everything unless specifically restricted (rare)
  if (isMasterAdmin) {
    return children
  }

  // Check if role is allowed
  const isAllowed = allowedRoles.length === 0 || allowedRoles.some(r => r.toUpperCase() === role)

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have the required permissions to access this page.
          </p>
          <a href="/dashboard" className="btn-primary inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Go to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Check feature access if required (subscription guard)
  // Skip check if user has subscription_bypass or full_access
  if (requiredFeature && !user?.subscription_bypass && !user?.full_access && !canAccessFeature(requiredFeature)) {
    const featureMessageMap = {
      PO_MANAGEMENT: 'PO Management requires an active subscription',
    }
    const customMessage = featureMessageMap[requiredFeature] || 'This feature is not available on your current plan.'
    const prettyFeature = String(requiredFeature || '').replace(/_/g, ' ').toLowerCase()
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Restricted</h1>
          <p className="text-gray-600 mb-6">{customMessage}</p>
          <p className="text-sm text-gray-500 mb-8">
            Upgrade your subscription to access {prettyFeature}.
          </p>
          <a href="/membership" className="btn-primary inline-block px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            View Plans
          </a>
        </div>
      </div>
    )
  }

  return children
}

RoleRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  requiredFeature: PropTypes.string
}
