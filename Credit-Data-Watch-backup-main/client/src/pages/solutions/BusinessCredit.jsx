import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  { q: "Q1. What exactly is the CreditDataWatch Business Credit Bureau?", a: "CreditDataWatch is a platform specifically designed to offer end-to-end credit intelligence and oversight for the B2B sector. Our system allows vendors and purchasers to digitize their deals, secure formal acknowledgments, and flag non-paying entities. By centralizing this data, we foster a culture of honesty and reliability in commercial trade." },
  { q: "Q2. What is the process for reporting a non-paying business?", a: "To list a defaulter, simply create an account on the CreditDataWatch portal using your valid GSTIN. After logging in, you can submit the details of the defaulting party, including the specific transaction records and their history of missed payments. Once authenticated, the entity is added to our national database, serving as a warning to the community and helping you recover your funds." },
  { q: "Q3. How does the Automated Payment Alerts system work?", a: "This tool removes the stress of manual collections by scheduling automatic nudges for your clients. The platform dispatches reminders via email, ensuring your invoices stay top-of-mind. The system is designed to track engagement and can increase the frequency or tone of the alerts if a payment remains outstanding, significantly boosting your chances of getting paid on time." },
  { q: "Q4. In what ways can CreditDataWatch help my company grow?", a: "Integrating CreditDataWatch into your daily operations offers several strategic advantages: risk assessment (review financial track records before signing contracts), accountability (officially log and monitor non-payment cases), efficiency (automate your entire collection workflow), financial health (keep cash flow steady and predictable), and market standing (build a reputation as a credit-disciplined business)." }
]

export default function BusinessCredit() {
  const [openFaq, setOpenFaq] = useState(-1)

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Business Credit</h1>
          </div>

          <div className="space-y-6">
            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }}>
              Advanced Credit Intelligence with Automated Recovery Tools
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              In the fast-paced world of modern commerce, maintaining financial stability requires a combination of accurate data and proactive collection strategies. CreditDataWatch provides a suite of smart reporting, risk evaluation, and automated follow-up systems designed to secure your revenue and eliminate the risk of bad debt.
            </p>

            <div className="card bg-purple-50 border-purple-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Evaluate Risks with Precision Business Credit Profiles
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Our in-depth company credit profiles offer a transparent view of any business's financial habits, including their track record of payments, current debt levels, and credit usage. For vendors and smaller enterprises (MSMEs), these insights are vital for vetting new clients and avoiding high-risk agreements. By utilizing our sophisticated database, you can cross-reference records of chronic non-payers. This builds a foundation of trust and allows you to implement highly effective payment recovery plans.
              </p>
            </div>

            <div className="card bg-blue-50 border-blue-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Optimize Your Receivables with Automated Collection Workflows
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                CreditDataWatch simplifies the entire lifecycle of an invoice. Our intelligent platform manages everything from the initial Payment Alert to the final Account Resolution. With our Scheduled Follow-Up System, your business can automate the chasing process. This ensures that late payments are addressed immediately, resolving potential issues before they turn into major financial losses.
              </p>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-4">
              Your Comprehensive Ecosystem for Debt Management
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🚩', title: 'Flag High-Risk Entities', desc: 'Spot potential non-payers before you sign the contract.' },
                { icon: '🔔', title: 'Deploy Smart Reminders', desc: 'Set up automated nudges via multiple channels.' },
                { icon: '⚡', title: 'Accelerate Settlements', desc: 'Use our structured process to close overdue accounts faster.' },
                { icon: '🔍', title: 'Identify Weak Points', desc: 'Use custom analytics to find where your credit cycle is leaking money.' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-[#e0e6f0] rounded-lg p-4">
                  <div className="w-10 h-10 rounded-full bg-[#E6F1FB] flex items-center justify-center mb-3">
                    <span style={{ color: '#185FA5', fontSize: '24px' }}>{item.icon}</span>
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: 500 }} className="text-gray-800 mb-1">{item.title}</h4>
                  <p style={{ fontSize: '12px', color: '#666' }} className="leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Struggling with Late Payments? We Have the Solution.
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Delayed invoices can paralyze your operations. Our system doesn't just wait for a default; it uses predictive trends and early-warning alerts to help you resolve credit issues before they escalate. We provide a clear, step-by-step roadmap to turn your pending receivables into liquid cash.
              </p>
            </div>

            <div className="card bg-gray-50 border-gray-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Empowering MSMEs with Seamless Credit Control
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Our platform is specifically tuned to the needs of small and medium businesses. From identifying problematic buyers to facilitating smooth settlements, we put financial control back in your hands. By combining real-time risk signals with automated outreach, we make complex credit management simple and effective.
              </p>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-4">
              Join CreditDataWatch Today
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🧠', title: 'Intelligent Credit Scoring', desc: 'High-level indicators of a company\'s financial health.' },
                { icon: '🤖', title: 'Automated Recovery Suite', desc: 'Hands-free reminders and persistent follow-up tools.' },
                { icon: '🤝', title: 'Expert Settlement Support', desc: 'Proven methods for clearing old debts.' },
                { icon: '🎯', title: 'A Centralized Credit Hub', desc: 'One platform to manage all your risks and rewards.' },
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-[#e0e6f0] rounded-lg p-4">
                  <div className="w-10 h-10 rounded-full bg-[#E6F1FB] flex items-center justify-center mb-3">
                    <span style={{ color: '#185FA5', fontSize: '24px' }}>{item.icon}</span>
                  </div>
                  <h4 style={{ fontSize: '13px', fontWeight: 500 }} className="text-gray-800 mb-1">{item.title}</h4>
                  <p style={{ fontSize: '12px', color: '#666' }} className="leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-lg font-semibold text-gray-800 mt-4">
              Register now and make the data-driven decisions that will fuel your company's growth.
            </p>
          </div>

          {/* FAQ Section */}
          <div className="space-y-4">
            <h2 className="text-3xl font-heading font-bold text-center mb-6">Commonly Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((item, idx) => (
                <button
                  key={item.q}
                  type="button"
                  className="card cursor-pointer w-full text-left"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p style={{ fontSize: '14px', fontWeight: 500 }} className="font-semibold text-gray-900">{item.q}</p>
                    <svg
                      className={`h-5 w-5 text-primary-600 transition-transform flex-shrink-0 ${openFaq === idx ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <AnimatePresence initial={false}>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden whitespace-pre-line"
                      >
                        <p style={{ fontSize: '14px', color: '#555' }} className="text-gray-700 mt-3 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="card bg-primary-50 border-primary-200 text-center space-y-4">
            <h3 className="text-2xl font-heading font-bold text-primary-900">Start Managing Credit Smartly</h3>
            <p className="text-gray-700">Schedule an appointment with us today!</p>
            <Link to="/appointment" className="btn-primary inline-block">
              Book Appointment
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
