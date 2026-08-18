import { useState } from 'react'
import PropTypes from 'prop-types'

export default function EditableTable({ rows = [], onEdit, onDelete }) {
  const [editing, setEditing] = useState(null)

  return (
    <div className="card">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Registered Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Mobile</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => (
              <tr key={row.id} className="text-gray-800">
                <td className="py-2 pr-3">{row.name}</td>
                <td className="py-2 pr-3">{row.registeredName}</td>
                <td className="py-2 pr-3">{row.email}</td>
                <td className="py-2 pr-3">{row.mobile}</td>
                <td className="py-2 pr-3 flex gap-3">
                  <button className="text-primary-700" onClick={() => { setEditing(row); onEdit?.(row) }}>✏️</button>
                  <button className="text-red-600" onClick={() => onDelete?.(row)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="text-xs text-gray-500 mt-3">Editing row: {editing.name} (stub)</div>
      )}
    </div>
  )
}

EditableTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    registeredName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    mobile: PropTypes.string.isRequired,
  })).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}
