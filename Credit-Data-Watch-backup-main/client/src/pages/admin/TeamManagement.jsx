import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api/apiClient'

export default function TeamManagement() {
  const [invitations, setInvitations] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ email: '', role: 'OPERATIONS', expiry_hours: 24 })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ role: 'OPERATIONS', expiry_hours: 24 })
  const [editingUserId, setEditingUserId] = useState(null)
  const [editUserRole, setEditUserRole] = useState('')
  const [sendingInvite, setSendingInvite] = useState(false)

  const loadInvitations = async () => {
    setLoading(true)
    const res = await adminApi.listInvitations()
    if (res.ok && Array.isArray(res.data)) {
      setInvitations(res.data)
    }
    setLoading(false)
  }

  const loadUsers = async () => {
    setLoadingUsers(true)
    const res = await adminApi.listUsers()
    if (res.ok && Array.isArray(res.data)) {
      setUsers(res.data)
    }
    setLoadingUsers(false)
  }

  useEffect(() => {
    loadInvitations()
    loadUsers()
  }, [])

  const startEdit = (inv) => {
    setEditingId(inv.id)
    setEditForm({ role: inv.role || 'OPERATIONS', expiry_hours: 24 })
  }
  const cancelEdit = () => {
    setEditingId(null)
  }
  const saveEdit = async (id) => {
    setMessage('')
    const hours = Number(editForm.expiry_hours)
    if (Number.isNaN(hours) || hours < 1 || hours > 168) {
      setMessage('Expiry must be between 1 and 168 hours')
      return
    }
    const res = await adminApi.updateInvitation(id, { role: editForm.role, expiry_hours: hours })
    if (res.ok) {
      setInvitations((prev) => prev.map((i) => (i.id === id ? { ...i, role: res.data?.role || editForm.role, expires_at: res.data?.expires_at || i.expires_at } : i)))
      setEditingId(null)
      setMessage('Invitation updated')
    } else {
      setMessage(res.error || 'Failed to update invitation')
    }
  }
  const deleteInvitation = async (id) => {
    setMessage('')
    const ok = window.confirm('Are you sure you want to delete this invitation?')
    if (!ok) return
    const res = await adminApi.deleteInvitation(id)
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== id))
      setMessage('Invitation deleted')
    } else {
      setMessage(res.error || 'Failed to delete invitation')
    }
  }

  const startEditUserRole = (user) => {
    setEditingUserId(user.id)
    setEditUserRole(user.role)
  }
  const cancelEditUserRole = () => {
    setEditingUserId(null)
  }
  const saveUserRole = async (id) => {
    setMessage('')
    const res = await adminApi.updateUserRole(id, editUserRole)
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: editUserRole } : u))
      setEditingUserId(null)
      setMessage('User role updated')
    } else {
      setMessage(res.error || 'Failed to update user role')
    }
  }
  const deleteUser = async (id, email) => {
    setMessage('')
    const ok = window.confirm(`Are you sure you want to delete user ${email}?`)
    if (!ok) return
    const res = await adminApi.deleteUser(id)
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setMessage('User deleted successfully')
    } else {
      setMessage(res.error || 'Failed to delete user')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    const { email, role, expiry_hours } = form
    const hours = Number(expiry_hours)
    if (!email || !role) {
      setMessage('Email and role are required')
      return
    }
    if (Number.isNaN(hours) || hours < 1 || hours > 168) {
      setMessage('Expiry must be between 1 and 168 hours')
      return
    }
    setSendingInvite(true) 
    const res = await adminApi.createInvitation({ email, role, expiry_hours: hours })
    if (res.ok) {
      setMessage('✅ Invitation sent successfully!')
      setForm({ email: '', role: 'OPERATIONS', expiry_hours: 24 })
      await loadInvitations()
    } else {
      setMessage(res.error || 'Failed to create invitation')
    }
    setSendingInvite(false) 
  }

  return (
    <section className="section-padding">
      <div className="container-custom space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Admin</p>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 max-w-3xl">Invite employees to your company and manage pending invitations.</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">Team Members</h2>
            {loadingUsers && <span className="text-sm text-gray-500">Loading...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Username</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Created At</th>
                  <th className="py-2 pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!loadingUsers && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-gray-500">No team members yet.</td>
                  </tr>
                )}
                {users.map((user) => (
                  <tr key={user.id} className="text-gray-800">
                    <td className="py-2 pr-3">{user.username || user.email}</td>
                    <td className="py-2 pr-3">{user.email}</td>
                    <td className="py-2 pr-3">
                      {editingUserId === user.id ? (
                        <select
                          className="rounded border border-gray-300 px-2 py-1 text-sm"
                          value={editUserRole}
                          onChange={(e) => setEditUserRole(e.target.value)}
                        >
                          <option value="MASTER_ADMIN">MASTER_ADMIN</option>
                          <option value="OPERATIONS">OPERATIONS</option>
                          <option value="FINANCIAL">FINANCIAL</option>
                          <option value="LEGAL">LEGAL</option>
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        user.role
                      )}
                    </td>
                    <td className="py-2 pr-3">{user.status || 'ACTIVE'}</td>
                    <td className="py-2 pr-3">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                    <td className="py-2 pr-3">
                      {editingUserId === user.id ? (
                        <div className="flex items-center gap-2">
                          <button type="button" className="btn-primary px-3 py-1 text-xs" onClick={() => saveUserRole(user.id)}>Save</button>
                          <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={cancelEditUserRole}>Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => startEditUserRole(user)}>Edit Role</button>
                          <button type="button" className="btn-danger px-3 py-1 text-xs" onClick={() => deleteUser(user.id, user.email)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold text-gray-900">Invitations</h2>
              {loading && <span className="text-sm text-gray-500">Loading...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Expires At</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {!loading && invitations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-3 text-center text-gray-500">No invitations yet.</td>
                    </tr>
                  )}
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="text-gray-800">
                      <td className="py-2 pr-3">{inv.email}</td>
                      <td className="py-2 pr-3">
                        {editingId === inv.id ? (
                          <select
                            className="rounded border border-gray-300 px-2 py-1 text-sm"
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="FINANCE">FINANCE</option>
                            <option value="LEGAL">LEGAL</option>
                            <option value="OPERATIONS">OPERATIONS</option>
                          </select>
                        ) : (
                          inv.role
                        )}
                      </td>
                      <td className="py-2 pr-3">{inv.status}</td>
                      <td className="py-2 pr-3">
                        {editingId === inv.id ? (
                          <input
                            type="number"
                            min={1}
                            max={168}
                            className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                            value={editForm.expiry_hours}
                            onChange={(e) => setEditForm({ ...editForm, expiry_hours: e.target.value })}
                          />
                        ) : (
                          inv.expires_at || '—'
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        {editingId === inv.id ? (
                          <div className="flex items-center gap-2">
                            <button type="button" className="btn-primary px-3 py-1 text-xs" onClick={() => saveEdit(inv.id)}>Save</button>
                            <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={cancelEdit}>Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => startEdit(inv)}>Edit</button>
                            <button type="button" className="btn-danger px-3 py-1 text-xs" onClick={() => deleteInvitation(inv.id)}>Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold text-gray-900">Invite Employee</h2>
              <span className="text-xs text-gray-500">Admin only</span>
            </div>
            {message && ( 
              <div className={`rounded-lg px-4 py-2 text-sm font-medium ${ 
                String(message).includes('✅') 
                  ? 'bg-green-50 border border-green-200 text-green-700' 
                  : 'bg-red-50 border border-red-200 text-red-700' 
              }`}> 
                {typeof message === 'object' ? (message.message || message.detail || JSON.stringify(message)) : String(message)} 
              </div> 
            )}
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Role</label>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="LEGAL">LEGAL</option>
                  <option value="OPERATIONS">OPERATIONS</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700">Expiry (hours)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  value={form.expiry_hours}
                  onChange={(e) => setForm({ ...form, expiry_hours: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Between 1 and 168 hours. Default is 24.</p>
              </div>
              <button 
                type="submit" 
                disabled={sendingInvite} 
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2" 
              > 
                {sendingInvite ? ( 
                  <> 
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> 
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/> 
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/> 
                    </svg> 
                    Sending... 
                  </> 
                ) : ( 
                  'Send Invitation' 
                )} 
              </button> 
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
