import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const services = [
  {
    title: 'Report Overdue Payer',
    desc: 'File overdue invoices with supporting docs and trigger formal follow-ups.',
    to: '/services/report-overdue',
    icon: '📋',
  },
  {
    title: 'Credit Management',
    desc: 'Centralize payment reminders, validation workflows, and dispute tracking.',
    to: '/services/credit-management',
    icon: '💳',
  },
  {
    title: 'Partners Credit Overdue Report',
    desc: 'Share structured overdue data with partner networks to reduce risk.',
    to: '/services/partners-report',
    icon: '📊',
  },
  {
    title: 'Finalization Steps',
    desc: 'Lock the trade record with acknowledgment, settlement notes, and audit trails.',
    to: '/services/finalization',
    icon: '✅',
  },
]

export default function ServicesGrid() {
  return (
    <section className="section-padding" style={{ background: 'linear-gradient(180deg, #DBEAFE 0%, #EFF6FF 100%)' }}>
      <div className="container-custom">
        <div 
          className="text-center mb-14"
        >
          <div className="inline-block w-20 h-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-full mb-4" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-[#0F172A] mb-4">Services Overview</h2>
          <p className="text-lg text-[#475569] max-w-2xl mx-auto">
            Centralized credit intelligence workflows designed for GST-registered businesses.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, idx) => (
            <div
              key={service.title}
              className="group transition-all duration-300 ease-out"
            >
              <Link to={service.to} className="block h-full">
                <div 
                  className="card h-full overflow-hidden bg-white rounded-2xl"
                  style={{
                    boxShadow: '0 10px 40px -10px rgba(30, 58, 138, 0.15)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)'
                    e.currentTarget.style.boxShadow = '0 25px 50px -10px rgba(30, 58, 138, 0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(30, 58, 138, 0.15)'
                  }}
                >
                  <div className="p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-50 to-transparent -mt-20 -mr-20 rounded-full" />
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-5 text-2xl"
                      style={{ 
                        background: 'linear-gradient(135deg, #EFF6FF 0%, #BFDBFE 100%)', 
                        color: '#1E3A8A',
                        boxShadow: '0 4px 15px rgba(59,130,246,0.25)'
                      }}
                    >
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-heading font-bold text-[#1E3A8A] mb-3">{service.title}</h3>
                    <p className="text-[#475569] mb-5 leading-relaxed">{service.desc}</p>
                    <span 
                      className="font-bold inline-flex items-center gap-2"
                      style={{ color: '#3B82F6' }}
                    >
                      Learn more <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
