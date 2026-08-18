import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const faqs = [
  {
    q: 'Q1. What is Business Credit Management?',
    a: 'It is a clear and organized way to track the credit you extend to your buyers. This process covers every step, from agreeing on a deal to making sure you get paid on time.',
  },
  {
    q: 'Q2. How do we help stop late payments?',
    a: 'We provide automated tools that handle your payment reminders and follow-ups. If a buyer still ignores their bill, registered members can report them on our platform. Because being listed as a defaulter hurts a buyer\'s nationwide credit reputation, they are much more likely to pay you on time. This system acts as a shield for your cash flow.',
  },
  {
    q: 'Q3. What are the main benefits?',
    a: 'Our tools help you avoid bad debt while maintaining healthy relationships with your clients. Key perks include:\n\n• Automatic Tracking: The system monitors deals and sends reminders without manual effort.\n\n• Digital Proof: Get instant electronic confirmation for all your credit agreements.\n\n• Professional Standard: Handle your payment collections in a formal and respectful way.\n\n• Simple Resolutions: Make it easy for both parties to settle unpaid bills.\n\n• Better Cash Flow: Keep your incoming money steady and predictable.\n\n• Stronger Reputation: Build trust and credibility in the market.\n\n• Qualified Legal Support: Secure expert legal representation from our vetted network.',
  },
  {
    q: 'Q4. Do I need documents to report a defaulter?',
    a: 'Yes. The Global Rating Dashboard updates with defaulter information only after the necessary supporting documents have been submitted and reviewed.',
  },
  {
    q: 'Q5. How does this affect my own business credit score?',
    a: 'Using our tools actively proves that you run a reliable company. When you regularly use the platform to track your deals, settle dues quickly, and maintain clean records, you build a very strong and positive credit profile for your own business.',
  },
]

export default function CreditManagement() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Streamlined Credit Management</h1>
          </div>

          {/* Main Description */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Main content</h2>
            <p className="text-gray-700 leading-relaxed">
              Safeguard your B2B transactions with our Business Credit Management tool. Because most supplier-buyer deals involve credit, the threat of non-payment is always present. CreditDataWatch helps you drastically reduce the risk of financial or material defaults by digitizing the entire process. From the initial agreement to digital acknowledgments and final tracking, we keep your credit transactions secure, transparent, and highly organized.
            </p>
          </div>

          {/* Our Operating Mechanism */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Our Operating Mechanism</h2>
            <p className="text-gray-700 leading-relaxed">
              Credit details will be entered manually or via automatic bulk PO uploads. Credit Data Watch members are given the option to upload supporting attachments. These uploads are approved by the Credit Data Watch support team to appear in the global star ratings. This visibility immediately impacts the defaulter's credit score, warning other businesses and decreasing their overall market credibility.
            </p>
          </div>

          {/* What Our Platform Delivers */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">What Our Platform Delivers:</h2>
            <div className="space-y-2">
              {[
                'Systematized Confirmations: Auto-acceptance capabilities streamline agreements between vendors and clients.',
                'Scheduled Follow-Ups: Maintain consistent cash flow with automated payment nudges sent before and after due dates.',
                'Frictionless Reporting: Seamlessly flag defaulting businesses once a deadline lapses, supported by documentation.',
                'Credit Impact: Deter chronic non-payment by lowering the defaulting party\'s credibility rating across the Indian market.',
                'Legal Support: Access options for formal legal notices and professional legal assistance through qualified lawyers.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary-600 flex-shrink-0" />
                  <p className="text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose Our Credit Management System? */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Why Choose Our Credit Management System?</h2>
            <div className="space-y-2">
              {[
                'Zero Manual Effort: Let automated reminders do the heavy lifting for you.',
                '100% Digital Records: Get instant, digital proof of all your trade agreements.',
                'Corporate Standards: Upgrade your collection strategy with a highly professional tone.',
                'All-in-One Dashboard: Keep a close eye on every single credit exchange in one convenient place.',
                'Frictionless Settlements: Resolve pending payments smoothly and easily.',
                'Time & Money Saved: Cut down on collection costs and reclaim your working hours.',
                'Fearless Expansion: Grow your enterprise safely, knowing your credit lines are thoroughly protected.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-green-600 flex-shrink-0" />
                  <p className="text-gray-700">{item}</p>
                </div>
              ))}
            </div>
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
                    <p className="font-semibold text-gray-900">{item.q}</p>
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
                        <p className="text-gray-700 mt-3 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
