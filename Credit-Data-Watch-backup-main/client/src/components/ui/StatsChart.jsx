
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Jan', transactions: 4000, score: 92 },
  { name: 'Feb', transactions: 3000, score: 93 },
  { name: 'Mar', transactions: 5000, score: 94 },
  { name: 'Apr', transactions: 2780, score: 92 },
  { name: 'May', transactions: 1890, score: 95 },
  { name: 'Jun', transactions: 2390, score: 97 },
]

const StatsChart = () => {
  return (
    <div className="card">
      <h3 className="text-lg font-heading font-bold text-text-primary mb-4">
        Monthly Performance Overview
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #E0E7FF',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line
              type="monotone"
              dataKey="transactions"
              stroke="#4F46E5"
              strokeWidth={3}
              dot={{ fill: '#4F46E5', r: 5 }}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#7C3AED"
              strokeWidth={3}
              dot={{ fill: '#7C3AED', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default StatsChart
