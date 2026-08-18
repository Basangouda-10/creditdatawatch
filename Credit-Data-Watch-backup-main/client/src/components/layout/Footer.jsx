import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Other Pages',
    links: [
      { label: 'Home', to: '/' },
      { label: 'About', to: '/about' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Membership', to: '/membership' },
      { label: 'Offerings', to: '/offerings' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Report Defaulters', to: '/defaulters' },
      { label: 'Purchase Orders', to: '/purchase-orders' },
      { label: 'Credit Reports', to: '/credit-reports' },
      { label: 'Settlement', to: '/settlement' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'B2B Solutions', to: '/solutions/b2b' },
      { label: 'MSME Solutions', to: '/solutions/msme' },
      { label: 'Business Credit', to: '/solutions/business-credit' },
      { label: 'Business Debt', to: '/solutions/business-debt' },
    ],
  },
  {
    title: 'Reach Us',
    links: [
      { label: 'Book Appointment', to: '/appointment' },
      { label: 'Login / Register', to: '/auth' },
      { label: 'Support', to: '/contact' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-200 mt-16">
      <div className="container-custom py-12">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary-600 text-white font-heading font-bold text-xl flex items-center justify-center shadow-md">
                CD
              </div>
              <div>
                <p className="font-heading font-bold text-lg">CreditDataWatch</p>
                <p className="text-sm text-gray-400">Centralized credit intelligence hub</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-sm">
              Report overdue payers, validate trades formally, and manage business credit with GST-first controls.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading font-semibold text-white mb-4">{col.title}</h3>
              <ul className="space-y-2 text-sm">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link className="hover:text-primary-300 transition-colors" to={link.to}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-800 mt-10 pt-6 text-sm text-gray-500 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span>Copyright © 2026 –Till Now. Credit-Data-Watch. All Rights Reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-primary-300">Privacy</Link>
            <Link to="/terms" className="hover:text-primary-300">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
