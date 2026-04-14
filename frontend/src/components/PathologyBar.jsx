import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Info } from 'lucide-react'
import { getPathology, getScoreBand } from '../lib/pathologyGlossary'

/**
 * Single pathology row with color-coded bar, score band, and expandable explanation.
 *
 * Replaces the previous "flat percentage" bars that misled users into thinking
 * torchxrayvision sigmoid outputs were direct probabilities.
 */
export default function PathologyBar({ name, score, rank }) {
  const [expanded, setExpanded] = useState(false)
  const info = getPathology(name)
  const band = getScoreBand(score)
  const pct = (score * 100).toFixed(1)

  return (
    <div className="rounded-xl bg-border/10 border border-border overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-border/20 transition-colors text-left"
      >
        {/* Rank */}
        {rank != null && (
          <span className="text-[10px] font-black text-text-muted w-5 text-center">#{rank}</span>
        )}

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[12px] font-bold text-text-primary truncate">
              {info.display}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md"
                style={{ color: band.color, background: `${band.color}18` }}
              >
                {band.label}
              </span>
              <span className="text-[11px] font-black" style={{ color: band.color }}>
                {pct}%
              </span>
            </div>
          </div>

          {/* Bar */}
          <div className="relative w-full h-1.5 bg-border/40 rounded-full overflow-hidden">
            {/* Baseline marker at 0.55 */}
            <div
              className="absolute top-0 bottom-0 w-px bg-text-muted/40"
              style={{ left: '55%' }}
              title="Baseline threshold"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score * 100}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: band.color }}
            />
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-text-muted transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded explanation */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-text-secondary mb-1">{info.short}</p>
                  <p className="text-[10px] text-text-muted leading-relaxed">{info.detail}</p>
                </div>
              </div>
              <div
                className="text-[10px] italic px-2 py-1 rounded-md"
                style={{ background: `${band.color}10`, color: band.color }}
              >
                {band.description}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
