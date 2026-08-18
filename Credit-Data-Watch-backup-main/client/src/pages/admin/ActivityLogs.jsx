import { useState, useEffect } from 'react' 
import { audit } from '../../services/api/apiClient'

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) {
      const cleaned = String(dateStr).replace(' ', 'T')
      const d2 = new Date(cleaned)
      if (!isNaN(d2.getTime())) {
        return d2.toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      }
      return String(dateStr).slice(0, 16).replace('T', ' ')
    }
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return String(dateStr).slice(0, 16) || '—'
  }
}

const ACTION_COLORS = { 
   PO_MARKED_PAID: 'bg-emerald-100 text-emerald-700',
   USER_CREATED: 'bg-green-100 text-green-700',
   PLAN_UPDATE: 'bg-blue-100 text-blue-700',
   LOGIN: 'bg-green-100 text-green-700', 
   LOGOUT: 'bg-gray-100 text-gray-600', 
   ADD_PO: 'bg-blue-100 text-blue-700', 
   DELETE_PO: 'bg-red-100 text-red-700', 
   EDIT_PO: 'bg-yellow-100 text-yellow-700', 
   MARK_PO_PAID: 'bg-emerald-100 text-emerald-700', 
   SEND_REMINDER: 'bg-indigo-100 text-indigo-700', 
   SEND_LEGAL: 'bg-purple-100 text-purple-700', 
   SUBMIT_PAYMENT: 'bg-orange-100 text-orange-700', 
   DEFAULT: 'bg-gray-100 text-gray-600' 
} 

 export default function ActivityLogs() { 
   const [logs, setLogs] = useState([]) 
   const [summary, setSummary] = useState({ by_action: [], by_user: [] }) 
   const [loading, setLoading] = useState(true) 
   const [filter, setFilter] = useState({ search: '', action: '' }) 
   const [activeTab, setActiveTab] = useState('logs') 

   const fetchLogs = async () => { 
     setLoading(true) 
     try {
       const res = await audit.getLogs(filter)
       if (res.ok) {
         const logsData = res.data || []
         setLogs(logsData)
         // Create summary from logs
         const actionCounts = {}
         const userCounts = {}
         logsData.forEach(log => {
           const action = log.action
           const email = log.user_email
           actionCounts[action] = (actionCounts[action] || 0) + 1
           if (!userCounts[email]) {
             userCounts[email] = { user_email: email, user_role: log.user_role, last_active: log.created_at, total_actions: 0 }
           }
           userCounts[email].total_actions += 1
           if (!userCounts[email].last_active || new Date(log.created_at) > new Date(userCounts[email].last_active)) {
             userCounts[email].last_active = log.created_at
           }
         })
         const byAction = Object.entries(actionCounts).map(([action, count]) => ({ action, count })).sort((a, b) => b.count - a.count)
         const byUser = Object.values(userCounts).sort((a, b) => b.total_actions - a.total_actions)
         setSummary({ by_action: byAction, by_user: byUser })
       }
     } catch (e) {
       console.error("Failed to fetch logs", e)
     } finally {
       setLoading(false) 
     }
   } 

   useEffect(() => { fetchLogs() }, [])  

   const actionColor = (action) => 
     ACTION_COLORS[action] || ACTION_COLORS.DEFAULT 

   return ( 
     <div className="max-w-6xl mx-auto p-6"> 
       <div className="mb-6"> 
         <h1 className="text-2xl font-bold text-gray-900">📊 User Activity Logs</h1> 
         <p className="text-sm text-gray-500 mt-1">Complete trail of every user action on the platform</p> 
       </div> 

       {/* Tabs */} 
       <div className="flex gap-2 mb-6 border-b"> 
         {['logs', 'summary'].map(tab => ( 
           <button key={tab} onClick={() => setActiveTab(tab)} 
             className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${ 
               activeTab === tab 
                 ? 'border-blue-600 text-blue-600' 
                 : 'border-transparent text-gray-500 hover:text-gray-700' 
             }`}> 
             {tab === 'logs' ? '📋 Activity Feed' : '📊 Summary'} 
           </button> 
         ))} 
       </div> 

       {activeTab === 'logs' && ( 
         <> 
           {/* Filters */} 
           <div className="flex flex-wrap gap-3 mb-4"> 
             <input 
               type="text" 
               placeholder="Filter by search..." 
               value={filter.search} 
               onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} 
               className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" 
             /> 
             <select 
               value={filter.action} 
               onChange={e => setFilter(f => ({ ...f, action: e.target.value }))} 
               className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none" 
             > 
               <option value="">All Actions</option> 
               <option value="PO_MARKED_PAID">PO_MARKED_PAID</option>
               <option value="LOGIN">LOGIN</option> 
               <option value="ADD_PO">ADD_PO</option> 
               <option value="DELETE_PO">DELETE_PO</option> 
               <option value="EDIT_PO">EDIT_PO</option> 
               <option value="MARK_PO_PAID">MARK_PO_PAID</option> 
               <option value="SEND_REMINDER">SEND_REMINDER</option> 
             </select> 
             <button onClick={fetchLogs} 
               className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"> 
               🔍 Search 
             </button> 
             <button onClick={() => { setFilter({ search: '', action: '' }); fetchLogs() }} 
               className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"> 
               Clear 
             </button> 
           </div> 

           {loading ? ( 
             <p className="text-gray-500 text-sm">Loading logs...</p> 
           ) : logs.length === 0 ? ( 
             <div className="bg-gray-50 rounded-xl p-8 text-center"> 
               <p className="text-gray-400">No activity logs found</p> 
             </div> 
           ) : ( 
             <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm"> 
               <table className="min-w-full divide-y divide-gray-100 text-sm"> 
                 <thead className="bg-gray-50"> 
                   <tr> 
                     {['User', 'Role', 'Action', 'PO Number', 'Vendor', 'Description', 'Time'].map(h => ( 
                       <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">{h}</th> 
                     ))} 
                   </tr> 
                 </thead> 
                 <tbody className="divide-y divide-gray-100 bg-white"> 
                   {logs.map(log => ( 
                     <tr key={log.id} className="hover:bg-gray-50"> 
                       <td className="px-4 py-3 text-gray-700 text-xs">{log.user_name || log.user_email || '—'}</td> 
                       <td className="px-4 py-3"> 
                         <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"> 
                           {typeof log.user_role === 'object' ? log.user_role.value || '—' : log.user_role || '—'} 
                         </span> 
                       </td> 
                       <td className="px-4 py-3"> 
                         <span className={`text-xs px-2 py-1 rounded-full font-semibold ${actionColor(log.action)}`}> 
                           {log.action || '—'} 
                         </span> 
                       </td> 
                       <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.po_number || '—'}</td> 
                       <td className="px-4 py-3 text-gray-500 text-xs">{log.vendor_name || '—'}</td> 
                       <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{log.description || log.reason || '—'}</td> 
                       <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap"> 
                         {formatDate(log.created_at)} 
                       </td> 
                     </tr> 
                   ))} 
                 </tbody> 
               </table> 
             </div> 
           )} 
         </> 
       )} 

       {activeTab === 'summary' && ( 
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
           {/* Actions Summary */} 
           <div className="bg-white rounded-xl border p-5"> 
             <h3 className="font-bold text-gray-800 mb-4">Top Actions</h3> 
             <div className="space-y-2"> 
               {summary.by_action.map(item => ( 
                 <div key={item.action} className="flex items-center justify-between"> 
                   <span className={`text-xs px-2 py-1 rounded-full font-semibold ${actionColor(item.action)}`}> 
                     {item.action} 
                   </span> 
                   <div className="flex items-center gap-2"> 
                     <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden"> 
                       <div className="h-full bg-blue-400 rounded-full" 
                         style={{ width: `${Math.min(100, (item.count / (summary.by_action[0]?.count || 1)) * 100)}%` }} /> 
                     </div> 
                     <span className="text-xs font-bold text-gray-700">{item.count}</span> 
                   </div> 
                 </div> 
               ))} 
             </div> 
           </div> 

           {/* Users Summary */} 
           <div className="bg-white rounded-xl border p-5"> 
             <h3 className="font-bold text-gray-800 mb-4">Most Active Users</h3> 
             <div className="space-y-3"> 
               {summary.by_user.map(u => ( 
                 <div key={u.user_email} className="flex items-center justify-between border-b pb-2"> 
                   <div> 
                     <p className="text-xs font-medium text-gray-800 truncate max-w-[180px]">{u.user_email}</p> 
                     <p className="text-xs text-gray-400">{u.user_role} · Last active: {formatDate(u.last_active)}</p> 
                   </div> 
                   <span className="text-sm font-bold text-blue-600">{u.total_actions} actions</span> 
                 </div> 
               ))} 
             </div> 
           </div> 
         </div> 
       )} 
     </div> 
   ) 
 } 
