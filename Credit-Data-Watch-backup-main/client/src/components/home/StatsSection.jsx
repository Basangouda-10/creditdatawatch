import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'

const stats = [
  { label: 'Highest No. of Defaulters by a Single Customer', value: '668+', prefix: '', suffix: '+', countTo: 668 },
  { label: 'Total Number of MSMEs Connected', value: '39+ Lakhs', prefix: '', suffix: '+ Lakhs', countTo: 39 },
  { label: 'Average Percentage of Settlements', value: '59%', prefix: '', suffix: '%', countTo: 59 },
  { label: 'Total amount reported defaulter', value: '4578+ Crores', prefix: '', suffix: '+ Crores', countTo: 4578 },
]

const AnimatedCounter = ({ from, to, duration = 2, suffix = '' }) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" })
  const [count, setCount] = useState(from)
  
  useEffect(() => {
    if (!isInView) return
    let start = from
    const increment = (to - from) / (duration * 60)
    const timer = setInterval(() => {
      start += increment
      if (start >= to) {
        setCount(to)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 1000 / 60)
    
    return () => clearInterval(timer)
  }, [isInView, from, to, duration])
  
  return (
    <span ref={ref} className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold" style={{ color: 'white' }}>
      {count}{suffix}
    </span>
  )
}

export default function StatsSection() {
  return (
    <section className="section-padding" style={{ background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)' }}>
      <div className="container-custom">
        <div 
          className="text-center mb-12"
        >
          <div className="inline-block w-24 h-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-full mb-4" />
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-[#0F172A] mb-3">
            Trusted by Thousands of Businesses
          </h2>
          <p className="text-[#475569] text-lg">
            Real-time stats showing our platform's impact across India
          </p>
        </div>
        
        <div className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <div
              key={stat.label}
              className="card relative overflow-hidden rounded-[20px]"
              style={{
                background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                boxShadow: '0 10px 40px -10px rgba(30, 58, 138, 0.35)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)'
                e.currentTarget.style.boxShadow = '0 25px 60px -10px rgba(30, 58, 138, 0.45)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(30, 58, 138, 0.35)'
              }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-400/30 to-transparent -mt-20 -mr-20 rounded-full" />
              <div className="relative p-6">
                <AnimatedCounter from={0} to={stat.countTo} duration={2.5} suffix={stat.suffix} />
                <p className="mt-4 text-base md:text-lg text-white/90 font-medium leading-relaxed">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
