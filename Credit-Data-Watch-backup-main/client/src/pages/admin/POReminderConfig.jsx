import { useEffect, useState } from 'react'
import { getPOReminderConfig, updatePOReminderConfig } from '../../services/api/apiClient'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function EmailPreviewModal({ isOpen, onClose, subject, body }) {
  if (!isOpen) return null

  const variables = {
    vendor_name: 'Test Vendor Pvt Ltd',
    amount: '₹50,000.00',
    due_date: '2026-03-25',
    po_number: 'PO-2026-001'
  }

  const replaceVariables = (str) => {
    let result = str
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })
    return result
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Email Preview</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</p>
            <p className="text-gray-900 font-medium bg-gray-50 p-3 rounded-lg border border-gray-200">
              {replaceVariables(subject)}
            </p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Content</p>
            <div className="text-gray-800 bg-gray-50 p-6 rounded-lg border border-gray-200 whitespace-pre-wrap font-sans leading-relaxed">
              {replaceVariables(body)}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> This is a preview using sample data. Placeholders like <code>{'{vendor_name}'}</code>, <code>{'{amount}'}</code>, etc., will be automatically replaced with real data when emails are sent.
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}

export default function POReminderConfig() {
  const [config, setConfig] = useState({ 
    before_days: [], 
    after_due_daily_enabled: false,
    reminder_subject: '',
    reminder_body: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newDay, setNewDay] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true)
        const res = await getPOReminderConfig()
        if (res.ok && res.data) {
          setConfig(prev => ({
            ...prev,
            ...res.data,
            // Ensure fields are never undefined/null to prevent uncontrolled input issues
            reminder_subject: res.data.reminder_subject || '',
            reminder_body: res.data.reminder_body || ''
          }))
        }
      } catch (err) {
        console.error('Failed to fetch PO reminder config:', err)
        setStatusMessage('Error loading configuration.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchConfig()
  }, [])

  const handleAddDay = () => {
    if (newDay && !config.before_days.includes(parseInt(newDay))) {
      setConfig({ ...config, before_days: [...config.before_days, parseInt(newDay)].sort((a, b) => a - b) })
      setNewDay('')
    }
  }

  const handleRemoveDay = (dayToRemove) => {
    setConfig({ ...config, before_days: config.before_days.filter(day => day !== dayToRemove) })
  }

  const handleSaveChanges = async () => {
    setIsSaving(true)
    setStatusMessage('')
    const res = await updatePOReminderConfig(config)
    if (res.ok) {
      setStatusMessage('Settings saved successfully!')
    } else {
      setStatusMessage(res.error || 'Failed to save settings.')
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <section className="section-padding">
      <div className="container-custom space-y-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900">PO Reminder Settings</h1>

        <div className="card max-w-2xl mx-auto">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Reminders Before Due Date</h3>
              <p className="text-sm text-gray-500 mt-1">Set up automated email reminders to be sent a specific number of days before a PO's due date.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {config.before_days.map(day => (
                  <div key={day} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full flex items-center gap-2">
                    <span>{day} days before</span>
                    <button onClick={() => handleRemoveDay(day)} className="text-primary-600 hover:text-primary-800">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  type="number"
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  placeholder="e.g., 7"
                  className="w-24 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                />
                <button onClick={handleAddDay} className="btn-secondary">
                  Add Day
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">Reminders After Due Date</h3>
              <p className="text-sm text-gray-500 mt-1">Enable daily reminders for POs that are past their due date.</p>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.after_due_daily_enabled}
                    onChange={(e) => setConfig({ ...config, after_due_daily_enabled: e.target.checked })}
                    className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-3 text-gray-700">Enable daily overdue reminders</span>
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900">Custom Email Content</h3>
              <p className="text-sm text-gray-500 mt-1">Customize the subject and message sent to vendors. Use <code>{'{vendor_name}'}</code>, <code>{'{amount}'}</code>, <code>{'{due_date}'}</code>, <code>{'{po_number}'}</code> as variables.</p>
              
              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Subject Line</label>
                  <input
                    type="text"
                    value={config.reminder_subject}
                    onChange={(e) => setConfig({ ...config, reminder_subject: e.target.value })}
                    placeholder="e.g. Payment Reminder: {po_number}"
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Email Body</label>
                  <textarea
                    value={config.reminder_body}
                    onChange={(e) => setConfig({ ...config, reminder_body: e.target.value })}
                    rows={6}
                    className="w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Dear {vendor_name}, your PO {po_number} is due..."
                  />
                </div>
                
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowPreview(true)}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1.5"
                  >
                    <span className="text-base">👁️</span> Preview Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-200 flex justify-end items-center gap-4">
            {statusMessage && (
              <p className={`text-sm ${String(statusMessage).toLowerCase().includes('success') ? 'text-green-600' : 'text-gray-600'}`}>
                {typeof statusMessage === 'object' ? (statusMessage.message || statusMessage.detail || JSON.stringify(statusMessage)) : String(statusMessage)}
              </p>
            )}
            <button onClick={handleSaveChanges} className="btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <EmailPreviewModal 
          isOpen={showPreview} 
          onClose={() => setShowPreview(false)} 
          subject={config.reminder_subject}
          body={config.reminder_body}
        />
      </div>
    </section>
  )
}
