import { useState, useEffect } from 'react' 
import { useAuth } from '../../state/authContext' 
import { api, STATIC_BASE_URL } from '../../services/api/apiClient'

// Helper to get full static URL
const getStaticUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${STATIC_BASE_URL}${url.startsWith('/') ? url : '/' + url}`
}

export default function POApprovals() { 
  const { user } = useAuth() 
  const [approvals, setApprovals] = useState([]) 
  const [loading, setLoading] = useState(true) 
  const [message, setMessage] = useState('') 

  useEffect(() => { 
    const fetchQueue = async () => {
      try {
        const res = await api.get('/purchase-orders/pending-approvals-queue')
        if (res.ok) {
          setApprovals(res.data || [])
        }
      } catch (err) {
        console.error("Failed to fetch queue", err)
      } finally {
        setLoading(false)
      }
    }
    fetchQueue()
  }, []) 
 
  const handleAction = async (poId, action) => { 
    const notes = action === 'reject' 
      ? prompt('Reason for rejection:') 
      : 'Approved by ' + user?.role 
    if (action === 'reject' && !notes) return 
 
    try {
      const res = await api.post(`/purchase-orders/${poId}/${action}-edit`, { notes })
      if (res.ok) { 
        setMessage(`✅ PO ${action}ed successfully`) 
        setApprovals(prev => prev.filter(p => p.id !== poId)) 
      } else { 
        setMessage(res.error || `Failed to ${action}`) 
      }
    } catch (err) {
      setMessage(`Failed to ${action}`)
    }
  } 
 
   if (loading) return <div className="p-8 text-center text-gray-500">Loading pending approvals...</div> 
 
   return ( 
     <div className="max-w-5xl mx-auto p-6 min-h-screen"> 
       <div className="mb-6"> 
         <h1 className="text-2xl font-bold text-gray-900">📋 PO Approval Queue</h1> 
         <p className="text-sm text-gray-500 mt-1">Review PO edits submitted with evidence</p> 
       </div> 
 
       {message && ( 
         <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700"> 
           {message} 
         </div> 
       )} 
 
       {approvals.length === 0 ? ( 
         <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm"> 
           <p className="text-4xl mb-4">✅</p> 
           <p className="text-gray-900 font-bold text-lg">No pending PO approvals</p> 
           <p className="text-gray-500 text-sm mt-2">All PO edits have been reviewed and processed.</p> 
         </div> 
       ) : ( 
         <div className="grid gap-4"> 
           {approvals.map(po => { 
             let pendingChanges = {} 
             try { 
               pendingChanges = typeof po.pending_changes === 'string' 
                 ? JSON.parse(po.pending_changes) 
                 : (po.pending_changes || {}) 
             } catch (e) {
               console.error("Failed to parse pending changes", e)
             } 
 
             return ( 
               <div key={po.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"> 
                 <div className="flex flex-col md:flex-row md:items-start justify-between gap-6"> 
                   <div className="flex-1"> 
                     <div className="flex items-center flex-wrap gap-2 mb-3"> 
                       <span className="font-bold text-gray-900 text-xl">{po.po_number}</span> 
                       <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"> 
                         Pending Approval 
                       </span> 
                     </div> 
                     
                     <div className="grid sm:grid-cols-2 gap-y-2 gap-x-4 mb-4">
                       <p className="text-gray-600 text-sm">Vendor: <span className="font-semibold text-gray-900">{po.vendor}</span></p> 
                       <p className="text-gray-600 text-sm">Amount: <span className="font-bold text-blue-600">₹{Number(po.amount).toLocaleString('en-IN')}</span></p> 
                       <p className="text-gray-600 text-sm">Due Date: <span className="font-medium text-gray-900">{new Date(po.due_date).toLocaleDateString()}</span></p>
                       <p className="text-gray-600 text-sm">Created: <span className="font-medium text-gray-900">{new Date(po.created_at).toLocaleDateString()}</span></p>
                     </div>

                     {po.evidence_url && ( 
                       <div className="mb-4"> 
                         <p className="text-sm font-medium text-gray-700 mb-1">Attached Evidence:</p>
                         <a href={getStaticUrl(po.evidence_url)} target="_blank" rel="noreferrer" 
                           className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold text-sm bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"> 
                           📎 View Evidence Document 
                         </a> 
                       </div> 
                     )} 
                     
                     {Object.keys(pendingChanges).length > 0 && ( 
                       <div className="bg-gray-50 rounded-xl p-4 border border-gray-100"> 
                         <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Requested Changes:</p> 
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                           {Object.entries(pendingChanges).map(([k, v]) => ( 
                             <p key={k} className="text-xs text-gray-700"> 
                               <span className="font-bold text-gray-500">{k.replace(/_/g, ' ')}:</span> {String(v)} 
                             </p> 
                           ))} 
                         </div>
                       </div> 
                     )} 
                     
                     {po.approval_notes && ( 
                       <div className="mt-4 pt-4 border-t border-gray-100">
                         <p className="text-xs italic text-gray-500">Submission Note: {po.approval_notes}</p> 
                       </div>
                     )} 
                   </div> 
                   
                   <div className="flex flex-row md:flex-col gap-3 min-w-[160px]"> 
                   </div> 
                 </div> 
               </div> 
             ) 
           })} 
         </div> 
       )} 
     </div> 
   ) 
 } 
