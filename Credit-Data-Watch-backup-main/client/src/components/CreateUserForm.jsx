import { useState, memo, useEffect } from 'react'
import { api } from '../services/api/apiClient'

const CreateUserForm = memo(function CreateUserForm() {
  // Initialize state from localStorage if available
  const [fullName, setFullName] = useState(() => {
    return localStorage.getItem('createUser_fullName') || ''
  })
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('createUser_email') || ''
  })
  const [gstin, setGstin] = useState(() => {
    return localStorage.getItem('createUser_gstin') || '22AAAAD0000A1Z5'
  })
  const [tempPassword, setTempPassword] = useState(() => {
    return localStorage.getItem('createUser_tempPassword') || 'TempPass@123'
  })
  const [selectedRole, setSelectedRole] = useState(() => {
    return localStorage.getItem('createUser_selectedRole') || 'OPERATION'
  })

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('createUser_fullName', fullName)
  }, [fullName])
  
  useEffect(() => {
    localStorage.setItem('createUser_email', email)
  }, [email])
  
  useEffect(() => {
    localStorage.setItem('createUser_gstin', gstin)
  }, [gstin])
  
  useEffect(() => {
    localStorage.setItem('createUser_tempPassword', tempPassword)
  }, [tempPassword])
  
  useEffect(() => {
    localStorage.setItem('createUser_selectedRole', selectedRole)
  }, [selectedRole])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    // capture values BEFORE any async call
    const payload = {
      name: fullName,
      email: email,
      gstin: gstin,
      password: tempPassword,
      role: selectedRole
    }

    if (!payload.name || !payload.email || !payload.password || !payload.role) {
      alert('Please fill all required fields')
      return
    }

    try {
      const res = await api.post('/admin/create-user', payload)
      if (res.ok) {
        alert(`✅ User created! Login email sent to ${payload.email}`)
        // Reset form AND localStorage only on success
        setFullName('')
        setEmail('')
        setGstin('22AAAAD0000A1Z5')
        setTempPassword('TempPass@123')
        setSelectedRole('OPERATION')
        localStorage.removeItem('createUser_fullName')
        localStorage.removeItem('createUser_email')
        localStorage.removeItem('createUser_gstin')
        localStorage.removeItem('createUser_tempPassword')
        localStorage.removeItem('createUser_selectedRole')
      } else {
        alert(res.error || res.message || 'Failed to create user')
      }
    } catch(e) {
      alert('Failed to create user')
      console.error(e)
    }
  }

  return (
    <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Full Name</label>
        <input 
          type="text" 
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-100 outline-none" 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Email Address</label>
        <input 
          type="email" 
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@company.com"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-100 outline-none" 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">GSTIN (Optional)</label>
        <input 
          type="text"
          value={gstin}
          onChange={(e) => setGstin(e.target.value)}
          placeholder="22AAAAD0000A1Z5"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-100 outline-none" 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Temp Password</label>
        <input 
          type="text"
          required
          value={tempPassword}
          onChange={(e) => setTempPassword(e.target.value)}
          placeholder="TempPass@123"
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-100 outline-none" 
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Role</label>
        <select 
          required 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-100 outline-none"
        >
          <option value="OPERATION">⚙️ Operations Team</option>
          <option value="FINANCIAL">💰 Financial Team</option>
          <option value="LEGAL">⚖️ Legal Team</option>
          <option value="COMPANY_ADMIN">🏢 Company Admin</option>
        </select>
      </div>
      <div className="flex items-end">
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-sm">
          ➕ Create & Send Email
        </button>
      </div>
    </form>
  )
})

export default CreateUserForm
