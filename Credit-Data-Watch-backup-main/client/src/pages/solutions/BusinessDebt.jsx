import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'What is CreditDataWatch\'s approach to handling business debt?',
    a: 'CreditDataWatch offers a comprehensive platform designed to assist businesses in managing debt effectively. Through features like reporting defaulters, tracking payment histories, and providing tools for debt settlement, CreditDataWatch empowers businesses to take proactive steps in addressing outstanding debts and improving cash flow.',
  },
  {
    q: 'How can I report a business debt defaulter on CreditDataWatch?',
    a: 'To report a defaulter, businesses with a valid GSTIN can register on CreditDataWatch. Once registered, you can submit necessary documents such as ledgers and CA-certified dues. After verification, the defaulter’s details will be listed, alerting other businesses and aiding in recovery efforts.',
  },
  {
    q: 'What steps are involved in settling a business debt through CreditDataWatch?',
    a: 'The settlement process includes: 1. Reporting the Defaulter: List the non-paying business on CreditDataWatch. 2. Negotiation: Engage with the defaulter to agree on repayment terms. 3. Settlement: Once payment is received, update the status on CreditDataWatch. 4. Transparency: The defaulter’s history remains visible, promoting accountability.',
  },
  {
    q: 'How does CreditDataWatch\'s "Auto Payment Reminder and Follow-up" feature assist in debt settlement?',
    a: 'This feature automates the process of sending reminders to clients with outstanding payments. Utilizing channels like SMS, email, and WhatsApp, businesses can ensure timely follow-ups, reducing manual efforts and enhancing the chances of prompt payments.',
  },
  {
    q: 'Is there a fee associated with using CreditDataWatch\'s business debt services?',
    a: 'While reporting a defaulter is free for registered members, accessing advanced features such as detailed credit reports and automated reminder services requires a subscription. These premium services provide enhanced tools to manage and recover business debts effectively.',
  },
]

export default function BusinessDebt() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Business Debt Solutions</h1>
            <p className="text-xl text-gray-600">Udhaar Ko Kaise Settlement Karu: Empowering Small Businesses</p>
          </div>

          {/* Section 1: Intro */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Business Debt Solutions – Empowering Small Businesses with CreditDataWatch</h2>
            <p className="text-gray-700 leading-relaxed">
              In today's competitive business landscape, small businesses often face numerous challenges, like "Udhaar Ko Kaise Settlement Karu" and one of the most common hurdles they encounter is managing debt. The burden of business debts can be overwhelming, hindering growth and profitability. However, with the right strategies and tools in place, small businesses can effectively navigate these challenges and find solutions that empower them to thrive. One such solution is CreditDataWatch, a leading business credit reporting agency that offers comprehensive debt solutions tailored to meet the unique needs of small businesses.
            </p>
          </div>

          {/* Section 2: Small Business Guide */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Udhaar Ko Kaise Settlement Karu: The Small Business Guide</h2>
            <p className="text-gray-700 leading-relaxed">
              Various factors have contributed to generating working capital crunch or intervention in negotiations. Small businesses often wonder, "Udhaar Ko Kaise Settlement Karu?" Hence, maintaining good cash management practices and a positive reputation hinges on making well-settled dues.
            </p>
          </div>

          {/* Section 3: Understanding Debt Settlement */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Understanding Debt Settlement Strategies</h2>
            <p className="text-gray-700 leading-relaxed">
              The debt settlement process relates to the negotiation between the debtor and creditors for settling a debt for a lesser amount. This strategy is extremely beneficial to small businesses since it alleviates the debt burden and allows the small business to regain control over its finance. CreditDataWatch team of experts understands the intricacies involved in debt settlement and guides small businesses throughout the entire process for the best possible outcome.
            </p>
            <p className="text-gray-700 leading-relaxed">
              For business owners wondering "Udhaar Ko Kaise Settlement Karu", CreditDataWatch offers a structured and efficient way to resolve outstanding dues, ensuring both parties come to a mutual agreement without prolonged disputes.
            </p>
          </div>

          {/* Section 4: Proactive Resolution */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Proactive Debt Resolution Techniques</h2>
            <p className="text-gray-700 leading-relaxed">
              Debt settlement is indeed one of the factors in stopping a problem before it starts; it is always better to prevent it. Through debt resolution methods, small businesses would be able to act on these debts. This means that they would need to manage cash flow actively, prepare realistic budgets, and maintain open lines of communication regarding their debts. An attitude of prevention will keep debts from ever piling up, thus running away from settlements.
            </p>
          </div>

          {/* Section 5: Managing Debts */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Managing Business Debts with CreditDataWatch</h2>
            <p className="text-gray-700 leading-relaxed">
              To help small businesses have effective accounts receivable management, CreditDataWatch offers its innovative solutions. Armed with the holistic business credit reporting services provided by CreditDataWatch, small businesses gain insight into the creditworthiness of other prospective partners, customers, or suppliers. Thus, with the help of accurate business credit reports, small businesses are empowered to make informed decisions that minimize the risk of transacting with unreliable entities and also to mitigate the chances of accumulating bad debts.
            </p>
          </div>

          {/* Section 6: Expert Tips */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Expert Tips for Debtor Management</h2>
            <p className="text-gray-700 leading-relaxed">
              In addition to providing debt solutions, CreditDataWatch also offers expert tips for effective debtor management. Small businesses can benefit from CreditDataWatch's extensive knowledge and experience in handling debtors. From establishing effective communication channels to implementing collection strategies, CreditDataWatch equips businesses with the tools they need to streamline their debtor management processes and improve settlement rates.
            </p>
          </div>

          {/* Section 7: Debt Settlement Process */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">The Debt Settlement Process at CreditDataWatch</h2>
            <p className="text-gray-700 leading-relaxed">
              When it comes to debt settlement, CreditDataWatch follows a systematic and transparent process. They initiate negotiations with creditors on behalf of small businesses and work towards achieving the best possible settlement terms. By leveraging their strong relationships with creditors and their in-depth understanding of debt settlement laws and regulations, CreditDataWatch ensures that small businesses can pursue debt settlement with confidence and achieve favorable outcomes.
            </p>
          </div>

          {/* Section 8: Collection Agency */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Best Debt Collection Agency in India – CreditDataWatch's Expertise</h2>
            <p className="text-gray-700 leading-relaxed">
              CreditDataWatch's expertise extends beyond debt settlement. They are widely recognized as the best debt collection agency in India, offering unparalleled services in debt settlement. With a team of highly skilled professionals and advanced technology-driven systems, CreditDataWatch has a proven track record of successfully settling debts for small businesses across various industries.
            </p>
          </div>

          {/* Section 9: Leading Provider */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Leading Debt Settlement Services Provider – CreditDataWatch's Commitment</h2>
            <p className="text-gray-700 leading-relaxed">
              As a leading debt settlement services provider, CreditDataWatch is committed to empowering small businesses by offering tailored solutions that address their unique debt challenges. They understand that every business is different and requires personalized assistance to achieve financial stability. CreditDataWatch's commitment to excellence and customer satisfaction sets them apart, making them the go-to choice for small businesses seeking reliable debt solutions.
            </p>
          </div>

          {/* Section 10: Trusted Agency */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">CreditDataWatch – Your Trusted Business Credit Reporting Agency</h2>
            <p className="text-gray-700 leading-relaxed">
              CreditDataWatch is not just a debt solutions provider; they also serve as a trusted business credit reporting agency. They offer comprehensive company credit reports that provide valuable insights into the financial health and creditworthiness of businesses. By leveraging CreditDataWatch's reports, small businesses can make informed decisions when it comes to extending credit or entering into partnerships, minimizing the risk of bad debt and potential losses.
            </p>
          </div>

          {/* Section 11: Elevating Credit Mgmt */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Elevating Business Credit Management</h2>
            <p className="text-gray-700 leading-relaxed">
              Effective business credit management is essential for long-term success. With CreditDataWatch's expertise, small businesses can elevate their credit management practices. From credit risk assessment to credit monitoring, CreditDataWatch provides the necessary tools and resources to help businesses make sound credit decisions, strengthen their creditworthiness, and build solid relationships with creditors.
            </p>
          </div>

          {/* Section 12: Streamlining Payment Settlement */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Streamlining the Payment Settlement Process</h2>
            <p className="text-gray-700 leading-relaxed">
              One of the key aspects of managing business debts is streamlining the payment settlement process. CreditDataWatch offers innovative solutions that simplify payment settlement and tracking, ensuring timely and efficient payment settlements. By automating payment processes and providing real-time updates, CreditDataWatch enables small businesses to focus on their core operations while ensuring smooth cash flow management.
            </p>
          </div>

          {/* Section 13: Get Started */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Get Started with CreditDataWatch – Your Partner in Business Debt Solutions</h2>
            <p className="text-gray-700 leading-relaxed">
              If your small business is burdened with debts and struggling to find effective solutions, or Udhaar Ko Kaise Settlement Karu, CreditDataWatch is here to help. With their comprehensive range of debt solutions, including debt settlement, debt resolution techniques, debtor payment settlement and debtor management strategies, CreditDataWatch empowers small businesses to overcome debt challenges and achieve financial stability. Take the first step towards a debt-free future and partner with CreditDataWatch.
            </p>
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
                    <p className="font-semibold text-gray-900">{item.q}</p>
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
                        className="overflow-hidden"
                      >
                        <p className="text-gray-700 mt-3 leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="card bg-primary-50 border-primary-200 text-center space-y-4">
            <h3 className="text-2xl font-heading font-bold text-primary-900">Resolve Business Debt Today</h3>
            <p className="text-gray-700">Schedule an appointment with us!</p>
            <Link to="/appointment" className="btn-primary inline-block">
              Book Appointment
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
