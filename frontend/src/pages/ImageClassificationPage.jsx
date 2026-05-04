import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { API_BASE } from '../lib/constants'
import { IMAGE_CLASSIFICATION_PROBLEMS, fadeUp, stagger } from '../lib/problemConfigs'
import ProblemPicker from '../components/ProblemPicker'
import ImageUploadZone from '../components/ImageUploadZone'
import ClassListSearch from '../components/ClassListSearch'
import MetricHelpTooltip from '../components/MetricHelpTooltip'
import { ScanEye, Zap, Sparkles, AlertCircle, Download, ChevronDown, AlertTriangle } from 'lucide-react'
import SEO from '../components/SEO'

/**
 * Translate axios/fetch errors into a single user-facing message that
 * distinguishes 4xx (user error / bad input) from 5xx (server crash) from
 * network failures — instead of the generic "Classification failed" we had.
 */
function formatPredictError(err, fallback = 'Classification failed') {
  if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return null // user cancelled, don't display
  const status = err?.response?.status
  const detail = err?.response?.data?.detail
  if (!err?.response) return 'Network error — backend unreachable.'
  if (status >= 500) return `Server error (${status}): ${typeof detail === 'string' ? detail : 'unexpected error'}`
  if (status >= 400) return typeof detail === 'string' ? detail : `Request rejected (${status}).`
  return fallback
}

/** Quick FNV-1a hash for client-side dedupe of identical images (filename+size+type). */
function quickFingerprint(file) {
  if (!file) return null
  return `${file.name}|${file.size}|${file.type}|${file.lastModified ?? 0}`
}

export default function ImageClassificationPage() {
  const [selectedId, setSelectedId] = useState('imagenet-1000')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showAllScores, setShowAllScores] = useState(false)

  // In-memory prediction cache for identical images within the same session —
  // researcher hits "Run Classification" twice on the same image, second call
  // is instant and skips the network. Keyed by problemId + file fingerprint.
  const cacheRef = useRef(new Map())
  // Active in-flight request — used to cancel on unmount / problem switch.
  const abortRef = useRef(null)

  const selected = IMAGE_CLASSIFICATION_PROBLEMS.find(p => p.id === selectedId)
  const isLive = selected?.status === 'live'

  // Reset state on problem switch (and abort any in-flight request)
  useEffect(() => {
    abortRef.current?.abort()
    setImage(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setShowAllScores(false)
  }, [selectedId])

  // Cleanup on unmount — also abort outstanding request
  useEffect(() => () => abortRef.current?.abort(), [])

  // Warm up the model as soon as user picks a problem — fires and forgets
  useEffect(() => {
    if (!selected?.modelKey || !isLive) return
    fetch(`${API_BASE}/models/warmup?model=${selected.modelKey}`).catch(() => {})
  }, [selected?.modelKey, isLive])

  const handleFileSelect = useCallback((file) => {
    setImage(file)
    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError(null)
    setShowAllScores(false)
  }, [])

  const clearImage = useCallback(() => {
    abortRef.current?.abort()
    setPreview(null)
    setImage(null)
    setResult(null)
    setError(null)
    setShowAllScores(false)
  }, [])

  const runPredictForFile = async (file) => {
    if (!file || !selected?.endpoint) return
    const cacheKey = `${selected.id}::${quickFingerprint(file)}`
    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      setResult(cached)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const resp = await axios.post(`${API_BASE}${selected.endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        signal: controller.signal,
        timeout: 30000,
      })
      cacheRef.current.set(cacheKey, resp.data)
      setResult(resp.data)
    } catch (err) {
      const msg = formatPredictError(err)
      if (msg) setError(msg)
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setLoading(false)
    }
  }

  const runPredict = () => runPredictForFile(image)

  const handleSampleClick = async (sample) => {
    if (!selected?.endpoint) return
    setError(null)
    setResult(null)
    setShowAllScores(false)
    try {
      const resp = await fetch(sample.url)
      const blob = await resp.blob()
      // Use sample label as filename so backend logs are readable + cache key
      // distinguishes between samples (was 'sample.jpg' for every sample).
      const safeName = `${(sample.label || 'sample').replace(/\s+/g, '-').toLowerCase()}.jpg`
      const file = new File([blob], safeName, { type: blob.type })
      setImage(file)
      setPreview(sample.url)
      await runPredictForFile(file)
    } catch (err) {
      setError(formatPredictError(err, 'Failed to process sample image'))
    }
  }

  // Sort prediction scores once — JSON insertion order from backend is not
  // guaranteed and we want top-5 displayed regardless.
  const sortedScores = useMemo(() => {
    if (!result?.all_scores) return []
    return Object.entries(result.all_scores).sort(([, a], [, b]) => b - a)
  }, [result])

  // Confidence calibration warning — under 30% top-1 typically means
  // out-of-distribution input (model has never seen this type of image).
  const lowConfidence = result && result.confidence < 0.30

  const handleExportJson = () => {
    if (!result) return
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.id}-prediction-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8 pb-12">
      <SEO
        path="/deep-learning/image-classification"
        title="Image Classification — ImageNet · Food-101 · Birds-525"
        description="Real-time image classification with EfficientNetV2-S (83.9% top-1 ImageNet accuracy), Food-101, and Birds-525 datasets. Upload an image and see top-5 predictions with confidence scores."
      />
      {/* Header */}
      <motion.div variants={fadeUp} className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/20 p-3 rounded-2xl"><ScanEye className="w-8 h-8 text-primary" /></div>
            <span className="badge-premium">Image Classification</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Image <span className="text-gradient">Classification</span>
          </h1>
          <p className="text-text-muted max-w-3xl text-lg font-medium leading-relaxed">
            Upload images and classify them using state-of-the-art deep learning models with real-time confidence scores.
          </p>
        </div>
      </motion.div>

      {/* Problem Picker */}
      <ProblemPicker
        problems={IMAGE_CLASSIFICATION_PROBLEMS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        accentColor="primary"
      />

      {/* Content — Live vs Coming Soon */}
      {isLive ? (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Column */}
          <div className="glass-card rounded-[2.5rem] p-8 border border-border">
            <h3 className="text-2xl font-black flex items-center gap-3 text-text-primary mb-8">
              <ScanEye className="w-7 h-7 text-primary" /> Upload Image
            </h3>
            <ImageUploadZone
              accentColor="primary"
              image={image}
              preview={preview}
              loading={loading}
              onFileSelect={handleFileSelect}
              onClear={clearImage}
              onPredict={runPredict}
              showPredict={!result}
              predictLabel="Run Classification"
              sampleImages={selected.sampleImages}
              onSampleClick={handleSampleClick}
              maxDimension={512}
            />
            {error && (
              <div className="mt-4 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Results Column */}
          <div className="space-y-8">
            {result ? (
              <div className="glass-card rounded-[2.5rem] p-8 border border-border space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-2xl font-black text-text-primary">Prediction Results</h3>
                  <button
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface/60 text-xs font-bold text-text-secondary hover:border-primary/40 hover:text-primary transition-colors"
                    aria-label="Export prediction as JSON"
                  >
                    <Download className="w-3.5 h-3.5" /> Export JSON
                  </button>
                </div>

                <div className="flex items-center justify-between p-6 rounded-3xl bg-primary/5 border border-primary/20">
                  <div>
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Top Prediction</div>
                    <div className="text-3xl font-black text-text-primary capitalize">{result.prediction.replace(/_/g, ' ')}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">Confidence</div>
                    <div className="text-3xl font-black text-success">{(result.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>

                {/* Out-of-distribution warning when top-1 is below the calibration threshold */}
                {lowConfidence && (
                  <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed text-text-secondary">
                      <strong className="text-warning">Low confidence ({(result.confidence * 100).toFixed(1)}%).</strong>{' '}
                      The model is uncertain — this image may be outside its training distribution.
                      Consider it suggestive at best.
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold text-text-muted uppercase tracking-widest">
                      {showAllScores ? 'All Scores' : 'Top 5 Scores'}
                    </div>
                    {sortedScores.length > 5 && (
                      <button
                        onClick={() => setShowAllScores((v) => !v)}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        {showAllScores ? 'Show top 5' : `Show all ${sortedScores.length}`}
                        <ChevronDown className={`w-3 h-3 transition-transform ${showAllScores ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                  {(showAllScores ? sortedScores : sortedScores.slice(0, 5)).map(([cls, score]) => (
                    <div key={cls} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="capitalize text-text-secondary">{cls.replace(/_/g, ' ')}</span>
                        <span className="text-text-muted">{(score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${score * 100}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={clearImage}
                  className="w-full py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
                >
                  Classify Another Image
                </button>
              </div>
            ) : (
              <div className="glass-card rounded-[2.5rem] p-8 border border-border">
                <div className="text-center py-16 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
                    <ScanEye className="w-10 h-10 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-black text-text-primary">Ready to Classify</h3>
                  <p className="text-sm text-text-muted max-w-xs mx-auto">
                    Upload an image or select a sample to see real-time classification results.
                  </p>
                </div>
              </div>
            )}

            {/* Model Info */}
            {selected.modelInfo && (
              <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-primary">
                <h4 className="font-black text-text-primary mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> Model Specifications
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {Object.entries(selected.modelInfo).map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                        <MetricHelpTooltip metric={label}>{label}</MetricHelpTooltip>
                      </div>
                      <div className="text-sm font-black text-text-primary mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Searchable class list */}
            {selected.modelKey && (
              <ClassListSearch modelKey={selected.modelKey} accentColor="primary" />
            )}
          </div>
        </motion.div>
      ) : (
        /* Coming Soon State */
        <motion.div variants={fadeUp} className="glass-card rounded-[2.5rem] p-8 border border-border">
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-xl font-black text-text-primary">{selected?.label}</h3>
            <p className="text-sm text-text-muted max-w-md mx-auto">{selected?.description}</p>
            <span className="badge-coming-soon inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Coming Soon
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
