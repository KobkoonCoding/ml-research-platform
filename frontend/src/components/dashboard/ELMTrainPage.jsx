import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Play, Settings2, ChevronDown, ChevronUp,
  Brain, Loader2, AlertTriangle, Zap, Layers, Hash,
  Shuffle, RotateCcw, Info
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { API_BASE } from '../../lib/constants'
import ELMResultsPanel from './elm/ELMResultsPanel'
import PageGuide from './elm/PageGuide'
import PageHeader from './elm/PageHeader'
import { NetworkSVG } from './elm/AnimatedSVGs'

const NeuralNetworkViz = lazy(() => import('../three/NeuralNetworkViz'))

const API = API_BASE

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

/* ── Default settings info cards ── */
const DEFAULTS_INFO = [
  {
    icon: Zap, label: 'Activation', color: '#f59e0b',
    getValue: (c) => c.activation ?? 'sigmoid',
    desc: 'Sigmoid maps values to 0\u20131 range. General-purpose and stable for ELM hidden layers.',
  },
  {
    icon: Layers, label: 'Validation', color: '#60a5fa',
    getValue: (c) => c.splitStrategy === 'holdout' ? `Holdout ${Math.round((c.testSize ?? 0.2) * 100)}%` : `${c.numFolds ?? 5}-Fold CV`,
    desc: 'K-Fold Cross-Validation splits data into K parts, trains on K\u22121 and validates on 1. Repeats K times for robust metrics.',
  },
  {
    icon: Brain, label: 'Hidden Nodes', color: '#c084fc',
    getValue: (c) => String(c.hiddenNodes ?? 100),
    desc: 'Number of random neurons in the hidden layer. More nodes = more capacity but slower training.',
  },
  {
    icon: Shuffle, label: 'Shuffle', color: '#34d399',
    getValue: (c) => (c.shuffle ?? true) ? 'Enabled' : 'Disabled',
    desc: 'Randomizes data order before splitting to prevent ordering bias in validation.',
  },
]

/* ── Loading phases ── */
const LOADING_PHASES = [
  'Preparing data...',
  'Training model...',
  'Computing metrics...',
]

/* ═══════════════════════════════════════════════════════════
   ELM TRAIN PAGE
   ═══════════════════════════════════════════════════════════ */
export default function ELMTrainPage() {
  const navigate = useNavigate()
  const { neural, setNeuralData } = useApp()

  if (!neural?.analysis || !neural?.targetColumn) {
    return <Navigate to="/elm-studio/setup" replace />
  }

  const analysis = neural.analysis
  const rows = analysis.shape?.[0] ?? 0
  const features = neural.selectedFeatures ?? []
  const numFeatures = features.length || 1
  const maxHidden = Math.min(10 * numFeatures, rows)

  const config = neural.trainingConfig ?? {}
  const problemType = config.problemType ?? 'classification'
  const hiddenNodes = config.hiddenNodes ?? 100
  const activation = config.activation ?? 'sigmoid'
  const splitStrategy = config.splitStrategy ?? 'kfold'
  const numFolds = config.numFolds ?? 5
  const testSize = config.testSize ?? 0.2
  const repeats = config.repeats ?? 1
  const randomSeed = config.randomSeed ?? 42
  const shuffle = config.shuffle ?? true

  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingPhase, setLoadingPhase] = useState(0)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [finalizing, setFinalizing] = useState(false)

  const results = neural.trainingResults ?? null

  // Cycle through loading phases
  useEffect(() => {
    if (!loading) { setLoadingPhase(0); return }
    const timer = setInterval(() => {
      setLoadingPhase(p => (p + 1) % LOADING_PHASES.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [loading])

  const updateConfig = (patch) => {
    setNeuralData({ trainingConfig: { ...config, ...patch } })
  }

  const handleTrain = async () => {
    setLoading(true)
    setError(null)
    setNeuralData({ trainingResults: null })
    setActiveTab('summary')
    try {
      const resp = await axios.post(`${API}/train`, {
        target_column: neural.targetColumn,
        features,
        problem_type: problemType,
        split_strategy: splitStrategy,
        num_folds: parseInt(numFolds, 10),
        test_size: parseFloat(testSize),
        shuffle,
        random_seed: parseInt(randomSeed, 10),
        hidden_nodes: parseInt(hiddenNodes, 10),
        activation,
        repeats: parseInt(repeats, 10),
      })
      setNeuralData({ trainingResults: resp.data })
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Training failed')
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    setError(null)
    try {
      const resp = await axios.post(`${API}/train-finalize`, {
        target_column: neural.targetColumn,
        features,
        problem_type: problemType,
        split_strategy: splitStrategy,
        num_folds: parseInt(numFolds, 10),
        test_size: parseFloat(testSize),
        shuffle,
        random_seed: parseInt(randomSeed, 10),
        hidden_nodes: parseInt(hiddenNodes, 10),
        activation,
        repeats: parseInt(repeats, 10),
      })
      setNeuralData({
        inferenceModel: {
          features: resp.data.features,
          target: resp.data.target,
          problem_type: problemType,
          classes: resp.data.classes ?? [],
        }
      })
      navigate('/elm-studio/predict')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Finalization failed')
    } finally {
      setFinalizing(false)
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Guide */}
      <PageGuide
        storageKey="elm_train"
        what="Train an Extreme Learning Machine (ELM) model on your data. ELM is a fast neural network that trains in milliseconds using random hidden layer weights and a closed-form solution. Cross-validation ensures your results are reliable."
        steps={[
          'Review or adjust the number of hidden nodes and activation function.',
          'Optionally open Advanced Settings to change validation strategy.',
          'Click "Start ELM Training" to train and evaluate the model.',
          'Review metrics and charts to assess model performance.',
          'Click "Finalize & Predict" when satisfied to enable real-time predictions.',
        ]}
        concepts={[
          { term: 'ELM', def: 'Extreme Learning Machine \u2014 a single-hidden-layer neural network with random weights' },
          { term: 'Cross-Validation', def: 'Training on different subsets to get reliable performance estimates' },
          { term: 'Hidden Nodes', def: 'Neurons in the hidden layer. More = more complex model' },
          { term: 'Overfitting', def: 'Model memorizes training data but fails on new data' },
        ]}
      />

      {/* Header */}
      <PageHeader
        title="Model Training"
        subtitle={`${rows.toLocaleString()} samples \u00b7 ${features.length} features \u00b7 Target: ${neural.targetColumn} \u00b7 ${problemType}`}
        accentColor="#f59e0b"
        icon={<Brain size={22} />}
        illustration={<NetworkSVG size={100} />}
      />
      {results && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem', marginTop: '-0.5rem' }}>
          <motion.button
            onClick={() => navigate('/elm-studio/predict')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.65rem 1.25rem', borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: '#fff', border: 'none', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
            }}
          >
            Next: Predict <ArrowRight size={15} />
          </motion.button>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>

        {/* LEFT: Configuration */}
        <motion.div {...fadeIn} transition={{ delay: 0.05 }} style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Quick Settings */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings2 size={16} style={{ color: '#60a5fa' }} /> Configuration
            </h3>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Brain size={13} /> Hidden Neurons
              </label>
              <input
                type="number" className="input-field"
                min="1" max="10000"
                value={hiddenNodes}
                onChange={e => updateConfig({ hiddenNodes: e.target.value })}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Recommended: {numFeatures}\u2013{maxHidden} (d to min(10d, n))
              </p>
            </div>

            <div className="input-group" style={{ marginTop: '0.75rem' }}>
              <label className="input-label">Activation Function</label>
              <select className="select-field" value={activation} onChange={e => updateConfig({ activation: e.target.value })}>
                <option value="sigmoid">Sigmoid</option>
                <option value="relu">ReLU</option>
                <option value="tanh">Tanh</option>
                <option value="sine">Sine</option>
              </select>
            </div>
          </div>

          {/* Defaults Info Panel — shows when Advanced is CLOSED */}
          <AnimatePresence>
            {!advancedOpen && (
              <motion.div
                className="glass-panel"
                style={{ padding: '1rem' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Info size={13} /> Current Settings
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {DEFAULTS_INFO.map(d => (
                    <div
                      key={d.label}
                      title={d.desc}
                      style={{
                        padding: '0.55rem 0.6rem', borderRadius: 8,
                        background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
                        cursor: 'help',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <d.icon size={12} style={{ color: d.color }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{d.label}</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: d.color }}>{d.getValue(config)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>{d.desc}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advanced Settings */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <button
              onClick={() => setAdvancedOpen(prev => !prev)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'none', border: 'none', color: '#818cf8', fontWeight: 600,
                fontSize: '0.95rem', cursor: 'pointer', padding: 0,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={16} /> Advanced Settings
              </span>
              {advancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <AnimatePresence>
              {advancedOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden', marginTop: '1rem' }}
                >
                  <div className="input-group">
                    <label className="input-label">Split Strategy</label>
                    <select className="select-field" value={splitStrategy} onChange={e => updateConfig({ splitStrategy: e.target.value })}>
                      <option value="kfold">K-Fold CV</option>
                      {problemType === 'classification' && <option value="stratified_kfold">Stratified K-Fold CV</option>}
                      <option value="holdout">Hold-Out</option>
                    </select>
                  </div>

                  {splitStrategy === 'holdout' ? (
                    <div className="input-group" style={{ marginTop: '0.75rem' }}>
                      <label className="input-label">Test Size: {Math.round(testSize * 100)}%</label>
                      <input type="range" className="input-field" min="0.05" max="0.5" step="0.05"
                        value={testSize} onChange={e => updateConfig({ testSize: parseFloat(e.target.value) })} />
                    </div>
                  ) : (
                    <div className="input-group" style={{ marginTop: '0.75rem' }}>
                      <label className="input-label">Number of Folds</label>
                      <input type="number" className="input-field" min="2" max="20"
                        value={numFolds} onChange={e => updateConfig({ numFolds: e.target.value })} />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label">Repeats</label>
                      <input type="number" className="input-field" min="1" max="10"
                        value={repeats} onChange={e => updateConfig({ repeats: e.target.value })} />
                    </div>
                    <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label className="input-label"><Hash size={11} /> Seed</label>
                      <input type="number" className="input-field"
                        value={randomSeed} onChange={e => updateConfig({ randomSeed: e.target.value })} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.75rem' }}>
                    <input type="checkbox" id="elm_shuffle" checked={shuffle}
                      onChange={e => updateConfig({ shuffle: e.target.checked })} />
                    <label htmlFor="elm_shuffle" className="input-label" style={{ marginBottom: 0 }}>Shuffle Data</label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Train Button */}
          <motion.button
            onClick={handleTrain}
            disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            className={!loading ? 'btn-glow' : ''}
            style={{
              width: '100%', padding: '0.9rem',
              background: loading ? 'var(--bg-card-subtle)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: loading ? 'var(--text-muted)' : '#fff',
              border: loading ? '1px solid var(--surface-border)' : 'none',
              borderRadius: 12, fontSize: '0.95rem', fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(245,158,11,0.3)',
              transition: 'all 0.25s',
            }}
          >
            {loading ? (
              <><Loader2 size={18} className="spin" /> {LOADING_PHASES[loadingPhase]}</>
            ) : (
              <><Play size={18} /> Start ELM Training</>
            )}
          </motion.button>
        </motion.div>

        {/* RIGHT: Results */}
        <motion.div {...fadeIn} transition={{ delay: 0.1 }} style={{ flex: '1 1 550px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '0.85rem 1rem', borderRadius: 12,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#fca5a5', fontSize: '0.88rem',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <AlertTriangle size={16} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <AnimatePresence>
            {results && (
              <ELMResultsPanel
                results={results}
                problemType={problemType}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onFinalize={handleFinalize}
                finalizing={finalizing}
              />
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!results && !loading && !error && (
            <motion.div
              {...fadeIn} transition={{ delay: 0.15 }}
              style={{
                padding: '3.5rem 2rem', textAlign: 'center',
                background: 'var(--bg-card-subtle)',
                border: '1px dashed var(--surface-border)',
                borderRadius: 14, flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 64, height: 64, borderRadius: '50%', marginBottom: '1rem',
                  background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Brain size={32} style={{ color: '#f59e0b', opacity: 0.6 }} />
              </motion.div>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                Ready for Training
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', opacity: 0.7, maxWidth: 340 }}>
                {hiddenNodes} hidden neurons &middot; {activation} &middot; {splitStrategy === 'holdout' ? `holdout ${Math.round(testSize * 100)}%` : `${numFolds}-fold CV`}
              </p>
            </motion.div>
          )}

          {/* Loading state with 3D neural network */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '2rem', textAlign: 'center',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14, flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Suspense fallback={<Loader2 size={40} className="spin" style={{ color: '#f59e0b' }} />}>
                <NeuralNetworkViz
                  inputCount={Math.min(features.length, 5)}
                  hiddenCount={Math.min(parseInt(hiddenNodes, 10) || 6, 8)}
                  outputCount={1}
                  isTraining={true}
                  height={200}
                />
              </Suspense>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.3rem' }}>
                {LOADING_PHASES[loadingPhase]}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', opacity: 0.7 }}>
                {splitStrategy === 'holdout' ? 'Hold-out' : `${numFolds}-fold`} cross-validation with {repeats} repeat(s)
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
