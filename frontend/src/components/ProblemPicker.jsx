import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Sparkles } from 'lucide-react'
import { fadeUp } from '../lib/problemConfigs'

const ACCENT = {
  primary: {
    selectedBorder: 'border-primary/50',
    selectedBg: 'bg-primary/5',
    iconBg: 'bg-primary/10',
    iconText: 'text-primary',
    ring: 'ring-primary/20',
  },
  error: {
    selectedBorder: 'border-error/50',
    selectedBg: 'bg-error/5',
    iconBg: 'bg-error/10',
    iconText: 'text-error',
    ring: 'ring-error/20',
  },
  success: {
    selectedBorder: 'border-success/50',
    selectedBg: 'bg-success/5',
    iconBg: 'bg-success/10',
    iconText: 'text-success',
    ring: 'ring-success/20',
  },
  warning: {
    selectedBorder: 'border-warning/50',
    selectedBg: 'bg-warning/5',
    iconBg: 'bg-warning/10',
    iconText: 'text-warning',
    ring: 'ring-warning/20',
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

          return (
            <motion.button
              key={problem.id}
              onClick={() => onSelect(problem.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`glass-card rounded-2xl p-5 border text-left transition-all duration-200 ${
                isSelected
                  ? `${colors.selectedBorder} ${colors.selectedBg} ring-2 ${colors.ring}`
                  : 'border-border hover:border-border-subtle'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${isSelected ? colors.iconBg : 'bg-border/30'}`}>
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
              <h4 className="font-black text-text-primary text-sm mb-1">{problem.label}</h4>
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
