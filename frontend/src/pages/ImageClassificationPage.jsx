import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { API_BASE } from '../lib/constants'
import { IMAGE_CLASSIFICATION_PROBLEMS, fadeUp, stagger } from '../lib/problemConfigs'
import ProblemPicker from '../components/ProblemPicker'
import ImageUploadZone from '../components/ImageUploadZone'
import ClassListSearch from '../components/ClassListSearch'
import MetricHelpTooltip from '../components/MetricHelpTooltip'
import { ScanEye, Zap, Sparkles, AlertCircle } from 'lucide-react'

export default function ImageClassificationPage() {
  const [selectedId, setSelectedId] = useState('imagenet-1000')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const selected = IMAGE_CLASSIFICATION_PROBLEMS.find(p => p.id === selectedId)
  const isLive = selected?.status === 'live'

  // Reset state on problem switch
  useEffect(() => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }, [selectedId])

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
  }, [])

  const clearImage = useCallback(() => {
    setPreview(null)
    setImage(null)
    setResult(null)
    setError(null)
  }, [])

  const runPredict = async () => {
    if (!image || !selected?.endpoint) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', image)
    try {
      const resp = await axios.post(`${API_BASE}${selected.endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Classification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSampleClick = async (sample) => {
    if (!selected?.endpoint) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resp = await fetch(sample.url)
      const blob = await resp.blob()
      const file = new File([blob], 'sample.jpg', { type: blob.type })
      setImage(file)
      setPreview(sample.url)
      const formData = new FormData()
      formData.append('file', file)
      const prediction = await axios.post(`${API_BASE}${selected.endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(prediction.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process sample image')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8 pb-12">
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
                <h3 className="text-2xl font-black text-text-primary">Prediction Results</h3>
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
                <div className="space-y-3">
                  <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">All Scores</div>
                  {Object.entries(result.all_scores).map(([cls, score]) => (
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
