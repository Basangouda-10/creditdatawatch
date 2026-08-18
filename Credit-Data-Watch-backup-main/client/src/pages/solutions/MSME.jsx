import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  { q: "Q1. What information is found in a CreditDataWatch MSME Credit Report?", a: "Our reports provide a deep dive into a business's financial reliability. They include detailed repayment patterns, current debt levels, and overall credit health scores. By analyzing these risk metrics and industry trends, your business can gain the clarity needed to make safe and smart financial choices." },
  { q: "Q2. What is the best way to manage a payment default from an MSME?", a: "We offer a proactive system for handling non-payments. Through our platform, registered members can track defaulting entities, receive real-time alerts on risky behaviors, and implement proven credit risk strategies. This allows you to address payment issues early and protect your company's revenue." },
  { q: "Q3. Why should an MSME focus on building a high credit rating?", a: "A solid credit rating acts as a \"financial resume\" for your business. It significantly boosts your market credibility, making it easier to secure large contracts and high-value partnerships. Additionally, a strong rating is often a prerequisite for accessing government subsidies, lower interest rates, and priority status in public procurement." },
  { q: "Q4. How does CreditDataWatch help MSMEs grow?", a: "We empower small businesses by providing them with the tools to compete on a larger scale. Our members benefit from expert credit assessments, automated registration help, and data-driven insights. These services help your business stand out in professional networks and build long-term trust with investors and lenders." }
]

export default function MSME() {
  const [openFaq, setOpenFaq] = useState(-1)

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">MSME Solutions</h1>
          </div>

          <div className="space-y-6">
            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }}>
              Driving National Growth: The Power of Indian MSMEs
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              Micro, Small, and Medium Enterprises (MSMEs) have become the backbone of India's economic engine. With a massive network of over 80 million registered units, this sector is a powerhouse for creating jobs, fostering local innovation, and boosting global exports. Currently, MSMEs generate approximately 29% of the nation's GDP, acting as a primary catalyst for widespread financial development.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              To foster this vital sector, the Indian government has launched several supportive frameworks. These include digitized registration systems, easier access to capital, and technological grants. Small businesses today benefit from lower-interest loans, tax breaks, and priority status in government tenders. Together, these initiatives create a supportive environment where small enterprises can scale and contribute to the country's wealth.
            </p>

            <div className="card bg-green-50 border-green-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Interpreting the MSME Credit Report
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                For business leaders and policymakers, staying in tune with the sector's financial health is essential. The MSME Credit Report serves as a vital diagnostic tool, offering a deep dive into the borrowing habits and repayment trends of small businesses across India. This report identifies emerging risks and growth opportunities, allowing business owners to pivot their strategies based on data-backed insights.
              </p>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-4">
              Seamless MSME Enrollment Services
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              While obtaining an official MSME status is the gateway to government support, the paperwork can often be overwhelming. CreditDataWatch bridges this gap by offering a simplified, expert-led registration journey. We eliminate the frustration of navigating complex government portals and dense legal forms. Our intuitive platform guides entrepreneurs through every requirement, ensuring compliance. By automating the registration workflow, we significantly cut down processing times, giving business owners more time to focus on their daily operations.
            </p>

            <div className="card bg-amber-50 border-amber-100 space-y-4">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Why Your MSME Credit Rating Matters
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                A solid financial reputation is the key to unlocking affordable capital. For a small business, a high MSME Credit Rating — powered by CreditDataWatch — is a badge of reliability. By analyzing past payment behavior and debt management, this score tells lenders you are a safe bet. Beyond just loans, a strong score boosts your market standing, helping you win larger contracts and attract higher-quality business partners.
              </p>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-4">
              How We Simplify Your Registration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🧭', title: 'Guided Onboarding', desc: 'Step-by-step assistance to ensure every detail is captured accurately.' },
                { icon: '✅', title: 'Live Validation', desc: 'Instant error-checking to prevent delays or application rejections.' },
                { icon: '📡', title: 'Live Tracking', desc: 'Users get real-time alerts and progress updates, providing complete visibility into the application status.' },
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

            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-4">
              Maximizing Your Potential with CreditDataWatch
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🌍', title: 'Establish Market Trust', desc: 'A verified, positive credit profile makes your business more attractive to serious investors and global collaborators.' },
                { icon: '🔒', title: 'Minimize Risk', desc: 'Use our data to vet your own clients and suppliers, ensuring you only do business with reliable partners.' },
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
            <h3 className="text-2xl font-heading font-bold text-primary-900">Explore MSME Solutions</h3>
            <p className="text-gray-700">Ready to boost your business credibility? Schedule an appointment today!</p>
            <Link to="/appointment" className="btn-primary inline-block">
              Book Appointment
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
