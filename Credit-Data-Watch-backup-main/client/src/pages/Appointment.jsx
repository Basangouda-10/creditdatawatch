import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { appointments as appointmentsApi } from '../services/api/apiClient'
import { useAuth } from '../state/authContext'

export default function Appointment() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showList, setShowList] = useState(false)
  const [form, setForm] = useState({
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    appointment_date: '',
    purpose: '',
    notes: '',
  })

  useEffect(() => {
    if (user && showList) {
      fetchAppointments()
    }
  }, [user, showList])

  const fetchAppointments = async () => {
    setLoading(true)
    const res = await appointmentsApi.list()
    if (res.ok && Array.isArray(res.data)) {
      setAppointments(res.data)
    }
    setLoading(false)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    // Convert date/time to ISO string
    const appointmentDateTime = new Date(form.appointment_date).toISOString()

    const res = await appointmentsApi.create({
      contact_name: form.contact_name,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      appointment_date: appointmentDateTime,
      purpose: form.purpose,
      notes: form.notes,
    })

    if (res.ok) {
      setMessage('Appointment booked successfully!')
      setForm({
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        appointment_date: '',
        purpose: '',
        notes: '',
      })
      if (user) {
        fetchAppointments()
      }
    } else {
      setMessage(res.error || 'Failed to book appointment')
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-heading font-bold mb-2">Book Appointment</h1>
              <p className="text-lg text-gray-600">Schedule a walkthrough with our credit specialists.</p>
            </div>
            {user && (
              <button
                onClick={() => setShowList(!showList)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showList ? 'Book New' : 'View My Appointments'}
              </button>
            )}
          </div>

          {message && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
              {typeof message === 'object' ? (message.message || message.detail || JSON.stringify(message)) : String(message)}
            </div>
          )}

          {showList && user ? (
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">My Appointments</h2>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : appointments.length === 0 ? (
                <p className="text-gray-500">No appointments yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(apt.appointment_date).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{apt.contact_name}</div>
                            <div className="text-sm text-gray-500">{apt.contact_email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{apt.purpose}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(apt.status)}`}>
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact_name" className="text-sm font-semibold text-gray-700">Contact Name</label>
                    <input
                      id="contact_name"
                      name="contact_name"
                      value={form.contact_name}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact_phone" className="text-sm font-semibold text-gray-700">Contact Phone</label>
                    <input
                      id="contact_phone"
                      name="contact_phone"
                      value={form.contact_phone}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contact_email" className="text-sm font-semibold text-gray-700">Contact Email</label>
                    <input
                      id="contact_email"
                      type="email"
                      name="contact_email"
                      value={form.contact_email}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                  <div>
                    <label htmlFor="appointment_date" className="text-sm font-semibold text-gray-700">Appointment Date & Time</label>
                    <input
                      id="appointment_date"
                      type="datetime-local"
                      name="appointment_date"
                      value={form.appointment_date}
                      onChange={handleChange}
                      required
                      className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="purpose" className="text-sm font-semibold text-gray-700">Purpose / Topic</label>
                  <input
                    id="purpose"
                    name="purpose"
                    value={form.purpose}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Credit Management Consultation"
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                <div>
                  <label htmlFor="notes" className="text-sm font-semibold text-gray-700">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={4}
                    value={form.notes}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    placeholder="Any specific questions or topics you'd like to discuss..."
                  />
                </div>

                <button type="submit" className="btn-primary w-full">
                  Schedule Appointment
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
