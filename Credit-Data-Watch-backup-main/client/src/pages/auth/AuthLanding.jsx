import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function AuthLanding() {
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
            Welcome to CreditDataWatch!
          </h2>
          <p className="text-[#93C5FD] text-lg mb-8">
            Access business credit insights, manage your account, and protect your business.
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
          <div className="text-center mb-8">
            <h1 className="text-[1.8rem] font-bold text-[#0F172A] mb-2">
              Access CreditDataWatch
            </h1>
            <p className="text-[#475569]">GST-validated access. Choose how you want to continue.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link 
              to="/auth/login" 
              className="group bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center"
            >
              <p className="font-bold text-[#0F172A] text-lg mb-1">Login</p>
              <p className="text-sm text-[#475569]">For registered GST entities</p>
            </Link>
            <Link 
              to="/auth/register" 
              className="group bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 p-6 text-center"
            >
              <p className="font-bold text-[#0F172A] text-lg mb-1">Register</p>
              <p className="text-sm text-[#475569]">Validate GST and start</p>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
