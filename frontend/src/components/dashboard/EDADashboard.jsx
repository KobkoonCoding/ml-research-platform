import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronRight, ArrowRight, Search, Table2, BarChart3, AlertTriangle, CheckCircle2, Target, Grid3x3, TrendingUp, PieChart } from 'lucide-react'
import PageHeader from './elm/PageHeader'
import { DataFlowSVG } from './elm/AnimatedSVGs'

/* ─── Plotly helper (loaded via CDN in index.html) ─── */
const Plot = ({ id, data, layout, style }) => {
  const ref = useRef()
  useEffect(() => {
    if (ref.current && window.Plotly) {
      const mergedLayout = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'rgba(0,0,0,0.15)',
        font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
        margin: { t: 30, r: 20, b: 40, l: 50 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)' },
        yaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)' },
        ...layout,
      }
      window.Plotly.newPlot(ref.current, data, mergedLayout, { responsive: true, displayModeBar: false })
    }
    return () => { if (ref.current && window.Plotly) window.Plotly.purge(ref.current) }
  }, [data, layout])
  return <div ref={ref} id={id} style={{ width: '100%', ...style }} />
}

/* ─── Collapsible Section ─── */
const Section = ({ title, icon: Icon, defaultOpen = false, badge, children }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass-panel" style={{
      padding: 0,
      overflow: 'hidden',
      marginBottom: '1rem',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 600,
          textAlign: 'left',
        }}
      >
        {Icon && <Icon style={{ width: 18, height: 18, color: 'var(--primary)', flexShrink: 0 }} />}
        <span style={{ flex: 1 }}>{title}</span>
        {badge && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 8px', borderRadius: 6,
            background: 'rgba(99,102,241,0.12)', color: '#a5b4fc',
            fontWeight: 500,
          }}>{badge}</span>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0.25rem 1.25rem 1.25rem' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Component ─── */
export default function EDADashboard({ analysis, targetColumn, onTargetChange, onStartPreprocessing }) {
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortCol, setSortCol] = useState(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedHistCol, setSelectedHistCol] = useState('')
  const [selectedBoxCol, setSelectedBoxCol] = useState('')
  const [selectedViolinCol, setSelectedViolinCol] = useState('')
  const [pairPlotCols, setPairPlotCols] = useState([])

  const a = analysis
  if (!a) return null

  const numericCols = a.column_types?.numeric || []
  const categoricalCols = a.column_types?.categorical || []

  useEffect(() => {
    if (numericCols.length > 0) {
      if (!selectedHistCol) setSelectedHistCol(numericCols[0])
      if (!selectedBoxCol) setSelectedBoxCol(numericCols[0])
      if (!selectedViolinCol) setSelectedViolinCol(numericCols[0])
      if (pairPlotCols.length === 0) setPairPlotCols(numericCols.slice(0, Math.min(4, numericCols.length)))
    }
  }, [numericCols])

  /* ─── Data Preview Logic ─── */
  let rows = a.preview_data || []
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    rows = rows.filter(row =>
      a.columns.some(col => {
        const val = row[col]
        return val !== null && String(val).toLowerCase().includes(term)
      })
    )
  }
  if (sortCol) {
    rows = [...rows].sort((ra, rb) => {
      const va = ra[sortCol], vb = rb[sortCol]
      if (va === null) return 1
      if (vb === null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return sortAsc ? va - vb : vb - va
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }
  const totalPages = Math.ceil(rows.length / pageSize)
  const pagedRows = rows.slice(page * pageSize, (page + 1) * pageSize)

  const handleSort = (col) => {
    if (sortCol === col) { setSortAsc(!sortAsc) } else { setSortCol(col); setSortAsc(true) }
    setPage(0)
  }

  const togglePairPlotCol = (col) => {
    if (pairPlotCols.includes(col)) {
      setPairPlotCols(pairPlotCols.filter(c => c !== col))
    } else {
      if (pairPlotCols.length < 5) setPairPlotCols([...pairPlotCols, col])
    }
  }

  const getTypeBadge = (col) => {
    if (numericCols.includes(col)) return <span className="col-type-badge badge-numeric">NUM</span>
    if (categoricalCols.includes(col)) return <span className="col-type-badge badge-categorical">CAT</span>
    if ((a.column_types?.datetime || []).includes(col)) return <span className="col-type-badge badge-datetime">DATE</span>
    if ((a.column_types?.boolean || []).includes(col)) return <span className="col-type-badge badge-boolean">BOOL</span>
    return <span className="col-type-badge badge-text">TXT</span>
  }

  /* ─── Render ─── */
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header + CTA */}
      <PageHeader
        title="Exploratory Analysis"
        subtitle="Visualize patterns, distributions, and data quality before preprocessing"
        accentColor="#6366F1"
        icon={<BarChart3 size={22} />}
        illustration={<DataFlowSVG size={100} />}
        action={
          <button
            onClick={onStartPreprocessing}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.25rem', borderRadius: 10,
              background: 'linear-gradient(135deg, var(--success), #059669)',
              color: '#fff', border: 'none', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            Start Preprocessing <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        }
      />

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="metrics-grid"
        style={{ marginBottom: '1.25rem' }}
      >
        <div className="metric-card"><div className="metric-value">{a.shape[0].toLocaleString()}</div><div className="metric-label">Rows</div></div>
        <div className="metric-card"><div className="metric-value">{a.shape[1]}</div><div className="metric-label">Columns</div></div>
        <div className="metric-card"><div className="metric-value">{numericCols.length}</div><div className="metric-label">Numeric</div></div>
        <div className="metric-card"><div className="metric-value">{categoricalCols.length}</div><div className="metric-label">Categorical</div></div>
        <div className="metric-card">
          <div className={`metric-value ${a.total_missing > 0 ? 'text-danger' : 'text-success'}`}>{a.total_missing_pct}%</div>
          <div className="metric-label">Missing</div>
        </div>
        <div className="metric-card">
          <div className={`metric-value ${a.duplicate_count > 0 ? 'text-warning' : 'text-success'}`}>{a.duplicate_count}</div>
          <div className="metric-label">Duplicates</div>
        </div>
        <div className="metric-card"><div className="metric-value" style={{fontSize:'1.05rem'}}>{a.memory_usage}</div><div className="metric-label">Memory</div></div>
      </motion.div>

      {/* Target Selector */}
      <div className="glass-panel" style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
      }}>
        <Target style={{ width: 16, height: 16, color: '#f59e0b', flexShrink: 0 }} />
        <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Target Column:</label>
        <select
          value={targetColumn}
          onChange={e => onTargetChange(e.target.value)}
          style={{
            flex: 1, maxWidth: 260,
            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-primary)', borderRadius: 8, padding: '0.4rem 0.6rem',
            fontSize: '0.85rem',
          }}
        >
          <option value="">-- None --</option>
          {a.columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>

      {/* ─── Collapsible Sections ─── */}

      {/* Data Quality */}
      {a.insights && a.insights.length > 0 && (
        <Section title="Data Quality Report" icon={AlertTriangle} badge={`${a.insights.length} issues`} defaultOpen={true}>
          <div className="insights-list">
            {a.insights.map((ins, idx) => (
              <div key={idx} className={`insight-item ${ins.type}`}>
                <span className="insight-icon">
                  {ins.type === 'danger' ? '🔴' : ins.type === 'warning' ? '🟡' : ins.type === 'success' ? '🟢' : '🔵'}
                </span>
                <div className="insight-content">
                  <div className="insight-title">{ins.title}</div>
                  <div className="insight-detail">{ins.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Data Preview */}
      <Section title="Data Preview" icon={Table2} badge={`${a.shape[0]} rows`} defaultOpen={false}>
        <div className="table-controls">
          <input
            className="table-search"
            type="text"
            placeholder="Search rows..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setPage(0) }}
          />
          <div className="pagination">
            <span className="text-muted">Rows/page:</span>
            <select
              style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: 4, padding: '0.3rem', fontFamily: 'var(--font-family)' }}
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
            >
              {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>Prev</button>
            <span>{page + 1} / {totalPages || 1}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>Next</button>
          </div>
        </div>

        <div className="table-wrapper">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th style={{width: 40, textAlign: 'center'}}>#</th>
                  {a.columns.map(col => (
                    <th key={col} onClick={() => handleSort(col)} style={{ cursor: 'pointer', minWidth: 100 }}>
                      {col} {getTypeBadge(col)}
                      {sortCol === col && (sortAsc ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, ri) => (
                  <tr key={ri}>
                    <td style={{textAlign:'center', color: 'var(--text-muted)', fontSize: '0.78rem'}}>{page * pageSize + ri + 1}</td>
                    {a.columns.map(col => {
                      const v = row[col]
                      const isMissing = v === null || v === undefined || v === 'None' || v === 'nan'
                      return (
                        <td key={col} className={isMissing ? 'cell-missing' : ''}>
                          {isMissing ? 'NaN' : String(v)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {pagedRows.length === 0 && (
                  <tr><td colSpan={a.columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No matching rows.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* Missing Values */}
      {a.total_missing > 0 && (
        <Section title="Missing Values Analysis" icon={AlertTriangle} badge={`${a.total_missing_pct}% missing`}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <Plot
              id="missing-chart"
              data={[{
                type: 'bar',
                x: a.columns.filter(c => a.missing_values[c] > 0),
                y: a.columns.filter(c => a.missing_values[c] > 0).map(c => a.missing_values[c]),
                marker: { color: '#ef4444', opacity: 0.8 },
                text: a.columns.filter(c => a.missing_values[c] > 0).map(c => `${a.missing_pct[c]}%`),
                textposition: 'outside',
              }]}
              layout={{ title: '', yaxis: { title: 'Count' }, height: 320 }}
            />
          </div>

          {a.missing_matrix && a.missing_matrix.length > 0 && (
            <div className="glass-panel" style={{ padding: '1rem', marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Missing Pattern Heatmap</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Red = Missing value (sampled up to 500 rows)</p>
              <Plot
                id="missing-heatmap"
                data={[{
                  type: 'heatmap',
                  z: a.missing_matrix,
                  x: a.missing_matrix_columns,
                  y: Array.from({length: a.missing_matrix.length}, (_, i) => `Row ${i}`),
                  colorscale: [[0, '#312e81'], [1, '#ef4444']],
                  showscale: false,
                  hoverongaps: false,
                }]}
                layout={{
                  height: 400,
                  xaxis: { tickangle: -45 },
                  yaxis: { showticklabels: false, title: 'Rows' },
                  margin: { b: 80, l: 50 },
                }}
              />
            </div>
          )}
        </Section>
      )}

      {/* Distributions - Histogram + Box + Violin */}
      {numericCols.length > 0 && (
        <Section title="Numeric Distributions" icon={BarChart3} badge={`${numericCols.length} features`}>
          {/* Histogram */}
          {a.histograms && (
            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>Histogram</h4>
                <select className="select-field" style={{ width: 200 }} value={selectedHistCol} onChange={e => setSelectedHistCol(e.target.value)}>
                  {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              {a.histograms[selectedHistCol] && (
                <Plot
                  id="histogram-chart"
                  data={[{
                    type: 'bar',
                    x: a.histograms[selectedHistCol].bin_edges.slice(0, -1).map((v, i) => {
                      const next = a.histograms[selectedHistCol].bin_edges[i + 1]
                      return ((v + next) / 2).toFixed(2)
                    }),
                    y: a.histograms[selectedHistCol].counts,
                    marker: { color: 'rgba(99, 102, 241, 0.7)', line: { color: 'rgba(99, 102, 241, 1)', width: 1 } },
                  }]}
                  layout={{ title: selectedHistCol, xaxis: { title: selectedHistCol }, yaxis: { title: 'Frequency' }, height: 350 }}
                />
              )}
            </div>
          )}

          {/* Box + Violin side by side */}
          {a.boxplots && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>Box Plot</h4>
                  <select className="select-field" style={{ width: 140 }} value={selectedBoxCol} onChange={e => setSelectedBoxCol(e.target.value)}>
                    {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                {a.boxplots[selectedBoxCol] && (
                  <Plot
                    id="boxplot-chart"
                    data={[{
                      type: 'box',
                      y: [
                        a.boxplots[selectedBoxCol].whisker_low,
                        a.boxplots[selectedBoxCol].q1,
                        a.boxplots[selectedBoxCol].median,
                        a.boxplots[selectedBoxCol].q3,
                        a.boxplots[selectedBoxCol].whisker_high,
                        ...a.boxplots[selectedBoxCol].outliers
                      ],
                      name: selectedBoxCol,
                      marker: { color: 'rgba(139, 92, 246, 0.7)' },
                      boxmean: true,
                    }]}
                    layout={{ title: '', yaxis: { title: selectedBoxCol }, height: 350, showlegend: false }}
                  />
                )}
              </div>

              <div className="glass-panel" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>Violin Plot</h4>
                  <select className="select-field" style={{ width: 140 }} value={selectedViolinCol} onChange={e => setSelectedViolinCol(e.target.value)}>
                    {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                {a.numeric_sample && a.numeric_sample[selectedViolinCol] ? (
                  <Plot
                    id="violin-chart"
                    data={[{
                      type: 'violin',
                      y: a.numeric_sample[selectedViolinCol].filter(v => v !== null),
                      name: selectedViolinCol,
                      box: { visible: true },
                      line: { color: '#ec4899' },
                      meanline: { visible: true },
                      fillcolor: 'rgba(236, 72, 153, 0.3)',
                      opacity: 0.8,
                      x0: selectedViolinCol
                    }]}
                    layout={{ title: '', yaxis: { title: selectedViolinCol }, height: 350, showlegend: false }}
                  />
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Reload dataset to access V2 Data Sample.</div>
                )}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* Pair Plots */}
      {numericCols.length >= 2 && a.numeric_sample && (
        <Section title="Pair Plots / Scatter Matrix" icon={Grid3x3} badge={`${pairPlotCols.length} selected`}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Select up to 5 numeric features to visualize relationships</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
            {numericCols.map(col => (
              <button
                key={col}
                onClick={() => togglePairPlotCol(col)}
                style={{
                  padding: '4px 10px', borderRadius: 8, border: '1px solid',
                  borderColor: pairPlotCols.includes(col) ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  background: pairPlotCols.includes(col) ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: pairPlotCols.includes(col) ? '#a5b4fc' : 'var(--text-muted)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
              >
                {col}
              </button>
            ))}
          </div>

          {pairPlotCols.length >= 2 ? (
            <div className="glass-panel" style={{ padding: '1rem' }}>
              <Plot
                id="splom-chart"
                data={[{
                  type: 'splom',
                  dimensions: pairPlotCols.map(col => ({ label: col, values: a.numeric_sample[col] })),
                  marker: { color: 'rgba(59, 130, 246, 0.5)', size: 5, line: { color: 'rgba(255, 255, 255, 0.5)', width: 0.5 } },
                  diagonal: { visible: false }
                }]}
                layout={{
                  height: Math.max(400, pairPlotCols.length * 120),
                  dragmode: 'select', hovermode: 'closest',
                  margin: { l: 60, r: 20, t: 30, b: 60 }
                }}
              />
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Select at least 2 columns to render the scatter matrix.
            </div>
          )}
        </Section>
      )}

      {/* Correlation Heatmap */}
      {a.correlation && a.correlation.columns && a.correlation.columns.length >= 2 && (
        <Section title="Correlation Heatmap" icon={TrendingUp} badge={`${a.correlation.columns.length}x${a.correlation.columns.length}`}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <Plot
              id="corr-heatmap"
              data={[{
                type: 'heatmap',
                z: a.correlation.values,
                x: a.correlation.columns,
                y: a.correlation.columns,
                colorscale: [[0, '#312e81'], [0.25, '#4338ca'], [0.5, '#f8fafc'], [0.75, '#be185d'], [1, '#831843']],
                zmin: -1, zmax: 1,
                text: a.correlation.values.map(row => row.map(v => v.toFixed(2))),
                texttemplate: '%{text}',
                textfont: { size: 10 },
                hoverongaps: false,
              }]}
              layout={{
                height: Math.max(350, a.correlation.columns.length * 35),
                xaxis: { tickangle: -45 },
                margin: { b: 80, l: 80 },
              }}
            />
          </div>
        </Section>
      )}

      {/* Categorical Distributions */}
      {a.distributions && Object.keys(a.distributions).length > 0 && (
        <Section title="Category Distributions" icon={PieChart} badge={`${Object.keys(a.distributions).length} features`}>
          <div className="charts-grid">
            {Object.entries(a.distributions).map(([colName, distData]) => (
              <div key={colName} className="chart-card">
                <div className="chart-card-title">{colName}</div>
                <Plot
                  id={`dist-${colName}`}
                  data={[{
                    type: 'bar',
                    x: distData.map(d => d.name),
                    y: distData.map(d => d.count),
                    marker: {
                      color: distData.map((_, i) => {
                        const colors = ['#6366f1','#ec4899','#8b5cf6','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4']
                        return colors[i % colors.length]
                      }),
                      opacity: 0.85,
                    },
                    text: distData.map(d => d.count),
                    textposition: 'outside',
                  }]}
                  layout={{
                    height: 320,
                    margin: { t: 40, b: 60, l: 50, r: 15 },
                    xaxis: { tickangle: -30 },
                    yaxis: { title: 'Count' },
                  }}
                  style={{ minHeight: 320 }}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Target Distribution */}
      {targetColumn && a.distributions && a.distributions[targetColumn] && (
        <Section title={`Target: ${targetColumn}`} icon={Target} defaultOpen={true}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <Plot
              id="target-dist"
              data={[{
                type: 'pie',
                labels: a.distributions[targetColumn].map(d => d.name),
                values: a.distributions[targetColumn].map(d => d.count),
                hole: 0.45,
                marker: { colors: ['#6366f1','#ec4899','#8b5cf6','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4'] },
                textinfo: 'label+percent',
                textposition: 'outside',
              }]}
              layout={{ height: 380, showlegend: true, legend: { font: { color: '#94a3b8' } } }}
            />
          </div>
        </Section>
      )}

      {/* Bottom CTA */}
      <div className="glass-panel" style={{
        marginTop: '1.5rem', padding: '1.5rem',
        textAlign: 'center',
        borderColor: 'rgba(16,185,129,0.15)',
      }}>
        <h3 style={{ marginBottom: '0.4rem', fontSize: '1.1rem' }}>Ready to clean your data?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>
          Handle missing values, outliers, encoding, and more in the preprocessing workspace.
        </p>
        <button
          onClick={onStartPreprocessing}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.75rem 2rem', borderRadius: 10,
            background: 'linear-gradient(135deg, var(--success), #059669)',
            color: '#fff', border: 'none', fontSize: '0.95rem', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Start Preprocessing <ArrowRight style={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  )
}
