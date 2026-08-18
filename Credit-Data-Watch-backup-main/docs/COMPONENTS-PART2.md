# CreditDataWatch - Pages and Additional Components (Part 2)

## Page Components

### src/pages/Home.jsx
```javascript
import HeroSection from '../components/home/HeroSection'
import ScamAlertSection from '../components/home/ScamAlertSection'
import ServicesGridSection from '../components/home/ServicesGridSection'
import SolutionsSection from '../components/home/SolutionsSection'
import StatsSection from '../components/home/StatsSection'
import TestimonialSection from '../components/home/TestimonialSection'
import FAQSection from '../components/home/FAQSection'
import CTASection from '../components/home/CTASection'

export default function Home() {
  return (
    <>
      <HeroSection />
      <ScamAlertSection />
      <ServicesGridSection />
      <SolutionsSection />
      <StatsSection />
      <TestimonialSection />
      <FAQSection />
      <CTASection />
    </>
  )
}
```

### src/pages/NotFound.jsx
```javascript
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4"
      >
        <h1 className="text-9xl font-heading font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-xl text-gray-600 mb-8">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </motion.div>
    </div>
  )
}
```

### src/pages/Appointment.jsx
```javascript
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Appointment() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    date: '',
    time: '',
    message: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Appointment booking:', formData)
    alert('Appointment request submitted! We will contact you shortly.')
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="section-padding bg-gray-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
              Book Your Free Consultation
            </h1>
            <p className="text-xl text-gray-600">
              Let's discuss your credit goals and create a personalized plan
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Interested In *
                  </label>
                  <select
                    name="service"
                    required
                    value={formData.service}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a service</option>
                    <option value="credit-repair">Credit Repair</option>
                    <option value="credit-monitoring">Credit Monitoring</option>
                    <option value="debt-management">Debt Management</option>
                    <option value="credit-education">Credit Education</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time *
                  </label>
                  <select
                    name="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a time</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="2:00 PM">2:00 PM</option>
                    <option value="3:00 PM">3:00 PM</option>
                    <option value="4:00 PM">4:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell us more about your credit situation and goals..."
                />
              </div>

              <button type="submit" className="btn-primary w-full">
                Schedule Consultation
              </button>

              <p className="text-sm text-gray-500 text-center">
                By booking, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Quick Response</h3>
              <p className="text-gray-600">We'll confirm within 24 hours</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Expert Advice</h3>
              <p className="text-gray-600">Get professional guidance</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">100% Confidential</h3>
              <p className="text-gray-600">Your information is secure</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

### src/pages/auth/Login.jsx
```javascript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    gstNumber: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Login attempt:', formData)
    // TODO: Implement authentication logic
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="font-heading font-bold text-2xl text-gray-900">
              CreditDataWatch
            </span>
          </Link>
          <h2 className="text-3xl font-heading font-bold text-gray-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number (Optional for Business Users)
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <Link to="/auth/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-primary w-full">
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-primary-600 font-semibold hover:text-primary-700">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
```

### src/pages/auth/Register.jsx
```javascript
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    accountType: 'individual',
    gstNumber: '',
    agreeToTerms: false,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    console.log('Registration attempt:', formData)
    // TODO: Implement registration logic
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <span className="font-heading font-bold text-2xl text-gray-900">
              CreditDataWatch
            </span>
          </Link>
          <h2 className="text-3xl font-heading font-bold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-gray-600">
            Start your journey to better credit today
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: 'individual' })}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.accountType === 'individual'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                >
                  <div className="font-semibold">Individual</div>
                  <div className="text-sm text-gray-600">Personal credit services</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, accountType: 'business' })}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.accountType === 'business'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-300 hover:border-primary-300'
                  }`}
                >
                  <div className="font-semibold">Business</div>
                  <div className="text-sm text-gray-600">Business credit solutions</div>
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="(555) 123-4567"
              />
            </div>

            {formData.accountType === 'business' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number *
                </label>
                <input
                  type="text"
                  name="gstNumber"
                  required={formData.accountType === 'business'}
                  value={formData.gstNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="22AAAAA0000A1Z5"
                />
                <p className="mt-2 text-sm text-gray-500">
                  GST number will be validated during registration
                </p>
              </div>
            )}

            <div className="flex items-start">
              <input
                type="checkbox"
                name="agreeToTerms"
                required
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="h-4 w-4 mt-1 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button type="submit" className="btn-primary w-full">
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
```

## Service Pages (Placeholders)

### src/pages/services/CreditRepair.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function CreditRepair() {
  return (
    <div className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            Credit Repair Services
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional credit repair to remove inaccuracies and improve your credit score.
          </p>

          <div className="card mb-8">
            <h2 className="text-2xl font-heading font-bold mb-4">What We Do</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Comprehensive credit report analysis</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dispute inaccurate or outdated information</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Work with credit bureaus on your behalf</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Personalized action plan for credit improvement</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Link to="/appointment" className="btn-primary">
              Get Started Today
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

### src/pages/services/CreditMonitoring.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function CreditMonitoring() {
  return (
    <div className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            Credit Monitoring Services
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Stay informed with 24/7 credit monitoring and instant alerts.
          </p>

          <div className="card mb-8">
            <h2 className="text-2xl font-heading font-bold mb-4">Features</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time credit score updates</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Instant alerts for suspicious activity</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dark web monitoring</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Identity theft protection</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Link to="/appointment" className="btn-primary">
              Start Monitoring
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

### src/pages/services/DebtManagement.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function DebtManagement() {
  return (
    <div className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            Debt Management Services
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Strategic debt consolidation and management to achieve financial freedom.
          </p>

          <div className="card mb-8">
            <h2 className="text-2xl font-heading font-bold mb-4">Our Approach</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Personalized debt analysis</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Consolidation strategies</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Creditor negotiations</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Customized repayment plans</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Link to="/appointment" className="btn-primary">
              Get Help Now
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

### src/pages/services/CreditEducation.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function CreditEducation() {
  return (
    <div className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            Credit Education Resources
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Learn how to build, maintain, and improve your credit score.
          </p>

          <div className="card mb-8">
            <h2 className="text-2xl font-heading font-bold mb-4">What You'll Learn</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Credit score fundamentals</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Building credit from scratch</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Managing credit cards wisely</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Avoiding common credit mistakes</span>
              </li>
            </ul>
          </div>

          <div className="text-center">
            <Link to="/appointment" className="btn-primary">
              Start Learning
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

## Solution Pages (Placeholders)

### src/pages/solutions/IndividualSolutions.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function IndividualSolutions() {
  return (
    <div className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            Solutions for Individuals
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Personalized credit solutions designed for your unique financial journey.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <h3 className="text-xl font-heading font-semibold mb-3">Credit Repair</h3>
              <p className="text-gray-600 mb-4">
                Remove negative items and improve your score
              </p>
              <Link to="/services/credit-repair" className="text-primary-600 font-semibold">
                Learn More →
              </Link>
            </div>

            <div className="card">
              <h3 className="text-xl font-heading font-semibold mb-3">Credit Monitoring</h3>
              <p className="text-gray-600 mb-4">
                Stay protected with real-time alerts
              </p>
              <Link to="/services/credit-monitoring" className="text-primary-600 font-semibold">
                Learn More →
              </Link>
            </div>

            <div className="card">
              <h3 className="text-xl font-heading font-semibold mb-3">Debt Management</h3>
              <p className="text-gray-600 mb-4">
                Strategic debt reduction plans
              </p>
              <Link to="/services/debt-management" className="text-primary-600 font-semibold">
                Learn More →
              </Link>
            </div>

            <div className="card">
              <h3 className="text-xl font-heading font-semibold mb-3">Credit Education</h3>
              <p className="text-gray-600 mb-4">
                Build financial literacy and confidence
              </p>
              <Link to="/services/credit-education" className="text-primary-600 font-semibold">
                Learn More →
              </Link>
            </div>
          </div>

          <div className="text-center">
            <Link to="/appointment" className="btn-primary">
              Schedule Free Consultation
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

### src/pages/solutions/BusinessSolutions.jsx
```javascript
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function BusinessSolutions() {
  return (
    <div className="section-padding">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-6">
            Solutions for Businesses
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Enterprise credit solutions to grow and protect your business.
          </p>

          <div className="card mb-8">
            <h2 className="text-2xl font-heading font-bold mb-4">Business Services</h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Business Credit Reports</h3>
                  <p className="text-gray-600">Access comprehensive business credit reports and monitoring</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Trade Line Establishment</h3>
                  <p className="text-gray-600">Build business credit through strategic trade lines</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Commercial Debt Management</h3>
                  <p className="text-gray-600">Professional restructuring and negotiation services</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="card mb-8 bg-primary-50 border-2 border-primary-200">
            <h3 className="text-xl font-heading font-semibold mb-3">GST Validation Required</h3>
            <p className="text-gray-700">
              Business accounts require GST number validation during registration. This ensures 
              compliance and enables access to specialized business credit services.
            </p>
          </div>

          <div className="text-center">
            <Link to="/appointment" className="btn-primary">
              Schedule Business Consultation
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
```

---

## Continue with API documentation in next file...
