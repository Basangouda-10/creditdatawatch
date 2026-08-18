import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { defaulters, drive } from '../services/api/apiClient'
import { isValidGstin } from '../utils/validation'
import { useAuth } from '../state/authContext'

const faqs = [
  { q: "What is a defaulter?", a: "A defaulter is a business that fails to pay its suppliers on time. CreditDataWatch offers a reliable, accessible database of these entities, compiling reports submitted exclusively by our network of GST-registered members." },
  { q: "What documentation is required for defaulter verification?", a: "Members must upload an updated ledger alongside a valid PO and GST number. CreditDataWatch reserves the right to request further documentation if required." },
  { q: "I submitted documents but the defaulting party has not appeared on the list yet?", a: "Please contact us at support@preflexsol.com with your submission details and our team will look into it immediately." },
  { q: "My balance is settled yet I am still receiving follow-ups. Why?", a: "To stop automatic reminders, contact support@preflexsol.com with supporting documents. All follow-up communications will cease immediately after we update the portal." },
  { q: "Does it cost anything to add a defaulter to the list?", a: "For registered CreditDataWatch members, the process of listing a defaulter is easy and completely free." },
  { q: "What is the verification timeline?", a: "Verification typically takes 1 to 2 business days following a complete submission. All uploads must be in PDF format." },
  { q: "How do I mark a defaulter as settled?", a: "Go to User Dashboard → Manage Defaulters → Locate Case → Mark as 'Settled/Closed.'" },
]

const steps = [
  { num: '1', title: 'Evidence Compilation', desc: 'Organize all financial records including purchase orders, invoices, and proof of fulfillment.' },
  { num: '2', title: 'Audit & Validation', desc: 'The CreditDataWatch internal team reviews your submission to ensure all data is accurate and complete.' },
  { num: '3', title: 'Formal Publication', desc: 'Once GSTIN and ledger are authenticated, the default is officially listed on the Global Rating Dashboard.' },
  { num: '4', title: 'Monitoring Progress', desc: 'Keep track of recovery milestones and record any payments as they arrive.' },
  { num: '5', title: 'Final De-listing', desc: "Once the debt is fully satisfied, close the file to refresh the business's status on the platform." },
]

const checklist = [
  { icon: '🪪', title: 'Tax Identifiers', desc: 'Valid GSTIN for both the claimant and the defaulting entity.' },
  { icon: '📊', title: 'Financial Statement', desc: 'A current account ledger highlighting the exact overdue balance.' },
  { icon: '📄', title: 'Transactional Proof', desc: 'Copies of all relevant bills and delivery confirmations.' },
  { icon: '📁', title: 'Interaction History', desc: 'A log of previous collection attempts.' },
  { icon: '📎', title: 'Supplementary Evidence', desc: 'Any additional files that support your claim.' },
]

export default function Defaulters() {
  const { canAccessFeature } = useAuth()
  const allowed = canAccessFeature('REPORT_OVERDUE')
  const [rows, setRows] = useState([])
  const [statusMsg, setStatusMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ business_name: '', business_gstin: '', pan: '', amount: '', invoice_number: '', due_date: '', notes: '', documents_drive_folder: '', ledger_url: '', ca_certificate_url: '' })
  const [selectedCase, setSelectedCase] = useState(null)
  const [docUpdate, setDocUpdate] = useState({ drive_folder_id: '', ledger_url: '', ca_certificate_url: '' })
  const [docStatus, setDocStatus] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => { 
    async function fetchData() { 
      setLoading(true) 
      const res = await defaulters.list() 
      if (res.ok && Array.isArray(res.data?.items)) setRows(res.data.items) 
      else if (res.ok && Array.isArray(res.data)) setRows(res.data) 
      setLoading(false) 
    } 
    fetchData() 
  }, []) 

  const handleChange = (e) => { 
    const { name, value } = e.target 
    setForm((prev) => ({ ...prev, [name]: value })) 
  } 

  const handleSubmit = async (e) => { 
    e.preventDefault() 
    setStatusMsg('') 
    if (!allowed) { setStatusMsg('Active subscription required to file defaulters.'); return } 
    const hasGstin = !!form.business_gstin 
    const hasPan = !!form.pan 
    if (hasGstin && !isValidGstin(form.business_gstin)) { setStatusMsg('Enter a valid GSTIN to continue.'); return } 
    if (hasPan && (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan))) { setStatusMsg('Enter a valid PAN (10 characters).'); return } 
    if (!form.business_name || !form.amount || !form.invoice_number || !form.due_date) { setStatusMsg('Fill all required fields.'); return } 
    setUploading(true) 
    let ledgerUrl = form.ledger_url 
    let caUrl = form.ca_certificate_url 
    try { 
      if (form.ledger_file) { 
        const fd = new FormData(); fd.append('file', form.ledger_file) 
        const upRes = await drive.upload(fd) 
        if (upRes.ok) ledgerUrl = upRes.data.webViewLink 
        else throw new Error('Failed to upload Ledger: ' + upRes.error) 
      } 
      if (form.ca_file) { 
        const fd = new FormData(); fd.append('file', form.ca_file) 
        const upRes = await drive.upload(fd) 
        if (upRes.ok) caUrl = upRes.data.webViewLink 
        else throw new Error('Failed to upload CA Certificate: ' + upRes.error) 
      } 
    } catch (err) { setUploading(false); setStatusMsg(err.message); return } 
    const payload = { 
      business_name: form.business_name.trim(), 
      business_gstin: form.business_gstin ? form.business_gstin.trim().toUpperCase() : '', 
      pan: form.pan ? form.pan.trim().toUpperCase() : '', 
      amount: Number(form.amount), 
      invoice_number: form.invoice_number.trim(), 
      due_date: form.due_date, 
      notes: form.notes || '', 
      documents_drive_folder: form.documents_drive_folder || '', 
      ledger_url: ledgerUrl || '', 
      ca_certificate_url: caUrl || '', 
    } 
    setUploading(false) 
    const res = await defaulters.create(payload) 
    if (!res.ok) { setStatusMsg(res.error || 'Failed to file defaulters'); return } 
    setRows((prev) => [res.data, ...prev])
    setForm({ business_name: '', business_gstin: '', pan: '', amount: '', invoice_number: '', due_date: '', notes: '', documents_drive_folder: '', ledger_url: '', ca_certificate_url: '' }) 
    setStatusMsg('Defaulter filed successfully.') 
  } 

  const handleView = (row) => { 
    setSelectedCase(row) 
    setDocUpdate({ drive_folder_id: row.documents_drive_folder || '', ledger_url: row.ledger_url || '', ca_certificate_url: row.ca_certificate_url || '' }) 
    setDocStatus('') 
  } 

  const handleDocChange = (e) => { 
    const { name, value } = e.target 
    setDocUpdate((prev) => ({ ...prev, [name]: value })) 
  } 

  const handleDocSave = async () => { 
    if (!selectedCase) return 
    setDocStatus('') 
    const res = await defaulters.uploadDocument(selectedCase.id, docUpdate) 
    if (res.ok) { 
      setRows((prev) => prev.map((r) => r.id === selectedCase.id ? { ...r, ...docUpdate, documents_drive_folder: docUpdate.drive_folder_id } : r)) 
      setSelectedCase((prev) => prev ? { ...prev, ...docUpdate, documents_drive_folder: docUpdate.drive_folder_id } : prev) 
      setDocStatus('Documents updated successfully.') 
    } else { 
      setDocStatus(res.error || 'Failed to update documents') 
    } 
  } 

  const timelineForCase = (c) => { 
    if (!c) return [] 
    const events = [{ title: 'Filed', time: c.created_at, detail: 'Submitted' }] 
    if (c.approval_status === 'pending') events.push({ title: 'Awaiting review', time: c.created_at, detail: 'Verification in progress' }) 
    if (c.approval_status === 'approved' && c.verification_date) events.push({ title: 'Approved', time: c.verification_date, detail: 'Verified by team' }) 
    if (c.approval_status === 'rejected' && c.verification_date) events.push({ title: 'Rejected', time: c.verification_date, detail: c.notes || 'See notes' }) 
    return events 
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* PART 1 — FEATURES */}
      <section className="py-6 md:py-8">
        <div className="container-custom space-y-6">
          <div className="space-y-1">
            <p className="text-sm text-gray-500">Overdue reporting</p>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Report Defaulter</h1>
            <p className="text-gray-600 max-w-3xl text-sm">File overdue invoices with GST validation, supporting docs, and track statuses.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="card lg:col-span-2 shadow-sm rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-heading font-semibold text-gray-700">File a case</h2>
                {!allowed && <span className="text-xs text-amber-700">Gated</span>}
              </div>
              {statusMsg && <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-700 mb-3">{statusMsg}</div>}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-4">
                  <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="business_name" value={form.business_name} onChange={handleChange} placeholder="Business name" required />
                  <div className="space-y-1">
                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="business_gstin" value={form.business_gstin} onChange={handleChange} placeholder="GSTIN (optional if PAN provided)" />
                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="pan" value={form.pan} onChange={handleChange} placeholder="PAN (optional if GSTIN provided)" />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="invoice_number" value={form.invoice_number} onChange={handleChange} placeholder="Invoice #" required />
                  <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="Amount" required />
                  <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" type="date" name="due_date" value={form.due_date} onChange={handleChange} required />
                </div>
                <textarea className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="notes" value={form.notes} onChange={handleChange} placeholder="Remarks (optional)" rows={3} />
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Ledger (PDF/Excel)</label>
                    <input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={(e) => setForm(prev => ({ ...prev, ledger_file: e.target.files[0] }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">CA Certificate (PDF)</label>
                    <input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={(e) => setForm(prev => ({ ...prev, ca_file: e.target.files[0] }))} />
                  </div>
                </div>
                <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="documents_drive_folder" value={form.documents_drive_folder} onChange={handleChange} placeholder="Drive folder ID or link (optional)" />
                <button type="submit" className="btn-primary" disabled={!allowed || uploading}>
                  {uploading ? 'Uploading Files...' : (allowed ? 'Submit defaulter' : 'Upgrade to submit')}
                </button>
              </form>
            </div>

            <div className="card p-4 space-y-2 text-sm text-gray-700 shadow-sm rounded-xl">
              <p className="font-semibold text-gray-700">Workflow</p>
              <ul className="list-disc list-inside space-y-1">
                <li>GSTIN validation on filing</li>
                <li>Structured reminders and acknowledgments</li>
                <li>Uploads stored in audit vault (backend)</li>
                <li>Escalations to partners and legal (paid)</li>
              </ul>
              <p className="text-xs text-gray-500">Backend will enforce document size/format and consent trails.</p>
            </div>
          </div>

          {/* Status Table */}
          <div id="status" className="card p-4 shadow-sm rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-semibold text-gray-700">Status & Acknowledgments</h2>
              <p className="text-xs text-gray-500">Live data from backend</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Business</th>
                    <th className="py-2 pr-3">GSTIN / PAN</th>
                    <th className="py-2 pr-3">Invoice</th>
                    <th className="py-2 pr-3">Amount</th>
                    <th className="py-2 pr-3">Due</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && <tr><td colSpan={7} className="py-3 text-center text-gray-500">Loading...</td></tr>}
                  {!loading && rows.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-gray-500">No cases yet.</td></tr>}
                  {rows.map((row) => (
                    <tr key={row.id} className="text-gray-800">
                      <td className="py-2 pr-3 font-semibold">{row.business_name}</td>
                      <td className="py-2 pr-3">{row.business_gstin || '—'}{row.pan && <div className="text-xs text-gray-500">PAN: {row.pan}</div>}</td>
                      <td className="py-2 pr-3">{row.invoice_number}</td>
                      <td className="py-2 pr-3">₹{Number(row.amount).toLocaleString('en-IN')}</td>
                      <td className="py-2 pr-3">{row.due_date?.slice(0, 10) || row.due_date}</td>
                      <td className="py-2 pr-3 capitalize">{row.approval_status || row.status}</td>
                      <td className="py-2 pr-3 text-right">
                        <button onClick={() => handleView(row)} className="text-sm text-primary-700 hover:text-primary-900 font-medium">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Defaulter Case</p>
                <h3 className="text-2xl font-heading font-bold text-gray-900">{selectedCase.business_name}</h3>
              </div>
              <button onClick={() => setSelectedCase(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold">Identifiers</p>
                  <p>GSTIN: {selectedCase.business_gstin || '—'}</p>
                  <p>PAN: {selectedCase.pan || '—'}</p>
                  <p>Invoice: {selectedCase.invoice_number}</p>
                </div>
                <div>
                  <p className="font-semibold">Amounts</p>
                  <p>Amount: ₹{Number(selectedCase.amount).toLocaleString('en-IN')}</p>
                  <p>Due: {selectedCase.due_date?.slice(0, 10) || selectedCase.due_date}</p>
                  <p>Status: <span className="capitalize">{selectedCase.approval_status}</span></p>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-2">Documents</p>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>Drive Folder: {selectedCase.documents_drive_folder ? <a className="text-primary-700 underline" href={selectedCase.documents_drive_folder} target="_blank" rel="noreferrer">Open</a> : '—'}</p>
                  <p>Ledger: {selectedCase.ledger_url ? <a className="text-primary-700 underline" href={selectedCase.ledger_url} target="_blank" rel="noreferrer">View</a> : '—'}</p>
                  <p>CA Certificate: {selectedCase.ca_certificate_url ? <a className="text-primary-700 underline" href={selectedCase.ca_certificate_url} target="_blank" rel="noreferrer">View</a> : '—'}</p>
                </div>
                <div className="mt-3 space-y-3">
                  {docStatus && <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{docStatus}</div>}
                  <div className="grid md:grid-cols-2 gap-3">
                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="drive_folder_id" value={docUpdate.drive_folder_id} onChange={handleDocChange} placeholder="Drive folder ID or link" />
                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="ledger_url" value={docUpdate.ledger_url} onChange={handleDocChange} placeholder="Ledger URL" />
                    <input className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200" name="ca_certificate_url" value={docUpdate.ca_certificate_url} onChange={handleDocChange} placeholder="CA Certificate URL" />
                  </div>
                  <button onClick={handleDocSave} className="btn-primary">Save documents</button>
                </div>
              </div>
              <div>
                <p className="font-semibold mb-3">Timeline</p>
                <div className="space-y-3">
                  {timelineForCase(selectedCase).map((ev, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-1 h-3 w-3 rounded-full bg-primary-500" />
                      <div>
                        <p className="font-medium text-gray-900">{ev.title}</p>
                        <p className="text-xs text-gray-500">{ev.time ? ev.time.slice(0, 19).replace('T', ' ') : 'Pending'}</p>
                        <p className="text-sm text-gray-700">{ev.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedCase.notes && (
                <div>
                  <p className="font-semibold mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{selectedCase.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PART 2 — SIR'S INFO CONTENT */}

      {/* Guidelines & Eligibility */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Guidelines & Eligibility</h2>
          <p className="text-gray-500 mb-8">Who can report a defaulter and what is required</p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-blue-900 text-lg mb-3">✅ Who Can Report?</h3>
              <p className="text-blue-800 text-sm leading-relaxed">Businesses and MSMEs with a valid GST number and an active CreditDataWatch membership can report credit defaulters. Every report is thoroughly checked and verified by a CreditDataWatch specialist. Reporting is a seamless and entirely free process for our members.</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
              <h3 className="font-bold text-green-900 text-lg mb-3">📄 Required Documentation</h3>
              <p className="text-green-800 text-sm leading-relaxed">You must submit the defaulting party's ledger and a CA-certified statement of the due amount containing a valid UDIN. Members must also provide a valid PO and GST number. CreditDataWatch reserves the right to request further documentation if required.</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
              <h3 className="font-bold text-amber-900 text-lg mb-3">🔍 Verification Process</h3>
              <p className="text-amber-800 text-sm leading-relaxed">CreditDataWatch follows strict, standardized procedures to verify every claim. Verification typically takes <strong>1 to 2 business days</strong> following a complete submission. All uploads must be clearly readable and in <strong>PDF format</strong>.</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <h3 className="font-bold text-purple-900 text-lg mb-3">🤝 Settlement & Removal</h3>
              <p className="text-purple-800 text-sm leading-relaxed">If the reporting member and the defaulting party reach a mutual agreement and settle the outstanding amount, the member has the option to remove the defaulter's name from the portal. This decision rests entirely at the discretion of the reporting member.</p>
            </div>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <h3 className="font-bold text-red-800 mb-4">⚠️ Critical Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                ['📅','Timeline','Verification takes 1–2 business days after a complete submission.'],
                ['📄','File Standards','All uploads must be clearly readable and submitted in PDF format.'],
                ['🪪','GSTIN Required','Any registration without a valid GSTIN will not be accepted.'],
                ['⏱️','Update Window','Creditors must log a settlement within 2–3 days of receiving funds.'],
                ['⚖️','Member Accountability','Neglecting to update a settled status may lead to administrative disputes.'],
              ].map(([icon,title,desc]) => (
                <div key={title} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-red-100">
                  <span className="text-xl">{icon}</span>
                  <div><p className="font-semibold text-red-800 text-sm">{title}</p><p className="text-red-600 text-xs mt-0.5">{desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step + Checklist + Post-Settlement */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Resolution & Finalization Workflow</h2>
          <p className="text-gray-500 mb-10">Our Case Closure Framework provides a systematic path for documenting and resolving default claims.</p>
          <div className="space-y-3 mb-12">
            {steps.map(step => (
              <div key={step.num} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <span className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">{step.num}</span>
                <div><p className="font-semibold text-gray-800">{step.title}</p><p className="text-gray-500 text-sm mt-0.5">{step.desc}</p></div>
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Essential Documentation Checklist</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {checklist.map(item => (
              <div key={item.title} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div><p className="font-bold text-gray-800 text-sm">{item.title}</p><p className="text-gray-500 text-xs mt-1">{item.desc}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
            <h3 className="font-bold text-emerald-800 text-lg mb-3">✅ Post-Settlement Protocol</h3>
            <p className="text-emerald-700 text-sm mb-4">When payment is received, the reporting member must mark the case as resolved/closed.</p>
            <div className="grid md:grid-cols-2 gap-3 mb-4">
              {[
                ['🔕','Halts Collections','Immediately terminates all automated recovery alerts sent to the debtor.'],
                ['⭐','Reputation Recovery','Allows the business to begin restoring its credit standing.'],
                ['📊','Data Integrity','Ensures CreditDataWatch database reflects real-time accuracy.'],
                ['🤝','Professionalism','Restores the business relationship between both parties.'],
              ].map(([icon,title,desc]) => (
                <div key={title} className="flex items-start gap-3 bg-white rounded-xl p-3 border border-emerald-100">
                  <span className="text-lg">{icon}</span>
                  <div><p className="font-semibold text-emerald-800 text-sm">{title}</p><p className="text-emerald-600 text-xs mt-0.5">{desc}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-800">📍 How to close a case:</p>
              <p className="text-sm text-emerald-700 mt-1">Go to <strong>User Dashboard → Manage Defaulters → Locate Case → Mark as "Settled/Closed"</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left px-6 py-4 flex items-center justify-between">
                  <span className="font-semibold text-gray-800 text-sm pr-4">{faq.q}</span>
                  <span className="text-blue-600 text-xl flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div className="px-6 pb-4"><p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-blue-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Report a Defaulter?</h2>
          <p className="text-blue-200 mb-8">Join India's fastest-growing B2B credit intelligence network. Reporting is free for all registered members.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/register" className="bg-white text-blue-900 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">Register Free</Link>
            <Link to="/contact" className="border border-blue-400 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-800 transition-colors">Contact Support</Link>
          </div>
        </div>
      </section>

    </div>
  )
}

