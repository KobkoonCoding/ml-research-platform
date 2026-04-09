import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Plot from 'react-plotly.js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BrainCircuit, ShieldCheck, Activity, Settings, RefreshCw, Layers, 
  Target, Info, Play, BarChart2, Table as TableIcon, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react'
import classNames from 'classnames'
import { API_BASE } from '../lib/constants'

export default function ModelTraining({ 
  analysis, 
  pipeline = [], 
  initialTarget, 
  onTargetChange, 
  trainingResults, 
  setTrainingResults,
  trainingConfig,
  setTrainingConfig
}) {
  const results = trainingResults
  const setResults = setTrainingResults
  
  const { 
    problemType, splitStrategy, numFolds, testSize, shuffle, 
    randomSeed, hiddenNodes, activation, repeats 
  } = trainingConfig

  const [targetColumn, setTargetColumn] = useState(initialTarget || (analysis?.columns ? analysis.columns[analysis.columns.length - 1] : ''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')

  const isFirstRender = useRef(true)

  const updateConfig = (newVal) => {
    setTrainingConfig(prev => ({ ...prev, ...newVal }))
  }

  useEffect(() => {
    if (analysis && targetColumn) {
      if (onTargetChange) onTargetChange(targetColumn)
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      const isNum = analysis.column_types?.numeric?.includes(targetColumn)
      updateConfig({ problemType: isNum ? 'regression' : 'classification' })
    }
  }, [targetColumn, analysis, onTargetChange])

  const handleTrain = async () => {
    setLoading(true)
    setError(null)
    setResults(null)
    setActiveTab('summary')
    
    try {
      const resp = await axios.post(`${API_BASE}/train`, {
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

  const renderPipelineSummary = () => {
    if (!pipeline || pipeline.length === 0) {
      return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 text-text-muted mt-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">No preprocessing steps configured. Using the raw dataset directly.</p>
        </div>
      )
    }
    return (
      <div className="bg-surface-card border border-white/10 rounded-xl overflow-hidden mt-4">
        <div className="bg-warning/10 px-4 py-3 flex items-start gap-3 border-b border-white/5">
          <ShieldCheck className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-xs text-text-primary leading-relaxed">
            <span className="font-semibold text-warning">Data Leakage Protection:</span> Global cleaning (Drop, Cast) is applied once. Statistical transformations (Imputation, Scaling, Encoding) are learned strictly from <strong className="text-white">training folds</strong> and applied dynamically to validation folds during Cross-Validation.
          </p>
        </div>
        <div className="p-4 space-y-1 bg-black/20 max-h-48 overflow-y-auto custom-scrollbar">
          {pipeline.map((step, idx) => (
            <div key={idx} className="flex items-center text-sm group">
              <span className="w-6 text-text-muted text-xs">{idx + 1}.</span>
              <span className="font-semibold text-white capitalize w-36">{step.action.replace('_', ' ')}</span>
              <span className="text-text-muted text-xs truncate flex-1 font-mono">{step.params ? JSON.stringify(step.params) : ''}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderFoldsTable = () => {
    if (!results || !results.folds) return null
    return (
      <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar border border-white/10 rounded-xl mt-4">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-text-muted uppercase bg-surface-card sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 border-b border-white/10">Run</th>
              <th className="px-4 py-3 border-b border-white/10">Fold</th>
              <th className="px-4 py-3 border-b border-white/10 text-right">Train Size</th>
              <th className="px-4 py-3 border-b border-white/10 text-right">Val Size</th>
              {problemType === 'classification' ? (
                <>
                  <th className="px-4 py-3 border-b border-white/10 text-right text-primary">Accuracy</th>
                  <th className="px-4 py-3 border-b border-white/10 text-right text-info">Precision</th>
                  <th className="px-4 py-3 border-b border-white/10 text-right text-accent">Recall</th>
                  <th className="px-4 py-3 border-b border-white/10 text-right text-success">F1</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 border-b border-white/10 text-right text-error">RMSE</th>
                  <th className="px-4 py-3 border-b border-white/10 text-right text-warning">MAE</th>
                  <th className="px-4 py-3 border-b border-white/10 text-right text-success">R²</th>
                </>
              )}
              <th className="px-4 py-3 border-b border-white/10 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {results.folds.map((f, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-2 text-text-muted">{f.repeat}</td>
                <td className="px-4 py-2 text-text-muted">{f.fold}</td>
                <td className="px-4 py-2 text-right">{f.train_size}</td>
                <td className="px-4 py-2 text-right">{f.val_size}</td>
                {problemType === 'classification' ? (
                  <>
                    <td className="px-4 py-2 text-right font-medium">{f.metrics.accuracy?.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-medium">{f.metrics.precision?.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-medium">{f.metrics.recall?.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-medium text-white">{f.metrics.f1_score?.toFixed(4)}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 text-right font-medium">{f.metrics.rmse?.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-medium">{f.metrics.mae?.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right font-medium text-white">{f.metrics.r2?.toFixed(4)}</td>
                  </>
                )}
                <td className="px-4 py-2 text-right text-text-muted">{f.elapsed?.toFixed(3)}s</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-black/40 text-white font-semibold sticky bottom-0 z-10 border-t border-white/10">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-text-muted">Average (All Runs)</td>
              {problemType === 'classification' ? (
                <>
                  <td className="px-4 py-3 text-right">{results.summary?.accuracy?.mean?.toFixed(4) || "N/A"}</td>
                  <td className="px-4 py-3 text-right">{results.summary?.precision?.mean?.toFixed(4) || "N/A"}</td>
                  <td className="px-4 py-3 text-right">{results.summary?.recall?.mean?.toFixed(4) || "N/A"}</td>
                  <td className="px-4 py-3 text-right text-success">{results.summary?.f1_score?.mean?.toFixed(4) || "N/A"}</td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3 text-right">{results.summary?.rmse?.mean?.toFixed(4) || "N/A"}</td>
                  <td className="px-4 py-3 text-right">{results.summary?.mae?.mean?.toFixed(4) || "N/A"}</td>
                  <td className="px-4 py-3 text-right text-success">{results.summary?.r2?.mean?.toFixed(4) || "N/A"}</td>
                </>
              )}
              <td className="px-4 py-3 text-right text-text-muted">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  const renderVisualizations = () => {
    if (!results) return null
    
    // 1. Performance Distribution (Boxplot of F1 or R2)
    const metricKey = problemType === 'classification' ? 'f1_score' : 'r2'
    const metricValues = results.folds.map(f => f.metrics[metricKey])
    
    const performanceData = [{
      y: metricValues,
      type: 'box',
      name: metricKey.toUpperCase(),
      marker: { color: '#6366f1' },
      boxpoints: 'all',
      jitter: 0.3,
      pointpos: -1.8
    }]

    const baseLayout = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'rgba(0,0,0,0.15)',
      font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
      margin: { t: 40, l: 40, r: 20, b: 40 },
      xaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)' },
      yaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)' },
    }

    const performanceLayout = {
      ...baseLayout,
      title: { text: `${metricKey.toUpperCase()} Distribution across Folds`, font: { color: 'white', size: 13 } },
    }

    // Best Fold Finder
    const bestFold = results.folds.reduce((prev, curr) => (curr.metrics[metricKey] > prev.metrics[metricKey]) ? curr : prev)
    
    let cmPlot = null
    if (problemType === 'classification' && bestFold.confusion_matrix) {
      const cm = bestFold.confusion_matrix
      cmPlot = (
        <Plot
          data={[{
            z: cm,
            type: 'heatmap',
            colorscale: [[0, '#0F172A'], [1, '#6366F1']],
            text: cm.map(row => row.map(val => String(val))),
            texttemplate: "%{text}",
            textfont: { color: 'white' },
            hoverinfo: "z"
          }]}
          layout={{
            ...baseLayout,
            title: { text: `Best Fold Confusion Matrix (Run ${bestFold.repeat}, Fold ${bestFold.fold})`, font: { color: 'white', size: 13 } },
            xaxis: { ...baseLayout.xaxis, title: 'Predicted Class', tickangle: 0 },
            yaxis: { ...baseLayout.yaxis, title: 'True Class', autorange: 'reversed' },
            margin: { t: 40, l: 60, r: 20, b: 50 },
          }}
          style={{ width: '100%', height: '350px' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      )
    }

    let curvesPlot = null
    if (problemType === 'classification' && bestFold.curves) {
      const roc = bestFold.curves.roc
      curvesPlot = (
        <Plot
          data={[
            { x: roc.fpr, y: roc.tpr, type: 'scatter', mode: 'lines', name: 'ROC Curve', line: { color: '#3b82f6', width: 2 } },
            { x: [0, 1], y: [0, 1], type: 'scatter', mode: 'lines', name: 'Random', line: { dash: 'dash', color: 'rgba(255,255,255,0.3)' } }
          ]}
          layout={{
            ...baseLayout,
            title: { text: `ROC Curve (AUC: ${bestFold.metrics.roc_auc?.toFixed(3) || 'N/A'})`, font: { color: 'white', size: 13 } },
            xaxis: { ...baseLayout.xaxis, title: 'False Positive Rate' },
            yaxis: { ...baseLayout.yaxis, title: 'True Positive Rate' },
            showlegend: false
          }}
          style={{ width: '100%', height: '350px' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      )
    }

    let prPlot = null
    if (problemType === 'classification' && bestFold.curves) {
      const pr = bestFold.curves.pr
      prPlot = (
        <Plot
          data={[
            { x: pr.recall, y: pr.precision, type: 'scatter', mode: 'lines', name: 'PR Curve', line: { color: '#ec4899', width: 2 } }
          ]}
          layout={{
            ...baseLayout,
            title: { text: `Precision-Recall Curve`, font: { color: 'white', size: 13 } },
            xaxis: { ...baseLayout.xaxis, title: 'Recall' },
            yaxis: { ...baseLayout.yaxis, title: 'Precision' },
            showlegend: false
          }}
          style={{ width: '100%', height: '350px' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      )
    }

    let distPlot = null
    if (problemType === 'classification' && bestFold.distribution) {
      const trainDist = bestFold.distribution.train
      const testDist = bestFold.distribution.test
      const classes = Object.keys(trainDist)
      
      distPlot = (
        <Plot
          data={[
            { x: classes, y: classes.map(c => trainDist[c]), type: 'bar', name: 'Train Size', marker: { color: '#6366f1' } },
            { x: classes, y: classes.map(c => testDist[c]), type: 'bar', name: 'Val Size', marker: { color: '#ec4899' } }
          ]}
          layout={{
            ...baseLayout,
            title: { text: 'Class Distribution (Best Fold)', font: { color: 'white', size: 13 } },
            barmode: 'stack',
            xaxis: { ...baseLayout.xaxis, title: 'Classes' },
            yaxis: { ...baseLayout.yaxis, title: 'Count' },
            margin: { t: 40, l: 50, r: 20, b: 50 },
            legend: { orientation: 'h', y: -0.2 }
          }}
          style={{ width: '100%', height: '350px' }}
          config={{ responsive: true, displayModeBar: false }}
        />
      )
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-surface-card border border-white/5 rounded-xl p-4 shadow-lg">
          <Plot data={performanceData} layout={performanceLayout} config={{ responsive: true, displayModeBar: false }} style={{ width: '100%', height: '350px' }} />
        </div>
        {distPlot && <div className="bg-surface-card border border-white/5 rounded-xl p-4 shadow-lg">{distPlot}</div>}
        {cmPlot && <div className="bg-surface-card border border-white/5 rounded-xl p-4 shadow-lg">{cmPlot}</div>}
        {curvesPlot && <div className="bg-surface-card border border-white/5 rounded-xl p-4 shadow-lg">{curvesPlot}</div>}
        {prPlot && <div className="bg-surface-card border border-white/5 rounded-xl p-4 shadow-lg">{prPlot}</div>}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white mb-2">
            <BrainCircuit className="w-8 h-8 text-primary" /> ELM Training & Evaluation
          </h2>
          <p className="text-text-muted text-sm max-w-2xl">
            Configure robust cross-validation, parameterize the Extreme Learning Machine, and train instantly. 
            The system handles data leakage automatically by splitting data before applying transformers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SETUP */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="glass-panel p-5 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 border-b border-white/10 pb-3">
              <Target className="w-4 h-4" /> Task Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Target Column Y</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none text-white" value={targetColumn} onChange={e => setTargetColumn(e.target.value)}>
                  {analysis?.columns?.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Problem Type</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none disabled:opacity-50" value={problemType} onChange={e => updateConfig({ problemType: e.target.value })}>
                  <option value="classification">Classification</option>
                  <option value="regression">Regression</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-accent flex items-center gap-2 border-b border-white/10 pb-3">
              <Layers className="w-4 h-4" /> Validation Strategy
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Evaluation Strategy</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={splitStrategy} onChange={e => updateConfig({ splitStrategy: e.target.value })}>
                  <option value="kfold">K-Fold Cross Validation</option>
                  {problemType === 'classification' && <option value="stratified_kfold">Stratified K-Fold CV</option>}
                  <option value="holdout">Hold-Out Split (Train/Test)</option>
                </select>
              </div>
              
              {splitStrategy === 'holdout' ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-semibold text-text-secondary">Test Set Size</label>
                    <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">{Math.round(testSize * 100)}%</span>
                  </div>
                  <input type="range" className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-primary" min="0.05" max="0.5" step="0.05" value={testSize} onChange={e => updateConfig({ testSize: e.target.value })} />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Number of Folds K</label>
                  <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" min="2" max="20" value={numFolds} onChange={e => updateConfig({ numFolds: e.target.value })} />
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Repeats</label>
                  <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" min="1" max="10" value={repeats} onChange={e => updateConfig({ repeats: e.target.value })} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Random Seed</label>
                  <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none font-mono" value={randomSeed} onChange={e => updateConfig({ randomSeed: e.target.value })} />
                </div>
              </div>
              
              <label className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-black/10 cursor-pointer hover:bg-black/20 transition-colors group">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary" checked={shuffle} onChange={e => updateConfig({ shuffle: e.target.checked })} />
                <span className="text-sm font-medium text-text-primary group-hover:text-white transition-colors">Shuffle Data prior to split</span>
              </label>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-secondary flex items-center gap-2 border-b border-white/10 pb-3">
              <Settings className="w-4 h-4" /> ELM Architecture
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1 flex justify-between">
                  <span>Hidden Neurons</span>
                  <span className="text-xs text-text-muted font-normal">(Capacity)</span>
                </label>
                <input type="number" className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none font-mono text-secondary" min="1" max="5000" value={hiddenNodes} onChange={e => updateConfig({ hiddenNodes: e.target.value })} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Hidden Activation</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={activation} onChange={e => updateConfig({ activation: e.target.value })}>
                  <option value="sigmoid">Sigmoid (Logistic)</option>
                  <option value="relu">ReLU (Rectified Linear)</option>
                  <option value="tanh">Tanh (Hyperbolic Tangent)</option>
                  <option value="sine">Sine</option>
                </select>
              </div>
            </div>
          </div>

          <button 
            className="w-full bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg hover:shadow-primary/30 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 text-lg mb-6 group relative overflow-hidden"
            onClick={handleTrain}
            disabled={loading}
          >
            {loading ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Training in Progress...</>
            ) : (
              <><Play className="w-5 h-5 fill-current" /> Initialize Training Protocol</>
            )}
            {!loading && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-[-1] rounded-xl"></div>}
          </button>
        </div>

        {/* RIGHT COLUMN: PIPELINE & RESULTS */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          <div className="glass-panel p-6 rounded-2xl shadow-lg border-l-4 border-l-info">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2"><Activity className="w-5 h-5 text-info" /> Preprocessing Pipeline</h3>
            {renderPipelineSummary()}
          </div>

          <AnimatePresence mode="popLayout">
            {error && (
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="bg-error/10 border border-error/30 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-error">Training Execution Failed</div>
                  <div className="text-sm text-error/80 mt-1">{error}</div>
                </div>
              </motion.div>
            )}

            {!results && !loading && !error && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 glass-panel border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <BrainCircuit className="w-10 h-10 text-primary opacity-50" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Awaiting Training Request</h3>
                <p className="text-text-muted max-w-md mx-auto mb-8">
                  Configure your target variable and model parameters on the left pane, then click Initialize Training Protocol to begin the learning process.
                </p>
                <div className="flex gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-full border border-white/5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Fast ELM Engine</span>
                  <span className="flex items-center gap-1 bg-black/20 px-3 py-1.5 rounded-full border border-white/5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Auto CV Reporting</span>
                </div>
              </motion.div>
            )}

            {results && (
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="glass-panel p-6 rounded-2xl flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <BrainCircuit className="w-48 h-48" />
                </div>
                
                <div className="flex bg-black/20 p-1.5 rounded-lg border border-white/5 w-fit mb-6 relative z-10">
                  <button className={classNames("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all", activeTab === 'summary' ? "bg-surface-card text-white shadow" : "text-text-muted hover:text-white")} onClick={() => setActiveTab('summary')}>
                    <BarChart2 className="w-4 h-4" /> Global Summary
                  </button>
                  <button className={classNames("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all", activeTab === 'folds' ? "bg-surface-card text-white shadow" : "text-text-muted hover:text-white")} onClick={() => setActiveTab('folds')}>
                    <TableIcon className="w-4 h-4" /> Folds Details
                  </button>
                </div>

                <div className="relative z-10">
                  {activeTab === 'summary' && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
                      
                      {/* Metric Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {problemType === 'classification' ? (
                          <>
                            <div className="bg-gradient-to-br from-surface-card to-black/40 border border-white/5 rounded-xl p-5 hover:border-primary/50 transition-colors">
                              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-1 block">Mean Accuracy</span>
                              <div className="text-3xl font-bold text-white mb-2">{results.summary?.accuracy?.mean ? (results.summary.accuracy.mean * 100).toFixed(2) + '%' : 'N/A'}</div>
                              <span className="text-xs text-text-muted">±{(results.summary?.accuracy?.std * 100).toFixed(2)}% std</span>
                            </div>
                            <div className="bg-gradient-to-br from-surface-card to-black/40 border border-white/5 rounded-xl p-5 hover:border-success/50 transition-colors">
                              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-1 block">Mean F1-Score</span>
                              <div className="text-3xl font-bold text-success mb-2">{results.summary?.f1_score?.mean?.toFixed(4) || 'N/A'}</div>
                              <span className="text-xs text-text-muted">±{results.summary?.f1_score?.std?.toFixed(4)} std</span>
                            </div>
                            <div className="bg-gradient-to-br from-surface-card to-black/40 border border-white/5 rounded-xl p-5 hover:border-info/50 transition-colors">
                              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-1 block">Mean Precision</span>
                              <div className="text-3xl font-bold text-info mb-2">{results.summary?.precision?.mean?.toFixed(4) || 'N/A'}</div>
                              <span className="text-xs text-text-muted">±{results.summary?.precision?.std?.toFixed(4)} std</span>
                            </div>
                            <div className="bg-gradient-to-br from-surface-card to-black/40 border border-white/5 rounded-xl p-5 hover:border-accent/50 transition-colors">
                              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-1 block">Mean Recall</span>
                              <div className="text-3xl font-bold text-accent mb-2">{results.summary?.recall?.mean?.toFixed(4) || 'N/A'}</div>
                              <span className="text-xs text-text-muted">±{results.summary?.recall?.std?.toFixed(4)} std</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-gradient-to-br from-surface-card to-black/40 border border-white/5 rounded-xl p-5 hover:border-success/50 transition-colors md:col-span-2">
                              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-1 block">Mean R² Score</span>
                              <div className="text-3xl font-bold text-success mb-2">{results.summary?.r2?.mean?.toFixed(4) || 'N/A'}</div>
                              <span className="text-xs text-text-muted">Higher is better (Max 1.0) ±{results.summary?.r2?.std?.toFixed(4)} std</span>
                            </div>
                            <div className="bg-gradient-to-br from-surface-card to-black/40 border border-white/5 rounded-xl p-5 hover:border-error/50 transition-colors bg-opacity-50">
                              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-1 block">Mean RMSE</span>
                              <div className="text-3xl font-bold text-error mb-2">{results.summary?.rmse?.mean?.toFixed(4) || 'N/A'}</div>
                              <span className="text-xs text-text-muted">Lower is better</span>
                            </div>
                            <div className="bg-gradient-to-br from-surface-card to-black/40 border border-white/5 rounded-xl p-5 hover:border-warning/50 transition-colors bg-opacity-50">
                              <span className="text-xs uppercase tracking-wider font-semibold text-text-muted mb-1 block">Mean MAE</span>
                              <div className="text-3xl font-bold text-warning mb-2">{results.summary?.mae?.mean?.toFixed(4) || 'N/A'}</div>
                              <span className="text-xs text-text-muted">Lower is better</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Charts Dashboard */}
                      {renderVisualizations()}

                    </motion.div>
                  )}
                  
                  {activeTab === 'folds' && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                      <h4 className="font-semibold text-white mb-4">Cross-Validation Detail Log</h4>
                      {renderFoldsTable()}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </motion.div>
  )
}
