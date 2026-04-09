import React, { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import { API_BASE } from '../../lib/constants'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Ship, Home, Flower2, Loader2, X, Sparkles } from 'lucide-react'

const MAX_SIZE_MB = 100

const DEMO_DATASETS = [
  { id: 'titanic', label: 'Titanic', type: 'Classification', icon: Ship, color: '#60a5fa', rows: '1,309', cols: 11 },
  { id: 'house_prices', label: 'House Prices', type: 'Regression', icon: Home, color: '#f59e0b', rows: '1,460', cols: 81 },
  { id: 'iris', label: 'Iris', type: 'Multiclass', icon: Flower2, color: '#ec4899', rows: '150', cols: 5 },
]

export default function UploadDataset({ onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const inputRef = useRef()

  const validateFile = (f) => {
    if (!f) return 'No file selected'
    if (!f.name.match(/\.(csv|xlsx?)$/i))
      return 'Unsupported file format. Please upload a .csv or .xlsx file.'
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `File too large (max ${MAX_SIZE_MB} MB).`
    if (f.size === 0)
      return 'The file is empty.'
    return null
  }

  const handleFileSelect = (f) => {
    const err = validateFile(f)
    if (err) { setError(err); setFile(null); return }
    setFile(f)
    setError('')
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const resp = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })
      onUploadSuccess(resp.data.analysis)
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'An error occurred during upload. Please check file format and try again.')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleDemoLoad = async (datasetName) => {
    setLoadingDemo(datasetName)
    setLoading(true)
    setError('')
    try {
      const resp = await axios.get(`${API_BASE}/demo/${datasetName}`)
      onUploadSuccess(resp.data.analysis)
    } catch (err) {
      setError(`Failed to load demo dataset: ${datasetName}`)
    } finally {
      setLoading(false)
      setLoadingDemo(null)
    }
  }

  const removeFile = (e) => {
    e.stopPropagation()
    setFile(null)
    setError('')
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '2rem' }}
      >
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Upload Dataset
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Import your data to begin exploratory analysis and preprocessing
        </p>
      </motion.div>

      {/* Dropzone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            border: `2px dashed ${dragActive ? 'var(--primary)' : file ? 'var(--success)' : 'var(--dropzone-border)'}`,
            borderRadius: 16,
            padding: file ? '1.5rem 2rem' : '3rem 2rem',
            textAlign: 'center',
            cursor: loading ? 'default' : 'pointer',
            background: dragActive
              ? 'rgba(99,102,241,0.08)'
              : file
              ? 'rgba(16,185,129,0.04)'
              : 'var(--bg-card-subtle)',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
          }}
        >
          {/* Animated border glow on drag */}
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', inset: 0,
                borderRadius: 14,
                boxShadow: 'inset 0 0 30px rgba(99,102,241,0.15)',
                pointerEvents: 'none',
              }}
            />
          )}

          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={dragActive ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    border: '1px solid rgba(99,102,241,0.2)',
                  }}
                >
                  <Upload style={{ width: 28, height: 28, color: 'var(--primary)' }} />
                </motion.div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Drag & drop your file here
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  or <span style={{ color: 'var(--primary)', fontWeight: 600 }}>click to browse</span>
                  <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>|</span>
                  .csv, .xlsx up to {MAX_SIZE_MB}MB
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FileSpreadsheet style={{ width: 24, height: 24, color: 'var(--success)' }} />
                </div>
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 2 }}>
                    {(file.size / 1024).toFixed(1)} KB
                    <span style={{ margin: '0 0.4rem', opacity: 0.3 }}>|</span>
                    Ready to analyze
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  style={{
                    background: 'var(--border-subtle)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: 6, cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text-muted)',
                  }}
                  title="Remove file"
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            style={{ display: 'none' }}
          />
        </div>
      </motion.div>

      {/* Upload Progress */}
      <AnimatePresence>
        {loading && uploadProgress > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '1rem' }}
          >
            <div style={{
              height: 4, borderRadius: 2,
              background: 'var(--border-subtle)',
              overflow: 'hidden',
            }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
                  borderRadius: 2,
                }}
              />
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'right' }}>
              {uploadProgress}% uploaded
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              marginTop: '1rem', padding: '0.85rem 1rem',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              fontSize: '0.9rem', color: '#fca5a5',
            }}
          >
            <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0, color: '#f87171' }} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ marginTop: '1.25rem' }}
      >
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{
            width: '100%', padding: '0.9rem',
            background: !file || loading ? 'var(--bg-card-subtle)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            color: !file || loading ? 'var(--text-muted)' : '#fff',
            border: !file || loading ? '1px solid rgba(255,255,255,0.08)' : 'none',
            borderRadius: 12, fontSize: '0.95rem', fontWeight: 600,
            cursor: !file || loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}
        >
          {loading && !loadingDemo ? (
            <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> Analyzing...</>
          ) : (
            <><Sparkles style={{ width: 18, height: 18 }} /> Upload & Analyze</>
          )}
        </button>
      </motion.div>

      {/* Divider */}
      <div style={{
        margin: '2.5rem 0 2rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
      }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          or try a demo
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
      </div>

      {/* Demo Datasets */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}
      >
        {DEMO_DATASETS.map((ds, i) => {
          const isLoading = loadingDemo === ds.id
          return (
            <motion.button
              key={ds.id}
              onClick={() => !loading && handleDemoLoad(ds.id)}
              disabled={loading}
              whileHover={!loading ? { y: -6, scale: 1.03 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              style={{
                position: 'relative',
                padding: '1.25rem 1rem',
                background: isLoading ? `${ds.color}10` : 'var(--bg-card-subtle)',
                border: `1px solid ${isLoading ? ds.color + '40' : 'var(--border-medium)'}`,
                borderRadius: 14,
                cursor: loading ? 'not-allowed' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                opacity: loading && !isLoading ? 0.5 : 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                color: 'inherit',
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `${ds.color}15`,
                border: `1px solid ${ds.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isLoading ? (
                  <Loader2 style={{ width: 20, height: 20, color: ds.color, animation: 'spin 1s linear infinite' }} />
                ) : (
                  <ds.icon style={{ width: 20, height: 20, color: ds.color }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{ds.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {ds.type}
                </div>
              </div>
              <div style={{
                fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.7,
                display: 'flex', gap: '0.5rem', justifyContent: 'center',
              }}>
                <span>{ds.rows} rows</span>
                <span style={{ opacity: 0.4 }}>|</span>
                <span>{ds.cols} cols</span>
              </div>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
