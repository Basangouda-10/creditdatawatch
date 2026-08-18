import { useState, useEffect } from 'react'
import { getPOReminderConfig } from '../../services/api/apiClient'
import { useAuth } from '../../state/authContext'

export default function ReminderModal({ po, onClose, onSend }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [emailData, setEmailData] = useState({ subject: '', body: '' })
  const [scheduleType, setScheduleType] = useState('now') // 'now' or 'later'
  const [scheduledAt, setScheduledAt] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [includeLegalNotice, setIncludeLegalNotice] = useState(false)
  const [legalNoticeContent, setLegalNoticeContent] = useState('')

  useEffect(() => {
    async function loadTemplate() {
      setLoading(true)
      const res = await getPOReminderConfig()
      if (res.ok) {
        const template = res.data
        const variables = {
          vendor_name: po.vendor || '',
          amount: `₹${Number(po.amount).toLocaleString('en-IN')}`,
          due_date: po.due_date?.slice(0, 10) || '',
          po_number: po.po_number || ''
        }

        const replaceVariables = (str) => {
          let result = str || ''
          Object.entries(variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
          })
          return result
        }

        setEmailData({
          subject: replaceVariables(template.reminder_subject || 'Payment Reminder: PO {po_number}'),
          body: replaceVariables(template.reminder_body || 'Dear {vendor_name}, your PO {po_number} is due.')
        })

        const lnTemplate = `To: ${po.vendor || ''}
RE: Outstanding Payment - PO ${po.po_number || ''}

Dear ${po.vendor || ''},

This is a formal legal notice that payment of ₹${po.amount || ''} for Purchase Order ${po.po_number || ''} due on ${po.due_date?.slice(0, 10) || ''} remains unpaid/pending.

You are required to clear this payment within 7 days of receiving this notice, failing which legal proceedings will be initiated without further notice.

Issued by: ${user?.company_name || ''}
Date: ${new Date().toLocaleDateString('en-IN')}`;
        setLegalNoticeContent(lnTemplate);
      }
      setLoading(false)
    }
    loadTemplate()
  }, [po, user])

  const handleSend = async () => {
    setIsSending(true)
    try {
      console.log("API payload:", JSON.stringify({
        include_legal_notice: includeLegalNotice,
        legal_notice_content: legalNoticeContent
      }))
      const payload = {
        subject: emailData.subject,
        body: emailData.body,
        scheduled_at: scheduleType === 'later' ? new Date(scheduledAt).toISOString() : null,
        include_legal_notice: includeLegalNotice,
        legal_notice_content: includeLegalNotice ? legalNoticeContent : null
      }
      console.log("Sending payload:", payload);
      const success = await onSend(payload)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error("Error sending reminder:", error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Send Payment Reminder</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="text-2xl">&times;</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Subject Line</label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Email Body</label>
                  <textarea
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    rows={6}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 font-sans leading-relaxed"
                  />
                </div>
              </div>

              {/* Legal Notice Section */}
              <div className="legal-notice-section">
                <label>
                  <input
                    type="checkbox"
                    checked={includeLegalNotice}
                    onChange={(e) => setIncludeLegalNotice(e.target.checked)}
                  />
                  ⚖️ Attach Legal Notice as PDF
                </label>

                {includeLegalNotice && (
                  <div>
                    <p style={{fontSize: '12px', color: '#666'}}>
                      📄 Edit legal notice below. It will be sent as a PDF attachment.
                    </p>
                    <textarea
                      value={legalNoticeContent}
                      onChange={(e) => setLegalNoticeContent(e.target.value)}
                      rows={12}
                      style={{width: '100%', fontFamily: 'monospace', fontSize: '12px'}}
                      placeholder="Legal notice content will appear here..."
                    />
                    <p style={{fontSize: '11px', color: '#888'}}>
                      ✅ This will be generated as a PDF and attached to the email
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Schedule Reminder</h4>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="schedule"
                      value="now"
                      checked={scheduleType === 'now'}
                      onChange={() => setScheduleType('now')}
                      className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">Send Now</span>
                  </label>

                  <div className="space-y-3">
                    <label className="flex items-center cursor-pointer group">
                      <input
                        type="radio"
                        name="schedule"
                        value="later"
                        checked={scheduleType === 'later'}
                        onChange={() => setScheduleType('later')}
                        className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">Schedule for later</span>
                    </label>

                    {scheduleType === 'later' && (
                      <div className="ml-7 animate-in fade-in slide-in-from-top-2 duration-200">
                        <input
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          className="rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading || isSending || (scheduleType === 'later' && !scheduledAt)}
            className="btn-primary px-8"
          >
            {isSending ? 'Processing...' : scheduleType === 'later' ? 'Schedule Reminder' : 'Send Reminder'}
          </button>
        </div>
      </div>
    </div>
  )
}
