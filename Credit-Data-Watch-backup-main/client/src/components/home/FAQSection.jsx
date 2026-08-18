import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    q: 'What Goes Into Your Credit Score?',
    a: 'Think of a credit score as a numerical summary of your payment habits. It is a three-digit number that tells suppliers how reliable you are based on your past transactions. The score is calculated using an intelligent algorithm that evaluates key financial factors for businesses and individuals alike.',
  },
  {
    q: 'Best Practices for Credit Score Enhancement?',
    a: '1. Punctuality: Pay all bills on or before the due date. 2. Resolution: Clear any outstanding dues listed on CreditDataWatch. 3. Trust: Foster strong connections with your creditors. Master these three areas to unlock a higher credit score.',
  },
  {
    q: 'What additional benefits come with a Subscription?',
    a: 'Think of Registration as getting your ID card—it creates your account using your personal details. Subscription is like paying your monthly dues—it ensures you keep receiving the service, content, or premium access you need over time.',
  },
  {
    q: 'Is GST registration a mandatory prerequisite for accessing Credit-Data-Watch services?',
    a: 'Access to Credit-Data-Watch services is restricted to GST-registered entities only. Please ensure your organization possesses a valid GSTIN before proceeding.',
  },
  {
    q: 'What is the procedure for registering on the Credit-Data-Watch platform?',
    a: 'Credit-Data-Watch is an easy-to-use platform available exclusively to users with a valid GST Number. Please watch the Demo for more details.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState(0)

  return (
    <section className="section-padding" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%)' }}>
      <div className="container-custom max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-block w-20 h-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-full mb-4" />
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3 text-[#0F172A]">Help & Education</h2>
          <p className="text-lg text-[#475569]">Common questions about CreditDataWatch</p>
        </div>
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <button
              key={item.q}
              type="button"
              className="card cursor-pointer w-full text-left bg-white rounded-2xl"
              style={{
                boxShadow: '0 5px 20px -5px rgba(30, 58, 138, 0.1)',
                transition: 'box-shadow 0.3s ease, transform 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(30, 58, 138, 0.18)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 5px 20px -5px rgba(30, 58, 138, 0.1)'
              }}
              onClick={() => setOpen(open === idx ? -1 : idx)}
              aria-expanded={open === idx}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#0F172A]">{item.q}</p>
                </div>
                <svg
                  className={`h-5 w-5 transition-transform ${open === idx ? 'rotate-180' : ''}`}
                  style={{ color: '#3B82F6' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <AnimatePresence initial={false}>
                {open === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[#475569] mt-3 leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
