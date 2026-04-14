import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'
import ProbabilityGauge from './ProbabilityGauge'
import FeatureImportanceChart from './FeatureImportanceChart'

/**
 * Right-hand results panel for tabular predictions.
 *
 * Shows top prediction gauge / stacked bar, signed feature contributions,
 * and a short natural-language summary of the strongest drivers.
 */
export default function TabularResultsPanel({
  schema,
  result,
  isLoading,
  error,
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
        <div className="font-semibold text-red-400 mb-1">Prediction failed</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface/40 p-8 text-center">
        <Sparkles className="mx-auto w-8 h-8 text-muted-foreground mb-2" />
        <div className="text-sm text-muted-foreground">
          Adjust the inputs on the left — predictions update live.
        </div>
      </div>
    )
  }

  const classes = result.probabilities || {}
  const targetType = result.target_type || 'binary'
  const isBinary = targetType === 'binary'
  const positiveClass = schema?.positiveClass
  const positiveProb = positiveClass && classes[positiveClass] !== undefined
    ? classes[positiveClass]
    : result.confidence

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">Prediction</h3>
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        )}
      </div>

      {/* Gauge or stacked bar */}
      <motion.div
        key={result.prediction + ':' + result.confidence.toFixed(3)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-surface/60 p-4"
      >
        {isBinary ? (
          <ProbabilityGauge
            variant="gauge"
            value={positiveProb}
            label={schema?.gaugeLabel || 'Probability'}
            topClass={positiveClass || result.prediction}
          />
        ) : (
          <ProbabilityGauge
            variant="stacked"
            classes={classes}
            topClass={result.prediction}
            label={schema?.gaugeLabel}
          />
        )}
      </motion.div>

      {/* Feature importance */}
      <div className="rounded-xl border border-border bg-surface/60 p-4">
        <div className="flex items-baseline justify-between mb-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Top drivers
          </h4>
          <span className="text-[10px] text-muted-foreground">
            signed contribution per feature
          </span>
        </div>
        <FeatureImportanceChart items={result.feature_importance || []} />
        <DriverSummary items={result.feature_importance || []} />
      </div>

      <div className="text-[10px] text-muted-foreground text-center">
        Model: {result.model}
      </div>
    </div>
  )
}

function DriverSummary({ items }) {
  const top = [...items]
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
    .slice(0, 3)
  if (top.length === 0) return null
  return (
    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
      {top.map((d) => {
        const dir = d.contribution >= 0 ? 'raised' : 'lowered'
        const mag = Math.abs(d.contribution).toFixed(3)
        return (
          <li key={d.feature}>
            <span className="font-medium text-foreground">{d.feature}</span>
            {' = '}
            <span className="tabular-nums">{prettyValue(d.value)}</span>
            {' — '}
            {dir} the probability by <span className="tabular-nums">{mag}</span>
          </li>
        )
      })}
    </ul>
  )
}

function prettyValue(v) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') {
    if (Number.isInteger(v)) return String(v)
    return v.toFixed(2)
  }
  return String(v)
}
