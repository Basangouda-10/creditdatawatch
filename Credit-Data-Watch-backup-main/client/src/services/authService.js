/**
 * Authentication Service
 * 
 * Manages user authentication state and API interactions
 */

import { auth, user as userApi } from './api/apiClient'

/**
 * Save tokens to localStorage
 * @param {object} data - Response data containing tokens
 */
const saveTokens = (data) => {
  if (!data) return
  
  // Support both flat and nested token structure
  const accessToken = data.access_token || data.token || data.tokens?.access_token
  const refreshToken = data.refresh_token || data.tokens?.refresh_token
  
  if (accessToken) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('token', accessToken)
  }
  
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken)
  }
}

/**
 * Register a new user
 */
export async function register(userData) {
  const response = await auth.register({
    company_name: userData.company_name || userData.company,
    email: userData.email,
    password: userData.password,
    phone: userData.phone,
    gstin: userData.gstin,
    otp_code: userData.otp_code,
  })

  if (response.ok && response.data) {
    saveTokens(response.data)
  }

  return response
}

/**
 * Login user with credentials
 */
export async function login(credentials) {
  const response = await auth.login({
    email: credentials.email,
    password: credentials.password,
    gstin: credentials.gstin,
  })
  
  if (response.ok && response.data) {
    saveTokens(response.data)
  }
  
  return response
}

export async function sendEmailLoginOtp(email) {
  return auth.sendEmailLoginOtp({ email })
}

export async function verifyEmailLoginOtp(email, gstin, otp_code) {
  const response = await auth.verifyEmailLoginOtp({ email, gstin, otp_code })
  
  if (response.ok && response.data) {
    saveTokens(response.data)
  }
  
  return response
}

/**
 * Logout current user (clears server-side cookies)
 * @returns {Promise<{ok: boolean}>}
 */
export async function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  return auth.logout()
}

/**
 * Send OTP for password reset
 * @param {string} email - Email address
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>}
 */
export async function sendPasswordResetOtp(email) {
  return auth.sendPasswordResetOtp({ email })
}

/**
 * Verify password reset OTP
 * @param {string} email - Email address
 * @param {string} otp_code - OTP code
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function verifyPasswordResetOtp(email, otp_code) {
  return auth.verifyPasswordResetOtp({ email, otp_code })
}

/**
 * Reset password with verified OTP
 * @param {string} email - Email address
 * @param {string} otp_code - Verified OTP code
 * @param {string} password - New password
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function resetPassword(email, otp_code, password) {
  return auth.resetPassword({ email, otp_code, password })
}

/**
 * Get current user's profile (requires valid access token cookie)
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function getCurrentUser() {
  return userApi.getProfile()
}

/**
 * Update user profile
 * @param {object} updates - { company_name?, email?, phone? }
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function updateProfile(updates) {
  return userApi.updateProfile(updates)
}

/**
 * Get user's subscription info
 * @returns {Promise<{ok: boolean, data?: {id, plan, is_active, start_date, expiry_date}, error?: string}>}
 */
export async function getSubscription() {
  return userApi.getSubscription()
}

/**
 * Send OTP for phone number verification (registration flow)
 * @param {string} phone - E.164 format phone number
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>}
 */
export async function sendPhoneOtp(phone) {
  return auth.sendOtp({
    phone,
    reason: 'phone_verification',
  })
}

/**
 * Verify phone OTP (registration flow)
 * @param {string} phone - E.164 format phone number
 * @param {string} otp_code - OTP code (6 digits)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function verifyPhoneOtp(phone, otp_code) {
  return auth.verifyOtp({
    phone,
    otp_code,
  })
}

/**
 * Start phone change process (account settings)
 * @param {string} new_phone - E.164 format phone number
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>}
 */
export async function sendPhoneChangeOtp(new_phone) {
  return userApi.sendPhoneChangeOtp({
    new_phone,
  })
}

/**
 * Verify OTP and update phone number (account settings)
 * @param {string} new_phone - E.164 format phone number
 * @param {string} otp_code - OTP code (6 digits)
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function verifyPhoneChangeOtp(new_phone, otp_code) {
  return userApi.verifyPhoneChangeOtp({
    new_phone,
    otp_code,
  })
}

/**
 * Send OTP for email change
 * @param {string} new_email - New email address
 * @returns {Promise<{ok: boolean, message?: string, error?: string}>}
 */
export async function sendEmailChangeOtp(new_email) {
  return userApi.sendEmailChangeOtp({
    new_email,
  })
}

/**
 * Verify OTP and update email address
 * @param {string} new_email - New email address
 * @param {string} otp_code - OTP code (6 digits)
 * @returns {Promise<{ok: boolean, data?: object, error?: string}>}
 */
export async function verifyEmailChangeOtp(new_email, otp_code) {
  return userApi.verifyEmailChangeOtp({
    new_email,
    otp_code,
  })
}

/**
 * Check if user is currently authenticated
 * Attempts to fetch user profile - returns true if successful
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const response = await getCurrentUser()
  return response.ok
}

/**
 * Refresh access token (called automatically by apiClient on 401)
 * @returns {Promise<boolean>} - true if refresh succeeded
 */
export async function refreshToken() {
  const response = await auth.refreshToken()
  return response === true // refreshAccessToken returns boolean directly
}

export default {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  getSubscription,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendPhoneChangeOtp,
  verifyPhoneChangeOtp,
  sendEmailChangeOtp,
  verifyEmailChangeOtp,
  isAuthenticated,
  refreshToken,
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
  resetPassword,
  sendEmailLoginOtp,
  verifyEmailLoginOtp,
}
