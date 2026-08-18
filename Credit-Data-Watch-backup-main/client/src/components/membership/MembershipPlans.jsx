import PlanCard from './PlanCard'
import { useState, useEffect } from 'react'
import SubscribeModal from './SubscribeModal'
import { api } from '../../services/api/apiClient'

export default function MembershipPlans() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await api.get('/subscriptions/plans')

        if (response.ok && response.data) {
          setPlans(response.data)
          setError(null)
        } else {
          setError('Failed to load plans')
          setPlans(getDefaultPlans())
        }
      } catch (err) {
        console.error('Error fetching plans:', err)
        setPlans(getDefaultPlans())
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const getDefaultPlans = () => [
    {
      id: 'c8cb82b0-0659-4a2c-a6d1-f9d4fec423f1',
      name: 'base',
      display_name: 'Base',
      price: 500,
      validity_days: 30,
      follow_up_limit: 999,
      legal_assistance: 'NO',
      reminder_followups: 'Yes',
      cir_generation_fee: 'Included',
      description: 'Entry-level plan for small businesses'
    },
    {
      id: '6a4f238b-95b3-40b0-9cb2-903dbc58450b',
      name: 'royal',
      display_name: 'Royal',
      price: 1000,
      validity_days: 180,
      follow_up_limit: 999,
      legal_assistance: '5 Incidents follow ups',
      reminder_followups: 'Yes',
      cir_generation_fee: 'Included',
      description: 'For growing businesses with legal support'
    },
    {
      id: '129a2385-557f-4f4d-a1ba-837863160a6e',
      name: 'groups',
      display_name: 'Groups',
      price: 2000,
      validity_days: 365,
      follow_up_limit: 999,
      legal_assistance: '20 Incidents follow ups',
      reminder_followups: 'Yes',
      cir_generation_fee: 'Included',
      description: 'For organizations managing multiple business entities'
    },
    {
      id: 'ea8e3c79-b9b0-4881-ba7d-2890f71d1b3b',
      name: 'enterprise',
      display_name: 'Enterprise',
      price: 100000,
      validity_days: 365,
      follow_up_limit: 999,
      legal_assistance: '100 Incidents follow ups',
      reminder_followups: 'Yes',
      cir_generation_fee: 'Included',
      description: 'Enterprise solution with maximum legal assistance'
    },
  ]

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-full animate-pulse bg-gray-200"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          {typeof error === 'object' ? (error.message || error.detail || JSON.stringify(error)) : String(error)} — Using default plans
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onSelect={setSelected} />
        ))}
      </div>
      <SubscribeModal plan={selected} onClose={() => setSelected(null)} />
    </div>
  )
}