import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import authService from '../../services/authService'

export default function ForgotPassword() {
  const [step, setStep] = useState('email') // email, otp, password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })
    
    if (!email?.includes('@')) {
      setStatus({ type: 'error', message: 'Enter a valid email address' })
      return
    }

    setLoading(true)
    try {
      const response = await authService.sendPasswordResetOtp(email)
      if (response.ok) {
        setStatus({ type: 'success', message: 'OTP sent to your email' })
        setStep('otp')
      } else {
        setStatus({ type: 'error', message: response.error || 'Failed to send OTP' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })
    
    if (!otp || otp.length < 4) {
      setStatus({ type: 'error', message: 'Enter a valid OTP' })
      return
    }

    setLoading(true)
    try {
      const response = await authService.verifyPasswordResetOtp(email, otp)
      if (response.ok) {
        setStatus({ type: 'success', message: 'OTP verified. Set your new password.' })
        setStep('password')
      } else {
        setStatus({ type: 'error', message: response.error || 'Invalid OTP' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })
    
    if (password !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }
    
    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    try {
      const response = await authService.resetPassword(email, otp, password)
      if (response.ok) {
        setStatus({ type: 'success', message: 'Password reset successful! Redirecting to login...' })
        setTimeout(() => globalThis.location.href = '/auth/login', 2000)
      } else {
        setStatus({ type: 'error', message: response.error || 'Failed to reset password' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary-600 text-white font-heading font-bold text-xl flex items-center justify-center">CD</div>
            <span className="font-heading font-bold text-2xl text-gray-900">CreditDataWatch</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold">Reset Password</h1>
          <p className="text-gray-600">Recover access to your account</p>
        </div>

        <div className="card">
          {status.message && (
            <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
              status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {status.message}
            </div>
          )}

          {step === 'email' && (
            <form className="space-y-4" onSubmit={handleSendOtp}>
              <div>
                <label htmlFor="forgot-email" className="text-sm font-semibold text-gray-700">Email Address</label>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs text-gray-500">We&apos;ll send you an OTP to reset your password.</p>
              <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <div>
                <label htmlFor="forgot-otp" className="text-sm font-semibold text-gray-700">OTP Code</label>
                <input
                  id="forgot-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  placeholder="Enter 6-digit code"
                />
              </div>
              <p className="text-xs text-gray-500">Check your email for the OTP code. It expires in 10 minutes.</p>
              <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-gray-600 hover:text-gray-900"
              >
                Back to email
              </button>
            </form>
          )}

          {step === 'password' && (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="forgot-password" className="text-sm font-semibold text-gray-700">New Password</label>
                <div className="relative mt-2">
                  <input
                    id="forgot-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="forgot-confirm-password" className="text-sm font-semibold text-gray-700">Confirm Password</label>
                <div className="mt-2">
                  <input
                    id="forgot-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link to="/auth/login" className="text-primary-700 font-semibold hover:text-primary-800">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
