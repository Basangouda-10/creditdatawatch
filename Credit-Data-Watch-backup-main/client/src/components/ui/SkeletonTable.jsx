
const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="card overflow-hidden animate-pulse">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="text-left p-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t border-gray-100">
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="p-3">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SkeletonTable
