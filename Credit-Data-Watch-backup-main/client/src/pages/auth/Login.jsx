import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { isValidGstin } from '../../utils/validation'
import { useAuth } from '../../state/authContext'
import authService from '../../services/authService'
import { logActivity, ACTIONS } from '../../utils/activityLogger'

export default function Login() {
  const navigate = useNavigate()
  const { login, loadUser, error } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', gstin: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState('password')
  const [otpEmail, setOtpEmail] = useState('')
  const [otpGstin, setOtpGstin] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [submittingOtp, setSubmittingOtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })
    
    // Validation
    if (!form.email || !form.email.includes('@')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address' })
      return
    }
    
    if (!isValidGstin(form.gstin)) {
      setStatus({ type: 'error', message: 'Enter a valid GSTIN (15 characters)' })
      return
    }
    
    if (!form.password || form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }
    
    setSubmitting(true)
    try {
      const success = await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        gstin: form.gstin.trim().toUpperCase(),
      })
      
      if (success) {
        logActivity(ACTIONS.LOGIN, { details: 'User logged in successfully' }) 
        setStatus({ type: 'success', message: 'Login successful! Redirecting...' })
        
        // Navigation based on role
        const userData = await loadUser()
        if (userData) {
          const role = String(userData.role || '').toUpperCase()
          if (role === 'MASTER_ADMIN') {
            navigate('/dashboard/admin')
          } else if (role === 'FINANCIAL' || role === 'FINANCE') {
            navigate('/dashboard/financial')
          } else if (role === 'OPERATION' || role === 'OPERATIONS') {
            navigate('/dashboard/operation')
          } else if (role === 'LEGAL') {
            navigate('/dashboard/legal')
          } else {
            navigate('/dashboard/user')
          }
        } else {
          // Fallback if loadUser fails
          navigate('/dashboard')
        }
      } else {
        // Use error from context if available, else fallback to default message
        setStatus({ 
          type: 'error', 
          message: error || 'Invalid email, password, or GSTIN. Please check your credentials.' 
        })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error: ' + error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendEmailLoginOtp = async () => {
    setStatus({ type: '', message: '' })
    if (!otpEmail || !otpEmail.includes('@')) {
      setStatus({ type: 'error', message: 'Enter a valid email address' })
      return
    }
    if (!isValidGstin(otpGstin)) {
      setStatus({ type: 'error', message: 'Enter a valid GSTIN (15 characters)' })
      return
    }
    setSendingOtp(true)
    const res = await authService.sendEmailLoginOtp(otpEmail.trim().toLowerCase())
    if (res.ok) {
      setOtpSent(true)
      setStatus({ type: 'success', message: 'OTP sent to your email' })
    } else {
      setStatus({ type: 'error', message: res.error || 'Failed to send OTP' })
    }
    setSendingOtp(false)
  }

  const handleVerifyEmailLoginOtp = async () => {
    setStatus({ type: '', message: '' })
    if (!otpCode || otpCode.length !== 6) {
      setStatus({ type: 'error', message: 'Enter the 6-digit OTP code' })
      return
    }
    setSubmittingOtp(true)
    const res = await authService.verifyEmailLoginOtp(
      otpEmail.trim().toLowerCase(),
      otpGstin.trim().toUpperCase(),
      otpCode.trim()
    )
    if (res.ok) {
      const userData = await loadUser()
      setStatus({ type: 'success', message: 'Login successful! Redirecting...' })
      
      if (userData) {
        const role = String(userData.role || '').toUpperCase()
        if (role === 'MASTER_ADMIN') {
          navigate('/dashboard/admin')
        } else if (role === 'FINANCIAL' || role === 'FINANCE') {
          navigate('/dashboard/financial')
        } else if (role === 'OPERATION' || role === 'OPERATIONS') {
          navigate('/dashboard/operation')
        } else if (role === 'LEGAL') {
          navigate('/dashboard/legal')
        } else {
          navigate('/dashboard/user')
        }
      } else {
        navigate('/dashboard')
      }
    } else {
      setStatus({ type: 'error', message: res.error || 'Invalid OTP' })
    }
    setSubmittingOtp(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient */}
      <div 
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
        }}
      >
        {/* Dot Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Decorative Circle */}
        <div 
          className="absolute bottom-[-150px] right-[-150px] rounded-full"
          style={{
            width: '400px',
            height: '400px',
            backgroundColor: '#0F172A',
            opacity: 0.05
          }}
        />
        
        {/* Top Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white text-[#1E3A8A] font-bold text-2xl flex items-center justify-center">CD</div>
            <span className="font-bold text-2xl text-white">CreditDataWatch</span>
          </Link>
        </div>

        {/* Middle Content */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold text-white mb-4">
            Welcome back!
          </h2>
          <p className="text-[#93C5FD] text-lg mb-8">
            Access your business credit insights and manage your account.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-lg">Secure</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-lg">Trusted</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                <svg className="w-4 h-4 text-[#1E3A8A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white font-medium text-lg">Verified</span>
            </div>
          </div>
        </div>
        
        {/* Bottom Content */}
        <div className="relative z-10">
          <p className="text-[#93C5FD] text-sm">
            © 2024 CreditDataWatch. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
          <div className="mb-8">
            <h1 className="text-[1.8rem] font-bold text-[#0F172A] mb-2">
              {mode === 'password' ? 'Welcome Back' : 'Login with OTP'}
            </h1>
            <p className="text-[#475569]">GST-registered entities only</p>
          </div>

          {status.message && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold ${
              status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {status.message}
            </div>
          )}

          <div className="flex gap-2 mb-6">
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${mode === 'password' 
                ? 'bg-[#1E3A8A] text-white' 
                : 'bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#DBEAFE]'}`}
              onClick={() => setMode('password')}
              type="button"
            >
              Password Login
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${mode === 'otp' 
                ? 'bg-[#1E3A8A] text-white' 
                : 'bg-[#EFF6FF] text-[#1E3A8A] hover:bg-[#DBEAFE]'}`}
              onClick={() => setMode('otp')}
              type="button"
            >
              Email OTP Login
            </button>
          </div>

          {mode === 'password' ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-[#0F172A]">Work Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="text-sm font-medium text-[#0F172A]">Password</label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0F172A] focus:outline-none"
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
                <label htmlFor="gstin" className="text-sm font-medium text-[#0F172A]">GSTIN (mandatory)</label>
                <input
                  id="gstin"
                  name="gstin"
                  value={form.gstin}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                  placeholder="22AAAAA0000A1Z5"
                />
                <p className="text-xs text-[#64748B] mt-1">GSTIN will be validated during login.</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[#1D4ED8] focus:ring-[#1D4ED8] border-[#E2E8F0] rounded"
                  />
                  <label className="ml-2 block text-sm text-[#475569]">
                    Remember me
                  </label>
                </div>
                <Link to="/auth/forgot-password" className="text-sm text-[#1D4ED8] font-semibold hover:text-[#1E3A8A]">
                  Forgot password?
                </Link>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-3 rounded-[12px] text-white font-bold transition-all duration-200 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                }}
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <label htmlFor="otp-email" className="text-sm font-medium text-[#0F172A]">Work Email</label>
                <input
                  id="otp-email"
                  type="email"
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  disabled={otpSent}
                  className="mt-2 w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)] disabled:bg-[#F1F5F9]"
                />
              </div>

              <div>
                <label htmlFor="otp-gstin" className="text-sm font-medium text-[#0F172A]">GSTIN (mandatory)</label>
                <input
                  id="otp-gstin"
                  value={otpGstin}
                  onChange={(e) => setOtpGstin(e.target.value)}
                  disabled={otpSent}
                  className="mt-2 w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)] disabled:bg-[#F1F5F9]"
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSendEmailLoginOtp}
                  disabled={sendingOtp || otpSent}
                  className="px-6 py-3 rounded-[12px] bg-[#EFF6FF] text-[#1E3A8A] font-semibold whitespace-nowrap transition-colors hover:bg-[#DBEAFE] disabled:opacity-60"
                >
                  {sendingOtp ? 'Sending...' : otpSent ? 'Sent ✓' : 'Send OTP'}
                </button>
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="otp-code" className="text-sm font-medium text-[#0F172A]">Enter OTP</label>
                  <div className="flex gap-2">
                    <input
                      id="otp-code"
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="flex-1 rounded-[12px] border border-[#E2E8F0] px-4 py-3 text-center text-xl tracking-widest font-mono focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyEmailLoginOtp}
                      disabled={submittingOtp}
                      className="px-6 py-3 rounded-[12px] text-white font-bold transition-all duration-200 disabled:opacity-60"
                      style={{
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                      }}
                    >
                      {submittingOtp ? 'Verifying...' : 'Verify & Login'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-[#475569] mt-8 text-center">
            New here? <Link to="/auth/register" className="text-[#1D4ED8] font-semibold hover:underline">Create an account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
