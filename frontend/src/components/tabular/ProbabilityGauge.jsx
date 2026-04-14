import React from 'react'
import { motion } from 'framer-motion'

/**
 * Probability gauge.
 *
 * variant='gauge' renders a semicircular SVG meter (good for binary).
 * variant='stacked' renders a 100%-stacked horizontal bar across classes.
 */
export default function ProbabilityGauge({
  variant = 'gauge',
  value = 0,
  classes = {},
  label,
  topClass,
}) {
  if (variant === 'stacked') {
    return <StackedBar classes={classes} topClass={topClass} label={label} />
  }
  return <SemiGauge value={value} label={label} topClass={topClass} />
}

function SemiGauge({ value = 0, label, topClass }) {
  const pct = Math.max(0, Math.min(1, value))
  // arc math: 180 -> 0 degrees across top. SVG path for half-ring.
  const R = 90
  const cx = 110
  const cy = 110
  const thickness = 16
  const start = polar(cx, cy, R, 180)
  const end = polar(cx, cy, R, 180 - pct * 180)
  const largeArc = pct > 0.5 ? 1 : 0
  const color = gaugeColor(pct)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 220 130" className="w-full max-w-[260px] h-auto">
        {/* track */}
        <path
          d={`M ${polar(cx, cy, R, 180).x} ${polar(cx, cy, R, 180).y}
              A ${R} ${R} 0 0 1 ${polar(cx, cy, R, 0).x} ${polar(cx, cy, R, 0).y}`}
          fill="none"
          stroke="rgba(148,163,184,0.18)"
          strokeWidth={thickness}
          strokeLinecap="round"
        />
        {/* value */}
        {pct > 0 && (
          <motion.path
            d={`M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </svg>
      <div className="-mt-10 text-center">
        <div className="text-4xl font-bold tabular-nums" style={{ color }}>
          {(pct * 100).toFixed(1)}%
        </div>
        {topClass && (
          <div className="text-sm font-semibold mt-0.5">{topClass}</div>
        )}
        {label && (
          <div className="text-xs uppercase tracking-wider text-muted-foreground mt-0.5">
            {label}
          </div>
        )}
      </div>
    </div>
  )
}

function StackedBar({ classes = {}, topClass, label }) {
  const entries = Object.entries(classes)
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <div>
          <div className="text-sm font-semibold">{topClass}</div>
          {label && (
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{entries.length} classes</div>
      </div>
      <div className="flex h-5 rounded-lg overflow-hidden border border-border bg-border/20">
        {entries.map(([name, v], i) => {
          const pct = (v / total) * 100
          const color = stackedColor(i, entries.length)
          return (
            <motion.div
              key={name}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: color }}
              title={`${name}: ${(v * 100).toFixed(1)}%`}
            />
          )
        })}
      </div>
      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-1.5">
        {entries.map(([name, v], i) => (
          <div key={name} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: stackedColor(i, entries.length) }}
            />
            <span className="truncate">{name}</span>
            <span className="ml-auto tabular-nums text-muted-foreground">
              {(v * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

function gaugeColor(pct) {
  if (pct >= 0.7) return '#22c55e' // green
  if (pct >= 0.5) return '#eab308' // amber
  if (pct >= 0.3) return '#f97316' // orange
  return '#ef4444' // red
}

function stackedColor(i, total) {
  // traffic-light ramp from red -> amber -> green
  const palette = ['#ef4444', '#eab308', '#22c55e']
  if (total === 2) return i === 0 ? '#ef4444' : '#22c55e'
  if (total === 3) return palette[i] || '#64748b'
  // generic hue wheel
  const hue = Math.round((i / total) * 140) // 0 red -> 140 green
  return `hsl(${hue}, 70%, 55%)`
}
