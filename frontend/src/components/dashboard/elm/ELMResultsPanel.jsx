import React, { useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart3, Table2, TrendingUp, Info, Sparkles,
  AlertTriangle, CheckCircle2, ArrowRight, Loader2
} from 'lucide-react'

/* ── CDN Plotly helper ── */
function Plot({ id, data, layout, style }) {
  const ref = useRef()
  useEffect(() => {
    if (ref.current && window.Plotly) {
      const merged = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'rgba(0,0,0,0.15)',
        font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
        margin: { t: 40, r: 20, b: 40, l: 50 },
        xaxis: { gridcolor: 'var(--border-subtle)', zerolinecolor: 'var(--border-medium)' },
        yaxis: { gridcolor: 'var(--border-subtle)', zerolinecolor: 'var(--border-medium)' },
        ...layout,
      }
      window.Plotly.newPlot(ref.current, data, merged, { responsive: true, displayModeBar: false })
    }
    return () => { if (ref.current && window.Plotly) window.Plotly.purge(ref.current) }
  }, [data, layout])
  return <div ref={ref} id={id} style={{ width: '100%', ...style }} />
}

/* ── Metric descriptions ── */
const METRIC_INFO = {
  accuracy: 'Percentage of correct predictions out of all predictions made.',
  precision: 'Of all positive predictions, how many were actually correct. High = few false positives.',
  recall: 'Of all actual positives, how many were correctly found. High = few false negatives.',
  f1_score: 'Harmonic mean of Precision and Recall — balances both into one score.',
  roc_auc: 'Area under ROC curve. 1.0 = perfect classifier, 0.5 = random guessing.',
  r2: 'Proportion of variance explained. 1.0 = perfect fit, 0 = no better than mean.',
  rmse: 'Root Mean Squared Error — average prediction error in original units. Lower is better.',
  mae: 'Mean Absolute Error — average absolute difference between predictions and actuals.',
  mse: 'Mean Squared Error — penalizes large errors more heavily than MAE.',
}

/* ── MetricCard with tooltip ── */
function MetricCard({ label, value, metricKey, percent, raw, delay = 0 }) {
  if (value == null) return null
  const display = percent ? `${(value * 100).toFixed(2)}%` : value.toFixed(4)
  const info = METRIC_INFO[metricKey]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      style={{
        padding: '0.85rem 0.75rem', borderRadius: 10,
        background: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-subtle)',
        textAlign: 'center', position: 'relative', cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: '0.35rem' }}>
        <span style={{
          fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
          {label}
        </span>
        {info && (
          <span title={info} style={{ cursor: 'help', display: 'inline-flex' }}>
            <Info size={11} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          </span>
        )}
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {display}
      </div>
    </motion.div>
  )
}

/* ── InsightCard ── */
function InsightCard({ summary, problemType }) {
  const insight = useMemo(() => {
    if (!summary) return null
    const primary = problemType === 'classification'
      ? summary.accuracy?.mean
      : summary.r2?.mean
    if (primary == null) return null

    let level, color, bg, message
    if (problemType === 'classification') {
      if (primary >= 0.95) { level = 'Excellent'; color = '#34d399'; bg = 'rgba(16,185,129,0.08)' }
      else if (primary >= 0.85) { level = 'Good'; color = '#60a5fa'; bg = 'rgba(59,130,246,0.08)' }
      else if (primary >= 0.70) { level = 'Fair'; color = '#fbbf24'; bg = 'rgba(251,191,36,0.08)' }
      else { level = 'Needs Improvement'; color = '#f87171'; bg = 'rgba(248,113,113,0.08)' }
      message = `Model achieves ${(primary * 100).toFixed(1)}% accuracy.`
    } else {
      if (primary >= 0.90) { level = 'Excellent'; color = '#34d399'; bg = 'rgba(16,185,129,0.08)' }
      else if (primary >= 0.70) { level = 'Good'; color = '#60a5fa'; bg = 'rgba(59,130,246,0.08)' }
      else if (primary >= 0.50) { level = 'Fair'; color = '#fbbf24'; bg = 'rgba(251,191,36,0.08)' }
      else { level = 'Needs Improvement'; color = '#f87171'; bg = 'rgba(248,113,113,0.08)' }
      message = `Model explains ${(primary * 100).toFixed(1)}% of variance (R\u00B2).`
    }

    // Extra insights
    const extras = []
    if (problemType === 'classification' && summary.precision?.mean != null && summary.recall?.mean != null) {
      const diff = Math.abs(summary.precision.mean - summary.recall.mean)
      if (diff > 0.15) extras.push('Precision and Recall are imbalanced \u2014 consider class weighting.')
    }
    if (summary.accuracy?.std != null && summary.accuracy.std > 0.05) {
      extras.push('High variance across folds \u2014 model may be unstable.')
    }

    return { level, color, bg, message, extras }
  }, [summary, problemType])

  if (!insight) return null
  const Icon = insight.level === 'Excellent' || insight.level === 'Good' ? Sparkles : AlertTriangle

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      style={{
        padding: '0.85rem 1rem', borderRadius: 10,
        background: insight.bg,
        borderLeft: `3px solid ${insight.color}`,
        marginTop: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: insight.extras.length ? '0.4rem' : 0 }}>
        <Icon size={16} style={{ color: insight.color, flexShrink: 0 }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: insight.color }}>{insight.level}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{insight.message}</span>
      </div>
      {insight.extras.map((e, i) => (
        <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', paddingLeft: 24 }}>
          \u2022 {e}
        </div>
      ))}
    </motion.div>
  )
}

/* ── Table styles ── */
const thStyle = {
  padding: '0.6rem 0.75rem', fontSize: '0.75rem', fontWeight: 600,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: '1px solid var(--surface-border)', textAlign: 'left',
}
const tdStyle = {
  padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)',
}

/* ═══════════════════════════════════════════════════
   ELM RESULTS PANEL
   ═══════════════════════════════════════════════════ */
export default function ELMResultsPanel({ results, problemType, activeTab, setActiveTab, onFinalize, finalizing }) {
  const summary = results?.summary ?? {}
  const folds = results?.folds ?? []

  const metricOrder = problemType === 'classification'
    ? ['accuracy', 'f1_score', 'precision', 'recall', 'roc_auc']
    : ['r2', 'rmse', 'mae', 'mse']

  const metrics = metricOrder
    .filter(k => summary[k]?.mean != null)
    .map(k => ({
      key: k,
      label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: summary[k].mean,
      percent: problemType === 'classification' && !['roc_auc'].includes(k),
    }))

  const bestFold = folds.length > 0
    ? folds.reduce((prev, curr) => {
        const key = problemType === 'classification' ? 'f1_score' : 'r2'
        return (curr.metrics[key] ?? 0) > (prev.metrics[key] ?? 0) ? curr : prev
      })
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel"
      style={{ padding: '1.25rem' }}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', background: 'var(--bg-card-subtle)', borderRadius: 10, padding: 4, border: '1px solid var(--border-subtle)' }}>
        {[
          { id: 'summary', label: 'Summary', icon: BarChart3 },
          { id: 'charts', label: 'Charts', icon: TrendingUp },
          { id: 'folds', label: `Folds (${folds.length})`, icon: Table2 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none',
              background: activeTab === tab.id ? 'rgba(245,158,11,0.12)' : 'transparent',
              color: activeTab === tab.id ? '#f59e0b' : 'var(--text-muted)',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'all 0.2s',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Summary Tab ── */}
      {activeTab === 'summary' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.6rem' }}>
            {metrics.map((m, i) => (
              <MetricCard key={m.key} label={m.label} value={m.value} metricKey={m.key} percent={m.percent} delay={i * 0.06} />
            ))}
          </div>
          <InsightCard summary={summary} problemType={problemType} />
        </div>
      )}

      {/* ── Charts Tab ── */}
      {activeTab === 'charts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          {/* Performance boxplot */}
          {metrics.length > 0 && (
            <Plot
              id="elm-perf-box"
              data={metrics.map(m => ({
                y: folds.map(f => f.metrics[m.key]).filter(v => v != null),
                type: 'box', name: m.label,
                marker: { color: '#f59e0b' }, boxmean: 'sd',
              }))}
              layout={{ title: 'Metric Distribution', height: 300, showlegend: false }}
            />
          )}

          {/* Confusion matrix */}
          {bestFold?.confusion_matrix && (
            <Plot
              id="elm-cm"
              data={[{
                z: bestFold.confusion_matrix, type: 'heatmap',
                colorscale: [[0, '#1e293b'], [1, '#f59e0b']], showscale: true,
                text: bestFold.confusion_matrix.map(row => row.map(String)),
                texttemplate: '%{text}', hoverinfo: 'z',
              }]}
              layout={{
                title: `Confusion Matrix (Fold ${bestFold.fold})`,
                xaxis: { title: 'Predicted' }, yaxis: { title: 'Actual', autorange: 'reversed' },
                height: 300,
              }}
            />
          )}

          {/* ROC curve */}
          {bestFold?.curves?.roc && (
            <Plot
              id="elm-roc"
              data={[
                { x: bestFold.curves.roc.fpr, y: bestFold.curves.roc.tpr, type: 'scatter', mode: 'lines', name: 'ROC', line: { color: '#f59e0b', width: 2 } },
                { x: [0, 1], y: [0, 1], type: 'scatter', mode: 'lines', name: 'Random', line: { dash: 'dash', color: 'gray' } },
              ]}
              layout={{
                title: `ROC Curve (AUC: ${(summary.roc_auc?.mean ?? 0).toFixed(3)})`,
                xaxis: { title: 'FPR', range: [0, 1] }, yaxis: { title: 'TPR', range: [0, 1] },
                height: 300, showlegend: false,
              }}
            />
          )}

          {/* PR curve */}
          {bestFold?.curves?.pr && (
            <Plot
              id="elm-pr"
              data={[{
                x: bestFold.curves.pr.recall, y: bestFold.curves.pr.precision,
                type: 'scatter', mode: 'lines', name: 'PR', line: { color: '#f97316', width: 2 },
              }]}
              layout={{
                title: 'Precision-Recall Curve',
                xaxis: { title: 'Recall', range: [0, 1] }, yaxis: { title: 'Precision', range: [0, 1] },
                height: 300,
              }}
            />
          )}

          {folds.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No chart data available.</p>
          )}
        </div>
      )}

      {/* ── Folds Tab ── */}
      {activeTab === 'folds' && folds.length > 0 && (
        <div style={{ overflowX: 'auto', maxHeight: 420 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Fold</th>
                <th style={thStyle}>Train</th>
                <th style={thStyle}>Test</th>
                {metrics.map(m => <th key={m.key} style={thStyle}>{m.label}</th>)}
                <th style={thStyle}>Time</th>
              </tr>
            </thead>
            <tbody>
              {folds.map((f, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--bg-card-subtle)' }}>
                  <td style={tdStyle}>{f.repeat > 1 ? `R${f.repeat}-` : ''}F{f.fold}</td>
                  <td style={tdStyle}>{f.train_size}</td>
                  <td style={tdStyle}>{f.test_size}</td>
                  {metrics.map(m => (
                    <td key={m.key} style={{ ...tdStyle, fontWeight: 600 }}>
                      {f.metrics[m.key] != null
                        ? m.percent ? `${(f.metrics[m.key] * 100).toFixed(1)}%` : f.metrics[m.key].toFixed(4)
                        : '\u2014'}
                    </td>
                  ))}
                  <td style={{ ...tdStyle, color: 'var(--text-muted)' }}>{f.training_time?.toFixed(2)}s</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-card-subtle)', fontWeight: 700 }}>
                <td colSpan={3} style={tdStyle}>MEAN</td>
                {metrics.map(m => (
                  <td key={m.key} style={{ ...tdStyle, fontWeight: 700 }}>
                    {summary[m.key]?.mean != null
                      ? m.percent ? `${(summary[m.key].mean * 100).toFixed(1)}%` : summary[m.key].mean.toFixed(4)
                      : '\u2014'}
                  </td>
                ))}
                <td style={tdStyle}>\u2014</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Finalize button */}
      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onFinalize}
          disabled={finalizing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.7rem 1.4rem', borderRadius: 10,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#fff', border: 'none',
            fontSize: '0.88rem', fontWeight: 700,
            cursor: finalizing ? 'not-allowed' : 'pointer',
            opacity: finalizing ? 0.6 : 1,
            boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
            transition: 'all 0.2s',
          }}
        >
          {finalizing ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
          {finalizing ? 'Finalizing...' : 'Finalize & Predict'}
          <ArrowRight size={15} />
        </button>
      </div>
    </motion.div>
  )
}
