const API = 'http://localhost:8000/api/v1' 
 
 const getToken = () => 
   localStorage.getItem('access_token') || 
   sessionStorage.getItem('access_token') 
 
 export const logActivity = async (action, options = {}) => { 
   const token = getToken() 
   if (!token) return 
   try { 
     await fetch(`${API}/activity/log`, { 
       method: 'POST', 
       headers: { 
         Authorization: `Bearer ${token}`, 
         'Content-Type': 'application/json' 
       }, 
       body: JSON.stringify({ 
         action, 
         page: options.page || window.location.pathname, 
         entity_type: options.entity_type || '', 
         entity_id: options.entity_id || '', 
         details: options.details || '' 
       }) 
     }) 
   } catch (e) { 
     // Silent fail — never block UI for logging 
   } 
 } 
 
 // Predefined action constants 
 export const ACTIONS = { 
   LOGIN: 'LOGIN', 
   LOGOUT: 'LOGOUT', 
   VIEW_DASHBOARD: 'VIEW_DASHBOARD', 
   VIEW_PO_LIST: 'VIEW_PO_LIST', 
   ADD_PO: 'ADD_PO', 
   EDIT_PO: 'EDIT_PO', 
   DELETE_PO: 'DELETE_PO', 
   MARK_PO_PAID: 'MARK_PO_PAID', 
   ARCHIVE_PO: 'ARCHIVE_PO', 
   SEND_REMINDER: 'SEND_REMINDER', 
   SEND_LEGAL: 'SEND_LEGAL', 
   IMPORT_CSV: 'IMPORT_CSV', 
   DOWNLOAD_TEMPLATE: 'DOWNLOAD_TEMPLATE', 
   VIEW_CREDIBILITY: 'VIEW_CREDIBILITY', 
   VIEW_CREDIBILITY_DETAIL: 'VIEW_CREDIBILITY_DETAIL', 
   VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS', 
   VIEW_ACTIVITY_LOGS: 'VIEW_ACTIVITY_LOGS', 
   SEND_INVITATION: 'SEND_INVITATION', 
   ACCEPT_INVITATION: 'ACCEPT_INVITATION', 
   VIEW_MEMBERSHIP: 'VIEW_MEMBERSHIP', 
   SELECT_PLAN: 'SELECT_PLAN', 
   SUBMIT_PAYMENT: 'SUBMIT_PAYMENT', 
   VIEW_WALLET: 'VIEW_WALLET', 
   VIEW_DEFAULTERS: 'VIEW_DEFAULTERS', 
   VIEW_INVOICES: 'VIEW_INVOICES', 
   VIEW_SETTLEMENTS: 'VIEW_SETTLEMENTS', 
   SUBMIT_PO_FOR_APPROVAL: 'SUBMIT_PO_FOR_APPROVAL', 
   APPROVE_PO: 'APPROVE_PO', 
   REJECT_PO: 'REJECT_PO', 
 } 
