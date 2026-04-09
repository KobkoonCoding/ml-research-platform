import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart2, Target, AlertTriangle, CheckCircle, Info, Hash,
  AlignLeft, ArrowUpDown, ChevronLeft, ChevronRight, Settings2, ShieldAlert
} from 'lucide-react'
import classNames from 'classnames'

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
  return <div ref={ref} id={id} className="w-full" style={style} />
}

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
  }, [numericCols, selectedHistCol, selectedBoxCol, selectedViolinCol, pairPlotCols])

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
    if (numericCols.includes(col)) return <span className="ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/20 text-primary-hover">NUM</span>
    if (categoricalCols.includes(col)) return <span className="ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-secondary/20 text-[#f9a8d4]">CAT</span>
    if ((a.column_types?.datetime || []).includes(col)) return <span className="ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning/20 text-warning">DATE</span>
    if ((a.column_types?.boolean || []).includes(col)) return <span className="ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-success/20 text-success">BOOL</span>
    return <span className="ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-text-muted/20 text-text-muted">TXT</span>
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          {/* Summary Cards */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
              <BarChart2 className="w-6 h-6 text-primary" /> Dataset Overview
            </h2>
            <p className="text-text-muted text-sm mb-6">High-level statistics and metadata of the uploaded dataset.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface-card border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors">
                <div className="text-3xl font-bold text-primary mb-1">{a.shape[0].toLocaleString()}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">Rows</div>
              </div>
              <div className="bg-surface-card border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors">
                <div className="text-3xl font-bold text-primary mb-1">{a.shape[1]}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">Columns</div>
              </div>
              <div className="bg-surface-card border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors">
                <div className="text-3xl font-bold text-primary mb-1">{numericCols.length}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">Numeric</div>
              </div>
              <div className="bg-surface-card border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors">
                <div className="text-3xl font-bold text-primary mb-1">{categoricalCols.length}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">Categorical</div>
              </div>
              <div className="bg-surface-card border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors">
                <div className={classNames("text-3xl font-bold mb-1", a.total_missing > 0 ? "text-error" : "text-success")}>
                  {a.total_missing_pct}%
                </div>
                <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">Missing Rate</div>
              </div>
              <div className="bg-surface-card border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors">
                <div className={classNames("text-3xl font-bold mb-1", a.duplicate_count > 0 ? "text-warning" : "text-success")}>
                  {a.duplicate_count}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">Duplicates</div>
              </div>
              <div className="bg-surface-card border border-white/5 rounded-xl p-4 text-center hover:border-white/10 transition-colors col-span-2">
                <div className="text-2xl font-bold text-text-primary mb-1 mt-1">{a.memory_usage}</div>
                <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">Memory Usage</div>
              </div>
            </div>
          </section>

          {/* Data Quality Report */}
          {a.insights && a.insights.length > 0 && (
            <section className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <ShieldAlert className="w-6 h-6 text-warning" /> Data Quality Issues
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Auto-diagnosed problems that might negatively impact Machine Learning model performance. 
                These should be addressed in the Preprocessing step.
              </p>
              <div className="space-y-3">
                {a.insights.map((ins, idx) => {
                  let Icon = Info;
                  let bgClass = "bg-info/10 border-info/30";
                  let iconColor = "text-info";
                  if (ins.type === 'danger') { Icon = AlertTriangle; bgClass = "bg-error/10 border-error/30"; iconColor = "text-error"; }
                  else if (ins.type === 'warning') { Icon = AlertTriangle; bgClass = "bg-warning/10 border-warning/30"; iconColor = "text-warning"; }
                  else if (ins.type === 'success') { Icon = CheckCircle; bgClass = "bg-success/10 border-success/30"; iconColor = "text-success"; }

                  return (
                    <div key={idx} className={`flex items-start gap-4 p-4 rounded-xl border ${bgClass}`}>
                      <Icon className={`w-6 h-6 mt-0.5 flex-shrink-0 ${iconColor}`} />
                      <div>
                        <div className="font-semibold text-text-primary">{ins.title}</div>
                        <div className="text-sm text-text-muted mt-1">{ins.detail}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Data Table */}
          <section className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
              <AlignLeft className="w-6 h-6 text-primary" /> Data Preview
            </h2>
            <p className="text-text-muted text-sm mb-6">
              Interactive view of your raw rows and columns. Click on headers to sort the table.
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
              <input
                className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 w-full sm:w-64 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none text-text-primary"
                type="text"
                placeholder="Search values..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setPage(0) }}
              />
              <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-lg border border-white/10">
                <span className="text-xs text-text-muted">Rows/page:</span>
                <select
                  className="bg-transparent text-sm text-text-primary outline-none"
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
                >
                  {[10,25,50,100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <div className="h-4 w-px bg-white/20" />
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="text-text-muted hover:text-primary disabled:opacity-30">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-medium text-text-primary whitespace-nowrap">
                  {page + 1} / {totalPages || 1}
                </span>
                <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="text-text-muted hover:text-primary disabled:opacity-30">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden border border-white/10 rounded-xl">
              <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-text-muted uppercase bg-surface-card sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-center border-b border-white/10">#</th>
                      {a.columns.map(col => (
                        <th 
                          key={col} 
                          onClick={() => handleSort(col)} 
                          className="px-4 py-3 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-center gap-1">
                            {col} {getTypeBadge(col)}
                            {sortCol === col ? (
                              <ArrowUpDown className={`w-3 h-3 ${sortAsc ? 'text-primary' : 'text-primary rotate-180'}`} />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pagedRows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-2 text-center text-text-muted text-xs bg-black/10">
                          {page * pageSize + ri + 1}
                        </td>
                        {a.columns.map(col => {
                          const v = row[col]
                          const isMissing = v === null || v === undefined || v === 'None' || v === 'nan'
                          return (
                            <td key={col} className={classNames("px-4 py-2", isMissing ? "text-error italic opacity-70" : "text-text-primary")}>
                              {isMissing ? 'NaN' : String(v)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                    {pagedRows.length === 0 && (
                      <tr>
                        <td colSpan={a.columns.length + 1} className="px-4 py-8 text-center text-text-muted">
                          No matching rows found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Missing Patterns */}
          {a.total_missing > 0 && (
            <section className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <AlertTriangle className="w-6 h-6 text-error" /> Missing Values Analysis
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Understand the extent and pattern of missing data to decide on the best imputation strategy.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-card border border-white/5 rounded-xl p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-4">By Column</h3>
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
                    layout={{ height: 320, margin: { t: 10, r: 10 } }}
                  />
                </div>
                
                {a.missing_matrix && a.missing_matrix.length > 0 && (
                  <div className="bg-surface-card border border-white/5 rounded-xl p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary mb-2">Matrix Heatmap</h3>
                    <p className="text-xs text-text-muted mb-2">Visualizing where missing values occur across rows (Red = Missing). Helps identify if data is missing randomly or systematically.</p>
                    <Plot
                      id="missing-heatmap"
                      data={[{
                        type: 'heatmap',
                        z: a.missing_matrix,
                        x: a.missing_matrix_columns,
                        y: Array.from({length: a.missing_matrix.length}, (_, i) => `Row ${i}`),
                        colorscale: [[0, '#1E293B'], [1, '#ef4444']],
                        showscale: false, hoverongaps: false
                      }]}
                      layout={{ height: 320, xaxis: { tickangle: -45 }, yaxis: { showticklabels: false }, margin: { b: 60, l: 10, t: 10, r: 10 } }}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Numerical Distributions */}
          {numericCols.length > 0 && (
            <section className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <BarChart2 className="w-6 h-6 text-accent" /> Numerical Distributions
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Analyze the spread, skewness, and outliers of your continuous numerical variables.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Histogram */}
                {a.histograms && (
                  <div className="bg-surface-card border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Histogram</h3>
                        <p className="text-xs text-text-muted mt-1">Shows the frequency distribution of continuous values.</p>
                      </div>
                      <select
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none w-32 focus:border-primary"
                        value={selectedHistCol}
                        onChange={e => setSelectedHistCol(e.target.value)}
                      >
                        {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                    </div>
                    {a.histograms[selectedHistCol] && (
                      <Plot
                        id="histogram-chart"
                        data={[{
                          type: 'bar',
                          x: a.histograms[selectedHistCol].bin_edges.slice(0, -1).map((v, i) => ((v + a.histograms[selectedHistCol].bin_edges[i+1]) / 2).toFixed(2)),
                          y: a.histograms[selectedHistCol].counts,
                          marker: { color: 'rgba(99, 102, 241, 0.7)', line: { color: '#6366F1', width: 1 } },
                        }]}
                        layout={{ height: 300, margin: { t: 10, r: 10 } }}
                      />
                    )}
                  </div>
                )}

                {/* Box Plot */}
                {a.boxplots && (
                  <div className="bg-surface-card border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Box Plot</h3>
                        <p className="text-xs text-text-muted mt-1">Excellent for spotting statistical outliers (dots) beyond the IQR.</p>
                      </div>
                      <select
                        className="bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none w-32 focus:border-primary"
                        value={selectedBoxCol}
                        onChange={e => setSelectedBoxCol(e.target.value)}
                      >
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
                        layout={{ height: 300, showlegend: false, margin: { t: 10, r: 10 } }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Pair Plots / Splom */}
              {numericCols.length >= 2 && a.numeric_sample && (
                <div className="bg-surface-card border border-white/5 rounded-xl p-4 text-white">
                  <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Scatter Matrix / Pair Plots</h3>
                      <p className="text-xs text-text-muted mt-1">Examine pairwise linear and non-linear correlations visually.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {numericCols.map(col => (
                        <button
                          key={col}
                          onClick={() => togglePairPlotCol(col)}
                          className={classNames(
                            "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                            pairPlotCols.includes(col) ? "bg-primary border-primary text-white" : "border-white/20 text-text-muted hover:border-text-muted"
                          )}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {pairPlotCols.length >= 2 ? (
                    <Plot
                      id="splom-chart"
                      data={[{
                        type: 'splom',
                        dimensions: pairPlotCols.map(col => ({ label: col, values: a.numeric_sample[col] })),
                        marker: { color: 'rgba(59, 130, 246, 0.5)', size: 4, line: { color: 'rgba(255, 255, 255, 0.2)', width: 0.5 } },
                        diagonal: { visible: false }
                      }]}
                      layout={{ height: Math.max(400, pairPlotCols.length * 100), dragmode: 'select', hovermode: 'closest', margin: { l: 40, r: 10, t: 10, b: 40 } }}
                    />
                  ) : (
                    <div className="py-12 text-center text-text-muted border border-dashed border-white/10 rounded-lg">
                      Please select at least 2 numerical columns to render the Pair Plot matrix.
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Correlation Heatmap */}
          {a.correlation && a.correlation.columns && a.correlation.columns.length >= 2 && (
            <section className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <Hash className="w-6 h-6 text-warning" /> Feature Correlations (Pearson)
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Understand linear relationships between variables. Values closer to 1 or -1 indicate strong correlation. 
                Highly correlated features may cause multicollinearity issues in some ML models.
              </p>
              <div className="bg-surface-card border border-white/5 rounded-xl p-4">
                <Plot
                  id="corr-heatmap"
                  data={[{
                    type: 'heatmap',
                    z: a.correlation.values,
                    x: a.correlation.columns,
                    y: a.correlation.columns,
                    colorscale: [[0, '#0F172A'], [0.5, '#6366F1'], [1, '#EC4899']],
                    zmin: -1, zmax: 1,
                    text: a.correlation.values.map(row => row.map(v => v.toFixed(2))),
                    texttemplate: '%{text}',
                    textfont: { size: 10, color: 'white' },
                    hoverongaps: false,
                  }]}
                  layout={{ height: Math.max(400, a.correlation.columns.length * 40), xaxis: { tickangle: -45 }, margin: { b: 80, l: 100, t: 10, r: 10 } }}
                />
              </div>
            </section>
          )}
          
          {/* Categorical Distributions */}
          {a.distributions && Object.keys(a.distributions).length > 0 && (
            <section className="glass-panel p-6 rounded-2xl">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <BarChart2 className="w-6 h-6 text-secondary" /> Category Distributions
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Frequency counts for discrete/categorical columns with less than 30 unique values.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(a.distributions).map(([colName, distData]) => {
                  if (colName === targetColumn) return null; // Skip target column here to show it specially
                  return (
                    <div key={colName} className="bg-surface-card border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                      <div className="text-sm font-semibold text-text-secondary truncate mb-2" title={colName}>{colName}</div>
                      <Plot
                        id={`dist-${colName}`}
                        data={[{
                          type: 'bar',
                          x: distData.map(d => d.name),
                          y: distData.map(d => d.count),
                          marker: {
                            color: distData.map((_, i) => ['#6366f1','#ec4899','#8b5cf6','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4'][i % 8]),
                            opacity: 0.85,
                          },
                          text: distData.map(d => d.count),
                          textposition: 'outside',
                        }]}
                        layout={{ height: 220, margin: { t: 10, b: 40, l: 30, r: 10 }, xaxis: { tickangle: -30, showgrid: false } }}
                      />
                    </div>
                  )
                })}
              </div>
            </section>
          )}

        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-2xl top-6 sticky">
            <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary mb-2">
              <Target className="w-5 h-5 text-primary" /> Target Selection
            </h3>
            <p className="text-xs text-text-muted mb-4 leading-relaxed">
              Designate a feature as your target variable (Dependent Variable Y) to prepare for model training.
            </p>
            <select 
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text-primary mb-6"
              value={targetColumn} 
              onChange={e => onTargetChange(e.target.value)}
            >
              <option value="">— Unsupervised / None —</option>
              {a.columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>

            {targetColumn && a.distributions && a.distributions[targetColumn] && (
              <div className="mb-6 bg-surface-card rounded-xl border border-white/5 p-4">
                <div className="text-xs font-bold uppercase text-text-secondary tracking-wider mb-2">Target Balance</div>
                <Plot
                  id="target-dist-side"
                  data={[{
                    type: 'pie',
                    labels: a.distributions[targetColumn].map(d => d.name),
                    values: a.distributions[targetColumn].map(d => d.count),
                    hole: 0.5,
                    marker: { colors: ['#6366f1','#ec4899','#8b5cf6','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4'] },
                    textinfo: 'percent',
                    textfont: { size: 10, color: 'white' }
                  }]}
                  layout={{ height: 200, margin: { t: 10, b: 10, l: 10, r: 10 }, showlegend: true, legend: { orientation: 'h', y: -0.1 } }}
                />
                <p className="text-[10px] text-text-muted mt-2 text-center">
                  Highly imbalanced targets might require specialized handling to prevent biased predictions.
                </p>
              </div>
            )}

            <div className="pt-6 border-t border-white/10">
              <h3 className="text-sm font-semibold mb-2">Ready to clean data?</h3>
              <p className="text-xs text-text-muted mb-4">
                Now that you've explored the data, proceed to Preprocessing to handle missing values and outliers.
              </p>
              <button 
                className="w-full bg-gradient-to-r from-success to-emerald-600 hover:shadow-lg hover:shadow-success/30 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                onClick={onStartPreprocessing}
              >
                Start Preprocessing <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
