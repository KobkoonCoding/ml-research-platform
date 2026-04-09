import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Target, Columns3, Table2, Sparkles,
  ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2,
  Database, Hash, Type, Loader2, BarChart2, Brain,
  ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { API_BASE } from '../../lib/constants'
import PageGuide from './elm/PageGuide'
import PageHeader from './elm/PageHeader'
import { SetupSVG } from './elm/AnimatedSVGs'

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export default function ELMSetupPage() {
  const navigate = useNavigate()
  const { neural, setNeuralData } = useApp()
  const [isFilling, setIsFilling] = useState(false)
  const [fillError, setFillError] = useState(null)
  const [fillSuccess, setFillSuccess] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const analysis = neural?.analysis

  if (!analysis) {
    return <Navigate to="/elm-studio/upload" replace />
  }

  const columns = analysis.columns ?? []
  const targetColumn = neural.targetColumn ?? ''
  const droppedColumns = neural.droppedColumns ?? []
  const config = neural.trainingConfig ?? {}
  const problemType = config.problemType ?? 'classification'

  const selectedFeatures = useMemo(() => {
    return columns.filter(col => col !== targetColumn && !droppedColumns.includes(col))
  }, [columns, targetColumn, droppedColumns])

  React.useEffect(() => {
    setNeuralData({ selectedFeatures })
  }, [selectedFeatures]) // eslint-disable-line react-hooks/exhaustive-deps

  const numericCols = useMemo(() =>
    columns.filter(col => {
      const dtype = (analysis.dtypes?.[col] ?? '').toLowerCase()
      return dtype.includes('int') || dtype.includes('float') || dtype.includes('number')
    }),
    [columns, analysis.dtypes]
  )

  const categoricalCols = useMemo(() =>
    columns.filter(col => !numericCols.includes(col)),
    [columns, numericCols]
  )

  const totalMissing = analysis.total_missing ?? 0
  const totalCells = (analysis.shape?.[0] ?? 0) * (analysis.shape?.[1] ?? 0)
  const missingPct = totalCells > 0 ? ((totalMissing / totalCells) * 100).toFixed(1) : '0.0'

  const handleTargetChange = useCallback((e) => {
    const col = e.target.value
    setNeuralData({
      targetColumn: col,
      droppedColumns: droppedColumns.filter(d => d !== col),
    })
  }, [droppedColumns, setNeuralData])

  const handleProblemTypeChange = useCallback((type) => {
    setNeuralData({
      trainingConfig: { ...config, problemType: type }
    })
  }, [config, setNeuralData])

  const toggleColumn = useCallback((col) => {
    const isDropped = droppedColumns.includes(col)
    const updated = isDropped
      ? droppedColumns.filter(d => d !== col)
      : [...droppedColumns, col]
    setNeuralData({ droppedColumns: updated })
  }, [droppedColumns, setNeuralData])

  const handleFillMissing = useCallback(async () => {
    setIsFilling(true)
    setFillError(null)
    setFillSuccess(false)
    try {
      const resp = await fetch(`${API_BASE}/preprocess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'missing',
          params: { strategy: 'mean', columns: null }
        })
      })
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}))
        throw new Error(errBody.detail ?? `Server error ${resp.status}`)
      }
      const data = await resp.json()
      setNeuralData({ analysis: data.analysis })
      setFillSuccess(true)
    } catch (err) {
      setFillError(err.message ?? 'Failed to fill missing values')
    } finally {
      setIsFilling(false)
    }
  }, [setNeuralData])

  const handleNext = useCallback(() => {
    navigate('/elm-studio/train')
  }, [navigate])

  const previewRows = (analysis.preview_data ?? []).slice(0, 10)
  const nRows = analysis.shape?.[0] ?? 0
  const nCols = analysis.shape?.[1] ?? 0

  return (
    <motion.div
      style={{ maxWidth: 1100, margin: '0 auto' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Guide */}
      <PageGuide
        storageKey="elm_setup"
        what="Configure what your model should predict (target column) and which columns to use as input features. You can also choose whether this is a classification (predict categories) or regression (predict numbers) problem."
        steps={[
          'Select your target column — this is what the model will learn to predict.',
          'Choose the problem type: Classification for categories, Regression for numbers.',
          'Toggle features on/off — drop columns that are irrelevant or redundant.',
          'Fix missing values if needed (auto-fill with column mean).',
          'Click "Continue to Training" when ready.',
        ]}
        concepts={[
          { term: 'Target Variable', def: 'The column you want to predict' },
          { term: 'Classification', def: 'Predicting categories (e.g., spam/not spam, species)' },
          { term: 'Regression', def: 'Predicting continuous numbers (e.g., price, temperature)' },
          { term: 'Missing Values', def: 'Empty cells in your data that need to be filled' },
        ]}
      />

      {/* ── Header ── */}
      <PageHeader
        title="Setup & Preview"
        subtitle="Configure target column, problem type, and select features before training"
        accentColor="#f59e0b"
        icon={<Database size={22} />}
        illustration={<SetupSVG size={100} />}
        action={
          <motion.button
            onClick={handleNext}
            disabled={!targetColumn}
            whileHover={targetColumn ? { scale: 1.03 } : {}}
            whileTap={targetColumn ? { scale: 0.97 } : {}}
            className={targetColumn ? 'btn-glow' : ''}
            style={{
              padding: '0.7rem 1.5rem', borderRadius: 12, border: 'none',
              background: targetColumn
                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                : 'var(--bg-card-subtle)',
              color: targetColumn ? 'white' : 'var(--text-muted)',
              fontWeight: 700, fontSize: '0.9rem',
              cursor: targetColumn ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: targetColumn ? '0 4px 20px rgba(245,158,11,0.3)' : 'none',
              transition: 'all 0.25s ease',
            }}
          >
            Next: Train Model
            <ArrowRight size={18} />
          </motion.button>
        }
      />

      {/* ── Dataset Summary ── */}
      <motion.div className="glass-panel" style={{ padding: '1.25rem' }} {...fadeIn} transition={{ delay: 0.08 }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
          <Database size={17} style={{ color: '#60a5fa' }} /> Dataset Overview
        </h3>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.6rem'
        }}>
          {[
            { label: 'Rows', value: nRows.toLocaleString(), color: '#60a5fa' },
            { label: 'Columns', value: nCols, color: '#60a5fa' },
            { label: 'Numeric', value: numericCols.length, color: '#34d399' },
            { label: 'Categorical', value: categoricalCols.length, color: '#c084fc' },
            { label: 'Missing', value: `${missingPct}%`, color: totalMissing > 0 ? '#f87171' : '#34d399' },
            { label: 'Features', value: selectedFeatures.length, color: '#f59e0b' },
          ].map(m => (
            <div key={m.label} style={{
              padding: '0.65rem 0.75rem', borderRadius: 10,
              background: 'var(--bg-card-subtle)', border: '1px solid var(--border-subtle)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Two-column layout ── */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>

        {/* LEFT: Target + Problem Type */}
        <div style={{ flex: '1 1 360px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Target Column */}
          <motion.div className="glass-panel" style={{ padding: '1.25rem' }} {...fadeIn} transition={{ delay: 0.12 }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <Target size={17} style={{ color: '#f59e0b' }} /> Target Column
            </h3>
            <select
              className="select-field"
              value={targetColumn}
              onChange={handleTargetChange}
              style={{ width: '100%', fontSize: '0.9rem' }}
            >
              <option value="">— Select target variable —</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            {!targetColumn && (
              <p style={{ color: 'var(--warning, #fbbf24)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={14} /> Select a target to continue
              </p>
            )}
          </motion.div>

          {/* Problem Type Selector */}
          <motion.div className="glass-panel" style={{ padding: '1.25rem' }} {...fadeIn} transition={{ delay: 0.15 }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <BarChart2 size={17} style={{ color: '#c084fc' }} /> Problem Type
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { type: 'classification', label: 'Classification', icon: Type, desc: 'Predict categories', color: '#c084fc' },
                { type: 'regression', label: 'Regression', icon: Hash, desc: 'Predict numbers', color: '#60a5fa' },
              ].map(opt => {
                const isActive = problemType === opt.type
                return (
                  <motion.button
                    key={opt.type}
                    onClick={() => handleProblemTypeChange(opt.type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      flex: 1, padding: '0.85rem 0.75rem', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${isActive ? opt.color + '60' : 'var(--border-subtle)'}`,
                      background: isActive ? opt.color + '12' : 'var(--bg-card-subtle)',
                      transition: 'all 0.25s ease',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      color: 'inherit',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: isActive ? opt.color + '20' : 'var(--bg-card-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.25s'
                    }}>
                      <opt.icon size={16} style={{ color: isActive ? opt.color : 'var(--text-muted)' }} />
                    </div>
                    <span style={{
                      fontSize: '0.85rem', fontWeight: 700,
                      color: isActive ? opt.color : 'var(--text-secondary)'
                    }}>
                      {opt.label}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {opt.desc}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="problem-check"
                        style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <CheckCircle2 size={14} style={{ color: 'white' }} />
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* Auto-fill Missing */}
          {totalMissing > 0 && (
            <motion.div className="glass-panel" style={{ padding: '1.25rem' }} {...fadeIn} transition={{ delay: 0.18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <Sparkles size={17} style={{ color: '#fbbf24' }} /> Fix Missing Values
                  </h3>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {totalMissing} missing cell{totalMissing !== 1 ? 's' : ''} — fill with column mean
                  </p>
                </div>
                <motion.button
                  onClick={handleFillMissing}
                  disabled={isFilling}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '0.55rem 1rem', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: 'white', fontWeight: 600, fontSize: '0.82rem',
                    cursor: isFilling ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 3px 12px rgba(245,158,11,0.2)',
                    opacity: isFilling ? 0.7 : 1,
                  }}
                >
                  {isFilling ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
                  {isFilling ? 'Filling...' : 'Auto-fill'}
                </motion.button>
              </div>
              {fillError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={13} /> {fillError}
                </p>
              )}
              {fillSuccess && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <CheckCircle2 size={13} /> Missing values filled successfully
                </motion.p>
              )}
            </motion.div>
          )}
        </div>

        {/* RIGHT: Feature Management */}
        <motion.div
          className="glass-panel"
          style={{ flex: '1 1 500px', padding: '1.25rem', alignSelf: 'flex-start' }}
          {...fadeIn} transition={{ delay: 0.2 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <Columns3 size={17} style={{ color: '#34d399' }} /> Feature Management
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>{selectedFeatures.length}</span> of {columns.length - (targetColumn ? 1 : 0)} selected
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.4rem',
            maxHeight: 400, overflowY: 'auto',
            paddingRight: 4,
          }}>
            {columns
              .filter(col => col !== targetColumn)
              .map(col => {
                const isDropped = droppedColumns.includes(col)
                const dtype = (analysis.dtypes?.[col] ?? '').toLowerCase()
                const isNum = dtype.includes('int') || dtype.includes('float') || dtype.includes('number')
                const missing = analysis.missing_values?.[col] ?? 0

                return (
                  <motion.div
                    key={col}
                    layout
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.5rem 0.65rem', borderRadius: 8,
                      background: isDropped ? 'var(--bg-card-subtle)' : 'var(--bg-card-subtle)',
                      border: `1px solid ${isDropped ? 'var(--bg-card-subtle)' : 'var(--surface-border)'}`,
                      opacity: isDropped ? 0.45 : 1,
                      transition: 'opacity 0.2s, background 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                        background: isNum ? 'rgba(59,130,246,0.12)' : 'rgba(168,85,247,0.12)',
                        color: isNum ? '#60a5fa' : '#c084fc',
                        flexShrink: 0
                      }}>
                        {isNum ? 'NUM' : 'CAT'}
                      </span>
                      <span style={{
                        fontSize: '0.82rem', color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: isDropped ? 'line-through' : 'none'
                      }}>
                        {col}
                      </span>
                      {missing > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--danger)', flexShrink: 0 }}>
                          ({missing})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleColumn(col)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: isDropped ? 'var(--text-muted)' : '#34d399',
                        padding: 2, display: 'flex', alignItems: 'center'
                      }}
                      title={isDropped ? 'Include column' : 'Drop column'}
                    >
                      {isDropped ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </motion.div>
                )
              })}
          </div>
        </motion.div>
      </div>

      {/* ── Data Preview (collapsible) ── */}
      <motion.div className="glass-panel" style={{ marginTop: '1rem', padding: '1.25rem' }} {...fadeIn} transition={{ delay: 0.25 }}>
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
            padding: 0, fontWeight: 600, fontSize: '0.95rem'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Table2 size={17} style={{ color: '#60a5fa' }} />
            Data Preview
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              (first {previewRows.length} rows)
            </span>
          </span>
          {showPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden', marginTop: '0.75rem' }}
            >
              <div className="table-container" style={{ maxHeight: 380, overflowY: 'auto' }}>
                <table style={{ minWidth: '100%', whiteSpace: 'nowrap' }}>
                  <thead style={{
                    position: 'sticky', top: 0,
                    background: 'var(--table-header-bg)', zIndex: 1,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <tr>
                      {columns.map((col) => (
                        <th key={col} style={{ textAlign: 'center', minWidth: 100, padding: '0.55rem 0.5rem' }}>
                          <div style={{ fontSize: '0.82rem', color: col === targetColumn ? '#f59e0b' : 'var(--text-primary)', fontWeight: col === targetColumn ? 700 : 500 }}>
                            {col}
                          </div>
                          <div style={{
                            fontSize: '0.75rem', fontWeight: 400, marginTop: 2,
                            color: col === targetColumn ? '#f59e0b' : 'var(--text-muted)'
                          }}>
                            {col === targetColumn ? 'TARGET' : analysis.dtypes?.[col] ?? ''}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {columns.map((col) => {
                          const val = row[col]
                          return (
                            <td key={col} style={{ textAlign: 'center', padding: '0.4rem 0.5rem', fontSize: '0.82rem' }}>
                              {val === null || val === undefined
                                ? <span style={{ color: 'var(--danger)', fontSize: '0.72rem' }}>NaN</span>
                                : String(val)
                              }
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Bottom Next CTA ── */}
      <motion.div
        style={{ marginTop: '1.5rem', textAlign: 'center' }}
        {...fadeIn} transition={{ delay: 0.3 }}
      >
        <motion.button
          onClick={handleNext}
          disabled={!targetColumn}
          whileHover={targetColumn ? { scale: 1.03 } : {}}
          whileTap={targetColumn ? { scale: 0.97 } : {}}
          className={targetColumn ? 'btn-glow' : ''}
          style={{
            padding: '0.85rem 2.5rem', borderRadius: 14, border: 'none',
            background: targetColumn
              ? 'linear-gradient(135deg, #f59e0b, #f97316)'
              : 'var(--bg-card-subtle)',
            color: targetColumn ? 'white' : 'var(--text-muted)',
            fontWeight: 700, fontSize: '1rem',
            cursor: targetColumn ? 'pointer' : 'not-allowed',
            display: 'inline-flex', alignItems: 'center', gap: 10,
            boxShadow: targetColumn ? '0 6px 24px rgba(245,158,11,0.3)' : 'none',
            transition: 'all 0.25s ease',
          }}
        >
          <Brain size={20} />
          Continue to Training
          <ArrowRight size={18} />
        </motion.button>
        {!targetColumn && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Select a target column above to proceed
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
