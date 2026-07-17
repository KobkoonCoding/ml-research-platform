import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { lockScroll, unlockScroll } from './scrollLock'

/**
 * Module-selection modal (opened by "Get Started" / the CTA).
 * Same three destinations as landing v1, restyled for the Optima design
 * language — glass panel, serif headings, single blue accent.
 */

export const MODULES = [
  {
    id: 'forensic',
    num: '01',
    title: 'Data Forensic & Cleaning',
    tagline: 'Clean, explore, and transform your data',
    features: ['Auto-detect data quality issues', 'Missing values & outliers', 'Visual EDA'],
    bestFor: 'Preparing messy real-world datasets',
    path: '/forensic',
  },
  {
    id: 'elm-studio',
    num: '02',
    title: 'ELM Studio',
    tagline: 'Train models with optimization-backed speed',
    features: ['Convergence-guaranteed ELM', 'Configurable hidden nodes', 'Real-time prediction'],
    bestFor: 'Quick prototyping of classification models',
    path: '/elm-studio',
  },
  {
    id: 'deep-learning',
    num: '03',
    title: 'AI Model Hub',
    tagline: '9 live models across vision & medical AI',
    features: ['Image classification', 'Medical imaging + heatmaps', 'Detection & pose'],
    bestFor: 'Exploring pre-trained AI models',
    path: '/deep-learning',
  },
]

export default function ModuleModal({ open, onClose }) {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const openerRef = useRef(null)

  // Callers pass an inline arrow, so `onClose` is a new reference every
  // render. Kept in a ref, the focus effect below can depend on `open`
  // alone — otherwise it re-ran constantly and re-captured the "opener"
  // as whatever was focused inside the dialog, breaking focus restore.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    openerRef.current = document.activeElement
    // Move focus in, keep Tab inside the dialog, restore focus on close —
    // aria-modal alone doesn't stop Tab from walking the page behind.
    closeRef.current?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = panelRef.current.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      // Focus outside the panel (e.g. parked on <body> after a backdrop
      // click) would otherwise Tab into the page that aria-modal claims
      // is inert.
      if (!panelRef.current.contains(document.activeElement)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
        return
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    lockScroll()
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockScroll()
      const opener = openerRef.current
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Select a module"
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(16px,3vw,32px)',
        background: 'rgba(4,5,9,0.72)', backdropFilter: 'blur(14px)',
        animation: 'lv2-fade-in .35s ease both',
      }}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 880, maxHeight: '90dvh', overflowY: 'auto',
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(9,11,18,0.92)', padding: 'clamp(24px,4vw,44px)',
          boxShadow: '0 60px 120px -40px rgba(0,0,0,0.8)',
          animation: 'lv2-pop-in .4s cubic-bezier(.2,.9,.3,1.2) both',
        }}
      >
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 18, right: 18, width: 38, height: 38,
            borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)', color: 'var(--lv2-ink-4)',
            fontSize: 16, cursor: 'pointer', lineHeight: 1,
          }}
        >
          ×
        </button>
        <div className="lv2-label" style={{ marginBottom: 14 }}>Choose a module</div>
        <h3 className="lv2-serif" style={{ fontWeight: 300, fontSize: 'clamp(1.6rem,3.2vw,2.4rem)', letterSpacing: '-0.02em' }}>
          Where do you want to <span className="lv2-gradient-text">begin?</span>
        </h3>
        <p style={{ color: 'var(--lv2-ink-3)', fontSize: 'var(--lv2-fs-4)', marginTop: 10 }}>
          Three modules, one workflow — clean, train, try.
        </p>
        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
            gap: 14, marginTop: 28,
          }}
        >
          {MODULES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onClose()
                navigate(m.path)
              }}
              className="lv2-modal-card"
              style={{
                textAlign: 'left', padding: '22px 20px', borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)', color: 'var(--lv2-ink)', cursor: 'pointer',
                transition: 'border-color .25s, background .25s, transform .25s',
              }}
            >
              <div aria-hidden="true" className="lv2-serif" style={{ fontWeight: 300, fontSize: '1.9rem', color: 'rgba(255,255,255,0.22)', lineHeight: 1 }}>
                {m.num}
              </div>
              <div className="lv2-serif" style={{ fontWeight: 400, fontSize: '1.15rem', marginTop: 12, letterSpacing: '-0.01em' }}>
                {m.title}
              </div>
              <div style={{ color: 'var(--lv2-accent-hi)', fontSize: 'var(--lv2-fs-2)', fontStyle: 'italic', marginTop: 5 }}>{m.tagline}</div>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {m.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 'var(--lv2-fs-3)', color: 'var(--lv2-ink-2)' }}>
                    <span style={{ color: 'var(--lv2-accent)' }}>—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 12, fontSize: 'var(--lv2-fs-1)', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--lv2-ink-4)' }}>
                Best for: <span style={{ color: 'var(--lv2-ink-3)' }}>{m.bestFor}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
