import React, { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, List, ChevronDown, ChevronUp } from 'lucide-react'
import { API_BASE } from '../lib/constants'

const ACCENT = {
  primary: { text: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  error: { text: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
  success: { text: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  warning: { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
}

function humanizeLabel(label) {
  // Replace underscores with spaces, capitalize each word — for Food-101 / ImageNet style labels
  return String(label)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function ClassListSearch({ modelKey, accentColor = 'primary' }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)

  const colors = ACCENT[accentColor] || ACCENT.primary

  useEffect(() => {
    if (!modelKey) return
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/models/classes?model=${modelKey}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (cancelled) return
        const sorted = Array.isArray(data.classes) ? [...data.classes].sort((a, b) => a.localeCompare(b)) : []
        setClasses(sorted)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Failed to load classes')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [modelKey])

  const filtered = useMemo(() => {
    if (!query.trim()) return classes
    const q = query.trim().toLowerCase()
    return classes.filter((c) => c.toLowerCase().includes(q))
  }, [classes, query])

  const count = classes.length

  return (
    <div className={`glass-card rounded-2xl border border-border overflow-hidden`}>
      {/* Header — click to expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-border/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${colors.bg}`}>
            <List className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div className="text-left">
            <div className="text-sm font-black text-text-primary">Supported Classes</div>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {loading ? 'Loading…' : error ? 'Failed to load' : `${count} classes · click to browse`}
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-text-muted" />
        ) : (
          <ChevronDown className="w-5 h-5 text-text-muted" />
        )}
      </button>

      {/* Expanded panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search classes..."
                  className={`w-full pl-10 pr-3 py-2.5 rounded-xl bg-border/20 border border-border focus:border-border-subtle focus:outline-none focus:ring-2 focus:ring-${accentColor}/30 text-sm text-text-primary placeholder:text-text-muted`}
                />
              </div>

              {/* Class list */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-border/10">
                {loading && (
                  <div className="p-4 text-center text-xs text-text-muted">Loading class list…</div>
                )}
                {error && (
                  <div className="p-4 text-center text-xs text-error">Error: {error}</div>
                )}
                {!loading && !error && filtered.length === 0 && (
                  <div className="p-4 text-center text-xs text-text-muted">No matches for "{query}"</div>
                )}
                {!loading && !error && filtered.length > 0 && (
                  <ul className="divide-y divide-border">
                    {filtered.slice(0, 200).map((cls) => (
                      <li
                        key={cls}
                        className="px-3 py-2 text-xs font-medium text-text-secondary hover:bg-border/20 transition-colors"
                      >
                        {humanizeLabel(cls)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {!loading && !error && (
                <div className="flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest">
                  <span>
                    Showing {Math.min(filtered.length, 200)} of {count}
                  </span>
                  {filtered.length > 200 && <span className="italic normal-case">Refine search to see more</span>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
