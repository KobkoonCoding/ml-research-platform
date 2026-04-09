import React from 'react'
import Plot from 'react-plotly.js'

export default function ReportView({ originalAnalysis, currentAnalysis, pipeline }) {
  if (!originalAnalysis || !currentAnalysis) return null

  const o = originalAnalysis
  const c = currentAnalysis

  const printDate = new Date().toLocaleString()

  // 3. Initial Data Quality Warnings
  const renderInitialWarnings = () => {
    if (!o.insights || o.insights.length === 0) return <p>No major issues detected originally.</p>
    return (
      <ul style={{ paddingLeft: '20px' }}>
        {o.insights.map((ins, idx) => (
          <li key={idx} style={{ marginBottom: '0.5rem' }}>
            <strong style={{ color: ins.type === 'danger' ? '#ef4444' : ins.type === 'warning' ? '#f59e0b' : '#3b82f6' }}>{ins.title}:</strong> {ins.detail}
          </li>
        ))}
      </ul>
    )
  }

  // 4. Key Visualizations
  const renderKeyVisualizations = () => {
    const charts = []
    
    // Missing Values Chart
    const totalMissingValues = o.total_missing
    const presentValues = (o.shape[0] * o.shape[1]) - totalMissingValues
    if (totalMissingValues > 0) {
      charts.push(
        <div key="missing" className="report-chart" style={{ width: '48%', display: 'inline-block', verticalAlign: 'top', padding: '10px' }}>
           <h4 style={{textAlign:'center'}}>Missing Data Overview</h4>
           <Plot 
             data={[{ type: 'pie', labels: ['Missing', 'Present'], values: [totalMissingValues, presentValues], marker: { colors: ['#ef4444', '#3b82f6'] }, textinfo: 'label+percent' }]}
             layout={{ height: 300, margin:{t:10,b:10,l:10,r:10}, showlegend: true, paper_bgcolor:'transparent', plot_bgcolor:'transparent', font: {color: '#111'} }}
             config={{ staticPlot: window.matchMedia("print").matches }}
           />
        </div>
      )
    }

    // Histograms
    const numCols = o.column_types?.numeric || []
    for (let i = 0; i < Math.min(2, numCols.length); i++) {
        const col = numCols[i]
        const histData = o.histograms?.[col]
        if (histData) {
            charts.push(
                <div key={`hist-${col}`} className="report-chart" style={{ width: '48%', display: 'inline-block', verticalAlign: 'top', padding: '10px' }}>
                   <h4 style={{textAlign:'center'}}>Distribution: {col}</h4>
                   <Plot 
                     data={[{ type: 'bar', x: histData.bin_edges.slice(0,-1), y: histData.counts, marker: { color: '#3b82f6' } }]}
                     layout={{ height: 300, margin:{t:10,b:30,l:40,r:10}, paper_bgcolor:'transparent', plot_bgcolor:'transparent', font: {color: '#111'} }}
                     config={{ staticPlot: window.matchMedia("print").matches }}
                   />
                </div>
              )
        }
    }

    // Categorical Distributions
    const catCols = o.column_types?.categorical || []
    for (let i = 0; i < Math.min(1, catCols.length); i++) {
        const col = catCols[i]
        const distData = o.distributions?.[col]
        if (distData) {
            charts.push(
                <div key={`cat-${col}`} className="report-chart" style={{ width: '48%', display: 'inline-block', verticalAlign: 'top', padding: '10px' }}>
                   <h4 style={{textAlign:'center'}}>Class Distribution: {col}</h4>
                   <Plot 
                     data={[{ type: 'bar', x: distData.map(d => String(d.name)), y: distData.map(d => d.count), marker: { color: '#f59e0b' } }]}
                     layout={{ height: 300, margin:{t:10,b:30,l:40,r:10}, paper_bgcolor:'transparent', plot_bgcolor:'transparent', font: {color: '#111'} }}
                     config={{ staticPlot: window.matchMedia("print").matches }}
                   />
                </div>
              )
        }
    }
    
    if (charts.length === 0) return <p>No major visualizations available.</p>
    return <div style={{ textAlign: 'center' }}>{charts}</div>
  }

  // 5. Preprocessing Pipeline Summary
  const renderPipeline = () => {
    if (!pipeline || pipeline.length === 0) return <p>No preprocessing steps applied.</p>
    return (
      <table className="report-table">
        <thead>
          <tr>
            <th>Step</th>
            <th>Operation</th>
            <th>Target/Columns</th>
            <th>Parameters</th>
          </tr>
        </thead>
        <tbody>
          {pipeline.map((step, idx) => {
            const params = step.params || {}
            let target = params.column || params.target_column || (params.columns ? params.columns.join(', ') : 'All')
            let paramStr = Object.entries(params)
              .filter(([k]) => !['column', 'columns', 'target_column'].includes(k))
              .map(([k, v]) => `${k}=${v}`)
              .join(', ')

            return (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td><strong style={{textTransform:'capitalize'}}>{step.action.replace('_', ' ')}</strong></td>
                <td>{target}</td>
                <td>{paramStr || '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  // 8. Final Schema Summary
  const renderSchema = () => {
    return (
      <table className="report-table">
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Final Data Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {c.columns.map((col, idx) => {
            const dtype = c.dtypes[col]
            let status = 'Unchanged'
            if (!o.columns.includes(col)) {
              status = 'Added/Encoded'
            } else if (o.dtypes[col] !== dtype) {
              status = 'Transformed (Type changed)'
            } else {
              // check if it was in the pipeline
              const modified = pipeline.some(p => {
                const pCols = p.params.columns || []
                const pCol = p.params.column || p.params.target_column
                return pCol === col || pCols.includes(col)
              })
              if (modified) status = 'Transformed'
            }

            return (
              <tr key={idx}>
                <td>{col}</td>
                <td>{dtype}</td>
                <td>{status}</td>
              </tr>
            )
          })}
          {o.columns.filter(col => !c.columns.includes(col)).map((col, idx) => (
            <tr key={`rem-${idx}`} style={{ color: '#ef4444', textDecoration: 'line-through' }}>
              <td>{col}</td>
              <td>{o.dtypes[col]}</td>
              <td>Removed</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="report-container" style={{ background: 'white', color: '#111', padding: '2rem' }}>
      {/* 1. Report Header */}
      <div className="report-header" style={{ borderBottom: '2px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ color: '#111', margin: '0 0 1rem 0' }}>Data Preprocessing Report</h1>
        <div className="report-meta" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', color: '#444' }}>
          <div><strong>Project/Dataset:</strong> Data Analysis Session</div>
          <div><strong>Export Date:</strong> {printDate}</div>
          <div><strong>Pipeline Steps:</strong> {pipeline.length} steps applied</div>
        </div>
      </div>

      {/* 2. Dataset Overview */}
      <div className="report-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#222', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>1. Initial Dataset Overview (Before Processing)</h2>
        <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div className="metric-card" style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}><div className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{o.shape[0].toLocaleString()}</div><div className="metric-label" style={{ color: '#64748b' }}>Initial Rows</div></div>
          <div className="metric-card" style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}><div className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{o.shape[1]}</div><div className="metric-label" style={{ color: '#64748b' }}>Initial Columns</div></div>
          <div className="metric-card" style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}><div className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{o.total_missing.toLocaleString()}</div><div className="metric-label" style={{ color: '#64748b' }}>Initial Missing</div></div>
          <div className="metric-card" style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}><div className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{o.duplicate_count.toLocaleString()}</div><div className="metric-label" style={{ color: '#64748b' }}>Initial Duplicates</div></div>
          <div className="metric-card" style={{ background: '#f8fafc', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '4px', textAlign: 'center' }}><div className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{o.memory_usage}</div><div className="metric-label" style={{ color: '#64748b' }}>Initial Memory</div></div>
        </div>
      </div>

      {/* 3. Initial Data Quality Warnings */}
      <div className="report-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#222', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>2. Initial Data Quality Diagnostics</h2>
        {renderInitialWarnings()}
      </div>

      {/* 4. Key Visualizations */}
      <div className="report-section" style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
        <h2 style={{ color: '#222', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>3. Key Initial Visualizations</h2>
        {renderKeyVisualizations()}
      </div>

      {/* 5. Preprocessing Pipeline Summary */}
      <div className="report-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#222', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>4. Preprocessing Pipeline Summary</h2>
        {renderPipeline()}
      </div>

      {/* 6. Before vs After Summary */}
      <div className="report-section" style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
        <h2 style={{ color: '#222', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>5. Before vs After Comparison</h2>
        <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Metric</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Before (Original)</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>After (Processed)</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Change</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}><strong>Rows</strong></td>
              <td style={{ padding: '0.75rem' }}>{o.shape[0].toLocaleString()}</td>
              <td style={{ padding: '0.75rem' }}>{c.shape[0].toLocaleString()}</td>
              <td style={{ padding: '0.75rem', color: c.shape[0] < o.shape[0] ? '#ef4444' : c.shape[0] > o.shape[0] ? '#10b981' : 'inherit' }}>
                {c.shape[0] - o.shape[0]}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}><strong>Columns</strong></td>
              <td style={{ padding: '0.75rem' }}>{o.shape[1]}</td>
              <td style={{ padding: '0.75rem' }}>{c.shape[1]}</td>
              <td style={{ padding: '0.75rem', color: c.shape[1] < o.shape[1] ? '#ef4444' : c.shape[1] > o.shape[1] ? '#10b981' : 'inherit' }}>
                {c.shape[1] - o.shape[1]}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}><strong>Missing Values</strong></td>
              <td style={{ padding: '0.75rem' }}>{o.total_missing.toLocaleString()}</td>
              <td style={{ padding: '0.75rem' }}>{c.total_missing.toLocaleString()}</td>
              <td style={{ padding: '0.75rem', color: c.total_missing < o.total_missing ? '#10b981' : c.total_missing > o.total_missing ? '#ef4444' : 'inherit' }}>
                {c.total_missing - o.total_missing}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '0.75rem' }}><strong>Duplicate Rows</strong></td>
              <td style={{ padding: '0.75rem' }}>{o.duplicate_count.toLocaleString()}</td>
              <td style={{ padding: '0.75rem' }}>{c.duplicate_count.toLocaleString()}</td>
              <td style={{ padding: '0.75rem', color: c.duplicate_count < o.duplicate_count ? '#10b981' : c.duplicate_count > o.duplicate_count ? '#ef4444' : 'inherit' }}>
                {c.duplicate_count - o.duplicate_count}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 7. Final Dataset Summary & Schema */}
      <div className="report-section" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: '#222', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>6. Final Dataset Schema</h2>
        {renderSchema()}
      </div>

      {/* 8. Export Metadata */}
      <div className="report-footer" style={{ marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid #ddd', fontSize: '0.9rem', color: '#666' }}>
        <p><strong>Note:</strong> This report reflects the transformation logic defined in the preprocessing pipeline. Missing value and distributions figures in the UI are based on exact statistics generated by the backend engine.</p>
        <p><em>Generated by Data Analytics Workspace at {printDate}</em></p>
      </div>

    </div>
  )
}
