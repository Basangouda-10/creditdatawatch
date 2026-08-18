import { useAuth } from '../../state/authContext'

export default function NotificationsPanel({ dueReminders = [] }) {
  const { subscription, getDaysRemaining } = useAuth()
  const notifications = []

  // Add subscription expiry notification
  if (subscription?.expiry_date) {
    const daysRemaining = getDaysRemaining()
    if (daysRemaining !== null) {
      if (daysRemaining <= 7 && daysRemaining > 0) {
        notifications.push({
          id: 'subscription-expiry',
          type: 'alert',
          text: `Membership expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
          priority: 'high',
        })
      } else if (daysRemaining === 0) {
        notifications.push({
          id: 'subscription-expired',
          type: 'alert',
          text: 'Your membership has expired. Please renew to continue using all features.',
          priority: 'high',
        })
      }
    }
  }

  // Add due reminders notifications
  if (dueReminders && dueReminders.length > 0) {
    dueReminders.slice(0, 3).forEach((invoice, index) => {
      notifications.push({
        id: `reminder-${invoice.id || index}`,
        type: 'reminder',
        text: `Payment reminder: ${invoice.invoice_number || 'Invoice'} - ${invoice.counterparty_name || 'Counterparty'}`,
        priority: 'medium',
      })
    })
  }

  // If no notifications, show a helpful message
  if (notifications.length === 0) {
    return (
      <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-gray-100 shadow-sm border-l-4 border-green-500 bg-white hover:shadow-md transition-shadow">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">📢</span>
            <h2 className="text-xs text-gray-500 uppercase font-semibold">Notifications</h2>
          </div>
          <p className="text-xs text-gray-500 py-1">No new notifications</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-gray-100 shadow-sm border-l-4 border-green-500 bg-white hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">📢</span>
            <h2 className="text-xs text-gray-500 uppercase font-semibold">Notifications</h2>
          </div>
          {notifications.length > 0 && (
            <span className="text-[10px] text-gray-500">{notifications.length} new</span>
          )}
        </div>
        <ul className="space-y-1 overflow-y-auto max-h-24 pr-1">
          {notifications.slice(0, 3).map((item) => (
            <li
              key={item.id}
              className={`text-[10px] flex items-start gap-2 p-1 rounded ${
                item.priority === 'high'
                  ? 'bg-red-50 text-red-800 border border-red-100'
                  : item.priority === 'medium'
                  ? 'bg-yellow-50 text-yellow-800 border border-yellow-100'
                  : 'bg-gray-50 text-gray-700 border border-gray-100'
              }`}
            >
              <span className="flex-1 leading-tight">{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
