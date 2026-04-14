import React, { useMemo } from 'react'
import Plot from 'react-plotly.js'

/**
 * Horizontal Plotly bar chart of signed feature contributions.
 * Red = pushed prediction down, green = pushed prediction up.
 */
export default function FeatureImportanceChart({ items = [], isDark = true }) {
  const sorted = useMemo(() => {
    return [...items]
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 10)
      .reverse() // Plotly barh renders bottom-to-top
  }, [items])

  if (sorted.length === 0) return null

  const y = sorted.map((d) => d.feature)
  const x = sorted.map((d) => d.contribution)
  const colors = sorted.map((d) => (d.contribution >= 0 ? '#22c55e' : '#ef4444'))
  const labels = sorted.map(
    (d) => `${prettyValue(d.value)}  ·  ${d.contribution >= 0 ? '+' : ''}${d.contribution.toFixed(3)}`
  )

  const font = { color: isDark ? '#e2e8f0' : '#1e293b', size: 11 }
  const absMax = Math.max(...x.map(Math.abs), 0.01)

  return (
    <div className="w-full">
      <Plot
        data={[
          {
            type: 'bar',
            orientation: 'h',
            x,
            y,
            text: labels,
            textposition: 'outside',
            marker: { color: colors },
            hovertemplate: '<b>%{y}</b><br>contribution: %{x:.3f}<extra></extra>',
            cliponaxis: false,
          },
        ]}
        layout={{
          autosize: true,
          height: 320,
          margin: { l: 100, r: 80, t: 10, b: 30 },
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font,
          xaxis: {
            zeroline: true,
            zerolinecolor: 'rgba(148,163,184,0.3)',
            gridcolor: 'rgba(148,163,184,0.12)',
            range: [-absMax * 1.3, absMax * 1.6],
            title: { text: 'Signed contribution', font: { ...font, size: 10 } },
          },
          yaxis: { gridcolor: 'rgba(0,0,0,0)' },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
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
