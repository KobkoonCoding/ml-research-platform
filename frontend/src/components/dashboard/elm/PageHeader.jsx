import React from 'react'
import { motion } from 'framer-motion'

/**
 * PageHeader — reusable page header for all dashboard pages.
 *
 * @param {string}   title        Page title
 * @param {string}   subtitle     Short description
 * @param {string}   accentColor  Hex color for gradient accent (default: module color)
 * @param {React.ReactNode} icon  Lucide icon component rendered before title
 * @param {React.ReactNode} illustration  Optional SVG illustration (right side)
 * @param {React.ReactNode} action  Optional action button (top-right)
 */
export default function PageHeader({ title, subtitle, accentColor = '#6366F1', icon, illustration, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ marginBottom: '1.5rem', position: 'relative' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>
          {/* Accent line */}
          <div style={{
            width: 40, height: 3, borderRadius: 2, marginBottom: '0.75rem',
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }} />

          <h2 style={{
            margin: 0, fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {icon && <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>{icon}</span>}
            {title}
          </h2>

          {subtitle && (
            <p style={{
              margin: '0.35rem 0 0', fontSize: '0.9rem', lineHeight: 1.5,
              color: 'var(--text-secondary)',
            }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Illustration (right side, hidden on small screens) */}
        {illustration && (
          <div style={{ flexShrink: 0, opacity: 0.7, display: 'none' }} className="md:!block">
            {illustration}
          </div>
        )}

        {/* Action button */}
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
    </motion.div>
  )
}
