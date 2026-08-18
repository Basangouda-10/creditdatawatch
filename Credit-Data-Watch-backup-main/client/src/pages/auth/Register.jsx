import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatE164 } from '../../utils/phone'
import { isValidGstin } from '../../utils/validation'
import { useAuth } from '../../state/authContext'
import authService from '../../services/authService'

export default function Register() {
  const navigate = useNavigate()
  const { loadUser } = useAuth()
  const [form, setForm] = useState({
    company: '',
    email: '',
    password: '',
    confirm: '',
    phone: '',
    gstin: '',
    accepts: false,
  })
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [timer, setTimer] = useState(0)

  const [status, setStatus] = useState({ type: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: value })
  }

  const handleSendOtp = async () => {
    setStatus({ type: '', message: '' })
    
    // Validate email and phone first
    if (!form.email || !form.email.includes('@')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address' })
      return
    }

    const phoneE164 = formatE164(form.phone)
    if (!phoneE164) {
      setStatus({ type: 'error', message: 'Enter a valid phone number with country code (e.g., +91XXXXXXXXXX)' })
      return
    }

    setSendingOtp(true)
    try {
      const response = await import('../../services/api/apiClient').then(m => m.api.post('/auth/register/send-otp', {
        email: form.email.trim().toLowerCase(),
        phone: phoneE164,
      }))
      if (response.ok) {
        setOtpSent(true)
        setTimer(60) // Start 60 second timer
        setStatus({
          type: 'success',
          message: response.data?.message || 'OTP sent to your email and phone. Check your inbox/SMS.'
        })
        if (response.data?.otp_code) {
          console.log('OTP Code (dev):', response.data.otp_code)
          setStatus({
            type: 'success',
            message: `OTP sent! Check console for OTP code: ${response.data.otp_code}`
          })
        }
      } else {
        setStatus({ type: 'error', message: response.error || 'Failed to send OTP' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error: ' + error.message })
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })

    // Validation
    if (!form.company || form.company.trim().length < 2) {
      setStatus({ type: 'error', message: 'Company name must be at least 2 characters' })
      return
    }

    if (!form.email || !form.email.includes('@') || !form.email.includes('.')) {
      setStatus({ type: 'error', message: 'Please enter a valid email address' })
      return
    }

    // Password validation - minimum 8 characters
    if (!form.password || form.password.trim().length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters' })
      return
    }

    // Password validation - maximum length safeguard
    if (form.password.trim().length > 256) {
      setStatus({ type: 'error', message: 'Password must be less than 256 characters' })
      return
    }

    if (form.password !== form.confirm) {
      setStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }

    const phoneE164 = formatE164(form.phone)
    if (!phoneE164) {
      setStatus({ type: 'error', message: 'Enter a valid phone number with country code (e.g., +91XXXXXXXXXX)' })
      return
    }

    if (!isValidGstin(form.gstin)) {
      setStatus({ type: 'error', message: 'Enter a valid GSTIN (15 characters, format: 22AAAAA0000A1Z5)' })
      return
    }

    if (!form.accepts) {
      setStatus({ type: 'error', message: 'Please accept the terms and privacy policy' })
      return
    }

    if (!otpSent) {
      setStatus({ type: 'error', message: 'Please verify your email and phone by sending OTP first' })
      return
    }

    if (!otpCode || otpCode.length !== 6) {
      setStatus({ type: 'error', message: 'Please enter the 6-digit OTP code' })
      return
    }

    setSubmitting(true)
    try {
      const response = await authService.register({
        company_name: form.company.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password.trim(),
        phone: phoneE164,
        gstin: form.gstin.trim().toUpperCase(),
        otp_code: otpCode.trim(),
      })

      if (response.ok) {
        setStatus({ type: 'success', message: 'Account created successfully! Logging you in...' })
        await loadUser()
        setTimeout(() => navigate('/dashboard'), 1000)
      } else {
        setStatus({ type: 'error', message: response.error || 'Registration failed. Please check your information and try again.' })
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error: ' + error.message })
    } finally {
      setSubmitting(false)
    }
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
            Join us today!
          </h2>
          <p className="text-[#93C5FD] text-lg mb-8">
            Create your account to access business credit insights and manage your account.
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
              Create Account
            </h1>
            <p className="text-[#475569]">GST-validated access for businesses</p>
          </div>

          <div className="mb-6 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-4 py-3">
            <p className="font-semibold text-[#78350F] mb-1">📌 Important:</p>
            <p className="text-[#78350F] text-sm">Registration creates your account. You'll then choose a subscription plan to unlock features.</p>
          </div>

          {status.message && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-sm font-semibold ${
              status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {status.message}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="company" className="text-sm font-medium text-[#0F172A]">Company / Legal Name</label>
                <input
                  id="company"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                />
              </div>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    minLength={8}
                    maxLength={64}
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
                <p className="text-xs text-[#64748B] mt-1">Minimum 8 characters, maximum 64</p>
              </div>
              <div>
                <label htmlFor="confirm" className="text-sm font-medium text-[#0F172A]">Confirm Password</label>
                <div className="relative mt-2">
                  <input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                  />
                </div>
              </div>
            </div>

            {/* Phone + Send OTP (Full Width) */}
            <div>
              <label htmlFor="phone" className="text-sm font-medium text-[#0F172A]">Phone</label>
              <div className="mt-2 flex gap-2 items-stretch">
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="+91XXXXXXXXXX"
                  disabled={otpSent}
                  className="flex-1 px-4 py-3 rounded-[12px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)] disabled:bg-[#F1F5F9]"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || timer > 0}
                  className="px-6 py-3 rounded-[12px] text-white font-semibold whitespace-nowrap transition-all duration-200 disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                  }}
                >
                  {sendingOtp ? 'Sending...' : timer > 0 ? `Resend in ${timer}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
              <p className="text-xs text-[#64748B] mt-1">Include country code (e.g., +91 for India)</p>
            </div>

            {/* GSTIN Field (Full Width Below Phone) */}
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
              <p className="text-xs text-[#64748B] mt-1">GSTIN will be validated and revalidated periodically.</p>
            </div>

            {/* OTP Verification */}
            {otpSent && (
              <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[12px] p-5">
                <label htmlFor="otp" className="text-sm font-semibold text-[#1E3A8A] block mb-3">
                  Enter OTP Code (sent to your email and phone)
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full rounded-[12px] border border-[#93C5FD] px-4 py-3 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)] text-center text-xl tracking-widest font-mono"
                  required
                />
                <p className="text-xs text-[#475569] mt-2">
                  Check your email inbox and SMS for the 6-digit OTP code
                </p>
              </div>
            )}

            <label className="flex items-start gap-3 text-sm text-[#475569]">
              <input
                type="checkbox"
                name="accepts"
                checked={form.accepts}
                onChange={handleChange}
                required
                className="mt-1 h-4 w-4 text-[#1D4ED8] border-[#E2E8F0] rounded"
              />
              <span className="text-[#475569]">
                I confirm that my entity is GST-registered and agree to the{' '}
                <Link to="/terms" target="_blank" className="text-[#1D4ED8] hover:text-[#1E3A8A] underline font-medium">Terms</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" className="text-[#1D4ED8] hover:text-[#1E3A8A] underline font-medium">Privacy Policy</Link>.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-[12px] text-white font-bold transition-all duration-200 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
              }}
            >
              {submitting ? 'Submitting...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-[#475569] mt-8 text-center">
            Already registered? <Link to="/auth/login" className="text-[#1D4ED8] font-semibold hover:underline">Login</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
