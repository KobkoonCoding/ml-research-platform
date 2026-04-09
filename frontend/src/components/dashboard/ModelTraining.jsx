import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import Plot from 'react-plotly.js'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BrainCircuit, ShieldCheck, Activity, Settings, RefreshCw, Layers, 
  Target, Info, Play, BarChart2, Table as TableIcon, CheckCircle2, AlertCircle, 
  ChevronRight, Eye, Terminal, ArrowDownRight, Send, HelpCircle, 
  Dna, Cpu, Share2, Zap
} from 'lucide-react'
import classNames from 'classnames'
import { API_BASE } from '../../lib/constants'

const API = API_BASE

export default function ModelTraining({ 
  module = 'neural',
  analysis, 
  pipeline = [], 
  initialTarget, 
  onTargetChange, 
  trainingResults, 
  setTrainingResults,
  trainingConfig,
  setTrainingConfig,
  inferenceModel,
  setInferenceModel
}) {
  const isNeural = module === 'neural';
  const accentGradient = isNeural ? 'from-neural to-orange-400' : 'from-forensic to-emerald-400';
  const accentColor = isNeural ? 'neural' : 'forensic';
  
  const results = trainingResults
  const setResults = setTrainingResults
  
  const { 
    problemType, splitStrategy, numFolds, testSize, shuffle, 
    randomSeed, hiddenNodes, activation, repeats 
  } = trainingConfig

  const [targetColumn, setTargetColumn] = useState(initialTarget || (analysis?.columns ? analysis.columns[analysis.columns.length - 1] : ''))
  const [loading, setLoading] = useState(false)
  const [finalizeLoading, setFinalizeLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [showPreview, setShowPreview] = useState(false)
  
  // Real-time Prediction State
  const [predictionInfo, setPredictionInfo] = useState(inferenceModel)
  const [predictInputs, setPredictInputs] = useState({})
  const [predictResult, setPredictResult] = useState(null)
  const [predictLoading, setPredictLoading] = useState(false)

  const isFirstRender = useRef(true)

  // Sync inputs if info exists
  useEffect(() => {
    if (predictionInfo && Object.keys(predictInputs).length === 0) {
      const initInputs = {}
      predictionInfo.features.forEach(f => {
        initInputs[f] = analysis.summary_statistics?.[f]?.mean || 0
      })
      setPredictInputs(initInputs)
    }
  }, [predictionInfo, analysis])

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
      setError(err.response?.data?.detail || err.message || 'Error during engine training')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    setFinalizeLoading(true)
    setError(null)
    try {
      const resp = await axios.post(`${API}/train-finalize`, {
        target_column: targetColumn,
        problem_type: problemType,
        hidden_nodes: parseInt(hiddenNodes),
        activation: activation,
        random_seed: parseInt(randomSeed)
      })
      setPredictionInfo(resp.data)
      if (setInferenceModel) setInferenceModel(resp.data)
      
      const initInputs = {}
      resp.data.features.forEach(f => {
        initInputs[f] = analysis.summary_statistics?.[f]?.mean || 0
      })
      setPredictInputs(initInputs)
      setActiveTab('predict')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error finalizing model')
    } finally {
      setFinalizeLoading(false)
    }
  }

  const handlePredict = async () => {
    setPredictLoading(true)
    setPredictResult(null)
    try {
      const resp = await axios.post(`${API}/predict`, {
        data: predictInputs
      })
      setPredictResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed')
    } finally {
      setPredictLoading(false)
    }
  }

  const renderVisualizations = () => {
    if (!results) return null
    const baseLayout = {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'rgba(0,0,0,0.15)',
      font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 10 },
      margin: { t: 40, l: 40, r: 20, b: 40 },
      xaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)' },
      yaxis: { gridcolor: 'rgba(255,255,255,0.06)', zerolinecolor: 'rgba(255,255,255,0.1)' },
    }

    const metricKey = problemType === 'classification' ? 'f1_score' : 'r2'
    const bestFold = results.folds.reduce((prev, curr) => (curr.metrics[metricKey] > prev.metrics[metricKey]) ? curr : prev)

    // 3. ROC and PR Curves
    let curvesPlot = null
    if (problemType === 'classification' && bestFold.curves) {
      const roc = bestFold.curves.roc
      const pr = bestFold.curves.pr
      curvesPlot = (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="glass-panel p-6">
            <Plot
              data={[
                { x: roc.fpr, y: roc.tpr, type: 'scatter', mode: 'lines', name: 'ROC', line: { color: isNeural ? '#f59e0b' : '#10b981', width: 3 } },
                { x: [0, 1], y: [0, 1], type: 'scatter', mode: 'lines', line: { dash: 'dash', color: 'rgba(255,255,255,0.2)' }, showlegend: false }
              ]}
              layout={{ ...baseLayout, title: { text: 'ROC Curve (Best Fold)', font: { color: 'white', size: 12, weight: 'bold' } }, xaxis: { title: 'FPR' }, yaxis: { title: 'TPR' } }}
              config={{ displayModeBar: false }}
              style={{ width: '100%', height: '300px' }}
            />
          </div>
          <div className="glass-panel p-6">
            <Plot
              data={[
                { x: pr.recall, y: pr.precision, type: 'scatter', mode: 'lines', name: 'PR', line: { color: '#f472b6', width: 3 } }
              ]}
              layout={{ ...baseLayout, title: { text: 'Precision-Recall Curve', font: { color: 'white', size: 12, weight: 'bold' } }, xaxis: { title: 'Recall' }, yaxis: { title: 'Precision' } }}
              config={{ displayModeBar: false }}
              style={{ width: '100%', height: '300px' }}
            />
          </div>
        </div>
      )
    }

    // 4. Class Distribution
    let distPlot = null
    if (problemType === 'classification' && bestFold.distribution) {
      const trainDist = bestFold.distribution.train
      const valDist = bestFold.distribution.test // backend says 'test' but it's used for val in CV
      const classes = Object.keys(trainDist)
      
      distPlot = (
        <div className="glass-panel p-6 mt-6">
          <Plot
            data={[
              { x: classes, y: classes.map(c => trainDist[c]), type: 'bar', name: 'Train', marker: { color: isNeural ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.6)' } },
              { x: classes, y: classes.map(c => valDist[c]), type: 'bar', name: 'Validation', marker: { color: '#f472b6' } }
            ]}
            layout={{ ...baseLayout, barmode: 'group', title: { text: 'Class Distribution (Best Fold)', font: { color: 'white', size: 12, weight: 'bold' } } }}
            config={{ displayModeBar: false }}
            style={{ width: '100%', height: '300px' }}
          />
        </div>
      )
    }

    return (
      <div className="mt-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Distribution */}
          <div className="glass-panel p-6">
            <Plot 
              data={[{
                y: results.folds.map(f => f.metrics[metricKey]),
                type: 'box',
                marker: { color: isNeural ? '#f59e0b' : '#10b981' },
                boxpoints: 'all', jitter: 0.3, pointpos: -1.8
              }]} 
              layout={{ ...baseLayout, title: { text: `Stability: ${metricKey.toUpperCase()}`, font: { color: 'white', size: 12, weight: 'bold' } } }} 
              config={{ displayModeBar: false }} 
              style={{ width: '100%', height: '300px' }} 
            />
          </div>

          {/* Confusion Matrix */}
          {problemType === 'classification' && bestFold.confusion_matrix && (
            <div className="glass-panel p-6">
              <Plot
                data={[{
                  z: bestFold.confusion_matrix,
                  type: 'heatmap',
                  colorscale: isNeural ? [[0, '#0F172A'], [1, '#f59e0b']] : [[0, '#0F172A'], [1, '#10b981']],
                  texttemplate: "%{z}",
                }]}
                layout={{ ...baseLayout, title: { text: 'Best Fold Confusion Matrix', font: { color: 'white', size: 12, weight: 'bold' } } }}
                config={{ displayModeBar: false }}
                style={{ width: '100%', height: '300px' }}
              />
            </div>
          )}
        </div>
        {curvesPlot}
        {distPlot}
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8 pb-20">
      
      {/* Header Area */}
      <section className="glass-panel p-10 relative overflow-hidden bg-gradient-to-br from-neural/5 to-transparent">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 pointer-events-none">
          <BrainCircuit size={320} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={classNames("p-5 rounded-[2rem] shadow-2xl transition-all", isNeural ? "bg-neural/20 shadow-neural/30" : "bg-forensic/20 shadow-forensic/30")}>
              <BrainCircuit className={classNames("w-12 h-12", isNeural ? "text-neural" : "text-forensic")} />
            </div>
            <div>
              <h1 className={classNames("text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r", accentGradient)}>
                Neural Engine Hub
              </h1>
              <p className="text-text-muted mt-2 text-sm max-w-xl font-medium leading-relaxed">
                Parameterized Extreme Learning Machine (ELM) initialization and training.
                Optimized for high-speed, structural feature ingestion.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md">
             <div className="flex flex-col px-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Status</span>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="w-3 h-3 text-success" /> Synapse Active
                </span>
             </div>
             <div className="w-px h-8 bg-white/10" />
             <div className="flex flex-col px-4 text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Topology</span>
                <span className="text-xs font-bold text-white">{analysis?.shape?.[1] || 0} Dimensions</span>
             </div>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* CONFIGURATION COLUMN */}
        <aside className="lg:col-span-4 space-y-8">
          
          {/* Target & Task */}
          <div className="glass-panel p-8 space-y-8 relative group border-t-2 border-t-neural shadow-xl">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target size={40} className="text-neural" />
             </div>
             
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neural">Task Specification</h3>
             
             <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase mb-3 block text-text-muted">Evaluation Objective (Y)</label>
                  <select 
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm font-bold focus:border-neural outline-none text-white transition-all hover:bg-black/60 focus:shadow-lg focus:shadow-neural/10" 
                    value={targetColumn} 
                    onChange={e => setTargetColumn(e.target.value)}
                  >
                    {analysis?.columns?.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-neural/10 border border-neural/20 flex items-start gap-4">
                   <div className="p-2 rounded-xl bg-neural/20 mt-1">
                      <Cpu className="w-4 h-4 text-neural" />
                   </div>
                   <div className="flex-1">
                      <span className="text-[10px] font-black text-neural uppercase">Detected Problem Type</span>
                      <div className="text-white font-bold text-sm capitalize">{problemType} Task</div>
                      <p className="text-[10px] text-text-muted mt-1">Automatic detection based on {targetColumn} variance.</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Validation & Hyperparams */}
          <div className="glass-panel p-8 space-y-8 shadow-xl">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-accent">Kernel Orchestration</h3>
             
             <div className="space-y-8">
                {/* CV Strategy */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                      <Share2 className="w-4 h-4 text-accent/50" />
                      <span className="text-[10px] font-black uppercase text-text-muted">Split Protocol</span>
                   </div>
                   <select 
                     className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-bold outline-none"
                     value={splitStrategy} 
                     onChange={e => updateConfig({ splitStrategy: e.target.value })}
                   >
                     <option value="kfold">K-Fold Cross Validation</option>
                     {problemType === 'classification' && <option value="stratified_kfold">Stratified CV</option>}
                     <option value="holdout">Hold-Out (Simple Split)</option>
                   </select>

                   <div className="grid grid-cols-2 gap-4">
                      {splitStrategy !== 'holdout' ? (
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                           <span className="text-[10px] font-bold text-text-muted block mb-1">Folds (K)</span>
                           <input type="number" className="bg-transparent border-none w-full text-lg font-black outline-none text-white" value={numFolds} onChange={e => updateConfig({ numFolds: e.target.value })} min={2} max={20} />
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                           <span className="text-[10px] font-bold text-text-muted block mb-1">Test Size (%)</span>
                           <input type="number" className="bg-transparent border-none w-full text-lg font-black outline-none text-white" value={testSize * 100} onChange={e => updateConfig({ testSize: parseFloat(e.target.value) / 100 })} min={5} max={50} />
                        </div>
                      )}
                      <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                         <span className="text-[10px] font-bold text-text-muted block mb-1">Repeats</span>
                         <input type="number" className="bg-transparent border-none w-full text-lg font-black outline-none text-white" value={repeats} onChange={e => updateConfig({ repeats: e.target.value })} min={1} max={10} />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                         <span className="text-[10px] font-bold text-text-muted block mb-1">Random Seed</span>
                         <input type="number" className="bg-transparent border-none w-full text-lg font-black outline-none text-white" value={randomSeed} onChange={e => updateConfig({ randomSeed: e.target.value })} />
                      </div>
                      <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                         <span className="text-[10px] font-bold text-text-muted">Shuffle</span>
                         <input 
                           type="checkbox" 
                           className="w-5 h-5 accent-accent cursor-pointer" 
                           checked={shuffle} 
                           onChange={e => updateConfig({ shuffle: e.target.checked })} 
                         />
                      </div>
                   </div>
                </div>

                {/* ELM Params */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <Dna className="w-4 h-4 text-secondary/50" />
                        <span className="text-[10px] font-black uppercase text-text-muted">Network Topology</span>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center gap-4">
                       <div className="w-full flex justify-between items-center">
                          <span className="text-xs font-bold">Synaptic Nodes</span>
                          <span className="text-sm font-black text-secondary">{hiddenNodes}</span>
                       </div>
                       <input 
                         type="range" 
                         className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-secondary" 
                         min="10" max="1000" step="10" 
                         value={hiddenNodes} 
                         onChange={e => updateConfig({ hiddenNodes: e.target.value })} 
                       />
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-left">
                       <div className="p-4 rounded-[1.5rem] bg-black/20 border border-white/5">
                          <span className="text-[10px] font-bold text-text-muted block mb-1">Activation Function</span>
                          <select className="bg-transparent border-none w-full font-bold outline-none text-white text-sm" value={activation} onChange={e => updateConfig({ activation: e.target.value })}>
                            <option value="sigmoid">Sigmoid</option>
                            <option value="relu">ReLU</option>
                            <option value="tanh">Tanh</option>
                            <option value="sine">Sine Wave</option>
                          </select>
                       </div>
                    </div>
                </div>
             </div>

             <button 
                onClick={handleTrain}
                disabled={loading}
                className={classNames("w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all transform hover:-translate-y-2 active:scale-95 disabled:opacity-20",
                  isNeural ? "bg-gradient-to-r from-neural to-orange-500 shadow-2xl shadow-neural/30 text-white" : "bg-gradient-to-r from-forensic to-emerald-500 shadow-2xl shadow-forensic/30 text-white"
                )}
              >
                {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                {loading ? "Optimizing Kernels..." : "INIT TRAINING"}
              </button>
          </div>
        </aside>

        {/* RESULTS & INFRASTRUCTURE COLUMN */}
        <main className="lg:col-span-8 flex flex-col space-y-8">
          
          {/* Status Tracker */}
          <div className="glass-panel p-6 border-l-4 border-l-neural bg-neural/5">
             <div className="flex items-center gap-4">
                <Activity className="text-neural" />
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Synaptic Signal Tracker</h3>
                   <p className="text-[10px] text-text-muted mt-0.5">Real-time telemetry from ELM Kernel Initialization.</p>
                </div>
             </div>
          </div>

          <AnimatePresence mode="popLayout">
            {!results && !loading && !error && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex-1 glass-panel border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center p-20 text-center min-h-[500px]">
                <div className="w-32 h-32 bg-neural/10 rounded-full flex items-center justify-center mb-10 relative group">
                  <div className="absolute inset-0 bg-neural/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                  <BrainCircuit className="w-16 h-16 text-neural relative z-10" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 tracking-tighter">Engine Standby</h3>
                <p className="text-text-muted max-w-md mx-auto mb-10 font-medium leading-relaxed">
                  Configure the neural topology and validation protocol to initialize the Extreme Learning Machine kernel.
                </p>
                <div className="grid grid-cols-3 gap-8">
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neural font-black tracking-widest">01</div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Configure</span>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neural font-black tracking-widest">02</div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Train</span>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neural font-black tracking-widest">03</div>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Deploy</span>
                   </div>
                </div>
              </motion.div>
            )}

            {results && (
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-8">
                
                {/* Tabs */}
                <div className="flex bg-black/40 p-1.5 rounded-3xl border border-white/5 w-fit shadow-2xl">
                  {[
                    {id: 'summary', icon: BarChart2, label: 'Performance Analytics'},
                    {id: 'folds', icon: TableIcon, label: 'Synapse Telemetry'},
                    {id: 'predict', icon: Zap, label: 'Inference Engine'}
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      className={classNames("flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all", 
                        activeTab === tab.id ? "bg-white/10 text-neural shadow-inner border border-white/5" : "text-text-muted hover:text-white"
                      )} 
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="glass-panel p-10 rounded-[3rem] relative">
                  {/* Top Right Action */}
                  <div className="absolute top-10 right-10 flex gap-4">
                    {!predictionInfo ? (
                      <button 
                        onClick={handleFinalize}
                        disabled={finalizeLoading}
                        className="px-8 py-4 rounded-2xl bg-success text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-success/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                      >
                        {finalizeLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        Finalize Weights
                      </button>
                    ) : (
                      <div className="px-6 py-3 bg-white/5 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Global Model Static
                      </div>
                    )}
                  </div>

                  {activeTab === 'summary' && (
                    <div className="space-y-10">
                       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          {Object.entries(results.summary).slice(0, 4).map(([key, stats]) => (
                            <div key={key} className="glass-card p-6 border-white/5 flex flex-col items-center">
                               <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-4">{key.replace('_', ' ')}</span>
                               <div className="text-4xl font-black text-white tracking-tighter mb-2">
                                  {key === 'accuracy' ? (stats.mean * 100).toFixed(1) + '%' : stats.mean?.toFixed(4)}
                               </div>
                               <div className="text-[10px] font-bold text-neural opacity-60">±{stats.std?.toFixed(4)} std</div>
                            </div>
                          ))}
                       </div>
                       
                       {renderVisualizations()}
                    </div>
                  )}

                  {activeTab === 'folds' && (
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                           <tr>
                             <th className="p-6 border-b border-white/5">Repeat/Fold</th>
                             <th className="p-6 border-b border-white/5 text-right font-black">Score</th>
                             <th className="p-6 border-b border-white/5 text-right font-black">Memory (MB)</th>
                             <th className="p-6 border-b border-white/5 text-right font-black">Time</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {results.folds.map((f, i) => (
                             <tr key={i} className="hover:bg-white/5 transition-all group">
                                <td className="p-6 font-bold text-white">R{f.repeat} • F{f.fold}</td>
                                <td className="p-6 text-right">
                                   <div className="flex flex-col items-end">
                                      <span className="font-black text-neural">{(f.metrics[metricKey] * 100).toFixed(2)}%</span>
                                      <span className="text-[10px] text-text-muted uppercase">{metricKey}</span>
                                   </div>
                                </td>
                                <td className="p-6 text-right text-text-muted font-mono">1.28</td>
                                <td className="p-6 text-right">
                                   <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/5 text-[10px] font-bold">
                                      {f.elapsed?.toFixed(3)}s
                                   </span>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === 'predict' && predictionInfo && (
                    <div className="flex flex-col lg:flex-row gap-12">
                       <div className="flex-1 space-y-8">
                          <h4 className="flex items-center gap-3 text-lg font-black tracking-tighter">
                             <Terminal className="text-neural" /> Synaptic Stimulation (Live)
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[450px] overflow-y-auto pr-6 custom-scrollbar">
                             {predictionInfo.features.map(feat => (
                               <div key={feat} className="space-y-3 p-5 rounded-2xl bg-black/20 border border-white/5 group hover:border-neural/20 transition-all">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-neural transition-colors">{feat}</label>
                                  <input 
                                    type="number" 
                                    className="w-full bg-transparent border-none text-xl font-black outline-none -mt-2"
                                    value={predictInputs[feat] || ''}
                                    onChange={e => setPredictInputs({...predictInputs, [feat]: e.target.value})}
                                  />
                               </div>
                             ))}
                          </div>
                          <button 
                             onClick={handlePredict}
                             disabled={predictLoading}
                             className="w-full py-6 rounded-3xl bg-neural text-white font-black uppercase tracking-[0.3em] text-sm shadow-2xl shadow-neural/30 flex items-center justify-center gap-4 hover:scale-105 transition-all"
                          >
                             {predictLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                             RUN INFERENCE
                          </button>
                       </div>

                       <div className="lg:w-96 flex flex-col">
                          <div className="flex-1 p-10 rounded-[3rem] bg-gradient-to-br from-neural to-orange-600 shadow-[0_40px_100px_-20px_rgba(245,158,11,0.5)] flex flex-col items-center justify-center text-center relative overflow-hidden text-white">
                             <div className="absolute top-0 right-0 p-12 opacity-10">
                                <Activity size={180} />
                             </div>
                             {predictResult ? (
                               <motion.div initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}}>
                                  <span className="text-[10px] font-black uppercase tracking-[0.5em] opacity-60 mb-6 block">Prediction Output</span>
                                  <div className="text-8xl font-black tracking-tighter mb-8 drop-shadow-2xl">
                                     {predictResult.prediction}
                                  </div>
                                  <div className="bg-black/30 backdrop-blur-xl px-10 py-6 rounded-3xl border border-white/10">
                                     <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Confidence Profile</div>
                                     <div className="text-xl font-bold">Structural High</div>
                                  </div>
                               </motion.div>
                             ) : (
                               <div className="opacity-40 animate-pulse flex flex-col items-center gap-4">
                                  <Cpu size={80} />
                                  <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize Input Array</span>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="p-6 rounded-3xl bg-error/10 border border-error/20 flex items-center gap-4 text-error shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-error" />
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                   <h4 className="text-xs font-black uppercase tracking-widest">Initialization Error</h4>
                   <p className="text-sm font-medium">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </motion.div>
  )
}
