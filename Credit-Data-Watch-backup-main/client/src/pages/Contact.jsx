import { useState } from 'react'
import { motion } from 'framer-motion'
import { contact as contactApi } from '../services/api/apiClient'
import { Link } from 'react-router-dom'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const res = await contactApi.submit(form)
    
    if (res.ok) {
      setSuccess(true)
      setForm({ name: '', email: '', message: '' })
    } else {
      setError(res.error || 'Failed to send message. Please try again.')
    }
    
    setLoading(false)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <section className="py-0 bg-[#F0F4FF]">
      {/* Navy Gradient Header */}
      <div 
        className="py-12 px-4 text-white text-center"
        style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold">Contact</h1>
          <p className="text-sm text-[#93C5FD] mt-2">Tell us about your credit workflows and we will tailor a walkthrough.</p>
        </div>
      </div>

      <div className="container-custom max-w-5xl mx-auto px-4 space-y-6 pt-8 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-[12px] flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Message sent successfully!</p>
                <p className="text-sm">Thank you for contacting us. We will respond within 24 hours.</p>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-[12px] flex items-center gap-2"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Failed to send message</p>
                <p className="text-sm">
                  {typeof error === 'object' ? (error.message || error.detail || JSON.stringify(error)) : String(error)}
                </p>
              </div>
            </motion.div>
          )}

          {/* Info Cards */}
          <div className="space-y-4 mb-8">
            <div className="bg-white rounded-[20px] p-6 border border-[#E2E8F0] shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-lg">📧</div>
                <h3 className="font-bold text-[#0F172A] text-lg">Support</h3>
              </div>
              <p className="text-[#475569] text-sm mb-2">
                For general inquiries, verification issues, or support tickets:
              </p>
              <a
                href="mailto:support@preflexsol.com"
                className="text-[#1D4ED8] font-bold text-base"
              >
                support@preflexsol.com
              </a>
              <p className="text-[#64748B] text-xs mt-3">
                We typically respond within 1–2 business days.
              </p>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#E2E8F0] shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-lg">📋</div>
                <h3 className="font-bold text-[#0F172A] text-lg">For Defaulter Verification Issues</h3>
              </div>
              <p className="text-[#475569] text-sm">
                If you submitted the required documents but the defaulting party has not appeared on the list yet,
                email us at <a href="mailto:support@preflexsol.com" className="font-bold text-[#1D4ED8]">support@preflexsol.com</a> with
                your submission reference and we will investigate promptly.
              </p>
            </div>

            <div className="bg-white rounded-[20px] p-6 border border-[#E2E8F0] shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-lg">🤝</div>
                <h3 className="font-bold text-[#0F172A] text-lg">Missing a Name from the Registry?</h3>
              </div>
              <p className="text-[#475569] text-sm">
                Email <a href="mailto:support@preflexsol.com" className="font-bold text-[#1D4ED8]">support@preflexsol.com</a> with
                the vendor's GSTN and our team will assist you in adding them to the Collaborative Overdue Registry.
              </p>
            </div>
          </div>

          {/* Contact Form Card */}
          <div className="bg-white rounded-[20px] shadow-lg max-w-[600px] mx-auto p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="text-sm font-semibold text-[#374151]">Name</label>
                <input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full px-4 py-3 rounded-[8px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-semibold text-[#374151]">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full px-4 py-3 rounded-[8px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="message" className="text-sm font-semibold text-[#374151]">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="mt-2 w-full px-4 py-3 rounded-[8px] border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[rgba(59,130,246,0.15)]"
                  placeholder="What do you want to achieve?"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 rounded-[8px] text-white font-semibold text-sm transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
                }}
              >
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
