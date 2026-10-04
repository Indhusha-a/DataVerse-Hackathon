import { useState } from 'react'

// Decorative route map. Used behind the sign-in and landing hero. If a photo is
// placed at /images/hero.jpg (see public/images/README.md), it is shown instead.
export function RouteArt({ className }: { className?: string }) {
  const [photo, setPhoto] = useState(true)

  return (
    <div className={className} aria-hidden="true">
      {photo && (
        <img
          src="/images/hero.jpg"
          alt=""
          onError={() => setPhoto(false)}
          className="h-full w-full object-cover"
        />
      )}
      {!photo && (
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
          <defs>
            <linearGradient id="wp-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0a0e1a" />
              <stop offset="1" stopColor="#171d33" />
            </linearGradient>
            <pattern id="wp-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="#818cf8" strokeOpacity="0.12" strokeWidth="1" />
            </pattern>
            <radialGradient id="wp-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="800" fill="url(#wp-sky)" />
          <rect width="1200" height="800" fill="url(#wp-grid)" />
          <ellipse cx="620" cy="380" rx="520" ry="300" fill="url(#wp-glow)" />

          {/* Coastline and district boundaries, drawn loosely */}
          <path
            d="M120 640 C 240 560, 300 600, 420 540 S 640 470, 760 500 S 980 420, 1100 360"
            fill="none"
            stroke="#334155"
            strokeWidth="2"
            strokeDasharray="6 10"
          />
          <path
            d="M180 260 C 330 300, 420 200, 560 240 S 820 300, 960 220"
            fill="none"
            stroke="#334155"
            strokeWidth="2"
            strokeDasharray="6 10"
          />

          {/* Routes between stops */}
          <path
            d="M250 470 C 360 380, 470 420, 560 350 S 760 260, 880 320"
            fill="none"
            stroke="#818cf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M560 350 C 620 430, 720 470, 860 470 S 1010 520, 1060 430"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />

          {/* Stops */}
          {[
            { x: 250, y: 470, label: 'Depot · Peliyagoda', tone: '#6366f1' },
            { x: 560, y: 350, label: 'OUT001 · Colombo', tone: '#818cf8' },
            { x: 880, y: 320, label: 'OUT040 · Gampaha', tone: '#818cf8' },
            { x: 860, y: 470, label: 'OUT077 · Kandy', tone: '#22c55e' },
            { x: 1060, y: 430, label: 'OUT088 · Kalutara', tone: '#22c55e' },
          ].map((stop) => (
            <g key={stop.label}>
              <circle cx={stop.x} cy={stop.y} r="22" fill={stop.tone} fillOpacity="0.18" />
              <circle cx={stop.x} cy={stop.y} r="8" fill={stop.tone} />
              <text x={stop.x + 16} y={stop.y - 14} fill="#cbd5e1" fontSize="20" fontFamily="Inter, sans-serif">
                {stop.label}
              </text>
            </g>
          ))}

          {/* Vehicle marker */}
          <g transform="translate(700 452)">
            <rect x="-26" y="-16" width="52" height="30" rx="6" fill="#ffffff" />
            <rect x="8" y="-10" width="16" height="14" rx="2" fill="#4f46e5" />
            <circle cx="-14" cy="18" r="6" fill="#0f172a" />
            <circle cx="16" cy="18" r="6" fill="#0f172a" />
          </g>
        </svg>
      )}
    </div>
  )
}
