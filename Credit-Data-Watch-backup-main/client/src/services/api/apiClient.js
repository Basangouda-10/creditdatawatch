const RAW_BASE = import.meta.env.VITE_API_URL || '/api/v1'

// Helper function to safely remove trailing slashes without ReDoS risk
const stripTrailingSlash = (str) => {
  let s = str;
  while (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
};

const API_BASE_URL = (() => {
  let u = (RAW_BASE || '').trim()
  if (!u) return '/api/v1'
  if (u.startsWith('/')) return stripTrailingSlash(u)
  if (u.startsWith(':')) u = 'http://127.0.0.1' + u
  if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'http://' + u
  if (!/\/api\/v1\/?$/.test(u)) {
    if (u.endsWith('/')) u += 'api/v1'
    else if (!/\/api\/v1/.test(u)) u += '/api/v1'
  }
  return stripTrailingSlash(u)
})()

// Get base URL for static files (uploads)
const STATIC_BASE_URL = (() => {
  let u = API_BASE_URL
  // Remove /api/v1 suffix
  if (u.includes('/api/v1')) {
    u = u.replace('/api/v1', '')
  }
  // If it's a relative path and ends up empty, use empty string
  if (!u || u === '') {
    return ''
  }
  return stripTrailingSlash(u)
})()

export { STATIC_BASE_URL }

/**
 * Make an authenticated API request with cookie support
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<{ok: boolean, data: any, error?: string, status: number}>}
 */
async function apiRequest(endpoint, options = null) {
  const opts = options || {};
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
  // Increased default timeout to 180s for AI-heavy tasks
  const timeout = opts.timeout || 180000 
  
  // Create AbortController if signal is not provided
  let controller = null
  let signal = opts.signal
  let timeoutId = null

  if (!signal) {
    controller = new AbortController()
    signal = controller.signal
    timeoutId = setTimeout(() => {
      if (controller) controller.abort('timeout')
    }, timeout)
  }

  const defaultOptions = {
    credentials: 'include', // Send cookies with every request
    signal: signal,
    headers: {
      ...(opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...opts.headers,
    },
    ...opts,
  }

  // Manually attach access_token from localStorage if available (fallback for non-cookie scenarios)
  const token = localStorage.getItem('access_token') || localStorage.getItem('token')
  const isValidToken = token && token !== 'undefined' && token !== 'null' && token.length > 10
  
  if (isValidToken && !defaultOptions.headers['Authorization']) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, defaultOptions)
    if (timeoutId) clearTimeout(timeoutId)
    const contentType = response.headers.get('content-type')
    let data = null;

    // A 204 No Content (or any response with an empty body) has nothing
    // to parse — attempting response.json() on it throws "Unexpected end
    // of JSON input" even when the Content-Type header says JSON.
    if (response.status === 204) {
      data = null
    } else if (contentType?.includes('application/json')) {
      const text = await response.text()
      data = text ? JSON.parse(text) : null
    } else {
      data = await response.text()
    }

    // Handle 401 Unauthorized - Try to refresh token
    if (response.status === 401) {
      // Don't retry refresh if the endpoint itself IS refresh or login
      if (endpoint.includes('/auth/refresh') || endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
        return {
          ok: false,
          status: 401,
          error: data?.error?.message || data?.detail || 'Session expired',
          data: null,
        }
      }

      // Clear local token if backend says it's invalid
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')

      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retry the original request after refresh
        return apiRequest(endpoint, opts)
      }
      
      // If refresh failed or not possible, redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        console.warn('Unauthorized access, redirecting to login...')
        // Use replace to avoid back button issues
        window.location.replace('/auth/login?expired=true')
      }

      return {
        ok: false,
        status: 401,
        error: data?.error?.message || data?.detail || 'Unauthorized - please login again',
        data: null,
      }
    }

    // Handle other errors
    if (!response.ok) {
      // Check for database connection errors
      if (response.status === 503 && data?.error?.code === 'DATABASE_CONNECTION_ERROR') {
        return {
          ok: false,
          status: 503,
          error: 'Database connection failed. Please ensure the database is running and configured correctly.',
          data: null,
        }
      }
      
      return {
        ok: false,
        status: response.status,
        error: data?.error?.message || data?.message || data?.detail || `HTTP ${response.status}`,
        data: null,
      }
    }

    // Success response
    const isSuccess = response.ok || (typeof data === 'object' && data?.success === true)
    const result = {
      ok: isSuccess,
      success: data?.success,
      status: response.status,
      data: data?.data || data, // Backend returns {data: ...}, fallback to response
      error: null,
      ...data, // Spread all top-level fields from data (like unread_count)
    }
    return result
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId)
    console.error(`API Request Error [${endpoint}]:`, error)
    
    if (error.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        error: 'Request timed out. Please check your internet connection or server status.',
        data: null,
      }
    }
    
    return {
      ok: false,
      status: 0,
      error: error.message || 'Network error',
      data: null,
    }
  }
}

/**
 * Refresh access token using the refresh token cookie
 * @returns {Promise<boolean>} - true if refresh succeeded, false otherwise
 */
async function refreshAccessToken() {
  try {
    const refreshToken = localStorage.getItem('refresh_token')
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: refreshToken ? JSON.stringify({ refresh_token: refreshToken }) : null
    })

    const data = await response.json()
    
    if (response.ok && data.data) {
      // If backend returned a new access token in the response data, store it
      if (data.data.access_token) {
        localStorage.setItem('access_token', data.data.access_token)
        localStorage.setItem('token', data.data.access_token)
      }
      return true
    }
    return false
  } catch (error) {
    console.error('Token refresh failed:', error)
    return false
  }
}

/**
 * Check if user is currently authenticated (has valid access token cookie)
 * @returns {Promise<boolean>}
 */
async function isAuthenticated() {
  const response = await apiRequest('/user/profile')
  return response.ok
}

/**
 * Logout - Clear cookies server-side
 * @returns {Promise<object>}
 */
async function logout() {
  return apiRequest('/auth/logout', { method: 'POST' })
}

// Generic API client with GET, POST, PUT, DELETE methods
export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) => apiRequest(endpoint, { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  put: (endpoint, data) => apiRequest(endpoint, { 
    method: 'PUT', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
}

// Export API methods grouped by feature
export const auth = {
  register: (data) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data), timeout: 10000 }),
  logout: () => logout(),
  refreshToken: () => refreshAccessToken(),
  sendOtp: (data) => apiRequest('/auth/otp/send', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data) => apiRequest('/auth/otp/verify', { method: 'POST', body: JSON.stringify(data) }),
  sendPasswordResetOtp: (data) => apiRequest('/auth/password/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyPasswordResetOtp: (data) => apiRequest('/auth/password/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => apiRequest('/auth/password/reset', { method: 'POST', body: JSON.stringify(data) }),
  sendEmailLoginOtp: (data) => apiRequest('/auth/login/send-email-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmailLoginOtp: (data) => apiRequest('/auth/login/verify-email-otp', { method: 'POST', body: JSON.stringify(data) }),
}

export const user = {
  getProfile: () => apiRequest('/user/profile', { timeout: 10000 }),
  updateProfile: (data) => apiRequest('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getSubscription: () => apiRequest('/user/subscription', { timeout: 10000 }),
  sendPhoneChangeOtp: (data) => apiRequest('/user/phone-change/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyPhoneChangeOtp: (data) => apiRequest('/user/phone-change/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  sendEmailChangeOtp: (data) => apiRequest('/user/email-change/send-otp', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmailChangeOtp: (data) => apiRequest('/user/email-change/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
}

export const purchaseOrders = {
  create: (data) => {
    const formData = new FormData()
    
    if (data.po_number) formData.append('po_number', data.po_number)
    if (data.vendor) formData.append('vendor', data.vendor)
    if (data.gstin) formData.append('gstin', data.gstin)
    if (data.vendor_email) formData.append('vendor_email', data.vendor_email)
    if (data.vendor_phone) formData.append('vendor_phone', data.vendor_phone)
    if (data.amount) formData.append('amount', data.amount)
    if (data.due_date) formData.append('due_date', data.due_date)
    if (data.status) formData.append('status', data.status)
    if (data.notes) formData.append('notes', data.notes)
    if (data.evidence_url) formData.append('evidence_url', data.evidence_url)
    if (data.supplier_address) formData.append('supplier_address', data.supplier_address)
    if (data.delivery_address) formData.append('delivery_address', data.delivery_address)
    if (data.invoice_address) formData.append('invoice_address', data.invoice_address)
    if (data.payment_window_days) formData.append('payment_window_days', data.payment_window_days)
    if (data.reason) formData.append('reason', data.reason)
    
    if (data.file) {
      formData.append('file', data.file)
    }
    
    return apiRequest('/purchase-orders', { 
      method: 'POST', 
      body: formData, 
      headers: {} 
    })
  },
  bulkImport: (formData) => apiRequest('/purchase-orders/bulk-import-upload', { 
    method: 'POST', 
    body: formData,
    // Note: Don't set Content-Type header; fetch will automatically set it to multipart/form-data with boundary
    headers: {} 
  }),
  bulkImportJson: (items) => apiRequest('/purchase-orders/bulk-import', { 
    method: 'POST', 
    body: JSON.stringify(items) 
  }),
  list: (page = 1, pageSize = 20, includeArchived = false, opt = {}) => apiRequest(`/purchase-orders?page=${page}&page_size=${pageSize}&include_archived=${includeArchived}`, opt),
  get: (id) => apiRequest(`/purchase-orders/${id}`),
  update: (id, data) => apiRequest(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id, data) => apiRequest(`/purchase-orders/${id}`, { method: 'DELETE', body: data ? JSON.stringify(data) : undefined }),
  archive: (id, data) => apiRequest(`/purchase-orders/${id}/archive`, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  markPaid: (id, reason, file) => {
    const formData = new FormData()
    formData.append('reason', reason)
    if (file) {
      formData.append('file', file)
    }
    return apiRequest(`/purchase-orders/${id}/mark-paid`, { 
      method: 'POST', 
      body: formData,
      headers: {}
    })
  },
  uploadReceipt: (id, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest(`/purchase-orders/${id}/upload-receipt`, {
      method: 'POST',
      body: formData,
      headers: {}
    })
  },
  sendReminder: (id) => apiRequest(`/purchase-orders/${id}/send-reminder`, { method: 'POST' }),
  sendLegalNotice: (id, data) => apiRequest(`/purchase-orders/${id}/send-legal-notice`, { method: 'POST', body: JSON.stringify(data) }),
  sendToLegal: (id, reason, file) => {
    const formData = new FormData()
    formData.append('reason', reason)
    if (file) {
      formData.append('file', file)
    }
    return apiRequest(`/purchase-orders/${id}/send-to-legal-support`, { 
      method: 'POST', 
      body: formData,
      headers: {}
    })
  },
  approve: (id) => apiRequest(`/purchase-orders/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) => apiRequest(`/purchase-orders/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  listPending: () => apiRequest('/purchase-orders/workflow/pending'),
}

export const admin = {
  getSettings: () => apiRequest('/user/admin/settings'),
  updateSettings: (data) => apiRequest('/user/admin/settings', { method: 'POST', body: JSON.stringify(data) }),
  getSubscriptionAnalytics: () => apiRequest('/admin/analytics/subscriptions'),
  getDefaulterAnalytics: () => apiRequest('/admin/analytics/defaulters'),
  getInternalStats: () => apiRequest('/admin/analytics/internal'), // We'll add this
}

// Manual reminder for PO (additive standalone function)
export const sendPOReminder = (poId, data = null) => apiRequest(`/purchase-orders/${poId}/send-reminder`, { method: 'POST', body: data ? JSON.stringify(data) : undefined })

export const getPOReminderConfig = () => apiRequest('/admin/po-reminders')

export const updatePOReminderConfig = (data) => apiRequest('/admin/po-reminders', { method: 'PUT', body: JSON.stringify(data) })

export const sendChatMessage = (message) => apiRequest('/chat', { method: 'POST', body: JSON.stringify({ message }), timeout: 180000 })

export const subscriptions = {
  getPlans: () => apiRequest('/subscriptions/plans'),
  purchase: (planId) => apiRequest('/payments/initiate', { method: 'POST', body: JSON.stringify({ plan_id: planId, payment_method: 'qr_code' }) }),
  getStatus: () => apiRequest('/subscriptions/status'),
  getDetails: (id) => apiRequest(`/subscriptions/${id}`),
  uploadProof: (id, proofUrl) => apiRequest(`/subscriptions/${id}/upload-proof`, { method: 'POST', body: JSON.stringify({ payment_proof_url: proofUrl }) }),
  verify: (id) => apiRequest(`/subscriptions/${id}/verify`, { method: 'POST' }),
  process: (id) => apiRequest(`/subscriptions/${id}/process`, { method: 'POST' }),
  approve: (id) => apiRequest(`/subscriptions/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) => apiRequest(`/subscriptions/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  listPending: () => apiRequest('/subscriptions/workflow/pending'),
  initiatePayment: (planId, method = 'qr_code') => apiRequest('/payments/initiate', { method: 'POST', body: JSON.stringify({ plan_id: planId, payment_method: method }) }),
  verifyPayment: (paymentId, transactionId) => apiRequest(`/payments/${paymentId}/verify`, { method: 'POST', body: JSON.stringify({ transaction_id: transactionId }) }),
}

export const defaulters = {
  create: (data) => apiRequest('/defaulters', { method: 'POST', body: JSON.stringify(data) }),
  list: (page = 1, pageSize = 20, opt = {}) => apiRequest(`/defaulters?page=${page}&page_size=${pageSize}`, opt),
  get: (id) => apiRequest(`/defaulters/${id}`),
  update: (id, data) => apiRequest(`/defaulters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/defaulters/${id}`, { method: 'DELETE' }),
  uploadDocument: (id, data) => apiRequest(`/defaulters/${id}/upload-document`, { method: 'POST', body: JSON.stringify(data) }),
}

export const invoices = {
  create: (data) => apiRequest('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  list: (params = {}, opt = {}) => {
    const queryParams = new URLSearchParams()
    if (params.skip !== undefined) queryParams.append('skip', params.skip)
    if (params.limit !== undefined) queryParams.append('limit', params.limit)
    if (params.status) queryParams.append('status', params.status)
    if (params.counterparty_gstin) queryParams.append('counterparty_gstin', params.counterparty_gstin)
    if (params.counterparty_pan) queryParams.append('counterparty_pan', params.counterparty_pan)
    if (params.search) queryParams.append('search', params.search)
    const query = queryParams.toString()
    return apiRequest(`/invoices${query ? '?' + query : ''}`, opt)
  },
  get: (id) => apiRequest(`/invoices/${id}`),
  update: (id, data) => apiRequest(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/invoices/${id}`, { method: 'DELETE' }),
  toggleAcknowledgment: (id) => apiRequest(`/invoices/${id}/acknowledge`, { method: 'POST' }),
  addFollowUpNote: (id, note) => apiRequest(`/invoices/${id}/follow-up`, { method: 'POST', body: JSON.stringify({ note }) }),
  getDueReminders: (opt = {}) => apiRequest('/invoices/reminders/due', opt),
}

export const businessRequests = {
  create: (data) => apiRequest('/business-requests', { method: 'POST', body: JSON.stringify(data) }),
  getMy: (opt = {}) => apiRequest('/business-requests/my', opt),
  getPending: (opt = {}) => apiRequest('/business-requests/pending', opt),
  complete: (id, data) => apiRequest(`/business-requests/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
}

export const businessCheck = {
  create: (data) => apiRequest('/business-check/request', { method: 'POST', body: JSON.stringify(data) }),
  getMy: (opt = {}) => apiRequest('/business-check/my', opt),
  getPending: (opt = {}) => apiRequest('/business-check/pending', opt),
  operationsReview: (id, data) => apiRequest(`/business-check/${id}/operations-review`, { method: 'POST', body: JSON.stringify(data) }),
  getPendingMaster: (opt = {}) => apiRequest('/business-check/pending-master', opt),
  masterApprove: (id, data) => apiRequest(`/business-check/${id}/master-approve`, { method: 'POST', body: JSON.stringify(data) }),
  saveToNetwork: (id) => apiRequest(`/business-check/${id}/save-to-network`, { method: 'POST' }),
  reject: (id) => apiRequest(`/business-check/${id}/reject`, { method: 'POST' }),
}

export const supportRequests = {
  create: (data) => apiRequest('/support-requests', { method: 'POST', body: JSON.stringify(data) }),
  list: (opt = {}) => apiRequest('/support-requests', opt),
  getMy: (opt = {}) => apiRequest('/support-requests/my', opt),
  resolve: (id, data) => apiRequest(`/support-requests/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
}

export const creditReports = {
  create: (data) => apiRequest('/credit-reports', { method: 'POST', body: JSON.stringify(data) }),
  list: (page = 1, pageSize = 20, opt = {}) => apiRequest(`/credit-reports?page=${page}&page_size=${pageSize}`, opt),
  get: (id) => apiRequest(`/credit-reports/${id}`),
  update: (id, data) => apiRequest(`/credit-reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

export const settlements = {
  create: (data) => apiRequest('/settlements', { method: 'POST', body: JSON.stringify(data) }),
  list: (page = 1, pageSize = 20, opt = {}) => apiRequest(`/settlements?page=${page}&page_size=${pageSize}`, opt),
  get: (id) => apiRequest(`/settlements/${id}`),
  update: (id, data) => apiRequest(`/settlements/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

export const appointments = {
  create: (data) => apiRequest('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  list: (status = null, opt = {}) => {
    const query = status ? `?status=${status}` : ''
    return apiRequest(`/appointments${query}`, opt)
  },
  get: (id) => apiRequest(`/appointments/${id}`),
  update: (id, data) => apiRequest(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/appointments/${id}`, { method: 'DELETE' }),
}

export const contact = {
  submit: (data) => apiRequest('/contact/public', { method: 'POST', body: JSON.stringify(data) }),
}

export const wallet = {
  getBalance: (opt = {}) => apiRequest('/wallet/balance', opt),
  getHistory: (page = 1, limit = 10) => apiRequest(`/wallet/history?page=${page}&limit=${limit}`),
  redeem: (amount, reference) => apiRequest('/wallet/redeem', { method: 'POST', body: JSON.stringify({ amount, reference }) }),
}

export const adminApi = {
  getInternalStats: () => apiRequest('/admin/analytics/internal'),
  listInvitations: ({ skip = 0, limit = 50 } = {}) => apiRequest(`/admin/invitations?skip=${skip}&limit=${limit}`),
  createInvitation: (data) => apiRequest('/admin/invitations', { method: 'POST', body: JSON.stringify(data) }),
  updateInvitation: (id, data) => apiRequest(`/admin/invitations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvitation: (id) => apiRequest(`/admin/invitations/${id}`, { method: 'DELETE' }),
  createInternalUser: (data) => apiRequest('/admin/create-user', { method: 'POST', body: JSON.stringify(data) }),
  listUsers: () => apiRequest('/admin/users'),
  updateUserRole: (id, role) => apiRequest(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }),
  getRoleSettings: () => apiRequest('/admin/role-settings'),
  listCompanies: () => apiRequest('/admin/companies'),
  getCompanyDetails: (companyId) => apiRequest(`/admin/companies/${companyId}`),
  post: (endpoint, data) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(data) }),
}

export const adminConfig = {
  getPOReminders: () => apiRequest('/admin/po-reminders'),
  updatePOReminders: (data) => apiRequest('/admin/po-reminders', { method: 'PUT', body: JSON.stringify(data) }),
}

export const invitations = {
  verify: (token) => apiRequest(`/invitations/verify?token=${encodeURIComponent(token)}`),
  accept: (data) => apiRequest('/invitations/accept', { method: 'POST', body: JSON.stringify(data) }),
  acceptStrict: (data) => apiRequest('/invitations/accept-invitation', { method: 'POST', body: JSON.stringify(data) }),
}

export const credibility = {
  list: () => apiRequest('/credibility'),
  get: (id) => apiRequest(`/credibility/${id}`),
  getAiAnalysis: (id) => apiRequest(`/credibility/${id}/ai-analysis`, { method: 'POST', timeout: 180000 }),
  recalculate: () => apiRequest('/credibility/recalculate', { method: 'POST' }),
}

export const drive = {
  getAuthUrl: () => apiRequest('/drive/auth-url'),
  callback: (code, state) => apiRequest('/drive/callback', { method: 'POST', body: JSON.stringify({ code, state }) }),
  listFiles: () => apiRequest('/drive/files'),
  upload: (formData) => apiRequest('/drive/upload', {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header for FormData; fetch sets it with boundary automatically
    headers: {}
  }),
}

export const ratings = {
  check: (gstin) => {
    if (!gstin) return Promise.resolve({ ok: false, error: 'GSTIN is required' })
    return apiRequest('/ratings/check', { method: 'POST', body: JSON.stringify({ counterparty_gstin: String(gstin).trim().toUpperCase() }) })
  },
  submit: (data) => apiRequest('/ratings', { method: 'POST', body: JSON.stringify(data) }),
  listForCompany: (companyId) => apiRequest(`/ratings/company/${companyId}`),
  getGlobalCbi: () => apiRequest('/ratings/global-cbi'),
  getAiAnalysis: (companyId) => apiRequest(`/ratings/ai-analyze/${companyId}`, { timeout: 180000 }),
  getAiTrends: () => apiRequest('/ratings/ai-trends', { timeout: 180000 }),
}

export const legal = {
  submitBusinessRequest: (data) => apiRequest('/legal/business-request', { method: 'POST', body: JSON.stringify(data) }),
  listBusinessRequests: () => apiRequest('/legal/business-requests/pending'),
  analyzeBusinessRequest: (id, data) => apiRequest(`/legal/business-request/${id}/analyze`, { method: 'POST', body: JSON.stringify(data) }),
  requestGstinReport: (data) => apiRequest('/legal/gstin-check/request-report', { method: 'POST', body: JSON.stringify(data) }),
  listGstinReports: () => apiRequest('/legal/reports/pending'),
  completeGstinReport: (id, data) => apiRequest(`/legal/report/${id}/complete`, { method: 'POST', body: JSON.stringify(data) }),
}

export const audit = {
  getLogs: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append('search', params.search)
    if (params.action && params.action !== 'all') queryParams.append('action', params.action)
    if (params.date_from) queryParams.append('date_from', params.date_from)
    const query = queryParams.toString()
    return apiRequest(`/audit-logs${query ? '?' + query : ''}`)
  },
}

// Global Credibility Index
export const credibilityIndex = {
  initiateReview: (data) => apiRequest('/credibility-index/initiate', { method: 'POST', body: JSON.stringify(data) }),
  getPendingFinancial: () => apiRequest('/credibility-index/pending/financial'),
  submitFinancialReview: (id, data) => apiRequest(`/credibility-index/review/financial/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  getPendingLegal: () => apiRequest('/credibility-index/pending/legal'),
  submitLegalReview: (id, data) => apiRequest(`/credibility-index/review/legal/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  getPendingOperations: () => apiRequest('/credibility-index/pending/operations'),
  submitOperationsReview: (id, data) => apiRequest(`/credibility-index/review/operations/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  getPendingMasterAdmin: () => apiRequest('/credibility-index/pending/master-admin'),
  submitMasterAdminDecision: (id, data) => apiRequest(`/credibility-index/approve/master-admin/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  getIndex: () => apiRequest('/credibility-index/index'),
  getReviewStatus: (businessRequestId) => apiRequest(`/credibility-index/status/${businessRequestId}`),
}

// Utility: Check authentication status
export const authUtils = {
  isAuthenticated,
  refreshToken: refreshAccessToken,
}

export default apiRequest