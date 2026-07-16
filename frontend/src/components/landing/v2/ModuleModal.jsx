import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Module-selection modal ("Get Started" / "Initialize System").
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

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

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
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', maxWidth: 880, maxHeight: '90vh', overflowY: 'auto',
          borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(9,11,18,0.92)', padding: 'clamp(24px,4vw,44px)',
          boxShadow: '0 60px 120px -40px rgba(0,0,0,0.8)',
          animation: 'lv2-pop-in .4s cubic-bezier(.2,.9,.3,1.2) both',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 18, right: 18, width: 38, height: 38,
            borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)', color: '#8890a3',
            fontSize: 16, cursor: 'pointer', lineHeight: 1,
          }}
        >
          ×
        </button>
        <div className="lv2-label" style={{ marginBottom: 14 }}>Initialize</div>
        <h3 className="lv2-serif" style={{ fontWeight: 250, fontSize: 'clamp(1.6rem,3.2vw,2.4rem)', letterSpacing: '-0.02em' }}>
          Where do you want to <span className="lv2-gradient-text">begin?</span>
        </h3>
        <p style={{ color: '#aab3c5', fontSize: 14.5, marginTop: 10 }}>
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
                background: 'rgba(255,255,255,0.03)', color: '#eef1f8', cursor: 'pointer',
                transition: 'border-color .25s, background .25s, transform .25s',
              }}
            >
              <div className="lv2-serif" style={{ fontWeight: 300, fontSize: '1.9rem', color: 'rgba(255,255,255,0.22)', lineHeight: 1 }}>
                {m.num}
              </div>
              <div className="lv2-serif" style={{ fontWeight: 400, fontSize: '1.15rem', marginTop: 12, letterSpacing: '-0.01em' }}>
                {m.title}
              </div>
              <div style={{ color: '#8fb6ff', fontSize: 12.5, fontStyle: 'italic', marginTop: 5 }}>{m.tagline}</div>
              <ul style={{ listStyle: 'none', padding: 0, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {m.features.map((f) => (
                  <li key={f} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 13, color: '#c6cddc' }}>
                    <span style={{ color: '#6da8ff' }}>—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <div style={{ marginTop: 12, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#8890a3' }}>
                Best for: <span style={{ color: '#aab3c5' }}>{m.bestFor}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
