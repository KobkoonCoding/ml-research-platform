import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BrainCircuit, ArrowRight, Database, Wand2, Target,
  Upload, Zap, ChevronRight, CheckCircle2, Layers,
  BarChart2, ShieldCheck, Sparkles
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import UploadDataset from './UploadDataset'
import PageGuide from './elm/PageGuide'

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

/* ── Module 2 intro section ── */
function ELMIntro() {
  const steps = [
    { icon: Database, label: 'Setup', desc: 'Configure target & features' },
    { icon: BrainCircuit, label: 'Train', desc: 'Build ELM model with cross-validation' },
    { icon: Target, label: 'Predict', desc: 'Real-time inference with probability' },
  ]

  return (
    <motion.div
      className="glass-panel"
      style={{ marginBottom: '1.5rem', padding: '1.5rem', position: 'relative', overflow: 'hidden' }}
      {...fadeIn}
      transition={{ delay: 0.05 }}
    >
      {/* Decorative gradient */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.15))',
          border: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <BrainCircuit size={20} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ELM Studio
          </h3>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Extreme Learning Machine &middot; Train &amp; Predict
          </p>
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1rem' }}>
        Build powerful classification and regression models using Extreme Learning Machines.
        Import data from Module 1 or upload new data, configure your model, and get real-time predictions with probability scores.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {steps.map((s, i) => (
          <div
            key={s.label}
            style={{
              flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.6rem 0.75rem', borderRadius: 10,
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(245,158,11,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <s.icon size={14} style={{ color: '#f59e0b' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Step {i + 1}: {s.label}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ── Import from Module 1 card ── */
function ImportFromModule1({ forensic, onImport }) {
  const hasData = !!forensic?.analysis
  const hasPipeline = (forensic?.pipeline?.length ?? 0) > 0
  const analysis = forensic?.analysis

  if (!hasData) return null

  const rows = analysis?.shape?.[0] ?? 0
  const cols = analysis?.shape?.[1] ?? 0
  const pipelineSteps = forensic?.pipeline?.length ?? 0

  return (
    <motion.div
      className="glass-panel"
      style={{ marginBottom: '1.5rem', padding: '1.25rem' }}
      {...fadeIn}
      transition={{ delay: 0.1 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <Layers size={18} style={{ color: '#10b981' }} />
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Import from Module 1
        </h3>
        <span style={{
          marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 600,
          padding: '0.2rem 0.5rem', borderRadius: 6,
          background: 'rgba(16,185,129,0.12)', color: '#34d399',
          border: '1px solid rgba(16,185,129,0.2)'
        }}>
          DATA READY
        </span>
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
        Use the dataset {hasPipeline ? 'and preprocessing pipeline ' : ''}from Data Forensic module.
        This saves time by reusing your cleaned and prepared data.
      </p>

      {/* Dataset info */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap'
      }}>
        <div style={{
          flex: '1 1 200px', padding: '0.75rem', borderRadius: 10,
          background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Database size={14} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dataset</span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {rows.toLocaleString()} rows &times; {cols} columns
          </div>
        </div>

        {hasPipeline && (
          <div style={{
            flex: '1 1 200px', padding: '0.75rem', borderRadius: 10,
            background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Wand2 size={14} style={{ color: '#c084fc' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>Pipeline</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {pipelineSteps} preprocessing step{pipelineSteps !== 1 ? 's' : ''} applied
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onImport}
        style={{
          width: '100%', padding: '0.8rem', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white', fontWeight: 700, fontSize: '0.9rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(16,185,129,0.25)',
          transition: 'all 0.2s',
        }}
      >
        <CheckCircle2 size={18} />
        Use Module 1 Data {hasPipeline ? '& Pipeline' : ''}
        <ArrowRight size={16} />
      </button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   UPLOAD PAGE — adapts per module
   ═══════════════════════════════════════════════════════════ */
export default function UploadPage({ module = 'forensic' }) {
  const navigate = useNavigate()
  const { forensic, setForensicData, setNeuralData } = useApp()
  const [showFreshUpload, setShowFreshUpload] = useState(false)

  const onSuccess = (analysis) => {
    if (module === 'forensic') {
      setForensicData({
        analysis,
        originalAnalysis: analysis,
        pipeline: [],
        targetColumn: ''
      })
      navigate('/forensic/analysis')
    } else if (module === 'neural') {
      setNeuralData({
        analysis,
        originalAnalysis: analysis,
        targetColumn: '',
        selectedFeatures: [],
        droppedColumns: [],
        trainingResults: null,
        inferenceModel: null,
      })
      navigate('/elm-studio/setup')
    }
  }

  const handleImportFromModule1 = () => {
    if (!forensic?.analysis) return
    setNeuralData({
      analysis: forensic.analysis,
      originalAnalysis: forensic.originalAnalysis ?? forensic.analysis,
      targetColumn: forensic.targetColumn ?? '',
      selectedFeatures: [],
      droppedColumns: [],
      trainingResults: null,
      inferenceModel: null,
    })
    navigate('/elm-studio/setup')
  }

  /* ── Forensic module: simple upload ── */
  if (module === 'forensic') {
    return <UploadDataset module={module} onUploadSuccess={onSuccess} />
  }

  /* ── Neural module: intro + import from Module 1 + fresh upload ── */
  const hasForensicData = !!forensic?.analysis

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Intro */}
      <ELMIntro />

      {/* Guide */}
      <PageGuide
        storageKey="elm_upload"
        what="This is where you import or upload data for machine learning. Your dataset should be a CSV or Excel file with rows (samples) and columns (features). You can also reuse data already prepared in Module 1."
        steps={[
          'Import cleaned data from Module 1 (recommended) OR upload a new CSV/Excel file.',
          'The system will automatically analyze your data and detect column types.',
          'Proceed to Setup to select your target variable and configure features.',
        ]}
        concepts={[
          { term: 'Dataset', def: 'A table of data with rows (samples) and columns (features)' },
          { term: 'Features', def: 'Input columns the model uses to make predictions' },
          { term: 'Target', def: 'The column you want to predict (selected in next step)' },
        ]}
      />

      {/* Import from Module 1 */}
      {hasForensicData && (
        <ImportFromModule1 forensic={forensic} onImport={handleImportFromModule1} />
      )}

      {/* Divider */}
      <div style={{
        margin: '1.5rem 0',
        display: 'flex', alignItems: 'center', gap: '1rem'
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        <span style={{
          color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.08em'
        }}>
          {hasForensicData ? 'or upload new data' : 'upload dataset'}
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      </div>

      {/* Fresh Upload */}
      <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
        <UploadDataset module={module} onUploadSuccess={onSuccess} />
      </motion.div>
    </div>
  )
}
