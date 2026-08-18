import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  { q: "Q1. What solutions does CreditDataWatch provide for B2B companies?", a: "Our B2B suite includes a variety of tools designed to safeguard your trade credit. These include comprehensive business credit profiles, automated payment alerts, financial tracking, defaulter registries, and debt resolution services. We also provide risk benchmarking to help you compare your credit health against industry standards. Together, these services make managing business relationships much more efficient." },
  { q: "Q2. How do automated payment alerts improve B2B operations?", a: "Automated alerts take the manual work out of chasing payments. The system sends scheduled notifications via email to remind your clients about upcoming or overdue bills. By staying on top of these deadlines automatically, you can reduce late payments and ensure your business maintains a healthy, steady cash flow." },
  { q: "Q3. Is it possible to report a business for non-payment?", a: "Yes. If a business entity or MSME fails to honor its payment commitments, registered members can issue legal notices and request assistance through CreditDataWatch's Legal Support feature. The defaulting MSME will be listed on CreditDataWatch's Global Rating Dashboard, ensuring visibility across the network. This shared intelligence helps other businesses identify and avoid high-risk partners. Public listing also motivates debtors to settle dues promptly, fostering accountability and encouraging fair business practices." },
  { q: "Q4. Why should I check a Business Credit Report before a partnership?", a: "A Business Credit Report acts as a financial background check. It details a company's past payment habits, current debt levels, and overall financial reliability. By reviewing this report before signing a contract, you can accurately judge the risk of working with a new buyer or supplier, helping you build partnerships based on facts rather than guesswork." },
  { q: "Q5. How does the payment settlement process work?", a: "The process is a vertical timeline:\nStep 1 — Reporting: The unpaid debt is logged on the platform.\nStep 2 — Notification: We initiate communication with the buyer to inform them of the report.\nStep 3 — Resolution: Both parties can use our tools to track and negotiate terms.\nStep 4 — Completion: Once the payment is received, the creditor marks the case as \"Settled.\"\nStep 5 — Status Update: The listing is updated or removed based on the agreement, helping the buyer restore their credit standing." }
]

export default function B2B() {
  const [openFaq, setOpenFaq] = useState(-1)

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">B2B Solutions</h1>
          </div>

          <div className="space-y-6">
            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }}>
              Empowering Enterprises through Strategic B2B Innovation
            </h3>
            <h4 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }}>
              How CreditDataWatch's Custom Solutions Are Transforming the Industry
            </h4>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              In the current high-stakes commercial market, the strength and agility of your B2B tools are vital for long-term scalability. CreditDataWatch, a premier authority in financial intelligence and risk mitigation, provides a specialized suite of B2B services designed to revolutionize your operational framework.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              By integrating our B2B architecture, your organization can harness the true potential of data-centric strategy. We deliver precise, deep-dive credit insights that allow you to select partners, vendors, and clients with absolute confidence. Whether you are vetting a new prospect's financial stability or monitoring the risk levels of your current portfolio, our solutions provide the clarity needed to master the complexities of corporate credit.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              Our platform is engineered to modernize and digitize your entire credit workflow. By utilizing cutting-edge analytics and high-speed technology, CreditDataWatch automates the heavy lifting of background checks and ongoing account surveillance. This digital transformation does more than just reclaim your time — it creates a proactive defense against revenue loss, protecting your business from the impact of late payments and bad debt.
            </p>

            <div className="card bg-blue-50 border-blue-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Setting the Gold Standard in B2B Support
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                CreditDataWatch is a leader in the B2B sector, distinguished by an unwavering dedication to client success. We prioritize a superior service experience, ensuring every partner receives world-class support from day one. When you collaborate with us, you aren't just a number — you receive individualized focus from a specialized team committed to exceeding your business expectations.
              </p>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                We recognize that no two organizations are identical. Our experts conduct a deep dive into your specific operational challenges to build custom strategies that mirror your corporate mission. Whether your focus is on mitigating financial risk, implementing recovery strategies, or retrieving real-time business credit intelligence, CreditDataWatch possesses the deep industry knowledge required to drive exceptional outcomes for your enterprise.
              </p>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-4">
              Advanced Strategies for Enterprise Credit
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              CreditDataWatch offers high-impact credit solutions engineered to strengthen your organization's financial foundation. Regardless of your organization's size, we provide the specialized resources and industry knowledge necessary to optimize your credit operations.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              A cornerstone of our platform is our B2B Risk Mitigation Service. By utilizing sophisticated predictive modeling and intelligent algorithms, we help you pinpoint potential financial threats before they materialize. From evaluating the stability of new prospects to tracking the ongoing payment habits of existing clients, our insights empower you to make data-backed choices that safeguard your company's fiscal health.
            </p>

            <div className="card bg-gray-50 border-gray-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-3">
                Revolutionizing Credit Oversight
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Our approach to risk management is defined by an exhaustive evaluation framework. We go beyond basic credit scores, integrating sector-specific data and proprietary analytics to provide a 360-degree view of a customer's reliability. This deep-dive analysis allows you to approve credit lines and establish limits with total precision.
              </p>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Beyond monitoring and assessment, CreditDataWatch provides expert B2B Debt Resolution support and tracking. Should a client fail to meet their obligations, our team assists in navigating the settlement process. We handle the complexities of recovery on your behalf, allowing you to manage your business credit portfolio with absolute certainty.
              </p>
            </div>

            <div className="card bg-amber-50 border-amber-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-3">
                Preserving a Default-Free Environment
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Unpaid invoices are one of the most significant threats to an organization's liquidity. To address this, CreditDataWatch advocates for a "Zero-Default Standard," prioritizing the long-term vitality of your accounts receivable.
              </p>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                We maintain an uncompromising stance toward chronic non-payment. By tapping into our massive Credit DataWatch database and real-time risk indicators, we identify high-risk entities and provide early warnings before you commit to a transaction. This proactive defense system is designed to eliminate bad debt at the source, preventing financial leakage and ensuring your business remains profitable.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🛡️', title: 'B2B Risk Mitigation', desc: 'Using sophisticated predictive modeling to pinpoint potential financial threats.' },
                { icon: '🔬', title: 'Exhaustive Evaluation', desc: 'Sector-specific data for a 360-degree view of reliability.' },
                { icon: '💼', title: 'Debt Resolution', desc: 'Expert support navigating the settlement process on your behalf.' },
                { icon: '🎯', title: 'Zero-Default Standard', desc: 'Proactive defense system to eliminate bad debt at source.' },
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

            <div className="bg-white border border-[#e0e6f0] rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3" style={{ fontSize: '14px', fontWeight: 500 }}>
                Payment Settlement Timeline
              </h3>
              <div className="relative pl-8 space-y-6">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-[#dce6f5]"></div>
                {[
                  ['Reporting', 'The unpaid debt is logged on the platform.'],
                  ['Notification', 'We initiate communication with the buyer to inform them of the report.'],
                  ['Resolution', 'Both parties can use our tools to track and negotiate terms.'],
                  ['Completion', 'Once the payment is received, the creditor marks the case as "Settled."'],
                  ['Status Update', 'The listing is updated or removed based on the agreement, helping the buyer restore their credit standing.'],
                ].map(([title, desc], idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-8 w-6 h-6 rounded-full bg-[#185FA5] flex items-center justify-center text-white text-xs font-bold">
                      {idx + 1}
                    </div>
                    <p className="font-bold text-gray-800" style={{ fontSize: '15px' }}>{title}</p>
                    <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="mt-1">{desc}</p>
                  </div>
                ))}
              </div>
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
            <h3 className="text-2xl font-heading font-bold text-primary-900">Get Started with CreditDataWatch</h3>
            <p className="text-gray-700">Ready to elevate your business with tailored B2B solutions? Schedule an appointment today!</p>
            <Link to="/appointment" className="btn-primary inline-block">
              Book Appointment
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
