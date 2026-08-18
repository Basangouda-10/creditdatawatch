import { motion } from 'framer-motion'
import PricingTable from '../components/common/PricingTable'

const DEFAULT_CONTENT = {
  title: "Our Offerings",
  subtitle: "Scalable solutions for every stage of growth",
  plans: [
    {
      name: "Base",
      price: "₹500",
      description: "Entry-level plan for small businesses.",
      features: [
        "Validity: 1 Month",
        "Legal Assistance: NO",
        "Reminder Follow-ups: Yes",
        "CIR Generation Fee: Included"
      ]
    },
    {
      name: "Royal",
      price: "₹1,000",
      description: "For growing businesses.",
      features: [
        "Validity: 6 Months",
        "Legal Assistance: 5 Incidents",
        "Reminder Follow-ups: Yes",
        "CIR Generation Fee: Included"
      ]
    },
    {
      name: "Groups",
      price: "₹2,000",
      description: "For organizations with multiple entities.",
      features: [
        "Validity: 1 Year",
        "Legal Assistance: 20 Incidents",
        "Reminder Follow-ups: Yes",
        "CIR Generation Fee: Included"
      ]
    },
    {
      name: "Enterprise",
      price: "₹1,00,000",
      description: "Maximum protection and support.",
      featured: true,
      features: [
        "Validity: 1 Year",
        "Legal Assistance: 100 Incidents",
        "Reminder Follow-ups: Yes",
        "CIR Generation Fee: Included"
      ]
    }
  ]
}

export default function Offerings() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-[#F0F4FF]">
      {/* Navy Gradient Header */}
      <section 
        className="py-20 px-4 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Our Offerings
        </h1>
        {/* Gold Underline */}
        <div 
          className="mx-auto mb-4"
          style={{ width: '48px', height: '3px', backgroundColor: '#F59E0B' }}
        ></div>
        <p className="text-[#93C5FD] text-lg max-w-3xl mx-auto">
          Scalable solutions for every stage of growth
        </p>
      </section>

      {/* Offerings Hero */}
      <section className="py-12 px-4 bg-[#EFF6FF] relative overflow-hidden">
        {/* Dot Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #1E3A8A 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#0F172A] mb-4">
            Choose the right plan for your business
          </h2>
          <p className="text-[#475569] text-lg">
            From small businesses to large enterprises, we have the perfect plan for you
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <PricingTable content={DEFAULT_CONTENT} />
      </section>

      {/* Bottom CTA Section */}
      <section 
        className="py-20 px-4 text-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)'
        }}
      >
        {/* Decorative Circles */}
        <div 
          className="absolute top-10 left-10 w-64 h-64 rounded-full"
          style={{
            backgroundColor: '#1E3A8A',
            opacity: 0.1
          }}
        ></div>
        <div 
          className="absolute bottom-10 right-10 w-96 h-96 rounded-full"
          style={{
            backgroundColor: '#0F172A',
            opacity: 0.1
          }}
        ></div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to protect your business?
          </h2>
          <p className="text-[#93C5FD] text-lg mb-8">
            Join thousands of Indian businesses using CreditDataWatch
          </p>
          <a 
            href="/membership"
            className="inline-block px-8 py-4 rounded-[10px] font-bold text-[#0F172A] transition-all duration-200 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
            }}
          >
            Get Started Now
          </a>
        </div>
      </section>
    </motion.div>
  )
}
