import React from 'react'

export default function ModelReportView({ results, pipeline, analysis }) {
  if (!results || !results.folds) return null

  const printDate = new Date().toLocaleString()
  const isClass = results.summary?.accuracy !== undefined
  
  const renderPipeline = () => {
    if (!pipeline || pipeline.length === 0) return <p>No preprocessing steps applied.</p>
    return (
      <ol style={{ paddingLeft: '20px', fontSize: '0.9rem' }}>
        {pipeline.map((step, idx) => {
          const params = step.params || {}
          let target = params.column || params.target_column || (params.columns ? params.columns.join(', ') : 'All')
          let paramStr = Object.entries(params)
            .filter(([k]) => !['column', 'columns', 'target_column'].includes(k))
            .map(([k, v]) => `${k}=${v}`)
            .join(', ')
          return (
            <li key={idx}>
              <strong>{step.action.replace('_', ' ')}</strong> on <em>{target}</em> {paramStr ? `(${paramStr})` : ''}
            </li>
          )
        })}
      </ol>
    )
  }

  const renderFoldsTable = () => {
    return (
      <table className="report-table">
        <thead>
          <tr>
            <th>Run</th>
            <th>Fold</th>
            <th>Train/Val Size</th>
            {isClass ? (
              <>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1 Score</th>
                <th>ROC AUC</th>
              </>
            ) : (
              <>
                <th>MAE</th>
                <th>RMSE</th>
                <th>R²</th>
              </>
            )}
            <th>Time (s)</th>
          </tr>
        </thead>
        <tbody>
          {results.folds.map((f, i) => (
            <tr key={i}>
              <td>{f.repeat}</td>
              <td>{f.fold}</td>
              <td>{f.train_size} / {f.test_size}</td>
              {isClass ? (
                <>
                  <td>{(f.metrics.accuracy * 100).toFixed(2)}%</td>
                  <td>{(f.metrics.precision * 100).toFixed(2)}%</td>
                  <td>{(f.metrics.recall * 100).toFixed(2)}%</td>
                  <td>{(f.metrics.f1_score * 100).toFixed(2)}%</td>
                  <td>{f.metrics.roc_auc ? f.metrics.roc_auc.toFixed(3) : '-'}</td>
                </>
              ) : (
                <>
                  <td>{f.metrics.mae.toFixed(4)}</td>
                  <td>{f.metrics.rmse.toFixed(4)}</td>
                  <td>{f.metrics.r2.toFixed(4)}</td>
                </>
              )}
              <td>{f.training_time.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="report-container">
      {/* 1. Report Header */}
      <div className="report-header">
        <h1>Extreme Learning Machine (ELM) Model Report</h1>
        <div className="report-meta">
          <div><strong>Project/Dataset:</strong> Data Analysis Session</div>
          <div><strong>Export Date:</strong> {printDate}</div>
        </div>
      </div>

      <hr />

      {/* 2. Training Configurations */}
      <div className="report-section">
        <h2>1. Training Configurations</h2>
        <table className="report-table" style={{ width: 'auto' }}>
          <tbody>
            <tr><td><strong>Target Column</strong></td><td>{results.target_column}</td></tr>
            <tr><td><strong>Problem Type</strong></td><td><span style={{textTransform:'capitalize'}}>{results.problem_type}</span></td></tr>
            <tr><td><strong>Split Strategy</strong></td><td><span style={{textTransform:'capitalize'}}>{results.split_strategy.replace('_', ' ')}</span></td></tr>
            <tr><td><strong>Number of Folds / Repeats</strong></td><td>{results.num_folds} folds / {results.repeats} repeats</td></tr>
            <tr><td><strong>Total Evaluated Models</strong></td><td>{results.folds.length}</td></tr>
          </tbody>
        </table>
      </div>

      {/* 3. Preprocessing Pipeline */}
      <div className="report-section">
        <h2>2. Data Preprocessing Pipeline</h2>
        <p className="insight-detail">Applied securely inside the cross-validation loop to prevent data leakage.</p>
        {renderPipeline()}
      </div>

      {/* 4. Overall Performance */}
      <div className="report-section">
        <h2>3. Overall Performance Summary (Mean ± Std)</h2>
        <div className="metrics-grid" style={{ marginBottom: '1.5rem' }}>
          {isClass ? (
            <>
              <div className="metric-card"><div className="metric-value">{(results.summary.accuracy.mean * 100).toFixed(2)}%</div><div className="metric-label">Accuracy</div></div>
              <div className="metric-card"><div className="metric-value">{(results.summary.precision.mean * 100).toFixed(2)}%</div><div className="metric-label">Precision</div></div>
              <div className="metric-card"><div className="metric-value">{(results.summary.recall.mean * 100).toFixed(2)}%</div><div className="metric-label">Recall</div></div>
              <div className="metric-card"><div className="metric-value">{(results.summary.f1_score.mean * 100).toFixed(2)}%</div><div className="metric-label">F1 Score</div></div>
            </>
          ) : (
            <>
              <div className="metric-card"><div className="metric-value">{results.summary.mae.mean.toFixed(4)}</div><div className="metric-label">MAE</div></div>
              <div className="metric-card"><div className="metric-value">{results.summary.rmse.mean.toFixed(4)}</div><div className="metric-label">RMSE</div></div>
              <div className="metric-card"><div className="metric-value">{results.summary.r2.mean.toFixed(4)}</div><div className="metric-label">R²</div></div>
            </>
          )}
        </div>
        
        <table className="report-table" style={{ width: 'auto' }}>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Mean</th>
              <th>Std Dev</th>
              <th>Min</th>
              <th>Max</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(results.summary).map(([k, v]) => {
              if (k === 'training_time' || !v) return null
              return (
                <tr key={k}>
                  <td style={{textTransform:'capitalize'}}>{k.replace('_', ' ')}</td>
                  <td>{isClass && k !== 'roc_auc' ? (v.mean * 100).toFixed(2) + '%' : v.mean.toFixed(4)}</td>
                  <td>{isClass && k !== 'roc_auc' ? (v.std * 100).toFixed(2) + '%' : v.std.toFixed(4)}</td>
                  <td>{isClass && k !== 'roc_auc' ? (v.min * 100).toFixed(2) + '%' : v.min.toFixed(4)}</td>
                  <td>{isClass && k !== 'roc_auc' ? (v.max * 100).toFixed(2) + '%' : v.max.toFixed(4)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Per-Fold Performance */}
      <div className="report-section" style={{ pageBreakInside: 'avoid' }}>
        <h2>4. Per-Fold Evaluation Results</h2>
        {renderFoldsTable()}
      </div>

      {/* 6. Model Notes */}
      <div className="report-section">
        <h2>5. Final Notes</h2>
        <div className="insight-item success" style={{ margin: 0, border: '1px solid #ddd', background: '#f8fafc' }}>
          <span className="insight-icon" style={{filter: 'grayscale(1)'}}>📈</span>
          <div className="insight-content">
            <div className="insight-title" style={{color:'#111'}}>Model Analysis</div>
            <div className="insight-detail" style={{color:'#444'}}>
              {isClass ? (
                <span>The model's median accuracy is <strong>{(results.summary.accuracy.mean * 100).toFixed(2)}%</strong> with a stability variance (std dev) of <strong>{(results.summary.accuracy.std * 100).toFixed(2)}%</strong>. Average training time per fold was <strong>{results.summary.training_time?.mean?.toFixed(3) || 0}s</strong>.</span>
              ) : (
                <span>The model explains <strong>{(results.summary.r2.mean * 100).toFixed(2)}%</strong> of the variance (R²) with an average MAE of <strong>{results.summary.mae.mean.toFixed(4)}</strong>. Average training time per fold was <strong>{results.summary.training_time?.mean?.toFixed(3) || 0}s</strong>.</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Export Metadata */}
      <div className="report-footer">
        <p><em>Generated by Data Analytics Workspace at {printDate}</em></p>
      </div>

    </div>
  )
}
