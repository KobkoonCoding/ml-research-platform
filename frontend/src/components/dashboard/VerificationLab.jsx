import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import PageHeader from './elm/PageHeader'
import { VerifySVG } from './elm/AnimatedSVGs'
import { API_BASE } from '../../lib/constants'

const API = API_BASE

/* ─── Plotly helper (loaded via CDN in index.html) ─── */
const Plot = ({ id, data, layout, style }) => {
  const ref = useRef()
  useEffect(() => {
    if (ref.current && window.Plotly) {
      const merged = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'rgba(0,0,0,0.15)',
        font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
        margin: { t: 40, r: 20, b: 40, l: 50 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)' },
        yaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)' },
        ...layout,
      }
      window.Plotly.newPlot(ref.current, data, merged, { responsive: true, displayModeBar: false })
    }
    return () => { if (ref.current && window.Plotly) window.Plotly.purge(ref.current) }
  }, [data, layout])
  return <div ref={ref} id={id} style={{ width: '100%', ...style }} />
}

export default function VerificationLab({ module = 'forensic', analysis, pipeline = [] }) {
  const a = analysis
  const numericCols = a?.column_types?.numeric || []
  const categoricalCols = a?.column_types?.categorical || []
  const allCols = a?.columns || []

  // Number of features (excluding target) for hidden nodes range hint
  const numFeatures = allCols.length > 1 ? allCols.length - 1 : 1
  const minHidden = numFeatures
  const maxHidden = Math.min(10 * numFeatures, a?.shape?.[0] || 1000)

  // --- Config States ---
  const [targetColumn, setTargetColumn] = useState(allCols.length > 0 ? allCols[allCols.length - 1] : '')
  const [problemType, setProblemType] = useState('classification')
  const [splitStrategy, setSplitStrategy] = useState('kfold')
  const [numFolds, setNumFolds] = useState(5)
  const [testSize, setTestSize] = useState(0.2)
  const [shuffle, setShuffle] = useState(true)
  const [randomSeed, setRandomSeed] = useState(42)
  const [hiddenNodes, setHiddenNodes] = useState(100)
  const [activation, setActivation] = useState('sigmoid')
  const [repeats, setRepeats] = useState(1)

  // --- UI States ---
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')

  const isFirstRender = useRef(true)

  // Auto-infer problem type when target changes (skip first render to preserve persisted state)
  useEffect(() => {
    if (targetColumn && a) {
      if (isFirstRender.current) {
        isFirstRender.current = false
        // Still infer on first render for initial default
        const isNum = numericCols.includes(targetColumn)
        setProblemType(isNum ? 'regression' : 'classification')
        return
      }
      const isNum = numericCols.includes(targetColumn)
      setProblemType(isNum ? 'regression' : 'classification')
    }
  }, [targetColumn, a, numericCols])

  // --- Train Handler ---
  const handleTrain = async () => {
    if (!targetColumn) {
      setError('Please select a target column.')
      return
    }
    setLoading(true)
    setError(null)
    setResults(null)
    setActiveTab('summary')

    try {
      const resp = await axios.post(`${API}/train`, {
        target_column: targetColumn,
        problem_type: problemType,
        split_strategy: splitStrategy,
        num_folds: parseInt(numFolds),
        test_size: parseFloat(testSize),
        shuffle: shuffle,
        random_seed: parseInt(randomSeed),
        hidden_nodes: parseInt(hiddenNodes),
        activation: activation,
        repeats: parseInt(repeats)
      })
      setResults(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Error during ELM model training')
    } finally {
      setLoading(false)
    }
  }

  // --- Pipeline Summary ---
  const renderPipelineSummary = () => {
    if (!pipeline || pipeline.length === 0) {
      return <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No preprocessing steps applied. Training on raw dataset.</p>
    }
    return (
      <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: 8, fontSize: '0.88rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          <strong>Data Leakage Protection:</strong> Global cleaning (Duplicates, Drops, Type Casting) is applied once.
          Statistical steps (Mean/Scale/Outliers/Encoding) are learned from <strong>training folds only</strong> and used to transform validation folds.
        </p>
        <ol style={{ paddingLeft: '1.2rem', margin: 0 }}>
          {pipeline.map((step, idx) => (
            <li key={idx} style={{ marginBottom: '0.3rem' }}>
              <strong>{(step.action || '').toUpperCase()}</strong>
              {step.params && <span style={{ color: 'var(--text-muted)' }}> - {JSON.stringify(step.params)}</span>}
            </li>
          ))}
        </ol>
      </div>
    )
  }

  // --- Folds Table ---
  const renderFoldsTable = () => {
    if (!results || !results.folds) return null
    return (
      <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Run</th>
              <th style={thStyle}>Fold</th>
              <th style={thStyle}>Train</th>
              <th style={thStyle}>Val</th>
              {problemType === 'classification' ? (
                <><th style={thStyle}>Accuracy</th><th style={thStyle}>Precision</th><th style={thStyle}>Recall</th><th style={thStyle}>F1</th></>
              ) : (
                <><th style={thStyle}>RMSE</th><th style={thStyle}>MAE</th><th style={thStyle}>R2</th></>
              )}
              <th style={thStyle}>Time</th>
            </tr>
          </thead>
          <tbody>
            {results.folds.map((f, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={tdStyle}>{f.repeat}</td>
                <td style={tdStyle}>{f.fold}</td>
                <td style={tdStyle}>{f.train_size}</td>
                <td style={tdStyle}>{f.test_size || f.val_size}</td>
                {problemType === 'classification' ? (
                  <>
                    <td style={tdStyle}>{f.metrics.accuracy?.toFixed(4)}</td>
                    <td style={tdStyle}>{f.metrics.precision?.toFixed(4)}</td>
                    <td style={tdStyle}>{f.metrics.recall?.toFixed(4)}</td>
                    <td style={tdStyle}>{f.metrics.f1_score?.toFixed(4)}</td>
                  </>
                ) : (
                  <>
                    <td style={tdStyle}>{f.metrics.rmse?.toFixed(4)}</td>
                    <td style={tdStyle}>{f.metrics.mae?.toFixed(4)}</td>
                    <td style={tdStyle}>{f.metrics.r2?.toFixed(4)}</td>
                  </>
                )}
                <td style={tdStyle}>{f.training_time?.toFixed(3) || f.elapsed?.toFixed(3)}s</td>
              </tr>
            ))}
          </tbody>
          <tfoot style={{ background: 'rgba(255,255,255,0.04)', fontWeight: 700 }}>
            <tr>
              <td colSpan={4} style={tdStyle}>AVERAGE</td>
              {problemType === 'classification' ? (
                <>
                  <td style={tdStyle}>{results.summary?.accuracy?.mean?.toFixed(4) || 'N/A'}</td>
                  <td style={tdStyle}>{results.summary?.precision?.mean?.toFixed(4) || 'N/A'}</td>
                  <td style={tdStyle}>{results.summary?.recall?.mean?.toFixed(4) || 'N/A'}</td>
                  <td style={tdStyle}>{results.summary?.f1_score?.mean?.toFixed(4) || 'N/A'}</td>
                </>
              ) : (
                <>
                  <td style={tdStyle}>{results.summary?.rmse?.mean?.toFixed(4) || 'N/A'}</td>
                  <td style={tdStyle}>{results.summary?.mae?.mean?.toFixed(4) || 'N/A'}</td>
                  <td style={tdStyle}>{results.summary?.r2?.mean?.toFixed(4) || 'N/A'}</td>
                </>
              )}
              <td style={tdStyle}>-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  // --- Visualizations ---
  const renderVisualizations = () => {
    if (!results) return null

    const metricKey = problemType === 'classification' ? 'f1_score' : 'r2'
    const metricValues = results.folds.map(f => f.metrics[metricKey])
    const bestFold = results.folds.reduce((prev, curr) => (curr.metrics[metricKey] > prev.metrics[metricKey]) ? curr : prev)

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Performance Distribution */}
        <div className="glass-panel" style={{ flex: '1 1 450px', padding: '1rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Performance Distribution</h4>
          <Plot
            id="perf-box"
            data={[{
              y: metricValues, type: 'box', name: metricKey.toUpperCase(),
              marker: { color: '#60a5fa' }, boxpoints: 'all', jitter: 0.3, pointpos: -1.8
            }]}
            layout={{ title: `${metricKey.toUpperCase()} Distribution across Folds`, height: 350, yaxis: { title: 'Score' } }}
          />
        </div>

        {/* Confusion Matrix */}
        {problemType === 'classification' && bestFold.confusion_matrix && (
          <div className="glass-panel" style={{ flex: '1 1 350px', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Confusion Matrix</h4>
            <Plot
              id="cm-heat"
              data={[{
                z: bestFold.confusion_matrix, type: 'heatmap', colorscale: 'Blues',
                text: bestFold.confusion_matrix.map(row => row.map(val => String(val))),
                texttemplate: "%{text}", hoverinfo: "z"
              }]}
              layout={{
                title: `Best Fold Confusion Matrix (Run ${bestFold.repeat}, Fold ${bestFold.fold})`,
                xaxis: { title: 'Predicted' }, yaxis: { title: 'True', autorange: 'reversed' },
                height: 350
              }}
            />
          </div>
        )}

        {/* ROC Curve */}
        {problemType === 'classification' && bestFold.curves?.roc && (
          <div className="glass-panel" style={{ flex: '1 1 350px', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>ROC Curve</h4>
            <Plot
              id="roc-curve"
              data={[
                { x: bestFold.curves.roc.fpr, y: bestFold.curves.roc.tpr, type: 'scatter', mode: 'lines', name: 'ROC', line: { color: '#38bdf8', width: 2 } },
                { x: [0, 1], y: [0, 1], type: 'scatter', mode: 'lines', name: 'Random', line: { dash: 'dash', color: 'gray' } }
              ]}
              layout={{
                title: `ROC Curve (AUC: ${bestFold.metrics.roc_auc?.toFixed(3) || 'N/A'})`,
                xaxis: { title: 'FPR' }, yaxis: { title: 'TPR' }, height: 350, showlegend: false
              }}
            />
          </div>
        )}

        {/* PR Curve */}
        {problemType === 'classification' && bestFold.curves?.pr && (
          <div className="glass-panel" style={{ flex: '1 1 350px', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Precision-Recall</h4>
            <Plot
              id="pr-curve"
              data={[{
                x: bestFold.curves.pr.recall, y: bestFold.curves.pr.precision,
                type: 'scatter', mode: 'lines', name: 'PR', line: { color: '#f472b6', width: 2 }
              }]}
              layout={{ title: 'Precision-Recall Curve', xaxis: { title: 'Recall' }, yaxis: { title: 'Precision' }, height: 350, showlegend: false }}
            />
          </div>
        )}

        {/* Class Distribution */}
        {problemType === 'classification' && bestFold.distribution && (
          <div className="glass-panel" style={{ flex: '1 1 400px', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Class Distribution</h4>
            <Plot
              id="class-dist"
              data={[
                { x: Object.keys(bestFold.distribution.train), y: Object.values(bestFold.distribution.train), type: 'bar', name: 'Train', marker: { color: '#60a5fa' } },
                { x: Object.keys(bestFold.distribution.test || bestFold.distribution.val || {}), y: Object.values(bestFold.distribution.test || bestFold.distribution.val || {}), type: 'bar', name: 'Val', marker: { color: '#f472b6' } }
              ]}
              layout={{ title: 'Class Distribution (Best Fold)', barmode: 'stack', height: 350, xaxis: { title: 'Classes' }, yaxis: { title: 'Count' } }}
            />
          </div>
        )}
      </div>
    )
  }

  // --- Main Render ---
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <PageHeader
        title="Verification Lab"
        subtitle="Train and evaluate your model with cross-validation to ensure reliable performance"
        accentColor="#10B981"
        icon={<ShieldCheck size={22} />}
        illustration={<VerifySVG size={100} />}
      />

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* ═══ LEFT: Configuration ═══ */}
        <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Task Configuration */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#60a5fa', fontWeight: 600 }}>Task Configuration</h3>

            <div className="input-group">
              <label className="input-label">Target Column</label>
              <select className="select-field" value={targetColumn} onChange={e => setTargetColumn(e.target.value)}>
                {allCols.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label className="input-label">Problem Type</label>
              <select className="select-field" value={problemType} onChange={e => setProblemType(e.target.value)}>
                <option value="classification">Classification</option>
                <option value="regression">Regression</option>
              </select>
            </div>
          </div>

          {/* Validation Strategy */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#818cf8', fontWeight: 600 }}>Validation Strategy</h3>

            <div className="input-group">
              <label className="input-label">Evaluation Strategy</label>
              <select className="select-field" value={splitStrategy} onChange={e => setSplitStrategy(e.target.value)}>
                <option value="kfold">K-Fold CV</option>
                {problemType === 'classification' && <option value="stratified_kfold">Stratified K-Fold CV</option>}
                <option value="holdout">Hold-Out Split</option>
              </select>
            </div>

            {splitStrategy === 'holdout' ? (
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label">Test Set Size: {Math.round(testSize * 100)}%</label>
                <input type="range" className="input-field" min="0.05" max="0.5" step="0.05" value={testSize}
                  onChange={e => setTestSize(parseFloat(e.target.value))} />
              </div>
            ) : (
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="input-label">Number of Folds</label>
                <input type="number" className="input-field" min="2" max="20" value={numFolds}
                  onChange={e => setNumFolds(e.target.value)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="input-label">Repeats</label>
                <input type="number" className="input-field" min="1" max="10" value={repeats}
                  onChange={e => setRepeats(e.target.value)} />
              </div>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="input-label">Random Seed</label>
                <input type="number" className="input-field" value={randomSeed}
                  onChange={e => setRandomSeed(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem' }}>
              <input type="checkbox" id="shuffle_cv" checked={shuffle}
                onChange={e => setShuffle(e.target.checked)} />
              <label htmlFor="shuffle_cv" className="input-label" style={{ marginBottom: 0 }}>Shuffle Data</label>
            </div>
          </div>

          {/* ELM Parameters */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#c084fc', fontWeight: 600 }}>ELM Parameters</h3>

            <div className="input-group">
              <label className="input-label">
                Hidden Neurons
                <span style={{
                  fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400,
                  marginLeft: '0.5rem',
                }}>
                  (recommended: {minHidden} - {maxHidden})
                </span>
              </label>
              <input type="number" className="input-field" min="1" max="10000" value={hiddenNodes}
                onChange={e => setHiddenNodes(e.target.value)} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Range: 1d to min(10d, n_samples) where d = {numFeatures} features, n = {a?.shape?.[0] || '?'} samples
              </p>
            </div>

            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label className="input-label">Activation Function</label>
              <select className="select-field" value={activation} onChange={e => setActivation(e.target.value)}>
                <option value="sigmoid">Sigmoid</option>
                <option value="relu">ReLU</option>
                <option value="tanh">Tanh</option>
                <option value="sine">Sine</option>
              </select>
            </div>
          </div>

          {/* Train Button */}
          <button
            onClick={handleTrain}
            disabled={loading || !targetColumn}
            style={{
              width: '100%', padding: '1rem',
              background: loading || !targetColumn
                ? 'rgba(255,255,255,0.04)'
                : 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: loading || !targetColumn ? 'var(--text-muted)' : '#fff',
              border: loading || !targetColumn ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderRadius: 12, fontSize: '1rem', fontWeight: 700,
              cursor: loading || !targetColumn ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            {loading ? 'Training in Progress...' : 'Start ELM Training'}
          </button>
        </div>

        {/* ═══ RIGHT: Pipeline + Results ═══ */}
        <div style={{ flex: '1 1 550px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Pipeline Summary */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Preprocessing Pipeline</h3>
            {renderPipelineSummary()}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '1rem', borderRadius: 12,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5', fontSize: '0.9rem',
                }}
              >
                <strong>Error:</strong> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel"
                style={{ padding: '1.25rem' }}
              >
                {/* Tabs */}
                <div className="tabs" style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <button className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                    Summary
                  </button>
                  <button className={`tab-btn ${activeTab === 'folds' ? 'active' : ''}`} onClick={() => setActiveTab('folds')}>
                    Folds Detail
                  </button>
                </div>

                {activeTab === 'summary' && (
                  <div>
                    {/* Summary Metric Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                      {problemType === 'classification' ? (
                        <>
                          <MetricCard label="Accuracy" value={results.summary?.accuracy?.mean} percent tooltip="Percentage of correct predictions" />
                          <MetricCard label="Precision" value={results.summary?.precision?.mean} percent tooltip="Of positive predictions, how many were correct" />
                          <MetricCard label="Recall" value={results.summary?.recall?.mean} percent tooltip="Of actual positives, how many were found" />
                          <MetricCard label="F1-Score" value={results.summary?.f1_score?.mean} tooltip="Harmonic mean of Precision and Recall" />
                          {results.summary?.roc_auc && <MetricCard label="ROC AUC" value={results.summary.roc_auc.mean} tooltip="Area under the ROC curve (higher is better)" />}
                        </>
                      ) : (
                        <>
                          <MetricCard label="R2 Score" value={results.summary?.r2?.mean} tooltip="Proportion of variance explained by the model" />
                          <MetricCard label="RMSE" value={results.summary?.rmse?.mean} raw tooltip="Root Mean Squared Error (lower is better)" />
                          <MetricCard label="MAE" value={results.summary?.mae?.mean} raw tooltip="Mean Absolute Error (lower is better)" />
                        </>
                      )}
                    </div>
                    {renderVisualizations()}
                  </div>
                )}

                {activeTab === 'folds' && renderFoldsTable()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!results && !loading && !error && (
            <div style={{
              padding: '4rem 2rem', textAlign: 'center',
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 14, flex: 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.6 }}>🧠</div>
              <h3 style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.4rem' }}>Ready for Training</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Configure parameters and click "Start ELM Training" to begin cross-validation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Small helpers ─── */
function MetricCard({ label, value, percent, raw, tooltip }) {
  if (value === null || value === undefined) return null
  let display
  if (raw) {
    display = value.toFixed(4)
  } else if (percent) {
    display = `${(value * 100).toFixed(2)}%`
  } else {
    display = value.toFixed(4)
  }
  return (
    <div
      title={tooltip}
      style={{
        padding: '1rem', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
        cursor: tooltip ? 'help' : undefined,
      }}
    >
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {display}
      </div>
    </div>
  )
}

const thStyle = {
  padding: '0.6rem 0.75rem', fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
  borderBottom: '1px solid rgba(255,255,255,0.08)', textAlign: 'left',
}

const tdStyle = {
  padding: '0.5rem 0.75rem', fontSize: '0.85rem',
  color: 'var(--text-secondary)',
}
