import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Sparkles, Check } from 'lucide-react'
import { fadeUp } from '../lib/problemConfigs'

// Accent-aware Tailwind class sets. Uses solid colors for selected state and
// branded hover glow for hinting clickability.
const ACCENT = {
  primary: {
    selectedBorder: 'border-primary',
    selectedBg: 'bg-primary/10',
    hoverBorder: 'hover:border-primary/60',
    hoverShadow: 'hover:shadow-[0_0_0_1px_rgba(99,102,241,0.3),0_8px_24px_-8px_rgba(99,102,241,0.4)]',
    iconBg: 'bg-primary/20',
    iconText: 'text-primary',
    ring: 'ring-primary/40',
    checkBg: 'bg-primary',
  },
  error: {
    selectedBorder: 'border-error',
    selectedBg: 'bg-error/10',
    hoverBorder: 'hover:border-error/60',
    hoverShadow: 'hover:shadow-[0_0_0_1px_rgba(239,68,68,0.3),0_8px_24px_-8px_rgba(239,68,68,0.4)]',
    iconBg: 'bg-error/20',
    iconText: 'text-error',
    ring: 'ring-error/40',
    checkBg: 'bg-error',
  },
  success: {
    selectedBorder: 'border-success',
    selectedBg: 'bg-success/10',
    hoverBorder: 'hover:border-success/60',
    hoverShadow: 'hover:shadow-[0_0_0_1px_rgba(16,185,129,0.3),0_8px_24px_-8px_rgba(16,185,129,0.4)]',
    iconBg: 'bg-success/20',
    iconText: 'text-success',
    ring: 'ring-success/40',
    checkBg: 'bg-success',
  },
  warning: {
    selectedBorder: 'border-warning',
    selectedBg: 'bg-warning/10',
    hoverBorder: 'hover:border-warning/60',
    hoverShadow: 'hover:shadow-[0_0_0_1px_rgba(245,158,11,0.3),0_8px_24px_-8px_rgba(245,158,11,0.4)]',
    iconBg: 'bg-warning/20',
    iconText: 'text-warning',
    ring: 'ring-warning/40',
    checkBg: 'bg-warning',
  },
}

export default function ProblemPicker({ problems, selectedId, onSelect, accentColor = 'primary' }) {
  const colors = ACCENT[accentColor] || ACCENT.primary

  return (
    <motion.div variants={fadeUp}>
      <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Select a Problem</p>
      <div className={`grid gap-4 ${problems.length <= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {problems.map((problem) => {
          const Icon = problem.icon
          const isSelected = selectedId === problem.id
          const isLive = problem.status === 'live'
          const isComingSoon = !isLive

          return (
            <motion.button
              key={problem.id}
              onClick={() => !isComingSoon && onSelect(problem.id)}
              whileHover={!isComingSoon ? { scale: 1.03, y: -2 } : undefined}
              whileTap={!isComingSoon ? { scale: 0.97 } : undefined}
              disabled={isComingSoon}
              aria-pressed={isSelected}
              className={`relative glass-card rounded-2xl p-5 border-2 text-left transition-all duration-200 ${
                isComingSoon
                  ? 'border-border opacity-60 cursor-not-allowed'
                  : 'cursor-pointer'
              } ${
                isSelected
                  ? `${colors.selectedBorder} ${colors.selectedBg} ring-2 ${colors.ring} shadow-lg`
                  : isComingSoon
                    ? ''
                    : `border-border ${colors.hoverBorder} ${colors.hoverShadow}`
              }`}
            >
              {/* Selected indicator — floating check badge top-right */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${colors.checkBg} flex items-center justify-center shadow-lg ring-2 ring-surface`}
                  aria-hidden="true"
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </motion.div>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl transition-colors ${isSelected ? colors.iconBg : 'bg-border/30'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? colors.iconText : 'text-text-muted'}`} />
                </div>
                {isLive ? (
                  <span className="px-2 py-1 rounded-full bg-success/10 text-success text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Live
                  </span>
                ) : (
                  <span className="badge-coming-soon flex items-center gap-1 !text-[9px] !px-2 !py-1">
                    <Sparkles className="w-2.5 h-2.5" /> Soon
                  </span>
                )}
              </div>
              <h4 className={`font-black text-sm mb-1 ${isSelected ? colors.iconText : 'text-text-primary'}`}>
                {problem.label}
              </h4>
              <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{problem.description}</p>
              {problem.note && isSelected && (
                <p className="text-[10px] text-text-muted mt-2 italic">{problem.note}</p>
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
