import { motion } from 'framer-motion'

const testimonials = [
  {
    name: 'Customer Corner',
    role: 'Partner',
    quote: 'Outstanding partner for accounts receivable. Their approach is firm yet respectful, and the results speak for themselves. Our cash flow has improved significantly.',
  }
]

export default function Testimonial() {
  return (
    <section className="section-padding" style={{ background: 'linear-gradient(180deg, #EFF6FF 0%, #FFFFFF 100%)' }}>
      <div className="container-custom">
        <div className="text-center mb-12">
          <div className="inline-block w-20 h-1 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] rounded-full mb-4" />
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#0F172A]">Customer Trust</h2>
          <p className="text-lg text-[#475569]">Signals from early adopters</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((item, idx) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="card bg-white rounded-2xl"
              style={{
                boxShadow: '0 10px 40px -10px rgba(30, 58, 138, 0.15)',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="h-12 w-12 rounded-full font-heading font-bold flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)',
                    color: 'white'
                  }}
                >
                  {item.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-[#0F172A]">{item.name}</p>
                  <p className="text-sm text-[#475569]">{item.role}</p>
                </div>
              </div>
              <p className="text-[#475569] leading-relaxed">“{item.quote}”</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
