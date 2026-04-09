import React, { useState, useEffect, lazy, Suspense } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Brain, Target, Layers, BarChart2, RefreshCw,
  ArrowLeft, AlertCircle, CheckCircle2, Activity, Hash, Sparkles
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { API_BASE } from '../../lib/constants'
import PageGuide from './elm/PageGuide'
import PageHeader from './elm/PageHeader'
import { PredictSVG } from './elm/AnimatedSVGs'

const NeuralNetworkViz = lazy(() => import('../three/NeuralNetworkViz'))

const API = API_BASE

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } }
}
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

export default function ELMPredictPage() {
  const { neural } = useApp()
  const inferenceModel = neural?.inferenceModel
  const analysis = neural?.analysis
  const trainingResults = neural?.trainingResults

  const [inputs, setInputs] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!inferenceModel?.features || !analysis?.summary_statistics) return
    const init = {}
    inferenceModel.features.forEach(f => {
      init[f] = analysis.summary_statistics[f]?.mean ?? 0
    })
    setInputs(init)
  }, [inferenceModel, analysis])

  if (!inferenceModel) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '4rem 1rem', textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.3 }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.5rem',
            background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertCircle size={36} style={{ color: '#fbbf24' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Model Trained</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Train an ELM model first to enable predictions.
          </p>
          <a
            href="/elm-studio/train"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '0.7rem 1.5rem', borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              color: 'white', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
            }}
          >
            <ArrowLeft size={16} /> Go to Training
          </a>
        </motion.div>
      </div>
    )
  }

  const { features, target, problem_type: problemType, classes } = inferenceModel

  const handleInputChange = (feature, value) => {
    setInputs(prev => ({ ...prev, [feature]: value }))
  }

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const payload = {}
      features.forEach(f => { payload[f] = parseFloat(inputs[f]) || 0 })
      const resp = await axios.post(`${API}/predict`, { data: payload })
      setResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed.')
    } finally {
      setLoading(false)
    }
  }

  const maxProb = result?.probabilities
    ? Math.max(...Object.values(result.probabilities))
    : 0

  // Summary metrics from training
  const summaryMetrics = trainingResults?.summary ?? {}

  return (
    <motion.div
      style={{ maxWidth: 900, margin: '0 auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Guide */}
      <PageGuide
        storageKey="elm_predict"
        what="Use your trained ELM model to make predictions on new data. Enter feature values and get instant predictions with confidence scores."
        steps={[
          'Review the model info bar below.',
          'Enter values for each feature.',
          'Click "Predict" for instant results with probability scores.',
        ]}
        concepts={[
          { term: 'Inference', def: 'Using a trained model to predict on new data' },
          { term: 'Probability', def: 'Confidence level for each class (0\u2013100%)' },
          { term: 'Min-Max Scaling', def: 'Inputs are auto-scaled to match training range' },
        ]}
      />

      {/* Header */}
      <PageHeader
        title="Real-Time Prediction"
        subtitle="Enter feature values below to get instant predictions"
        accentColor="#f59e0b"
        icon={<Zap size={22} />}
        illustration={<PredictSVG size={100} />}
      />

      {/* Model Info Bar — horizontal, no overlap */}
      <motion.div
        className="glass-panel"
        style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem' }}
        {...fadeUp}
        transition={{ delay: 0.05 }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap',
          fontSize: '0.82rem', color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-muted)' }}>Target:</span>
            <span style={{ fontWeight: 700, color: '#f59e0b' }}>{target}</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border-medium)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={14} style={{ color: '#c084fc', flexShrink: 0 }} />
            <span style={{ color: 'var(--text-muted)' }}>Type:</span>
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{problemType}</span>
          </div>
          <div style={{ width: 1, height: 16, background: 'var(--border-medium)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{features.length} features</span>
          </div>
          {classes?.length > 0 && (
            <>
              <div style={{ width: 1, height: 16, background: 'var(--border-medium)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Hash size={14} style={{ color: '#34d399', flexShrink: 0 }} />
                <span style={{ fontWeight: 600 }}>{classes.length} classes</span>
              </div>
            </>
          )}

          {/* Inline training metrics */}
          {summaryMetrics.accuracy?.mean != null && (
            <>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: '#34d399', fontWeight: 700, fontSize: '0.75rem' }}>
                  Acc: {(summaryMetrics.accuracy.mean * 100).toFixed(1)}%
                </span>
                {summaryMetrics.f1_score?.mean != null && (
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: 6, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', fontWeight: 700, fontSize: '0.75rem' }}>
                    F1: {(summaryMetrics.f1_score.mean * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Input Form */}
      <motion.div
        className="glass-panel"
        style={{ padding: '1.25rem', marginBottom: '1.25rem' }}
        {...fadeUp}
        transition={{ delay: 0.1 }}
      >
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <Activity size={16} style={{ color: '#f59e0b' }} /> Input Features
        </h3>

        <motion.div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          {features.map(feature => (
            <motion.div key={feature} className="input-group" variants={fadeUp} style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                {feature}
              </label>
              <input
                type="number"
                step="any"
                className="input-field"
                value={inputs[feature] ?? ''}
                onChange={e => handleInputChange(feature, e.target.value)}
                style={{ fontSize: '0.88rem' }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Predict Button */}
        <motion.button
          onClick={handlePredict}
          disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.98 } : {}}
          className={!loading ? 'btn-glow' : ''}
          style={{
            width: '100%', marginTop: '1.25rem', padding: '0.85rem',
            borderRadius: 12, border: 'none',
            background: loading ? 'var(--bg-card-subtle)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: loading ? 'var(--text-muted)' : 'white',
            fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.08em',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: loading ? 'none' : '0 4px 24px rgba(245,158,11,0.3)',
            transition: 'all 0.25s',
          }}
        >
          {loading ? <RefreshCw size={18} className="spin" /> : <Zap size={18} />}
          {loading ? 'Predicting...' : 'Predict'}
        </motion.button>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="glass-panel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '0.85rem 1rem', marginBottom: '1.25rem',
              borderLeft: '3px solid #ef4444',
              background: 'rgba(239,68,68,0.06)',
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#fca5a5', fontSize: '0.85rem'
            }}
          >
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="glass-panel"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            style={{
              padding: '2rem 1.5rem', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Decorative gradient glow */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.06) 0%, transparent 60%)',
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: '0.75rem' }}>
              <CheckCircle2 size={16} style={{ color: '#34d399' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                Prediction Result
              </span>
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', bounce: 0.4 }}
              style={{
                fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                padding: '0.25rem 0',
              }}
            >
              {result.prediction}
            </motion.div>

            {/* Probability Bars */}
            {result.probabilities && Object.keys(result.probabilities).length > 0 && (
              <div style={{ maxWidth: 480, margin: '1.5rem auto 0', textAlign: 'left' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Class Probabilities
                </div>
                {Object.entries(result.probabilities)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cls, prob], i) => {
                    const pct = (prob * 100).toFixed(1)
                    const isTop = prob === maxProb
                    return (
                      <div key={cls} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: '0.82rem' }}>
                          <span style={{ fontWeight: isTop ? 700 : 400, color: isTop ? '#f59e0b' : 'var(--text-muted)' }}>
                            {cls}
                          </span>
                          <span style={{ fontWeight: isTop ? 700 : 400, color: isTop ? '#f59e0b' : 'var(--text-muted)' }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{
                          width: '100%', height: 8, borderRadius: 4,
                          background: 'var(--bg-card-subtle)', overflow: 'hidden',
                          position: 'relative',
                        }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                              height: '100%', borderRadius: 4,
                              background: isTop
                                ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                                : 'var(--border-strong)',
                            }}
                          />
                          {isTop && (
                            <div className="shimmer-bar" style={{
                              position: 'absolute', inset: 0, borderRadius: 4,
                            }} />
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            <motion.button
              onClick={() => { setResult(null); setError(null) }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                marginTop: '1.5rem', padding: '0.5rem 1.5rem', borderRadius: 10,
                border: '1px solid var(--border-medium)', background: 'var(--bg-card-subtle)',
                color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              <RefreshCw size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              Reset
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
