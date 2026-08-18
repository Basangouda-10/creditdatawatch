import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { invitations } from '../../services/api/apiClient'

export default function AcceptInvite() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState(null)
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setStatus({ type: '', message: '' })
      if (!token) {
        setStatus({ type: 'error', message: 'Invitation is invalid or expired.' })
        setLoading(false)
        return
      }
      const res = await invitations.verify(token)
      if (res.ok && res.data) {
        setInvite(res.data)
      } else {
        setStatus({ type: 'error', message: 'Invitation is invalid or expired.' })
      }
      setLoading(false)
    }
    run()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', message: '' })
    if (!form.password || form.password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }
    if (form.password !== form.confirm) {
      setStatus({ type: 'error', message: 'Passwords do not match' })
      return
    }
    setSubmitting(true)
    const res = await invitations.acceptStrict({
      token,
      email: invite.email,
      role: invite.role,
      company_id: invite.company_id,
      password: form.password,
      confirm_password: form.confirm,
    })
    if (res.ok) {
      setStatus({ type: 'success', message: 'Invitation accepted. Redirecting to login...' })
      setTimeout(() => navigate('/auth/login'), 1200)
    } else {
      setStatus({ type: 'error', message: res.error || 'Failed to accept invitation' })
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 justify-center mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary-600 text-white font-heading font-bold text-xl flex items-center justify-center">CD</div>
            <span className="font-heading font-bold text-2xl text-gray-900">CreditDataWatch</span>
          </Link>
          <h1 className="text-3xl font-heading font-bold">Accept Invitation</h1>
          <p className="text-gray-600">Join your company workspace</p>
        </div>
        <div className="card">
          {loading ? (
            <div className="text-center text-gray-600 py-6">Validating invitation...</div>
          ) : invite ? (
            <>
              {status.message && (
                <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                  status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}>
                  {status.message}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <input
                    type="email"
                    value={invite.email}
                    disabled
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Role</label>
                  <input
                    type="text"
                    value={invite.role}
                    disabled
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    required
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"
                  />
                </div>
                <button type="submit" className="btn-primary w-full disabled:opacity-60" disabled={submitting}>
                  {submitting ? 'Accepting...' : 'Accept Invitation'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">Invitation is invalid or expired.</h2>
              <p className="text-gray-600">Please contact your company admin for a new invitation.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
