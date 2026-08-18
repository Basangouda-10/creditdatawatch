import { useState, useEffect } from 'react'

const TrustTicker = () => {
  const [trustScore, setTrustScore] = useState(0)
  const [verifiedCompanies, setVerifiedCompanies] = useState(0)
  const [transactions, setTransactions] = useState(0)

  useEffect(() => {
    const animateCount = (target, setter, duration = 2000) => {
      const start = 0
      const increment = target / (duration / 16)
      let current = start
      const timer = setInterval(() => {
        current += increment
        if (current >= target) {
          setter(target)
          clearInterval(timer)
        } else {
          setter(Math.floor(current))
        }
      }, 16)
    }
    animateCount(98, setTrustScore)
    animateCount(12450, setVerifiedCompanies)
    animateCount(456780, setTransactions)
  }, [])

  const tickerItems = [
    { label: 'Average Trust Score', value: trustScore, suffix: '%' },
    { label: 'Verified Companies', value: verifiedCompanies.toLocaleString(), suffix: '' },
    { label: 'Secure Transactions', value: transactions.toLocaleString(), suffix: '+' }
  ]

  return (
    <section className="py-10 bg-white border-y border-primary-100 overflow-hidden">
      <div className="container-custom">
        <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
          {tickerItems.map((item, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl md:text-5xl font-heading font-bold bg-gradient-primary bg-clip-text text-transparent mb-1">
                {item.value}{item.suffix}
              </div>
              <div className="text-text-secondary text-sm md:text-base font-medium">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrustTicker
