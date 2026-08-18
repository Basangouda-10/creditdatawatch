import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/authContext'
import { api, purchaseOrders } from '../../services/api/apiClient'
import authService from '../../services/authService'
import { formatE164 } from '../../utils/phone'
import EditPOModal from '../../components/po/EditPOModal'

export default function Account() {
  const { user, logout, loadUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Form states
  const [companyName, setCompanyName] = useState('')
  const [editingName, setEditingName] = useState(false)
  
  // Phone change
  const [showPhoneChange, setShowPhoneChange] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneStatus, setPhoneStatus] = useState('')
  
  // Email change
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)
  const [emailStatus, setEmailStatus] = useState('')
  
  // Image uploads
  const [photoUploading, setPhotoUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  
  // Time display
  const [currentTime, setCurrentTime] = useState({ gmt: '', ist: '' })
  const [loginTime, setLoginTime] = useState('')
  const [showPOHistory, setShowPOHistory] = useState(false)
  const [poRows, setPoRows] = useState([])
  const [poLoading, setPoLoading] = useState(false)
  const [poStatus, setPoStatus] = useState('')
  const [editingPO, setEditingPO] = useState(null)
  useEffect(() => {
    const handler = () => {
      if (showPOHistory) loadPOs()
    }
    window.addEventListener('poChanged', handler)
    return () => window.removeEventListener('poChanged', handler)
  }, [showPOHistory])

  useEffect(() => {
    if (user) {
      setCompanyName(user.company_name || '')
      // Get login time from localStorage or use created_at
      const storedLoginTime = localStorage.getItem('loginTime')
      if (storedLoginTime) {
        setLoginTime(storedLoginTime)
      } else {
        setLoginTime(new Date().toISOString())
        localStorage.setItem('loginTime', new Date().toISOString())
      }
    }
    loadProfile()
    
    // Update time every second
    const updateTime = () => {
      const now = new Date()
      setCurrentTime({
        gmt: now.toUTCString(),
        ist: new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})).toLocaleString(),
      })
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [user])

  const loadProfile = async () => {
    try {
      const response = await api.get('/account/profile')
      if (response.ok && response.data?.data) {
        setProfile(response.data.data)
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    localStorage.removeItem('loginTime')
    await logout()
    navigate('/')
  }

  const handleUpdateName = async () => {
    if (!companyName.trim()) {
      setPhoneStatus('Company name cannot be empty')
      return
    }
    
    try {
      const response = await api.put('/user/profile', {
        company_name: companyName.trim(),
      })
      
      if (response.ok) {
        setEditingName(false)
        await loadUser()
        setPhoneStatus('Name updated successfully')
        setTimeout(() => setPhoneStatus(''), 3000)
      } else {
        setPhoneStatus(response.error || 'Failed to update name')
      }
    } catch (err) {
      setPhoneStatus('Error updating name: ' + err.message)
    }
  }

  const handleSendPhoneOtp = async () => {
    setPhoneStatus('')
    const formatted = formatE164(newPhone)
    if (!formatted) {
      setPhoneStatus('Enter a valid phone with country code')
      return
    }
    
    const res = await authService.sendPhoneChangeOtp(formatted)
    if (res.ok) {
      setPhoneOtpSent(true)
      setPhoneStatus('OTP sent to your email and phone')
    } else {
      setPhoneStatus(res.error || 'Failed to send OTP')
    }
  }

  const handleVerifyPhoneOtp = async () => {
    setPhoneStatus('')
    const formatted = formatE164(newPhone)
    const res = await authService.verifyPhoneChangeOtp(formatted, phoneOtp.trim())
    
    if (res.ok) {
      setPhoneStatus('Phone number updated successfully')
      setNewPhone('')
      setPhoneOtp('')
      setPhoneOtpSent(false)
      setShowPhoneChange(false)
      await loadUser()
      await loadProfile()
      setTimeout(() => setPhoneStatus(''), 3000)
    } else {
      setPhoneStatus(res.error || 'Invalid OTP')
    }
  }

  const handleCancelPhoneChange = () => {
    setShowPhoneChange(false)
    setNewPhone('')
    setPhoneOtp('')
    setPhoneOtpSent(false)
    setPhoneStatus('')
  }

  const handleSendEmailOtp = async () => {
    setEmailStatus('')
    if (!newEmail || !newEmail.includes('@')) {
      setEmailStatus('Enter a valid email address')
      return
    }
    
    const res = await authService.sendEmailChangeOtp(newEmail)
    if (res.ok) {
      setEmailOtpSent(true)
      setEmailStatus('OTP sent to new email address')
    } else {
      setEmailStatus(res.error || 'Failed to send OTP')
    }
  }

  const handleVerifyEmailOtp = async () => {
    setEmailStatus('')
    const res = await authService.verifyEmailChangeOtp(newEmail, emailOtp.trim())
    
    if (res.ok) {
      setEmailStatus('Email updated successfully')
      setNewEmail('')
      setEmailOtp('')
      setEmailOtpSent(false)
      setShowEmailChange(false)
      await loadUser()
      await loadProfile()
      setTimeout(() => setEmailStatus(''), 3000)
    } else {
      setEmailStatus(res.error || 'Invalid OTP')
    }
  }

  const handleCancelEmailChange = () => {
    setShowEmailChange(false)
    setNewEmail('')
    setEmailOtp('')
    setEmailOtpSent(false)
    setEmailStatus('')
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhoneStatus('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhoneStatus('Image size should be less than 5MB')
      return
    }

    setPhotoUploading(true)
    try {
      // TODO: Upload to Google Drive and get actual URL
      // For now, create a data URL for preview
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result
        // Upload to Google Drive and get URL (simulated for now)
        const driveUrl = `https://drive.google.com/file/d/photo-${Date.now()}/view`
        
        const response = await api.post('/account/profile-photo', {
          file_type: 'profile_photo',
          drive_url: driveUrl,
        })
        
        if (response.ok) {
          await loadProfile()
          // Trigger event to refresh header
          window.dispatchEvent(new Event('profileUpdated'))
          setPhoneStatus('Profile photo updated successfully')
          setTimeout(() => setPhoneStatus(''), 3000)
        } else {
          setPhoneStatus('Failed to upload photo: ' + (response.error || 'Unknown error'))
        }
        setPhotoUploading(false)
      }
      reader.onerror = () => {
        setPhoneStatus('Failed to read image file')
        setPhotoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setPhoneStatus('Failed to upload photo: ' + err.message)
      setPhotoUploading(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhoneStatus('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhoneStatus('Image size should be less than 5MB')
      return
    }

    setLogoUploading(true)
    try {
      // TODO: Upload to Google Drive and get actual URL
      // For now, create a data URL for preview
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageDataUrl = event.target?.result
        // Upload to Google Drive and get URL (simulated for now)
        const driveUrl = `https://drive.google.com/file/d/logo-${Date.now()}/view`
        
        const response = await api.post('/account/company-logo', {
          file_type: 'company_logo',
          drive_url: driveUrl,
        })
        
        if (response.ok) {
          await loadProfile()
          // Trigger event to refresh header
          window.dispatchEvent(new Event('profileUpdated'))
          setPhoneStatus('Company logo updated successfully')
          setTimeout(() => setPhoneStatus(''), 3000)
        } else {
          setPhoneStatus('Failed to upload logo: ' + (response.error || 'Unknown error'))
        }
        setLogoUploading(false)
      }
      reader.onerror = () => {
        setPhoneStatus('Failed to read image file')
        setLogoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setPhoneStatus('Failed to upload logo: ' + err.message)
      setLogoUploading(false)
    }
  }

  const loadPOs = async () => {
    setPoLoading(true)
    setPoStatus('')
    const res = await purchaseOrders.list(1, 100, true)
    if (res.ok && Array.isArray(res.data?.items)) {
      setPoRows(res.data.items)
    } else if (res.ok && Array.isArray(res.data)) {
      setPoRows(res.data)
    } else {
      setPoStatus(res.error || 'Failed to load purchase orders')
    }
    setPoLoading(false)
  }

  const handleAddNewPOSection = async () => {
    setShowPOHistory(true)
    await loadPOs()
  }

  const handleClearPOSection = () => {
    setShowPOHistory(false)
    setPoRows([])
    setPoStatus('')
  }

  const handleArchivePO = async (po) => {
    const res = await purchaseOrders.archive(po.id)
    if (res.ok) {
      setPoRows((prev) => prev.map(r => r.id === po.id ? { ...r, is_archived: !r.is_archived } : r))
      setPoStatus(po.is_archived ? 'PO restored.' : 'PO archived.')
    } else {
      setPoStatus(res.error || 'Failed to archive PO')
    }
  }

  const handleDeletePO = async (po) => {
    const res = await purchaseOrders.delete(po.id)
    if (res.ok) {
      setPoRows((prev) => prev.filter(r => r.id !== po.id))
      setPoStatus('PO deleted.')
    } else {
      setPoStatus(res.error || 'Failed to delete PO')
    }
  }

  const handleSaveEditPO = async (payload) => {
    if (!editingPO) return false
    const res = await purchaseOrders.update(editingPO.id, payload)
    if (res.ok) {
      setPoRows((prev) => prev.map(r => r.id === editingPO.id ? { ...r, ...payload } : r))
      setPoStatus('PO updated.')
      return true
    }
    setPoStatus(res.error || 'Failed to update PO')
    return false
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user) {
    return (
      <div className="container-custom py-10">
        <div className="card text-center">
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary-600 text-white font-heading font-bold text-2xl flex items-center justify-center shadow-md overflow-hidden">
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : user?.company_name ? (
                user.company_name.charAt(0).toUpperCase()
              ) : (
                '👤'
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                {user?.company_name || 'Account'}
              </h1>
              <p className="text-gray-600 mt-1">{user?.email || 'User'}</p>
            </div>
            {profile?.company_logo_url && (
              <div className="w-20 h-20 rounded-lg bg-white border-2 border-primary-200 flex items-center justify-center overflow-hidden shadow-md">
                <img src={profile.company_logo_url} alt="Company Logo" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        {/* Time Display */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Time (GMT)</h3>
            <p className="text-lg font-mono text-gray-900">{currentTime.gmt}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Time (IST)</h3>
            <p className="text-lg font-mono text-gray-900">{currentTime.ist}</p>
          </div>
        </div>

        {/* Login Time */}
        {loginTime && (
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Last Login</h3>
            <p className="text-gray-900">{formatDateTime(loginTime)}</p>
          </div>
        )}

        {/* Profile Image Upload */}
        <div className="card">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">Profile Image</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              {profile?.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="profile-photo" className="text-sm font-semibold text-gray-700 block mb-2">
                Upload Profile Photo
              </label>
              <input
                id="profile-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={photoUploading}
                className="w-full text-sm"
              />
              {photoUploading && <p className="text-xs text-gray-600 mt-1">Uploading...</p>}
            </div>
          </div>
        </div>

        {/* Company Logo Upload */}
        <div className="card">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">Company Logo</h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-lg bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              {profile?.company_logo_url ? (
                <img src={profile.company_logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">🏢</span>
              )}
            </div>
            <div className="flex-1">
              <label htmlFor="company-logo" className="text-sm font-semibold text-gray-700 block mb-2">
                Upload Company Logo
              </label>
              <input
                id="company-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={logoUploading}
                className="w-full text-sm"
              />
              {logoUploading && <p className="text-xs text-gray-600 mt-1">Uploading...</p>}
            </div>
          </div>
        </div>

        

        {/* Purchase Order History moved to Dashboard */}

        {/* Edit Name */}
        <div className="card">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">Company Name</h2>
          {editingName ? (
            <div className="space-y-3">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                placeholder="Company Name"
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateName} className="btn-primary">Save</button>
                <button onClick={() => { setEditingName(false); setCompanyName(user.company_name || ''); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-900 text-lg">{user.company_name || '—'}</p>
              <button onClick={() => setEditingName(true)} className="btn-secondary">
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Change Phone Number */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">Mobile Number</h2>
            {!showPhoneChange && (
              <button onClick={() => setShowPhoneChange(true)} className="btn-secondary text-sm">
                Change
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Current Phone</label>
              <p className="text-gray-900">{user.phone || '—'}</p>
            </div>
            
            {showPhoneChange && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">New Phone Number</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+91XXXXXXXXXX"
                      disabled={phoneOtpSent}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:bg-gray-100"
                    />
                    <button
                      onClick={handleSendPhoneOtp}
                      disabled={phoneOtpSent}
                      className="btn-secondary whitespace-nowrap disabled:opacity-50"
                    >
                      {phoneOtpSent ? 'Sent ✓' : 'Send OTP'}
                    </button>
                  </div>
                </div>
                {phoneOtpSent && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Enter OTP</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-widest font-mono focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      />
                      <button onClick={handleVerifyPhoneOtp} className="btn-primary whitespace-nowrap">
                        Verify
                      </button>
                    </div>
                  </div>
                )}
                {phoneStatus && (
                  <p className={`text-sm ${phoneStatus.includes('success') || phoneStatus.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                    {phoneStatus}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelPhoneChange} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Change Email */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-heading font-semibold text-gray-900">Email</h2>
            {!showEmailChange && (
              <button onClick={() => setShowEmailChange(true)} className="btn-secondary text-sm">
                Change
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Current Email</label>
              <p className="text-gray-900">{user.email || '—'}</p>
            </div>
            
            {showEmailChange && (
              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">New Email Address</label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new@email.com"
                      disabled={emailOtpSent}
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:bg-gray-100"
                    />
                    <button
                      onClick={handleSendEmailOtp}
                      disabled={emailOtpSent}
                      className="btn-secondary whitespace-nowrap disabled:opacity-50"
                    >
                      {emailOtpSent ? 'Sent ✓' : 'Send OTP'}
                    </button>
                  </div>
                </div>
                {emailOtpSent && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Enter OTP</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="000000"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-center text-xl tracking-widest font-mono focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      />
                      <button onClick={handleVerifyEmailOtp} className="btn-primary whitespace-nowrap">
                        Verify
                      </button>
                    </div>
                  </div>
                )}
                {emailStatus && (
                  <p className={`text-sm ${emailStatus.includes('success') || emailStatus.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                    {emailStatus}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={handleCancelEmailChange} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="card">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-gray-700">GSTIN</label>
              <p className="text-gray-900 mt-1">{user.gstin || '—'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Role</label>
              <p className="text-gray-900 mt-1 capitalize">{user.role || 'User'}</p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Account Created</label>
              <p className="text-gray-900 mt-1">{formatDateTime(user.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="card">
          <button
            onClick={handleLogout}
            className="btn-primary w-full"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
