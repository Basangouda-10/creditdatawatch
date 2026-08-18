import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function PartnersReport() {
  const features = [
    'Verified Network Data: Review authenticated default records from a wide range of partner businesses.',
    'Cross-Sector Analysis: Compare credit backgrounds across multiple different industries.',
    'Risk Detection: Identify potential non-payers early with our proactive warning system.',
    'Deep Financial Auditing: Perform a thorough evaluation of a company\'s credit reliability.',
    'Trend Monitoring: Spot specific defaulting patterns within your particular trade sector.',
  ]

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-heading font-bold mb-4">Partners Credit Overdue Report</h1>
          </div>

          {/* Intro */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Intro paragraph</h2>
            <p className="text-gray-700 leading-relaxed">
              Access the Collaborative Overdue Registry to identify high-risk payment defaulters. Missing a name? Email support@preflexsol.com with the vendor's GSTN, and our team will assist. Use this collective data to streamline your due diligence and safeguard your business against credit risks.
            </p>
            <p className="text-gray-700 leading-relaxed">
              To maintain the highest standards, our dedicated specialists manually review and validate every report. This ensures you receive only the most trustworthy insights into payment habits, historical disputes, and resolution trends throughout the country.
            </p>
          </div>

          {/* Key Features */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Key features list</h2>
            <div className="space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary-600 flex-shrink-0" />
                  <p className="text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-step process */}
          <div className="card space-y-4">
            <h2 className="text-2xl font-heading font-bold text-primary-700">Step-by-step process (4 steps)</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                <strong>Step 1 — Identify the Business</strong><br />
                Simply input the GSTIN of the entity you wish to investigate.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Step 2 — Access Validated Data</strong><br />
                Instantly retrieve a list of confirmed defaults reported.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Step 3 — Evaluate the Risk</strong><br />
                Examine past payment behaviors, unpaid balances, and how they handled previous settlements.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>Step 4 — Execute Confidently</strong><br />
                Use these professional insights to set safe credit boundaries and protect your revenue.
              </p>
            </div>
          </div>

          {/* Resolution & Finalization Guide */}
          <div className="card space-y-4 bg-amber-50 border-amber-200">
            <h2 className="text-2xl font-heading font-bold text-amber-900">Resolution & Finalization Guide</h2>
            <p className="text-amber-800 leading-relaxed">
              Our Case Closure Framework provides a systematic path for documenting, publishing, and resolving default claims on the CreditDataWatch portal. This structured workflow ensures full transparency for both the creditor and the debtor throughout the recovery lifecycle.
            </p>
            <p className="text-amber-800 leading-relaxed">
              By adhering to these protocols, you ensure that your records remain legally sound and that your business stays compliant with industry standards during every phase of the dispute.
            </p>

            <h3 className="text-xl font-heading font-bold text-amber-900">The 5-Step Workflow:</h3>
            <div className="space-y-2">
              {[
                '1. Evidence Compilation — Organize all necessary financial records, including purchase orders, invoices, and proof of fulfillment.',
                '2. Audit & Validation — The CreditDataWatch internal team reviews your submission to ensure all data is accurate and complete.',
                '3. Formal Publication — Once the GSTIN and ledger are authenticated, the default is officially listed on the Credit DataWatch Global Rating Dashboard.',
                '4. Monitoring Progress — Keep track of recovery milestones and record any payments as they arrive.',
                '5. Final De-listing — Once the debt is fully satisfied, close the file to refresh the business\'s status on the platform.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-600 flex-shrink-0" />
                  <p className="text-amber-700">{item}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-heading font-bold text-amber-900">Essential Documentation Checklist:</h3>
            <div className="space-y-2">
              {[
                'Tax Identifiers: Valid GSTIN for both the claimant and the defaulting entity.',
                'Financial Statement: A current account ledger highlighting the exact overdue balance.',
                'Transactional Proof: Copies of all relevant bills and delivery confirmations.',
                'Interaction History: A log of previous collection attempts.',
                'Supplementary Evidence: Any additional files that support your claim.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-600 flex-shrink-0" />
                  <p className="text-amber-700">{item}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-heading font-bold text-amber-900">Critical Guidelines:</h3>
            <div className="space-y-2">
              {[
                'Timeline: Verification usually takes 1 to 2 business days following a complete submission.',
                'File Standards: All uploads must be clearly readable and submitted in PDF format.',
                'GSTIN Requirement: Any registration without a valid GSTIN will not be accepted.',
                'Update Window: Creditors are required to log a settlement within 2 to 3 days of receiving funds.',
                'Member Accountability: Neglecting to update a settled status may lead to administrative disputes or support tickets.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-600 flex-shrink-0" />
                  <p className="text-amber-700">{item}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-heading font-bold text-amber-900">Post-Settlement Protocol:</h3>
            <p className="text-amber-800 leading-relaxed">
              When a payment is successfully received, the reporting member must mark the case as Resolved/Closed. Updating the status:
            </p>
            <div className="space-y-2">
              {[
                'Halts Collections: Immediately terminates all automated recovery alerts sent to the debtor.',
                'Reputation Recovery: Allows the business to begin restoring its credit standing.',
                'Data Integrity: Ensures the Credit DataWatch database reflects real-time accuracy.',
                'Professionalism: Restores the business relationship between both parties.',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-600 flex-shrink-0" />
                  <p className="text-amber-700">{item}</p>
                </div>
              ))}
            </div>

            <div className="bg-amber-100 rounded-xl p-4">
              <p className="font-semibold text-amber-900 text-sm mb-2">How to close a case:</p>
              <p className="text-amber-700 text-xs">Go to User Dashboard → Manage Defaulters → Locate Case → Mark as "Settled/Closed"</p>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  )
}
