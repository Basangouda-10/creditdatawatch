import { useState, useEffect, useRef } from 'react' 
import { useAuth } from '../state/authContext' 
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api/apiClient'

const normalizeNotification = (n) => ({
  ...n,
  message: n.message || n.title || n.body || n.content || 
    (n.action ? `New ${n.action.toLowerCase().replace(/_/g, ' ')}` : 'New notification'),
  created_at: n.created_at || n.timestamp || n.created
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      const cleaned = String(dateStr).replace(' ', 'T')
      const d2 = new Date(cleaned)
      if (!isNaN(d2.getTime())) {
        return d2.toLocaleString('en-IN', {
          day: '2-digit', month: 'short',
          hour: '2-digit', minute: '2-digit'
        })
      }
      return String(dateStr).slice(0, 16).replace('T', ' ')
    }
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return String(dateStr).slice(0, 16) || ''
  }
}

export default function NotificationBell() { 
  const { token } = useAuth() 
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([]) 
  const [unreadCount, setUnreadCount] = useState(0) 
  const [open, setOpen] = useState(false) 
  const ref = useRef(null)

  const fetch_notifs = async () => { 
    if (!token) return 
    try { 
      const res = await api.get('/workflow/notifications') 
      if (res.ok) { 
        const data = (res.data || []).map(normalizeNotification)
        setNotifications(data) 
        setUnreadCount(res.unread_count || 0) 
      } 
    } catch(e) { 
      console.error('Notification fetch error:', e) 
    } 
  } 

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/workflow/notifications/${notificationId}/read`)
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n 
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      console.error('Mark read error:', e)
    }
  }

  const markAllRead = async () => { 
    await api.post('/workflow/notifications/read-all') 
    fetch_notifs() 
  } 

  const getLink = (notification) => {
    const type = (notification.type || notification.entity_type || '').toLowerCase()
    const action = (notification.action || '').toLowerCase()
    if (type.includes('po') || action.includes('po')) return '/purchase-orders'
    if (type.includes('payment') || action.includes('payment')) return '/membership'
    if (type.includes('legal') || action.includes('legal')) return '/purchase-orders'
    if (type.includes('credibility') || action.includes('credibility')) return '/credibility-index'
    if (type.includes('invoice') || action.includes('invoice')) return '/invoices'
    if (type.includes('defaulter') || action.includes('defaulter')) return '/defaulters'
    if (type.includes('subscription') || action.includes('subscription')) return '/membership'
    if (type.includes('user') || action.includes('user')) return '/admin/team'
    return '/dashboard'
  }

  useEffect(() => { 
    fetch_notifs() 
    const timer = setInterval(fetch_notifs, 10000)
    return () => clearInterval(timer) 
  }, [token]) 

  useEffect(() => { 
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) } 
    document.addEventListener('mousedown', handler) 
    return () => document.removeEventListener('mousedown', handler) 
  }, []) 

  return ( 
    <div className="relative" ref={ref}> 
      <button 
        onClick={() => setOpen(!open)} 
        className={`relative p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${unreadCount > 0 ? 'animate-pulse' : ''}`}
      > 
        <span className="text-xl">🔔</span> 
        {unreadCount > 0 && ( 
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-bold"> 
            {unreadCount > 99 ? '99+' : unreadCount} 
          </span> 
        )} 
      </button> 

      {open && ( 
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-[100]"> 
          <div className="flex justify-between items-center p-4 border-b"> 
            <span className="font-bold text-gray-800"> 
              🔔 Notifications {unreadCount > 0 && <span className="text-blue-600">({unreadCount} new)</span>} 
            </span> 
            <div className="flex gap-2"> 
              {unreadCount > 0 && ( 
                <button onClick={markAllRead} 
                  className="text-xs text-blue-600 hover:underline"> 
                  Mark all read 
                </button> 
              )} 
              <button onClick={() => setOpen(false)} 
                className="text-gray-400 hover:text-gray-600 text-sm">✕</button> 
            </div> 
          </div> 

          <div className="max-h-96 overflow-y-auto"> 
            {notifications.length === 0 ? ( 
              <div className="text-center py-10 text-gray-400"> 
                <div className="text-4xl mb-2">🔕</div> 
                <p className="text-sm">No notifications yet</p> 
              </div> 
            ) : ( 
              notifications.map(n => {
                return (
                  <div 
                    key={n.id} 
                    onClick={() => { 
                      markAsRead(n.id)
                      const link = getLink(n)
                      if (link.startsWith('http')) {
                        window.location.href = link
                      } else {
                        navigate(link)
                      }
                      setOpen(false)
                    }} 
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors duration-200 ${!n.is_read ? 'bg-blue-50 border-l-4 border-l-blue-400' : ''}`} 
                  > 
                    <div className="flex items-start gap-2"> 
                      <span className="text-lg flex-shrink-0"> 
                        {(n.type || '').includes('po') ? '📋' : 
                         (n.type || '').includes('payment') ? '💳' : 
                         (n.type || '').includes('legal') ? '⚖️' : 
                         (n.type || '').includes('user') ? '👤' : 
                         (n.type || '').includes('subscription') ? '🎯' : '🔔'} 
                      </span> 
                      <div className="flex-1 min-w-0"> 
                        <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}> 
                          {n.message}
                        </p> 
                        {n.created_at && ( 
                          <p className="text-xs text-gray-400 mt-0.5"> 
                            {formatDate(n.created_at)}
                          </p> 
                        )} 
                      </div> 
                      {!n.is_read && ( 
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span> 
                      )} 
                    </div> 
                  </div> 
                )
              })
            )} 
          </div> 
        </div> 
      )} 
    </div> 
  ) 
 } 
