import { Link } from 'react-router-dom'

export default function About() {
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
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">About CreditDataWatch</h1>
          <div 
            className="mx-auto mb-6"
            style={{ 
              width: '80px', 
              height: '2px', 
              backgroundColor: '#F59E0B' 
            }}
          ></div>
          <p className="text-[#93C5FD] text-lg max-w-3xl mx-auto">
            India's premier credit intelligence hub — empowering businesses and MSMEs with verified data, risk management tools, and debt recovery solutions.
          </p>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0F172A] mb-6">What is CreditDataWatch?</h2>
          <p className="text-[#475569] text-lg mb-6 max-w-3xl">
            CreditDataWatch is India's centralized credit intelligence hub built specifically for B2B businesses and MSMEs.
            We enable businesses to report overdue payers, validate trade partners, manage credit risk, and resolve outstanding debts —
            all in one platform, powered by GST-verified data.
          </p>
          <p className="text-[#475569] mb-10 max-w-3xl">
            Our platform serves as a trusted database of commercial credit behaviour, compiled exclusively from reports submitted
            by our network of GST-registered members. Every entry is thoroughly verified by our specialist team before
            being published, ensuring accuracy and reliability at every step.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🏢', title: 'For Enterprises', desc: 'High-impact B2B credit solutions engineered to strengthen your organization\'s financial foundation with predictive modeling and 360° credit profiles.' },
              { icon: '🏭', title: 'For MSMEs', desc: 'Simplified MSME enrollment, credit rating tools, and data-driven insights to help small businesses compete and grow on a larger scale.' },
              { icon: '⚖️', title: 'For Legal Recovery', desc: 'Formal legal notices, qualified legal assistance, and a structured case closure framework to recover outstanding dues efficiently.' },
            ].map(item => (
              <div 
                key={item.title} 
                className="card group transition-all duration-250 ease-out hover:-translate-y-1"
              >
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h3 className="font-bold text-[#1E3A8A] mb-2">{item.title}</h3>
                <p className="text-[#475569] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works + Flow Diagram — Row 1 */}
      <section className="py-16 px-4 bg-[#F0F4FF]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-stretch">
            {/* Flow Diagram */}
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold text-[#0F172A] mb-6 relative inline-block">
                Our Process Flow
                <span 
                  className="absolute -bottom-2 left-0 w-12 h-1.5"
                  style={{ backgroundColor: '#F59E0B' }}
                ></span>
              </h2>
              <div 
                className="card flex-1"
                style={{ borderTop: '3px solid #1E3A8A', boxShadow: '0 4px 24px rgba(30, 58, 138, 0.15)' }}
              >
                <div className="flex-1 flex items-center justify-center">
                  <img
                    src="/flow-diagram.png"
                    alt="CreditDataWatch Process Flow"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="flex flex-col">
              <h2 className="text-3xl font-bold text-[#0F172A] mb-2 relative inline-block">
                How CreditDataWatch Works
                <span 
                  className="absolute -bottom-2 left-0 w-12 h-1.5"
                  style={{ backgroundColor: '#F59E0B' }}
                ></span>
              </h2>
              <p className="text-[#475569] mb-6">A transparent, verified, and GST-first approach to credit intelligence</p>
              <div 
                className="card flex-1 flex flex-col gap-4"
                style={{ borderTop: '3px solid #1E3A8A', boxShadow: '0 4px 24px rgba(30, 58, 138, 0.15)' }}
              >
                {[
                  ['🔐', 'GST-Verified Registration', 'Businesses register using their valid GSTIN. No GSTIN, no registration — this ensures every member is a genuine, verified business entity.'],
                  ['📋', 'Report & Document', 'Members submit defaulter details with supporting documents — ledger, CA-certified statement with UDIN, POs, and delivery proofs.'],
                  ['🔍', 'Expert Verification', 'Our specialist team rigorously reviews every submission within 1–2 business days, ensuring only accurate, verified data is published.'],
                  ['🌐', 'National Visibility', 'Verified defaulters are listed on the CreditDataWatch Global Rating Dashboard, visible to all members nationwide — impacting credit scores and market credibility.'],
                  ['🤝', 'Settlement & Closure', 'Once dues are cleared, the creditor marks the case as Settled/Closed, halting all alerts and allowing the defaulter to begin credit restoration.'],
                ].map(([icon, title, desc], idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-2xl text-[#3B82F6] flex-shrink-0">→</span>
                    <div>
                      <p className="font-semibold text-[#1E3A8A] flex items-center gap-1 text-sm"><span>{icon}</span>{title}</p>
                      <p className="text-[#475569] text-xs mt-0.5" style={{ lineHeight: 1.6 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission — Row 2 */}
      <section className="py-16 px-4 bg-[#F0F4FF]">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Our Mission */}
          <div 
            className="card relative overflow-hidden"
            style={{ 
              backgroundColor: '#EFF6FF', 
              borderLeft: '4px solid #1E3A8A' 
            }}
          >
            <span 
              className="absolute top-2 right-4 text-6xl font-serif opacity-10"
              style={{ color: '#1E3A8A' }}
            >"</span>
            <h3 className="text-2xl font-bold text-[#1E3A8A] mb-4">Our Mission</h3>
            <ol className="space-y-3 text-[#475569]">
              <li className="flex items-start gap-3">
                <span className="bg-[#3B82F6] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                <span>Empower businesses to monitor, manage, and recover credit transactions efficiently through a unified digital platform.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#3B82F6] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                <span>Promote financial discipline and accountability by enabling companies to report defaulters and access verified credit ratings.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#3B82F6] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                <span>Provide real-time visibility into purchase orders, payments, and customer credit behavior to support confident decision-making.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#3B82F6] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">4</span>
                <span>Facilitate ethical recovery and settlement processes through structured notifications, documentation, and legal support.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#3B82F6] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">5</span>
                <span>Build a community of responsible businesses that collaborate to maintain financial health and trust across industries.</span>
              </li>
            </ol>
          </div>

          {/* Our Vision */}
          <div 
            className="card relative overflow-hidden"
            style={{ 
              backgroundColor: '#FFFBEB', 
              borderLeft: '4px solid #F59E0B' 
            }}
          >
            <span 
              className="absolute top-2 right-4 text-6xl font-serif opacity-10"
              style={{ color: '#F59E0B' }}
            >"</span>
            <h3 className="text-2xl font-bold text-[#1E3A8A] mb-4">Our Vision</h3>
            <p className="text-[#475569] leading-relaxed">
              "To create a transparent and trusted business ecosystem where every organization can make informed credit decisions, minimize financial risk, and strengthen long-term partnerships through verified data and actionable insights."
            </p>
          </div>
        </div>
      </section>

      {/* Why CreditDataWatch */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0F172A] mb-2">Why CreditDataWatch?</h2>
          <p className="text-[#475569] mb-6">
            CreditDataWatch offers highly competitive and budget-friendly membership plans that include robust features.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              ['✅', 'GST-First Verification', 'All data is anchored to valid GSTINs, eliminating fraud and ensuring business authenticity.'],
              ['🤖', 'Automated Collections', 'Automated reminders and follow-ups reduce manual effort and keep cash flow healthy.'],
              ['🌍', 'National Network', 'Credit information and defaulter lists are accessible to all members throughout India.'],
              ['⚖️', 'Legal Support', 'Access qualified legal assistance and formal legal notices through our vetted network.'],
              ['📊', 'Real-Time Dashboard', 'Monitor every credit transaction, default status, and settlement update in one dashboard.'],
            ].map(([icon, title, desc]) => (
              <div 
                key={title} 
                className="card group transition-all duration-250 ease-out hover:-translate-y-1 flex items-start gap-3"
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-semibold text-[#1E3A8A] text-sm">{title}</p>
                  <p className="text-[#475569] text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
