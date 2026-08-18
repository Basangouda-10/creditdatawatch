
import { useState } from 'react'

const IndiaCredibilityMap = ({ companies = [] }) => {
  const [hoveredCompany, setHoveredCompany] = useState(null)

  // Convert lat/lng to SVG coordinates (world map projection)
  const latLngToXY = (lat, lng) => {
    // World map bounds: lat -60 to 80, lng -180 to 180
    // SVG viewBox: 0 0 1200 600
    const x = ((lng + 180) / 360) * 1200
    const y = ((90 - lat) / 180) * 600
    return { x, y }
  }

  // World locations with coordinates
  const locations = [
    { city: 'Mumbai', lat: 19.076, lng: 72.8777, companies: 45 },
    { city: 'Delhi', lat: 28.7041, lng: 77.1025, companies: 32 },
    { city: 'Bangalore', lat: 12.9716, lng: 77.5946, companies: 58 },
    { city: 'London', lat: 51.5074, lng: -0.1278, companies: 25 },
    { city: 'New York', lat: 40.7128, lng: -74.0060, companies: 40 },
    { city: 'Tokyo', lat: 35.6762, lng: 139.6503, companies: 30 },
    { city: 'Singapore', lat: 1.3521, lng: 103.8198, companies: 35 },
    { city: 'Dubai', lat: 25.2048, lng: 55.2708, companies: 20 },
    { city: 'Sydney', lat: -33.8688, lng: 151.2093, companies: 22 },
    { city: 'Berlin', lat: 52.5200, lng: 13.4050, companies: 28 },
  ]

  return (
    <div className="card">
      <h3 className="text-lg font-heading font-bold text-gray-900 mb-4">Credibility Index Across the World</h3>
      <div className="relative h-[400px] bg-gradient-to-b from-blue-50 to-blue-100 rounded-xl overflow-hidden">
        <svg viewBox="0 0 1200 600" className="w-full h-full">
          <defs>
            <linearGradient id="ocean" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
            <linearGradient id="land" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bbf7d0" />
              <stop offset="100%" stopColor="#86efac" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00000030" />
            </filter>
          </defs>

          {/* Ocean */}
          <rect x="0" y="0" width="1200" height="600" fill="url(#ocean)" />

          {/* North America */}
          <g filter="url(#shadow)">
            <path d="M180 80 Q220 60 280 70 L340 60 Q400 50 460 80 L500 100 Q520 150 480 200 L440 220 Q400 240 340 220 L300 200 Q260 180 240 160 Q220 140 200 120 Q180 100 180 80 Z M260 100 Q240 120 250 140 L270 130 Q280 110 260 100 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="2.5" />
            {/* Central America */}
            <path d="M460 200 Q480 220 500 230 L520 240 Q540 260 560 280 L540 300 Q520 310 500 300 Q480 290 460 270 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="2.5" />
          </g>

          {/* South America */}
          <g filter="url(#shadow)">
            <path d="M500 280 Q560 300 620 320 L640 380 Q660 440 600 480 L540 460 Q500 420 500 360 Q500 320 500 280 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="2.5" />
          </g>

          {/* Europe */}
          <g filter="url(#shadow)">
            <path d="M580 80 Q640 60 700 70 L760 90 Q780 130 740 160 L680 150 Q640 130 600 110 Q580 95 580 80 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="2.5" />
          </g>

          {/* Africa */}
          <g filter="url(#shadow)">
            <path d="M600 160 Q660 140 720 160 L780 200 Q800 270 760 340 L680 360 Q600 340 600 280 Q600 220 600 160 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="2.5" />
          </g>

          {/* Asia */}
          <g filter="url(#shadow)">
            <path d="M700 60 Q800 30 920 60 L1050 100 Q1100 160 1060 240 L980 260 Q900 250 840 220 L780 180 Q720 140 700 100 Q700 80 700 60 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="2.5" />
            {/* Japan */}
            <path d="M1020 90 Q1040 85 1055 95 L1050 115 Q1035 120 1020 105 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="1.5" />
            {/* Philippines */}
            <path d="M950 160 Q965 155 975 165 L970 180 Q955 185 950 170 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="1.5" />
          </g>

          {/* Australia */}
          <g filter="url(#shadow)">
            <path d="M980 300 Q1030 290 1080 320 L1060 390 Q1010 410 960 380 L980 340 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="2.5" />
          </g>

          {/* Greenland */}
          <g filter="url(#shadow)">
            <path d="M380 30 Q440 20 480 40 L460 70 Q420 85 380 65 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="1.5" />
          </g>

          {/* Iceland */}
          <g filter="url(#shadow)">
            <path d="M560 55 Q580 50 590 60 L585 75 Q565 80 560 65 Z" fill="url(#land)" stroke="#22c55e" strokeWidth="1.5" />
          </g>

          {/* Location pins */}
          {locations.map((loc, i) => {
            const { x, y } = latLngToXY(loc.lat, loc.lng)
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredCompany(loc)}
                onMouseLeave={() => setHoveredCompany(null)}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                {/* Outer glow circle */}
                <circle cx={x} cy={y} r={Math.min(loc.companies / 3, 20)} fill="#4f46e5" opacity="0.6" />
                {/* Main pin circle */}
                <circle cx={x} cy={y} r={8} fill="#4f46e5" />
                {/* Pin highlight */}
                <circle cx={x - 2} cy={y - 2} r={3} fill="#818cf8" />
                {/* Pin top */}
                <circle cx={x} cy={y - 10} r={5} fill="#1d4ed8" />
              </g>
            )
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredCompany && (
          <div className="absolute top-4 right-4 bg-white p-4 rounded-xl shadow-xl border border-gray-200 z-20">
            <p className="font-bold text-gray-900 text-lg">{hoveredCompany.city}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold text-primary-700">{hoveredCompany.companies}</span> verified companies</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default IndiaCredibilityMap
