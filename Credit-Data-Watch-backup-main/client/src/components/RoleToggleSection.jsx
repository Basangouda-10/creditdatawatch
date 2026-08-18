import { useState, useEffect } from 'react'
import { api } from '../services/api/apiClient'

export default function RoleToggleSection({ token }) {
  const [settings, setSettings] = useState({ financial_role_enabled: { enabled: false }, legal_role_enabled: { enabled: false } })
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const load = async () => {
    try {
      const d = await api.get('/admin/settings/roles')
      if (d.success) setSettings(d.data)
    } catch(e) { console.error(e) }
    setLoading(false)
  }
  useEffect(() => { load() }, [token])
  const toggle = async (key, val) => {
    setToggling(key)
    try {
      const d = await api.post(`/admin/settings/roles/${key}/toggle`, { enabled: val })
      if (d.success) { await load(); alert(`✅ ${d.message}`) } else alert(`❌ ${d.message}`)
    } catch(e) { alert('Connection failed') }
    setToggling(null)
  }
  if (loading) return null
  const roles = [
    { key: 'financial_role_enabled', label: 'Financial Team Role', icon: '💰', onDesc: 'Financial team handles subscriptions', offDesc: 'Operations team handles subscriptions' },
    { key: 'legal_role_enabled', label: 'Legal Team Role', icon: '⚖️', onDesc: 'Legal team handles legal notices', offDesc: 'Operations team handles legal notices' }
  ]
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
      <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2"><span>⚙️</span> Role Management</h2>
        <span className="text-xs text-gray-400">Toggle team roles ON or OFF</span>
      </div>
      <div className="p-5 space-y-4">
        {roles.map(role => {
          const isEnabled = settings[role.key]?.enabled || false
          return (
            <div key={role.key} className={`rounded-xl border-2 p-4 transition-all ${isEnabled ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{role.icon}</span>
                    <span className="font-bold text-gray-800 text-sm">{role.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                      {isEnabled ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{isEnabled ? role.onDesc : role.offDesc}</p>
                  {settings[role.key]?.updated_by && <p className="text-xs text-gray-400 mt-1">Last changed by: {settings[role.key].updated_by}</p>}
                </div>
                <button disabled={toggling === role.key}
                  onClick={() => { if (window.confirm(`${isEnabled ? 'Disable' : 'Enable'} this role?`)) toggle(role.key, !isEnabled) }}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors disabled:opacity-50 ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )
        })}
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs font-bold text-blue-800 mb-2">💡 How it works:</p>
          <div className="space-y-1 text-xs text-blue-700">
            <p>• Financial OFF: Operations handles subscriptions → Master approves</p>
            <p>• Financial ON: Financial team handles subscriptions → Master approves</p>
            <p>• Legal OFF: Operations handles legal notices → Master notified</p>
            <p>• Legal ON: Legal team handles legal notices → Master notified</p>
          </div>
        </div>
      </div>
    </div>
  )
}
