import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'Q1. What is a defaulter?',
    a: 'A defaulter is a business that fails to pay its suppliers on time. Credit Datawatch offers a reliable, accessible database of these entities, compiling reports submitted exclusively by our network of GST-registered members.',
  },
  {
    q: 'Q2. Required Documentation for Defaulter Verification?',
    a: 'To substantiate a defaulter claim, members must upload an updated ledger for the defaulting party alongside a valid PO and a valid GST number. Please be aware that Credit Datawatch reserves the right to request further documentation if required for verification.',
  },
  {
    q: 'Q3. We submitted the required documents, but the defaulter is not showing on the list yet.',
    a: 'If you uploaded the verification files but the defaulter is still not showing up on the portal, or you provided all documentation but the defaulter\'s name hasn\'t been added yet — please contact us at support@preflexsol.com.',
  },
  {
    q: 'Q4. My outstanding balance has been fully paid and settled, yet I am still receiving collection follow-ups.',
    a: 'We understand that you have already settled your payment! To stop the automatic reminders, please contact the business or Credit Data Watch support team (support@preflexsol.com) with supporting documents. As soon as we receive the request, we will update this information on the Credit Datawatch portal and all follow-up communications will cease immediately.',
  },
  {
    q: 'Q5. Does it cost anything to add a defaulter to the list?',
    a: 'For registered Credit Datawatch members, the process of listing a defaulter is easy and free.',
  },
]

export default function ReportOverdue() {
  const [openFaq, setOpenFaq] = useState(0)

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Report Overdue Payer</h1>
          </div>

          {/* Section 1: Expose Corporate Defaulters */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">1. Expose Corporate Defaulters</h2>
            <p className="text-gray-700 leading-relaxed">
              For registered CreditDataWatch members, reporting a business defaulter is quick and easy. When you report a defaulter, you not only open the door to recovering your dues via the CreditDataWatch settlement portal, but you also shield other MSMEs from dealing with chronic non-payers. Because the Credit Information Report and Defaulters List are accessible to all our members throughout the country, any business you report will immediately face exposure on a national scale.
            </p>
          </div>

          {/* Section 2: Guidelines and Eligibility */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">2. Guidelines and Eligibility for Reporting Commercial Credit Defaulters</h2>
            <p className="text-gray-700 leading-relaxed">
              Businesses and MSMEs with a valid GST number and an active Credit Datawatch membership can report credit defaulters. To ensure acceptable accuracy, every report is thoroughly checked and verified by a Credit Datawatch specialist. This meticulous process guarantees that all information and defaulter lists on our portal are genuine and reliable. Furthermore, reporting a defaulter is a seamless and entirely free process for our members — simply fill in the required details under the "Report Defaulter" section, and you are ready to go.
            </p>
          </div>

          {/* Section 3: Prerequisites and Documentation */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">3. Prerequisites and Documentation for Reporting a Defaulting Business</h2>
            <p className="text-gray-700 leading-relaxed">
              To successfully report a business as a credit defaulter, you must submit key documents, including the defaulting party's ledger and a CA-certified statement of the due amount containing a valid UDIN. Once submitted, the CreditDataWatch expert team rigorously verifies the information. Upon successful review, the business is officially added to the defaulters list on our portal.
            </p>
          </div>

          {/* Section 4: Verification Process */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">4. What is the process for verifying a reported defaulter?</h2>
            <p className="text-gray-700 leading-relaxed">
              Credit Datawatch is committed to protecting the reputations of genuine businesses. We follow strict, standardized procedures to thoroughly verify every claim before adding any entity to our defaulters list. By taking every reasonable precaution, we ensure that the information on our portal remains accurate, reliable, and consistently up to date.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Credit Datawatch serves as a platform to list defaulters reported by our registered members and to track the payments. If the reporting member and the defaulting party reach a mutual agreement and settle the outstanding amount, the member has the option to remove the defaulter's name from the portal. Please note that the settlement process is facilitated between the members and the defaulting party using Credit DataWatch platform. The decision to remove a name from the defaulters list rests entirely at the discretion of the reporting member.
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
                        className="overflow-hidden whitespace-pre-line"
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
            <h3 className="text-2xl font-heading font-bold text-primary-900">Ready to Begin?</h3>
            <p className="text-gray-700">Schedule an appointment with us today!</p>
            <Link to="/appointment" className="btn-primary inline-block">
              Book Appointment
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
