'use client';

import { useMemo, useState } from 'react';

const CHART_W = 600;
const CHART_H = 200;
const PAD_X = 44;
const PAD_Y = 24;

function toPoints(data, w, h, max, padX = PAD_X, padY = PAD_Y) {
  if (!data.length) return [];
  return data.map((v, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * (w - padX * 2),
    y: h - padY - (v / max) * (h - padY * 2),
    v,
  }));
}

function smoothLinePath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function smoothAreaPath(points, h, padY = PAD_Y) {
  if (!points.length) return '';
  const bottom = h - padY;
  const line = smoothLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${bottom} L ${first.x} ${bottom} Z`;
}

function buildDayLabels(count = 14) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (count - 1 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
}

function computeTicks(max) {
  const step = max <= 20 ? 5 : max <= 50 ? 10 : 25;
  const ticks = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

export function genChartSeries(seed, base, variance, points = 14) {
  return Array.from({ length: points }, (_, i) => {
    const s = (seed * (i + 7) * 31) % 100;
    return Math.min(98, Math.max(4, base + (s % variance) - variance / 2));
  });
}

export default function LineChart({
  title,
  subtitle,
  data = [],
  color = '#ef4444',
  max = 100,
  suffix = '%',
  badge,
  height = CHART_H,
  className = '',
}) {
  const [tooltip, setTooltip] = useState(null);
  const days = useMemo(() => buildDayLabels(data.length), [data.length]);
  const ticks = useMemo(() => computeTicks(max), [max]);
  const points = useMemo(() => toPoints(data, CHART_W, height, max), [data, height, max]);
  const linePath = useMemo(() => smoothLinePath(points), [points]);
  const areaPath = useMemo(() => smoothAreaPath(points, height), [points, height]);
  const gradId = useMemo(() => `grad-${title?.replace(/\s/g, '-') || 'chart'}`, [title]);

  const last = data[data.length - 1];
  const avg = data.length ? Math.round(data.reduce((a, b) => a + b, 0) / data.length) : 0;

  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {last != null && (
            <div className="text-right">
              <p className="text-lg font-bold text-white leading-none">
                {last}
                <span className="text-sm font-normal text-neutral-400">{suffix}</span>
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">avg {avg}{suffix}</p>
            </div>
          )}
          {badge && (
            <span className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-xl bg-neutral-900/50 border border-neutral-800/80 px-2 pt-2">
        <svg
          viewBox={`0 0 ${CHART_W} ${height}`}
          className="w-full"
          style={{ minWidth: '280px' }}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => {
            const y = height - PAD_Y - (tick / max) * (height - PAD_Y * 2);
            return (
              <g key={tick}>
                <line
                  x1={PAD_X}
                  y1={y}
                  x2={CHART_W - PAD_X}
                  y2={y}
                  stroke="#2a2a2a"
                  strokeWidth={1}
                  strokeDasharray="4 6"
                />
                <text x={PAD_X - 8} y={y + 4} textAnchor="end" fill="#525252" fontSize={10}>
                  {tick}
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}

          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - 14}
              y={0}
              width={28}
              height={height}
              fill="transparent"
              onMouseEnter={() => setTooltip({ i, x: p.x })}
            />
          ))}

          {tooltip !== null && (
            <>
              <line
                x1={tooltip.x}
                y1={PAD_Y}
                x2={tooltip.x}
                y2={height - PAD_Y}
                stroke="#404040"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle
                cx={points[tooltip.i]?.x}
                cy={points[tooltip.i]?.y}
                r={5}
                fill={color}
                stroke="#0a0a0a"
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {tooltip !== null && (
          <div
            className="absolute top-3 pointer-events-none bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs shadow-xl z-10"
            style={{ left: `${Math.min(Math.max((tooltip.x / CHART_W) * 100 - 10, 4), 72)}%` }}
          >
            <p className="text-neutral-400 mb-1 font-medium">{days[tooltip.i]}</p>
            <p className="text-white font-semibold">
              {data[tooltip.i]}{suffix}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2 px-1">
        {[0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
          <span key={i} className="text-xs text-neutral-600">
            {days[i]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MultiLineChart({
  title,
  subtitle,
  series = [],
  max = 100,
  suffix = '%',
  badge,
  height = CHART_H,
  className = '',
}) {
  const [tooltip, setTooltip] = useState(null);
  const [active, setActive] = useState('all');
  const days = useMemo(() => buildDayLabels(series[0]?.data?.length || 14), [series]);
  const ticks = useMemo(() => computeTicks(max), [max]);

  const visible = active === 'all' ? series : series.filter((s) => s.key === active);
  const pointCount = series[0]?.data?.length || 0;

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-white font-semibold">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {badge && (
            <span className="text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
          <button
            onClick={() => setActive('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              active === 'all' ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            All
          </button>
          {series.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(active === s.key ? 'all' : s.key)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active === s.key ? 'bg-neutral-800 text-white border-neutral-600' : 'border-neutral-800 text-neutral-500 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative overflow-x-auto rounded-xl bg-neutral-900/50 border border-neutral-800/80 px-2 pt-2">
        <svg
          viewBox={`0 0 ${CHART_W} ${height}`}
          className="w-full"
          style={{ minWidth: '280px' }}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`ml-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {ticks.map((tick) => {
            const y = height - PAD_Y - (tick / max) * (height - PAD_Y * 2);
            return (
              <g key={tick}>
                <line x1={PAD_X} y1={y} x2={CHART_W - PAD_X} y2={y} stroke="#2a2a2a" strokeWidth={1} strokeDasharray="4 6" />
                <text x={PAD_X - 8} y={y + 4} textAnchor="end" fill="#525252" fontSize={10}>{tick}</text>
              </g>
            );
          })}

          {visible.map((s) => {
            const pts = toPoints(s.data, CHART_W, height, max);
            return (
              <path key={`area-${s.key}`} d={smoothAreaPath(pts, height)} fill={`url(#ml-${s.key})`} />
            );
          })}

          {visible.map((s) => {
            const pts = toPoints(s.data, CHART_W, height, max);
            return (
              <path
                key={`line-${s.key}`}
                d={smoothLinePath(pts)}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          })}

          {pointCount > 0 && Array.from({ length: pointCount }, (_, i) => {
            const xs = PAD_X + (i / Math.max(pointCount - 1, 1)) * (CHART_W - PAD_X * 2);
            return (
              <rect
                key={i}
                x={xs - 14}
                y={0}
                width={28}
                height={height}
                fill="transparent"
                onMouseEnter={() => setTooltip({ i, x: xs })}
              />
            );
          })}

          {tooltip !== null && (
            <>
              <line x1={tooltip.x} y1={PAD_Y} x2={tooltip.x} y2={height - PAD_Y} stroke="#404040" strokeWidth={1} strokeDasharray="3 3" />
              {visible.map((s) => {
                const pts = toPoints(s.data, CHART_W, height, max);
                const p = pts[tooltip.i];
                if (!p) return null;
                return <circle key={s.key} cx={p.x} cy={p.y} r={4} fill={s.color} stroke="#0a0a0a" strokeWidth={2} />;
              })}
            </>
          )}
        </svg>

        {tooltip !== null && (
          <div
            className="absolute top-3 pointer-events-none bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs shadow-xl z-10"
            style={{ left: `${Math.min(Math.max((tooltip.x / CHART_W) * 100 - 10, 4), 72)}%` }}
          >
            <p className="text-neutral-400 mb-1.5 font-medium">{days[tooltip.i]}</p>
            {visible.map((s) => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-neutral-300">{s.label}:</span>
                <span className="text-white font-semibold">{s.data[tooltip.i]}{suffix}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-2 px-1">
        {[0, Math.floor((pointCount - 1) / 2), pointCount - 1].map((i) => (
          <span key={i} className="text-xs text-neutral-600">{days[i]}</span>
        ))}
      </div>
    </div>
  );
}
