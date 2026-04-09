import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

/**
 * PageGuide — collapsible quick-guide card for ELM Studio pages.
 *
 * @param {string}   storageKey   localStorage key to persist open/closed state
 * @param {string}   what         1-2 sentence description of the page
 * @param {string[]} steps        ordered steps the user should follow
 * @param {{ term: string, def: string }[]} concepts  key ML concepts explained simply
 */
export default function PageGuide({ storageKey, what, steps = [], concepts = [] }) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(`guide_${storageKey}`) === '1' }
    catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem(`guide_${storageKey}`, open ? '1' : '0') }
    catch { /* noop */ }
  }, [open, storageKey])

  return (
    <motion.div
      className="glass-panel"
      style={{ padding: '0.85rem 1.1rem', marginBottom: '1rem' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          <BookOpen size={16} style={{ color: '#60a5fa' }} />
          Quick Guide
        </span>
        {open ? <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', marginTop: '0.75rem' }}>
              {/* What this page does */}
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                {what}
              </p>

              {/* Steps */}
              {steps.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                    How to use
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {steps.map((s, i) => (
                      <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Key concepts */}
              {concepts.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lightbulb size={12} /> Key Concepts
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {concepts.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '0.35rem 0.6rem', borderRadius: 8,
                          background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                          fontSize: '0.78rem'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#60a5fa' }}>{c.term}:</span>{' '}
                        <span style={{ color: 'var(--text-secondary)' }}>{c.def}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
