import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import ParticleBackground from '../ui/ParticleBackground'
import TypewriterText from '../ui/TypewriterText'

const tiles = [
  { title: 'Partners Credit Overdue Report', to: '/services/partners-report' },
  { title: 'Payment Follow-ups', to: '/services/credit-management' },
  { title: 'Report Overdue Payer', to: '/services/report-overdue' },
  { title: 'Finalization', to: '/services/finalization' },
  { title: 'Legal Service', to: '/offerings' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
}

export default function HeroSection() {
  const headingText = "India’s Credit Intelligence Hub – Streamline Your Business Credit Transactions"
  const words = headingText.split(" ")
  
  return (
    <section 
      className="relative overflow-hidden text-white section-padding"
      style={{ 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)',
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2393C5FD' fill-opacity='0.4'%3E%3Ccircle cx='2' cy='2' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px'
        }}
      />
      
      <div className="container-custom grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center relative z-10">
        <div 
          className="fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          <p 
            className="inline-flex items-center rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white/90 mb-6 backdrop-blur-sm border border-white/20"
          >
            <span className="mr-2 h-2 w-2 rounded-full bg-[#F59E0B] animate-pulse" />
            GST-Registered Businesses Only
          </p>
          
          <h1 
            className="font-heading font-extrabold mb-6"
            style={{ 
              fontSize: 'clamp(2.5rem, 5vw, 4rem)', 
              lineHeight: 1.1 
            }}
          >
            <TypewriterText text={headingText} />
          </h1>
          
          <p 
            className="mb-9 max-w-2xl"
            style={{ 
              color: '#93C5FD', 
              fontSize: '1.1rem', 
              fontWeight: 400 
            }}
          >
            Mutual transaction acknowledgment and formal validation between buyers and suppliers. Report overdue payers, manage collections, and protect your trade lines.
          </p>
          
          <div 
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link to="/services/report-overdue" 
              className="inline-flex items-center justify-center px-5 py-3 rounded-[10px] font-semibold tracking-[0.01em] shadow-md transition-all duration-200"
              style={{ backgroundColor: '#F59E0B', color: '#0F172A' }}
            >
              Report Overdue Payer
            </Link>
            <Link to="/appointment" 
              className="inline-flex items-center justify-center px-5 py-3 rounded-[10px] font-semibold tracking-[0.01em] border-2 bg-transparent text-white transition-all duration-200 hover:bg-white/10"
              style={{ borderColor: 'white' }}
            >
              Book Appointment
            </Link>
          </div>
          
          <div 
            className="mt-10 flex flex-wrap gap-6 text-sm text-white/80"
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] shadow-sm" /> Formal trade validation
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B] shadow-sm" /> Collections-ready workflows
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6] shadow-sm" /> Secure GST-first access
            </span>
          </div>
        </div>

        <div 
          className="grid grid-cols-2 md:grid-cols-3 gap-4"
          style={{ 
            filter: 'drop-shadow(0 0 40px rgba(59,130,246,0.3))' 
          }}
        >
          {tiles.map((tile, idx) => (
            <div 
              key={tile.title} 
              className="group"
            >
              <Link to={tile.to} className="block">
                <div 
                  className="card h-full bg-white/10 border border-white/20 text-white backdrop-blur-md hover:bg-white/15"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold leading-snug text-base">{tile.title}</p>
                    <span className="text-sm text-white/80 group-hover:rotate-45 group-hover:translate-x-1 transition-all duration-300">
                      →
                    </span>
                  </div>
                  <div className="mt-3 h-1.5 w-12 rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] group-hover:w-full transition-all duration-300" />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      
      {/* Wave divider */}
      <div className="wave-divider absolute bottom-0">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,56.5L50,53.8C100,51,200,45.5,300,42.8C400,40.2,500,40.3,600,44.2C700,48,800,55.5,900,56.8C1000,58,1100,53,1150,50.5L1200,48V120H1150C1100,120,1000,120,900,120C800,120,700,120,600,120C500,120,400,120,300,120C200,120,100,120,50,120H0Z" className="shape-fill" />
        </svg>
      </div>
    </section>
  )
}
