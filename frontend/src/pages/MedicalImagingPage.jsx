import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { API_BASE } from '../lib/constants'
import { MEDICAL_IMAGING_PROBLEMS, fadeUp, stagger } from '../lib/problemConfigs'
import ProblemPicker from '../components/ProblemPicker'
import ImageUploadZone from '../components/ImageUploadZone'
import HeatmapOverlay from '../components/HeatmapOverlay'
import ClassListSearch from '../components/ClassListSearch'
import MetricHelpTooltip from '../components/MetricHelpTooltip'
import PathologyBar from '../components/PathologyBar'
import ClinicalInterpretation from '../components/ClinicalInterpretation'
import {
  getPathology, getScoreBand,
  getMedicalClass, SHARED_DISCLAIMER,
} from '../lib/pathologyGlossary'
import {
  Stethoscope, Sparkles, Layers, FileText,
  Activity, ShieldCheck, Upload, ScanEye, Brain, AlertCircle, Zap, Gauge,
  AlertTriangle, Info, HelpCircle, ChevronDown
} from 'lucide-react'

const PROBLEM_FEATURES = {
  'xray-pneumonia': [
    { icon: ScanEye, label: '18 Pathology Detection', description: 'Detect pneumonia, atelectasis, cardiomegaly, and 15 more pathologies', color: '#EF4444' },
    { icon: Layers, label: 'Grad-CAM Heatmap', description: 'Visual attention overlay showing where the model focuses', color: '#F59E0B' },
    { icon: Activity, label: 'Multi-label Scores', description: 'Confidence scores across all 18 torchxrayvision labels', color: '#6366F1' },
    { icon: FileText, label: 'Clinical Report', description: 'Auto-generated summary with findings and confidence levels', color: '#10B981' },
  ],
  'skin-lesion': [
    { icon: ScanEye, label: 'Malignancy Classification', description: 'Multi-class ISIC dermoscopy classifier (malignant vs benign lesions)', color: '#EF4444' },
    { icon: Layers, label: 'Attention Heatmap', description: 'ViT attention rollout highlighting diagnostic regions', color: '#F59E0B' },
    { icon: Activity, label: 'Class Probability Bars', description: 'Full softmax distribution across lesion categories', color: '#6366F1' },
    { icon: FileText, label: 'Risk Interpretation', description: 'Plain-language summary with clinical-grade disclaimer', color: '#10B981' },
  ],
  'brain-tumor-mri': [
    { icon: Brain, label: '4-class Brain Tumor', description: 'Glioma, meningioma, pituitary, or no-tumor from MRI slices', color: '#EF4444' },
    { icon: Layers, label: 'Tumor Localization Heatmap', description: 'Attention rollout indicating tumor regions on the MRI', color: '#F59E0B' },
    { icon: Activity, label: 'Confidence Distribution', description: 'Full softmax bars for all 4 classes', color: '#6366F1' },
    { icon: FileText, label: 'Findings Report', description: 'Auto-generated summary with research-only disclaimer', color: '#10B981' },
  ],
}

export default function MedicalImagingPage() {
  const [selectedId, setSelectedId] = useState('xray-pneumonia')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [fastMode, setFastMode] = useState(true)

  const selected = MEDICAL_IMAGING_PROBLEMS.find(p => p.id === selectedId)
  const isLive = selected?.status === 'live'
  const features = PROBLEM_FEATURES[selectedId] || PROBLEM_FEATURES['xray-pneumonia']
  const outputType = selected?.outputType || 'multi-label'
  const isMultiClass = outputType === 'multi-class'

  // Per-problem copy / labels
  const problemCopy = {
    'xray-pneumonia': {
      uploadTitle: 'Upload X-ray',
      predictLabel: 'Analyze X-ray',
      uploadHint: 'JPG, PNG supported · Chest X-ray images',
      resultsTitle: 'X-ray Analysis',
      tryAgain: 'Analyze Another X-ray',
      emptyTitle: 'Ready to Analyze',
      emptyBody: 'Upload a chest X-ray to detect pathologies with attention visualization.',
    },
    'skin-lesion': {
      uploadTitle: 'Upload Dermoscopy Image',
      predictLabel: 'Classify Lesion',
      uploadHint: 'JPG, PNG supported · Dermoscopic close-up images',
      resultsTitle: 'Skin Lesion Analysis',
      tryAgain: 'Classify Another Lesion',
      emptyTitle: 'Ready to Classify',
      emptyBody: 'Upload a dermoscopy image to identify lesion type with attention heatmap.',
    },
    'brain-tumor-mri': {
      uploadTitle: 'Upload Brain MRI',
      predictLabel: 'Classify MRI',
      uploadHint: 'JPG, PNG supported · Brain MRI slices',
      resultsTitle: 'Brain Tumor Analysis',
      tryAgain: 'Classify Another MRI',
      emptyTitle: 'Ready to Classify',
      emptyBody: 'Upload a brain MRI to classify glioma, meningioma, pituitary, or no tumor.',
    },
  }
  const copy = problemCopy[selectedId] || problemCopy['xray-pneumonia']

  useEffect(() => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }, [selectedId])

  // Warm up the model when X-ray is selected
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

  const buildEndpoint = () => {
    if (!selected?.endpoint) return null
    // X-ray supports fast-mode (pseudo-CAM vs Grad-CAM) via query params
    if (selected.id === 'xray-pneumonia') {
      return `${API_BASE}${selected.endpoint}?use_pseudo_cam=${fastMode}&heatmap=true`
    }
    return `${API_BASE}${selected.endpoint}`
  }

  const runPredict = async () => {
    const url = buildEndpoint()
    if (!image || !url) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', image)
    try {
      const resp = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'X-ray analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSampleClick = async (sample) => {
    const url = buildEndpoint()
    if (!url) return
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
      const prediction = await axios.post(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
        <div className="absolute top-0 right-0 w-80 h-80 bg-error/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-error/20 p-3 rounded-2xl"><Stethoscope className="w-8 h-8 text-error" /></div>
            <span className="badge-premium">Medical Imaging</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Medical <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">Imaging</span>
          </h1>
          <p className="text-text-muted max-w-3xl text-lg font-medium leading-relaxed">
            AI-powered medical image analysis — select a problem below to explore models for clinical diagnostics.
          </p>
        </div>
      </motion.div>

      {/* Problem Picker */}
      <ProblemPicker problems={MEDICAL_IMAGING_PROBLEMS} selectedId={selectedId} onSelect={setSelectedId} accentColor="error" />

      {/* LIVE: X-ray flow */}
      {isLive ? (
      <>
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Column */}
          <div className="glass-card rounded-[2.5rem] p-8 border border-border">
            <h3 className="text-2xl font-black flex items-center gap-3 text-text-primary mb-8">
              <Stethoscope className="w-7 h-7 text-error" /> {copy.uploadTitle}
            </h3>
            <ImageUploadZone
              accentColor="error"
              image={image}
              preview={preview}
              loading={loading}
              onFileSelect={handleFileSelect}
              onClear={clearImage}
              onPredict={runPredict}
              showPredict={!result}
              predictLabel={copy.predictLabel}
              uploadHint={copy.uploadHint}
              sampleImages={selected.sampleImages}
              onSampleClick={handleSampleClick}
              maxDimension={1024}
            />

            {/* Fast-mode toggle — X-ray only, locked once a result is shown */}
            {selected.id === 'xray-pneumonia' && (() => {
              const locked = !!result || loading
              return (
                <label
                  className={`mt-4 flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                    locked
                      ? 'bg-border/10 border-border/50 cursor-not-allowed opacity-60'
                      : 'bg-border/20 border-border cursor-pointer hover:bg-border/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={fastMode}
                    onChange={(e) => setFastMode(e.target.checked)}
                    disabled={locked}
                    className="w-4 h-4 accent-error disabled:cursor-not-allowed"
                  />
                  <Gauge className="w-4 h-4 text-error shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-text-primary">
                      {fastMode ? 'Fast mode (pseudo-CAM)' : 'Accurate mode (Grad-CAM)'}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      {locked
                        ? 'Clear the current result to change modes'
                        : fastMode
                          ? '~3x faster, gradient-free heatmap'
                          : 'Slower but more detailed attention'}
                    </div>
                  </div>
                </label>
              )
            })()}

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
                {/* Medical disclaimer — prominent */}
                <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-[11px] text-text-secondary leading-relaxed">
                    <strong className="text-warning">{SHARED_DISCLAIMER}</strong>{' '}
                    This model provides pattern-matching hints for educational use.
                    <strong>
                      {' '}Only a qualified specialist can diagnose medical images.
                    </strong>
                  </div>
                </div>

                <h3 className="text-2xl font-black text-text-primary">{copy.resultsTitle}</h3>

                {/* ── Multi-class branch (skin / brain) ── */}
                {isMultiClass && (() => {
                  const topInfo = getMedicalClass(selectedId, result.prediction)
                  const confPct = (result.confidence * 100).toFixed(1)
                  const isMalignant = topInfo.malignant === true
                  const isLowConf = result.confidence < 0.5
                  const color = isMalignant
                    ? '#B91C1C'
                    : isLowConf
                      ? '#F59E0B'
                      : '#10B981'
                  const ringDeg = Math.min(360, result.confidence * 360)
                  return (
                    <>
                      <div
                        className="p-6 rounded-3xl border"
                        style={{ background: `${color}10`, borderColor: `${color}40` }}
                      >
                        <div className="flex items-center gap-5">
                          {/* Confidence ring */}
                          <div
                            className="shrink-0 rounded-full p-1"
                            style={{
                              background: `conic-gradient(${color} ${ringDeg}deg, ${color}22 ${ringDeg}deg)`,
                              width: 96,
                              height: 96,
                            }}
                          >
                            <div className="w-full h-full rounded-full bg-bg-elevated flex flex-col items-center justify-center">
                              <div className="text-xl font-black" style={{ color }}>
                                {confPct}%
                              </div>
                              <div className="text-[8px] uppercase tracking-widest text-text-muted font-black">
                                Top class
                              </div>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-[10px] font-black uppercase tracking-[0.3em] mb-1"
                              style={{ color }}
                            >
                              {isMalignant ? 'Potentially malignant' : isLowConf ? 'Low confidence' : 'Benign-appearing'}
                            </div>
                            <div className="text-2xl md:text-3xl font-black text-text-primary">
                              {topInfo.display}
                            </div>
                            <p className="text-xs text-text-muted mt-1 leading-relaxed">
                              {topInfo.short}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Heatmap */}
                      {result.heatmap && (
                        <div>
                          <div className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Layers className="w-3 h-3" /> Attention Heatmap — {topInfo.display}
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/30">
                              ViT Rollout
                            </span>
                          </div>
                          <HeatmapOverlay heatmapSrc={result.heatmap} />
                          <div className="mt-2 text-[10px] text-text-muted italic text-center">
                            Red/yellow = regions the ViT attention concentrated on for this class.
                          </div>
                        </div>
                      )}

                      {/* Class distribution bars */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                          <span>All {Object.keys(result.classes || {}).length} Class Probabilities</span>
                          <span className="normal-case font-medium text-[10px] opacity-70">
                            (softmax — sums to 100%)
                          </span>
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                          {Object.entries(result.classes || {})
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, prob]) => {
                              const info = getMedicalClass(selectedId, name)
                              const barColor = info.malignant
                                ? '#B91C1C'
                                : info.malignant === false
                                  ? '#10B981'
                                  : '#F59E0B'
                              const isTop = name === result.prediction
                              return (
                                <div
                                  key={name}
                                  className="rounded-xl border px-3 py-2.5"
                                  style={{
                                    borderColor: `${barColor}30`,
                                    background: `${barColor}06`,
                                    outline: isTop ? `2px solid ${barColor}50` : 'none',
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1.5 gap-3">
                                    <span className="text-[12px] font-black text-text-primary truncate">
                                      {isTop && '★ '}
                                      {info.display}
                                    </span>
                                    <span
                                      className="text-[11px] font-black shrink-0"
                                      style={{ color: barColor }}
                                    >
                                      {(prob * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-[width] duration-500"
                                      style={{
                                        width: `${prob * 100}%`,
                                        background: barColor,
                                      }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>

                      <button
                        onClick={clearImage}
                        className="w-full py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-error/5 hover:text-error hover:border-error/30 transition-all"
                      >
                        {copy.tryAgain}
                      </button>
                    </>
                  )
                })()}

                {/* ── Multi-label branch (X-ray, existing UI) ── */}
                {!isMultiClass && (() => {
                  const topBand = getScoreBand(result.confidence)
                  const topInfo = getPathology(result.prediction)
                  return (
                    <div
                      className="p-6 rounded-3xl border"
                      style={{ background: `${topBand.color}10`, borderColor: `${topBand.color}40` }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-[10px] font-black uppercase tracking-[0.3em] mb-1"
                            style={{ color: topBand.color }}
                          >
                            Top Attention
                          </div>
                          <div className="text-2xl md:text-3xl font-black text-text-primary">
                            {topInfo.display}
                          </div>
                          <p className="text-xs text-text-muted mt-1 leading-relaxed">{topInfo.short}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">
                            Score
                          </div>
                          <div className="text-2xl md:text-3xl font-black" style={{ color: topBand.color }}>
                            {(result.confidence * 100).toFixed(1)}%
                          </div>
                          <div
                            className="text-[9px] font-black uppercase tracking-widest mt-1"
                            style={{ color: topBand.color }}
                          >
                            {topBand.label}
                          </div>
                        </div>
                      </div>
                      <div
                        className="text-[11px] italic p-2.5 rounded-lg"
                        style={{ background: `${topBand.color}15`, color: topBand.color }}
                      >
                        {topBand.description}
                      </div>
                    </div>
                  )
                })()}

                {!isMultiClass && <>
                {/* Collapsible: How to read this */}
                <details className="rounded-2xl bg-border/10 border border-border overflow-hidden group">
                  <summary className="px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-border/20 transition-colors list-none">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs font-black text-text-primary flex-1">How to read these results</span>
                    <ChevronDown className="w-4 h-4 text-text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-4 pb-4 pt-1 border-t border-border space-y-2 text-[11px] text-text-secondary leading-relaxed">
                    <p>
                      <strong className="text-text-primary">Scores are NOT probabilities.</strong> torchxrayvision
                      outputs are relative pattern-matching scores. A NORMAL chest X-ray typically shows scores
                      of <strong>0.3 – 0.55</strong> across all 18 pathologies — this is expected baseline noise.
                    </p>
                    <p>
                      <strong className="text-text-primary">Score bands:</strong>
                      <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-success/15 text-success font-black text-[10px]">Baseline &lt;55%</span>{' '}
                      <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-warning/15 text-warning font-black text-[10px]">Mild 55-70%</span>{' '}
                      <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-error/15 text-error font-black text-[10px]">Notable 70-85%</span>{' '}
                      <span className="inline-block ml-1 px-1.5 py-0.5 rounded bg-error/20 text-error font-black text-[10px]">High &gt;85%</span>
                    </p>
                    <p>
                      <strong className="text-text-primary">Heatmap:</strong> Highlights the regions of the X-ray
                      the model is paying most attention to. Red = high attention, blue/green = medium. Low-attention
                      regions are transparent.
                    </p>
                    <p>
                      <strong className="text-text-primary">Model accuracy:</strong> Pneumonia AUC = 0.86
                      means the model correctly ranks a pneumonia case higher than a normal case 86% of the time —
                      good, but not perfect. False positives are expected.
                    </p>
                  </div>
                </details>

                {/* Heatmap overlay */}
                {result.heatmap && (
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <div className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                        <Layers className="w-3 h-3" /> Attention Heatmap — {getPathology(result.prediction).display}
                      </div>
                      {result.mode && (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border ${
                            result.mode === 'grad_cam'
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-warning/10 text-warning border-warning/30'
                          }`}
                        >
                          <Gauge className="w-2.5 h-2.5" />
                          {result.mode === 'grad_cam' ? 'Accurate · Grad-CAM' : 'Fast · Pseudo-CAM'}
                        </span>
                      )}
                    </div>
                    <HeatmapOverlay heatmapSrc={result.heatmap} />
                    <div className="mt-2 text-[10px] text-text-muted italic text-center">
                      Red/yellow = regions the model focused on. Click pathologies below for details.
                    </div>
                  </div>
                )}

                {/* All pathology scores — new PathologyBar component */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span>All 18 Pathology Scores</span>
                    <span className="normal-case font-medium text-[10px] opacity-70">(click to expand)</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {Object.entries(result.pathologies || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([name, score], idx) => (
                        <PathologyBar key={name} name={name} score={score} rank={idx + 1} />
                      ))}
                  </div>
                </div>

                <button
                  onClick={clearImage}
                  className="w-full py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-error/5 hover:text-error hover:border-error/30 transition-all"
                >
                  Analyze Another X-ray
                </button>
                </>}
              </div>

            ) : (
              <div className="glass-card rounded-[2.5rem] p-8 border border-border">
                <div className="text-center py-16 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-error/10 flex items-center justify-center mx-auto">
                    <Stethoscope className="w-10 h-10 text-error/40" />
                  </div>
                  <h3 className="text-xl font-black text-text-primary">{copy.emptyTitle}</h3>
                  <p className="text-sm text-text-muted max-w-xs mx-auto">
                    {copy.emptyBody}
                  </p>
                  <div className="pt-3">
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold text-warning bg-warning/10 px-3 py-1.5 rounded-full border border-warning/20">
                      <AlertTriangle className="w-3 h-3" /> Research tool — not for clinical diagnosis
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Model Info */}
            {selected.modelInfo && (
              <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-error">
                <h4 className="font-black text-text-primary mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-error" /> Model Specifications
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

            {/* Searchable pathology list */}
            {selected.modelKey && (
              <ClassListSearch modelKey={selected.modelKey} accentColor="error" />
            )}
          </div>
        </motion.div>

        {/* Full-width Detailed Clinical Interpretation — spans the entire page width */}
        {result && (
          <motion.div variants={fadeUp}>
            <ClinicalInterpretation
              result={result}
              problemId={selectedId}
              outputType={outputType}
            />
          </motion.div>
        )}
      </>
      ) : (
        /* Coming Soon state for skin-lesion and retinal-oct */
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-xl font-black text-text-primary">Planned Features — {selected?.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f.label} className="glass-card rounded-2xl p-6 border border-border group hover:scale-[1.02] transition-all">
                  <f.icon className="w-8 h-8 mb-4" style={{ color: f.color }} />
                  <h4 className="font-black text-text-primary text-sm mb-2">{f.label}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8 border border-border relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-error/5 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-xl font-black text-text-primary mb-6">{selected?.label} Preview</h3>
              <div className="border-2 border-dashed border-border rounded-3xl p-10 flex flex-col items-center justify-center gap-4 opacity-60">
                <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-error/50" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-text-muted mb-1">Upload Medical Image</p>
                  <p className="text-xs text-text-muted">DICOM, JPG, PNG supported</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <span className="badge-coming-soon inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Coming Soon
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Info Panel */}
      <motion.div variants={fadeUp} className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-error">
        <h4 className="font-black text-text-primary mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-error" /> Medical Validation Pipeline
        </h4>
        <p className="text-sm text-text-muted font-medium">
          {isLive
            ? 'Grad-CAM visualizations highlight regions of interest for radiologist review — not intended as standalone diagnostic tools.'
            : (selected?.note || 'Models are undergoing rigorous validation against clinical datasets.')}
        </p>
      </motion.div>
    </motion.div>
  )
}
