import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const solutions = [
  {
    title: 'B2B Solutions',
    desc: 'Multi-entity workflows, trade validation, and risk scoring for enterprise supply chains.',
    bullets: [
      'Vendor onboarding with GST checks',
      'Trade acknowledgement with dual consent',
      'Portfolio-level overdue heatmaps',
    ],
    to: '/solutions',
    tone: 'from-primary-500/90 to-primary-700/90',
  },
  {
    title: 'MSME Solutions',
    desc: 'Simple, guided flows for small teams to report overdue payers and secure faster collections.',
    bullets: [
      '1-click overdue filings',
      'Automated reminder cadences',
      'Guided dispute resolution steps',
    ],
    to: '/solutions',
    tone: 'from-emerald-500/90 to-emerald-600/90',
  },
  {
    title: 'Business Credit',
    desc: 'Build and protect your business credit posture with verified trade lines.',
    bullets: [
      'Credit score insights with action cards',
      'Positive trade line submissions',
      'Identity & compliance guardrails',
    ],
    to: '/solutions',
    tone: 'from-indigo-500/90 to-indigo-600/90',
  },
  {
    title: 'Business Debt',
    desc: 'Manage liabilities, renegotiate terms, and stay compliant across payables.',
    bullets: [
      'Debt calendar and escalations',
      'Negotiation playbooks',
      'Settlement documentation vault',
    ],
    to: '/solutions',
    tone: 'from-amber-500/90 to-amber-600/90',
  },
]

export default function SolutionsSection() {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-3">Solutions Overview</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tailored credit intelligence for enterprises and MSMEs to keep commerce trusted.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {solutions.map((solution, idx) => (
            <Link key={solution.title} to={solution.to} className="block">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="card overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className={`-m-6 mb-6 p-6 bg-gradient-to-r ${solution.tone} text-white`}> 
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-heading font-semibold">{solution.title}</h3>
                    <span className="text-white/80 text-sm">GST-first</span>
                  </div>
                  <p className="text-white/80 mt-2">{solution.desc}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {solution.bullets.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-700">
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="btn-primary w-full text-center">
                  Explore Solutions
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
