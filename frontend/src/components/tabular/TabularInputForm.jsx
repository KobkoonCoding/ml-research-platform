import React from 'react'
import { motion } from 'framer-motion'

/**
 * Schema-driven form for tabular problems. Emits normalized values via onChange
 * every time any field moves, enabling live-debounced predictions upstream.
 */
export default function TabularInputForm({ schema, values, onChange }) {
  if (!schema) return null

  const patch = (key, raw) => {
    onChange({ ...values, [key]: raw })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {schema.fields.map((field) => (
        <FieldRow
          key={field.key}
          field={field}
          value={values[field.key]}
          onChange={(v) => patch(field.key, v)}
        />
      ))}
    </div>
  )
}

function FieldRow({ field, value, onChange }) {
  if (field.type === 'select') {
    return (
      <div className="rounded-xl border border-border bg-surface/60 p-3">
        <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1">
          {field.label}
          {field.help && <span className="ml-2 lowercase text-[10px] opacity-70">· {field.help}</span>}
        </label>
        <select
          className="w-full bg-transparent border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={value ?? field.options[0].value}
          onChange={(e) => {
            const raw = e.target.value
            const opt = field.options.find((o) => String(o.value) === raw)
            onChange(opt ? opt.value : raw)
          }}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // slider
  const numVal = typeof value === 'number' ? value : Number(value) || field.min
  const decimals = decimalsFor(field.step || 1)
  const display = decimals === 0 ? Math.round(numVal) : numVal.toFixed(decimals)

  return (
    <div className="rounded-xl border border-border bg-surface/60 p-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs uppercase tracking-wider text-muted-foreground">
          {field.label}
        </label>
        <span className="text-sm font-semibold tabular-nums">
          {display}
          {field.unit ? <span className="ml-1 text-muted-foreground font-normal">{field.unit}</span> : null}
        </span>
      </div>
      <input
        type="range"
        min={field.min}
        max={field.max}
        step={field.step || 1}
        value={numVal}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
        <span>{field.min}</span>
        <span>{field.max}</span>
      </div>
    </div>
  )
}

function decimalsFor(step) {
  const s = String(step)
  if (!s.includes('.')) return 0
  return s.split('.')[1].length
}
