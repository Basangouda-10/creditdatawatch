import { useState } from 'react'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

function FAQSection({ faqs }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={faq.q} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button onClick={() => setOpen(open === faq.q ? null : faq.q)}
            className="w-full text-left px-6 py-4 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm pr-4">{faq.q}</span>
            <span className="text-blue-600 text-xl flex-shrink-0">{open === faq.q ? '−' : '+'}</span>
          </button>
          {open === faq.q && (
            <div className="px-6 pb-4 border-l-4 border-blue-500">
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

FAQSection.propTypes = {
  faqs: PropTypes.arrayOf(PropTypes.shape({
    q: PropTypes.string.isRequired,
    a: PropTypes.string.isRequired
  })).isRequired
}

const b2bFaqs = [
  { q: "Q1. What solutions does CreditDataWatch provide for B2B companies?", a: "Our B2B suite includes a variety of tools designed to safeguard your trade credit. These include comprehensive business credit profiles, automated payment alerts, financial tracking, defaulter registries, and debt resolution services. We also provide risk benchmarking to help you compare your credit health against industry standards. Together, these services make managing business relationships much more efficient." },
  { q: "Q2. How do automated payment alerts improve B2B operations?", a: "Automated alerts take the manual work out of chasing payments. The system sends scheduled notifications via email to remind your clients about upcoming or overdue bills. By staying on top of these deadlines automatically, you can reduce late payments and ensure your business maintains a healthy, steady cash flow." },
  { q: "Q3. Is it possible to report a business for non-payment?", a: "Yes. If a business entity or MSME fails to honor its payment commitments, registered members can issue legal notices and request assistance through CreditDataWatch's Legal Support feature. The defaulting MSME will be listed on CreditDataWatch's Global Rating Dashboard, ensuring visibility across the network. This shared intelligence helps other businesses identify and avoid high-risk partners. Public listing also motivates debtors to settle dues promptly, fostering accountability and encouraging fair business practices." },
  { q: "Q4. Why should I check a Business Credit Report before a partnership?", a: "A Business Credit Report acts as a financial background check. It details a company's past payment habits, current debt levels, and overall financial reliability. By reviewing this report before signing a contract, you can accurately judge the risk of working with a new buyer or supplier, helping you build partnerships based on facts rather than guesswork." },
  { q: "Q5. How does the payment settlement process work?", a: "Render as vertical timeline:\nStep 1 — Reporting: The unpaid debt is logged on the platform.\nStep 2 — Notification: We initiate communication with the buyer to inform them of the report.\nStep 3 — Resolution: Both parties can use our tools to track and negotiate terms.\nStep 4 — Completion: Once the payment is received, the creditor marks the case as \"Settled.\"\nStep 5 — Status Update: The listing is updated or removed based on the agreement, helping the buyer restore their credit standing." }
]

const msmeFaqs = [
  { q: "Q1. What information is found in a CreditDataWatch MSME Credit Report?", a: "Our reports provide a deep dive into a business's financial reliability. They include detailed repayment patterns, current debt levels, and overall credit health scores. By analyzing these risk metrics and industry trends, your business can gain the clarity needed to make safe and smart financial choices." },
  { q: "Q2. What is the best way to manage a payment default from an MSME?", a: "We offer a proactive system for handling non-payments. Through our platform, registered members can track defaulting entities, receive real-time alerts on risky behaviors, and implement proven credit risk strategies. This allows you to address payment issues early and protect your company's revenue." },
  { q: "Q3. Why should an MSME focus on building a high credit rating?", a: "A solid credit rating acts as a \"financial resume\" for your business. It significantly boosts your market credibility, making it easier to secure large contracts and high-value partnerships. Additionally, a strong rating is often a prerequisite for accessing government subsidies, lower interest rates, and priority status in public procurement." },
  { q: "Q4. How does CreditDataWatch help MSMEs grow?", a: "We empower small businesses by providing them with the tools to compete on a larger scale. Our members benefit from expert credit assessments, automated registration help, and data-driven insights. These services help your business stand out in professional networks and build long-term trust with investors and lenders." }
]

const businessCreditFaqs = [
  { q: "Q1. What exactly is the CreditDataWatch Business Credit Bureau?", a: "CreditDataWatch is a platform specifically designed to offer end-to-end credit intelligence and oversight for the B2B sector. Our system allows vendors and purchasers to digitize their deals, secure formal acknowledgments, and flag non-paying entities. By centralizing this data, we foster a culture of honesty and reliability in commercial trade." },
  { q: "Q2. What is the process for reporting a non-paying business?", a: "To list a defaulter, simply create an account on the CreditDataWatch portal using your valid GSTIN. After logging in, you can submit the details of the defaulting party, including the specific transaction records and their history of missed payments. Once authenticated, the entity is added to our national database, serving as a warning to the community and helping you recover your funds." },
  { q: "Q3. How does the Automated Payment Alerts system work?", a: "This tool removes the stress of manual collections by scheduling automatic nudges for your clients. The platform dispatches reminders via email, ensuring your invoices stay top-of-mind. The system is designed to track engagement and can increase the frequency or tone of the alerts if a payment remains outstanding, significantly boosting your chances of getting paid on time." },
  { q: "Q4. In what ways can CreditDataWatch help my company grow?", a: "Integrating CreditDataWatch into your daily operations offers several strategic advantages: risk assessment (review financial track records before signing contracts), accountability (officially log and monitor non-payment cases), efficiency (automate your entire collection workflow), financial health (keep cash flow steady and predictable), and market standing (build a reputation as a credit-disciplined business)." }
]

const businessDebtFaqs = [
  { q: "Q1. How does CreditDataWatch help businesses manage debt?", a: "CreditDataWatch provides a unified platform that enables companies to handle debt challenges more effectively. With features such as defaulter reporting, payment history tracking, and structured settlement tools, businesses can take proactive steps to recover dues and maintain stronger cash flow." },
  { q: "Q2. How can I report a defaulter?", a: "Businesses holding a valid GSTIN can sign up on CreditDataWatch. After registration, they can upload supporting documents like ledgers or auditor-verified statements. Once verified, the defaulter's details are published, alerting other businesses and assisting in recovery." },
  { q: "Q3. What is the process for settling a debt?", a: "Render as vertical timeline:\nStep 1 — Report the Defaulter: Add the non-paying business to the CreditDataWatch system.\nStep 2 — Negotiate Terms: Work with the defaulter to agree on repayment conditions.\nStep 3 — Confirm Settlement: Update the record once dues are cleared.\nStep 4 — Ensure Transparency: The defaulter's past record remains visible, encouraging accountability in future transactions." },
  { q: "Q4. How do automated reminders support debt recovery?", a: "CreditDataWatch's reminder system reduces manual effort by sending automated alerts via email. This consistent follow-up increases the likelihood of timely payments and helps businesses stay on top of collections." },
  { q: "Q5. Are there fees for using CreditDataWatch?", a: "Basic defaulter reporting is free for registered members. Advanced features — such as detailed credit ratings, automated reminders, and premium debt-management tools — are available through subscription plans, offering deeper insights and stronger recovery mechanisms." }
]

export default function Solutions() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section 
        className="py-20 px-4 text-white text-center"
        style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Our Solutions</h1>
          <div 
            className="mx-auto mb-4"
            style={{ 
              width: '48px', 
              height: '3px', 
              backgroundColor: '#F59E0B' 
            }}
          ></div>
          <p className="text-[#93C5FD] text-lg max-w-3xl mx-auto">
            Empowering Indian businesses with advanced credit intelligence, risk management, and debt recovery tools built for the modern economy.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {['B2B Solutions','MSME Solutions','Business Credit','Business Debt'].map(tab => (
              <a key={tab} href={`#${tab.toLowerCase().replaceAll(' ','-')}`}
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white text-sm px-4 py-2 rounded-full transition-colors">
                {tab}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 1 — B2B Solutions */}
      <section id="b2b-solutions" className="py-16 px-4 bg-white" style={{ marginBottom: '60px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏢</span>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>B2B Solutions</h2>
              <div style={{ width: '48px', height: '3px', backgroundColor: '#F59E0B', marginTop: '4px' }}></div>
            </div>
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

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Setting the Gold Standard in B2B Support
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                CreditDataWatch is a leader in the B2B sector, distinguished by an unwavering dedication to client success. We prioritize a superior service experience, ensuring every partner receives world-class support from day one. When you collaborate with us, you aren't just a number — you receive individualized focus from a specialized team committed to exceeding your business expectations.
              </p>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed mt-3">
                We recognize that no two organizations are identical. Our experts conduct a deep dive into your specific operational challenges to build custom strategies that mirror your corporate mission. Whether your focus is on mitigating financial risk, implementing recovery strategies, or retrieving real-time business credit intelligence, CreditDataWatch possesses the deep industry knowledge required to drive exceptional outcomes for your enterprise.
              </p>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-4">
              Advanced Strategies for Enterprise Credit
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              CreditDataWatch offers high-impact credit solutions engineered to strengthen your organization's financial foundation. Regardless of your organization's size, we provide the specialized resources and industry knowledge necessary to optimize your credit operations.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed mt-3">
              A cornerstone of our platform is our B2B Risk Mitigation Service. By utilizing sophisticated predictive modeling and intelligent algorithms, we help you pinpoint potential financial threats before they materialize. From evaluating the stability of new prospects to tracking the ongoing payment habits of existing clients, our insights empower you to make data-backed choices that safeguard your company's fiscal health.
            </p>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-3">
                Revolutionizing Credit Oversight
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Our approach to risk management is defined by an exhaustive evaluation framework. We go beyond basic credit scores, integrating sector-specific data and proprietary analytics to provide a 360-degree view of a customer's reliability. This deep-dive analysis allows you to approve credit lines and establish limits with total precision.
              </p>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed mt-3">
                Beyond monitoring and assessment, CreditDataWatch provides expert B2B Debt Resolution support and tracking. Should a client fail to meet their obligations, our team assists in navigating the settlement process. We handle the complexities of recovery on your behalf, allowing you to manage your business credit portfolio with absolute certainty.
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-3">
                Preserving a Default-Free Environment
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Unpaid invoices are one of the most significant threats to an organization's liquidity. To address this, CreditDataWatch advocates for a "Zero-Default Standard," prioritizing the long-term vitality of your accounts receivable.
              </p>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed mt-3">
                We maintain an uncompromising stance toward chronic non-payment. By tapping into our massive Credit DataWatch database and real-time risk indicators, we identify high-risk entities and provide early warnings before you commit to a transaction. This proactive defense system is designed to eliminate bad debt at the source, preventing financial leakage and ensuring your business remains profitable.
              </p>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="text-xl font-bold mb-4">
              Key Features
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '🛡️', title: 'B2B Risk Mitigation', desc: 'Using sophisticated predictive modeling to pinpoint potential financial threats.' },
                { icon: '🔬', title: 'Exhaustive Evaluation', desc: 'Sector-specific data for a 360-degree view of reliability.' },
                { icon: '💼', title: 'Debt Resolution', desc: 'Expert support navigating the settlement process on your behalf.' },
                { icon: '🎯', title: 'Zero-Default Standard', desc: 'Proactive defense system to eliminate bad debt at source.' },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="relative overflow-hidden transition-all duration-250 ease-out hover:-translate-y-1"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px rgba(30, 58, 138, 0.08)',
                    padding: '24px'
                  }}
                >
                  <div 
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#EFF6FF',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ color: '#3B82F6', fontSize: '24px' }}>{item.icon}</span>
                  </div>
                  <h4 
                    style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      color: '#1E3A8A',
                      marginBottom: '4px'
                    }}
                  >
                    {item.title}
                  </h4>
                  <p 
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#475569',
                      lineHeight: 1.6
                    }}
                  >
                    {item.desc}
                  </p>
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 bg-[#1E3A8A] transition-all duration-250 ease-out"
                    style={{ width: '0' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.width = '100%';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.width = '0';
                    }}
                  ></div>
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

          <div className="mt-12">
            <h3 style={{ fontSize: '14px', fontWeight: 500 }} className="text-xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
            <FAQSection faqs={b2bFaqs} />
          </div>
        </div>
      </section>

      {/* SECTION 2 — MSME Solutions */}
      <section id="msme-solutions" className="py-16 px-4 bg-gray-50" style={{ marginBottom: '60px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🏭</span>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>MSME Solutions</h2>
              <div style={{ width: '48px', height: '3px', backgroundColor: '#F59E0B', marginTop: '4px' }}></div>
            </div>
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

            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
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

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
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
                <div 
                  key={idx} 
                  className="relative overflow-hidden transition-all duration-250 ease-out hover:-translate-y-1"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px rgba(30, 58, 138, 0.08)',
                    padding: '24px'
                  }}
                >
                  <div 
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#EFF6FF',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ color: '#3B82F6', fontSize: '24px' }}>{item.icon}</span>
                  </div>
                  <h4 
                    style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      color: '#1E3A8A',
                      marginBottom: '4px'
                    }}
                  >
                    {item.title}
                  </h4>
                  <p 
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#475569',
                      lineHeight: 1.6
                    }}
                  >
                    {item.desc}
                  </p>
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 bg-[#1E3A8A] transition-all duration-250 ease-out"
                    style={{ width: '0' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.width = '100%';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.width = '0';
                    }}
                  ></div>
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
                <div 
                  key={idx} 
                  className="relative overflow-hidden transition-all duration-250 ease-out hover:-translate-y-1"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px rgba(30, 58, 138, 0.08)',
                    padding: '24px'
                  }}
                >
                  <div 
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#EFF6FF',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ color: '#3B82F6', fontSize: '24px' }}>{item.icon}</span>
                  </div>
                  <h4 
                    style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      color: '#1E3A8A',
                      marginBottom: '4px'
                    }}
                  >
                    {item.title}
                  </h4>
                  <p 
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#475569',
                      lineHeight: 1.6
                    }}
                  >
                    {item.desc}
                  </p>
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 bg-[#1E3A8A] transition-all duration-250 ease-out"
                    style={{ width: '0' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.width = '100%';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.width = '0';
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <h3 style={{ fontSize: '14px', fontWeight: 500 }} className="text-xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
            <FAQSection faqs={msmeFaqs} />
          </div>
        </div>
      </section>

      {/* SECTION 3 — Business Credit */}
      <section id="business-credit" className="py-16 px-4 bg-white" style={{ marginBottom: '60px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📊</span>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>Business Credit</h2>
              <div style={{ width: '48px', height: '3px', backgroundColor: '#F59E0B', marginTop: '4px' }}></div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }}>
              Advanced Credit Intelligence with Automated Recovery Tools
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              In the fast-paced world of modern commerce, maintaining financial stability requires a combination of accurate data and proactive collection strategies. CreditDataWatch provides a suite of smart reporting, risk evaluation, and automated follow-up systems designed to secure your revenue and eliminate the risk of bad debt.
            </p>

            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Evaluate Risks with Precision Business Credit Profiles
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Our in-depth company credit profiles offer a transparent view of any business's financial habits, including their track record of payments, current debt levels, and credit usage. For vendors and smaller enterprises (MSMEs), these insights are vital for vetting new clients and avoiding high-risk agreements. By utilizing our sophisticated database, you can cross-reference records of chronic non-payers. This builds a foundation of trust and allows you to implement highly effective payment recovery plans.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
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
                <div 
                  key={idx} 
                  className="relative overflow-hidden transition-all duration-250 ease-out hover:-translate-y-1"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px rgba(30, 58, 138, 0.08)',
                    padding: '24px'
                  }}
                >
                  <div 
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#EFF6FF',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ color: '#3B82F6', fontSize: '24px' }}>{item.icon}</span>
                  </div>
                  <h4 
                    style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      color: '#1E3A8A',
                      marginBottom: '4px'
                    }}
                  >
                    {item.title}
                  </h4>
                  <p 
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#475569',
                      lineHeight: 1.6
                    }}
                  >
                    {item.desc}
                  </p>
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 bg-[#1E3A8A] transition-all duration-250 ease-out"
                    style={{ width: '0' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.width = '100%';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.width = '0';
                    }}
                  ></div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Struggling with Late Payments? We Have the Solution.
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Delayed invoices can paralyze your operations. Our system doesn't just wait for a default; it uses predictive trends and early-warning alerts to help you resolve credit issues before they escalate. We provide a clear, step-by-step roadmap to turn your pending receivables into liquid cash.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
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
                <div 
                  key={idx} 
                  className="relative overflow-hidden transition-all duration-250 ease-out hover:-translate-y-1"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 4px 24px rgba(30, 58, 138, 0.08)',
                    padding: '24px'
                  }}
                >
                  <div 
                    className="flex items-center justify-center mb-3"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#EFF6FF',
                      borderRadius: '8px'
                    }}
                  >
                    <span style={{ color: '#3B82F6', fontSize: '24px' }}>{item.icon}</span>
                  </div>
                  <h4 
                    style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 700, 
                      color: '#1E3A8A',
                      marginBottom: '4px'
                    }}
                  >
                    {item.title}
                  </h4>
                  <p 
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#475569',
                      lineHeight: 1.6
                    }}
                  >
                    {item.desc}
                  </p>
                  <div 
                    className="absolute bottom-0 left-0 h-0.5 bg-[#1E3A8A] transition-all duration-250 ease-out"
                    style={{ width: '0' }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.width = '100%';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.width = '0';
                    }}
                  ></div>
                </div>
              ))}
            </div>

            <p className="text-lg font-semibold text-gray-800 mt-4">
              Register now and make the data-driven decisions that will fuel your company's growth.
            </p>
          </div>

          <div className="mt-12">
            <h3 style={{ fontSize: '14px', fontWeight: 500 }} className="text-xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
            <FAQSection faqs={businessCreditFaqs} />
          </div>
        </div>
      </section>

      {/* SECTION 4 — Business Debt */}
      <section id="business-debt" className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💰</span>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>Business Debt</h2>
              <div style={{ width: '48px', height: '3px', backgroundColor: '#F59E0B', marginTop: '4px' }}></div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }}>
              Business Debt Solutions — Empowering Small Businesses with CreditDataWatch
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
              In today's competitive business landscape, small enterprises often struggle with the challenge of managing debt. The weight of unpaid dues can restrict growth and profitability, making financial stability harder to achieve. CreditDataWatch, a trusted business credit reporting agency, offers tailored debt-management services designed to meet the unique needs of small businesses.
            </p>

            <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Proactive Debt Resolution Techniques
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Debt settlement is always better prevented than resolved. This means managing cash flow actively, preparing realistic budgets, and maintaining open lines of communication regarding debts. A prevention-first attitude keeps debts from piling up and avoids costly settlements.
              </p>
            </div>

            <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Managing Business Debts with CreditDataWatch
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                Armed with holistic business credit reporting services, small businesses gain insight into the creditworthiness of prospective partners, customers, or suppliers. With accurate business credit reports, businesses are empowered to make informed decisions that minimize the risk of transacting with unreliable entities and mitigate the chances of accumulating bad debt.
              </p>
            </div>

            <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Expert Tips for Debtor Management
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                From establishing effective communication channels to implementing collection strategies, CreditDataWatch equips businesses with the tools they need to streamline their debtor management processes and improve settlement rates.
              </p>
            </div>

            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                CreditDataWatch — Your Trusted Business Credit Reporting Agency
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                We offer comprehensive company credit reports that provide valuable insights into the financial health and creditworthiness of businesses. By leveraging CreditDataWatch's reports, small businesses can make informed decisions when extending credit or entering partnerships, minimizing the risk of bad debt and potential losses.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                The Debt Settlement Process at CreditDataWatch
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                We initiate negotiations with creditors on behalf of small businesses and work towards achieving the best possible settlement terms. By leveraging strong relationships with creditors and an in-depth understanding of debt settlement regulations, CreditDataWatch ensures small businesses can pursue debt settlement with confidence.
              </p>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Elevating Business Credit Management
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                From credit risk assessment to credit monitoring, CreditDataWatch provides the necessary tools and resources to help businesses make sound credit decisions, strengthen their creditworthiness, and build solid relationships with creditors.
              </p>
            </div>

            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#1a3c6e' }} className="font-bold mb-3">
                Streamlining the Payment Settlement Process
              </h3>
              <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#333' }} className="leading-relaxed">
                CreditDataWatch offers innovative solutions that simplify payment settlement and tracking. By automating payment processes and providing real-time updates, CreditDataWatch enables small businesses to focus on their core operations while ensuring smooth cash flow management.
              </p>
            </div>

            <div className="bg-white border border-[#e0e6f0] rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3" style={{ fontSize: '14px', fontWeight: 500 }}>
                Debt Settlement Timeline
              </h3>
              <div className="relative pl-8 space-y-6">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-[#dce6f5]"></div>
                {[
                  ['Report the Defaulter', 'Add the non-paying business to the CreditDataWatch system.'],
                  ['Negotiate Terms', 'Work with the defaulter to agree on repayment conditions.'],
                  ['Confirm Settlement', 'Update the record once dues are cleared.'],
                  ['Ensure Transparency', 'The defaulter\'s past record remains visible, encouraging accountability in future transactions.'],
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

          <div className="mt-12">
            <h3 style={{ fontSize: '14px', fontWeight: 500 }} className="text-xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
            <FAQSection faqs={businessDebtFaqs} />
          </div>
        </div>
      </section>



    </div>
  )
}
