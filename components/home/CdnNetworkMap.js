'use client';

import { CDN_NETWORK_POPS, CDN_NETWORK_STATS } from '@/data/cdn-network';

export default function CdnNetworkMap() {
  return (
    <div className="relative bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect width="1000" height="500" fill="#0a0a0a" />
          <ellipse cx="220" cy="180" rx="120" ry="100" fill="none" stroke="#404040" strokeWidth="1" />
          <ellipse cx="500" cy="160" rx="90" ry="80" fill="none" stroke="#404040" strokeWidth="1" />
          <ellipse cx="780" cy="200" rx="130" ry="110" fill="none" stroke="#404040" strokeWidth="1" />
          <ellipse cx="300" cy="360" rx="80" ry="60" fill="none" stroke="#404040" strokeWidth="1" />
          <ellipse cx="560" cy="340" rx="70" ry="90" fill="none" stroke="#404040" strokeWidth="1" />
          <ellipse cx="850" cy="380" rx="60" ry="50" fill="none" stroke="#404040" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative aspect-[2/1] min-h-[280px] sm:min-h-[360px]">
        <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
              <path d="M 4 0 L 0 0 0 4" fill="none" stroke="#1a1a1a" strokeWidth="0.15" />
            </pattern>
          </defs>
          <rect width="100" height="50" fill="url(#grid)" />

          {/* Simplified continent outlines */}
          <path d="M8,12 Q15,8 22,14 Q28,22 18,28 Q10,26 8,12" fill="none" stroke="#333" strokeWidth="0.2" />
          <path d="M42,8 Q52,6 58,12 Q62,20 55,26 Q48,22 42,8" fill="none" stroke="#333" strokeWidth="0.2" />
          <path d="M68,10 Q78,8 88,16 Q92,24 82,30 Q72,26 68,10" fill="none" stroke="#333" strokeWidth="0.2" />
          <path d="M44,32 Q52,30 58,36 Q60,42 52,44 Q44,40 44,32" fill="none" stroke="#333" strokeWidth="0.2" />
          <path d="M78,34 Q84,32 90,38 Q88,44 82,42 Q78,38 78,34" fill="none" stroke="#333" strokeWidth="0.2" />

          {/* Connection lines between major hubs */}
          {[
            [26, 36, 48, 28], [48, 28, 74, 54], [14, 40, 26, 36],
            [52, 28, 62, 42], [74, 54, 84, 36], [48, 28, 54, 68],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="0.08" strokeDasharray="0.5 0.5" />
          ))}

          {CDN_NETWORK_POPS.map((pop) => (
            <g key={pop.id}>
              <circle cx={pop.x} cy={pop.y} r="1.2" fill="#fff" opacity="0.9">
                <animate attributeName="r" values="1;1.8;1" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={pop.x} cy={pop.y} r="0.5" fill="#000" />
            </g>
          ))}
        </svg>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {CDN_NETWORK_STATS.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {CDN_NETWORK_POPS.map((pop) => (
              <span
                key={pop.id}
                className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-neutral-300"
              >
                {pop.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
