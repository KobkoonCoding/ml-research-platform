import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { API_BASE } from '../lib/constants'
import { OBJECT_DETECTION_PROBLEMS, fadeUp, stagger } from '../lib/problemConfigs'
import ProblemPicker from '../components/ProblemPicker'
import ImageUploadZone from '../components/ImageUploadZone'
import BoundingBoxOverlay from '../components/BoundingBoxOverlay'
import PoseSkeletonOverlay from '../components/PoseSkeletonOverlay'
import ClassListSearch from '../components/ClassListSearch'
import MetricHelpTooltip from '../components/MetricHelpTooltip'
import {
  Target, Sparkles, Box, SlidersHorizontal, BarChart3,
  Layers, ShieldCheck, Upload, AlertCircle, Zap,
  PersonStanding, Activity
} from 'lucide-react'

const PROBLEM_FEATURES = {
  'animal-detection': [
    { icon: Box, label: 'Animal Bounding Boxes', description: 'Localize dogs, cats, birds, and wildlife with precise boxes', color: '#10B981' },
    { icon: Layers, label: 'Multi-animal Detection', description: 'Detect multiple animals in a single image simultaneously', color: '#6366F1' },
    { icon: SlidersHorizontal, label: 'Confidence Threshold', description: 'Adjustable slider to filter by minimum confidence', color: '#F59E0B' },
    { icon: BarChart3, label: 'Species Analytics', description: 'Count and classify detected animals across photos', color: '#EF4444' },
  ],
  'pose-estimation': [
    { icon: PersonStanding, label: '17-Keypoint Skeleton', description: 'Detect nose, eyes, shoulders, elbows, wrists, hips, knees, ankles', color: '#10B981' },
    { icon: Activity, label: 'Multi-person Pose', description: 'Track skeleton poses of multiple people simultaneously', color: '#6366F1' },
    { icon: SlidersHorizontal, label: 'Keypoint Confidence', description: 'Filter uncertain keypoints with a confidence slider', color: '#F59E0B' },
    { icon: BarChart3, label: 'Yoga / Dance / Sports', description: 'Fun uploads — selfies, group photos, action shots', color: '#EF4444' },
  ],
  'general-objects': [
    { icon: Box, label: 'COCO 80 Categories', description: 'Detect laptops, cups, phones, chairs, bags, food, vehicles, and more', color: '#10B981' },
    { icon: Layers, label: 'Multi-class Detection', description: 'Detect multiple object types in a single image', color: '#6366F1' },
    { icon: SlidersHorizontal, label: 'Confidence Filter', description: 'Adjust minimum confidence threshold', color: '#F59E0B' },
    { icon: BarChart3, label: 'Object Statistics', description: 'Summary of detected objects and class distribution', color: '#EF4444' },
  ],
}

export default function ObjectDetectionPage() {
  const [selectedId, setSelectedId] = useState('animal-detection')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [confThreshold, setConfThreshold] = useState(0.25)

  const selected = OBJECT_DETECTION_PROBLEMS.find(p => p.id === selectedId)
  const isLive = selected?.status === 'live'
  const isPose = selectedId === 'pose-estimation'
  const features = PROBLEM_FEATURES[selectedId] || PROBLEM_FEATURES['animal-detection']

  const predictLabelByTask = {
    'animal-detection': 'Detect Animals',
    'pose-estimation': 'Detect Poses',
    'general-objects': 'Detect Objects',
  }
  const emptyCopyByTask = {
    'animal-detection': 'Upload an image with animals to see bounding box detection powered by YOLOv8.',
    'pose-estimation': 'Upload a photo of people — selfies, sports, dance, yoga — to see a 17-keypoint skeleton.',
    'general-objects': 'Upload any everyday photo — kitchen, office, street — to detect objects across 80 COCO classes.',
  }

  useEffect(() => {
    setImage(null)
    setPreview(null)
    setResult(null)
    setError(null)
  }, [selectedId])

  // Warm up YOLO model when selected
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
      const resp = await axios.post(`${API_BASE}${selected.endpoint}?conf_threshold=0.1`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Detection failed')
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
      const prediction = await axios.post(`${API_BASE}${selected.endpoint}?conf_threshold=0.1`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(prediction.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process sample image')
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    if (!result) return null
    const visible = result.detections.filter(d => d.confidence >= confThreshold)
    const classes = new Set(visible.map(d => d.class_name))
    const avgConf = visible.length > 0 ? visible.reduce((s, d) => s + d.confidence, 0) / visible.length : 0
    return {
      count: visible.length,
      classes: classes.size,
      avgConf: Math.round(avgConf * 100),
    }
  }, [result, confThreshold])

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8 pb-12">
      {/* Header */}
      <motion.div variants={fadeUp} className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-success/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-success/20 p-3 rounded-2xl"><Target className="w-8 h-8 text-success" /></div>
            <span className="badge-premium">Object Detection</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Object <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Detection</span>
          </h1>
          <p className="text-text-muted max-w-3xl text-lg font-medium leading-relaxed">
            Detect and localize objects with bounding boxes — select a problem to explore specialized detection models.
          </p>
        </div>
      </motion.div>

      {/* Problem Picker */}
      <ProblemPicker problems={OBJECT_DETECTION_PROBLEMS} selectedId={selectedId} onSelect={setSelectedId} accentColor="success" />

      {/* LIVE: Animal Detection */}
      {isLive ? (
        <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload + Slider Column */}
          <div className="space-y-6">
            <div className="glass-card rounded-[2.5rem] p-8 border border-border">
              <h3 className="text-2xl font-black flex items-center gap-3 text-text-primary mb-8">
                <Target className="w-7 h-7 text-success" /> Upload Image
              </h3>
              <ImageUploadZone
                accentColor="success"
                image={image}
                preview={preview}
                loading={loading}
                onFileSelect={handleFileSelect}
                onClear={clearImage}
                onPredict={runPredict}
                showPredict={!result}
                predictLabel={predictLabelByTask[selectedId] || 'Detect'}
                uploadHint="JPG, PNG, WEBP supported"
                sampleImages={selected.sampleImages}
                onSampleClick={handleSampleClick}
                maxDimension={640}
              />
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {error}
                </div>
              )}
            </div>

            {/* Confidence Threshold Slider */}
            {result && (
              <div className="glass-card rounded-2xl p-6 border border-border">
                <h4 className="font-black text-text-primary text-sm mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-success" /> Confidence Threshold
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-text-muted">
                    <span>Min Confidence</span>
                    <span className="text-success">{(confThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={confThreshold}
                    onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                    className="w-full accent-success"
                  />
                  <p className="text-[10px] text-text-muted">Hide detections below this confidence level</p>
                </div>
              </div>
            )}
          </div>

          {/* Results Column */}
          <div className="space-y-8">
            {result ? (
              <div className="glass-card rounded-[2.5rem] p-8 border border-border space-y-6">
                <h3 className="text-2xl font-black text-text-primary">Detection Results</h3>

                {/* Overlay — pose vs bbox */}
                {isPose ? (
                  <PoseSkeletonOverlay
                    imageSrc={preview}
                    detections={result.detections}
                    imageWidth={result.image_width}
                    imageHeight={result.image_height}
                    confThreshold={confThreshold}
                  />
                ) : (
                  <BoundingBoxOverlay
                    imageSrc={preview}
                    detections={result.detections}
                    imageWidth={result.image_width}
                    imageHeight={result.image_height}
                    confThreshold={confThreshold}
                  />
                )}

                {/* Stats Grid */}
                {stats && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Objects', value: stats.count, color: '#10B981' },
                      { label: 'Classes', value: stats.classes, color: '#6366F1' },
                      { label: 'Avg Conf', value: `${stats.avgConf}%`, color: '#F59E0B' },
                    ].map((stat) => (
                      <div key={stat.label} className="p-4 rounded-2xl bg-border/30 border border-border text-center">
                        <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Detection list */}
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">Detections</div>
                  {result.detections
                    .filter(d => d.confidence >= confThreshold)
                    .sort((a, b) => b.confidence - a.confidence)
                    .map((det, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-border/20">
                        <span className="text-xs font-bold text-text-primary capitalize">{det.class_name}</span>
                        <span className="text-xs text-success font-black">{(det.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  {result.detections.filter(d => d.confidence >= confThreshold).length === 0 && (
                    <p className="text-xs text-text-muted italic">No detections above threshold</p>
                  )}
                </div>

                <button
                  onClick={clearImage}
                  className="w-full py-4 rounded-2xl border border-border text-text-muted font-bold hover:bg-success/5 hover:text-success hover:border-success/30 transition-all"
                >
                  Detect Another Image
                </button>
              </div>
            ) : (
              <div className="glass-card rounded-[2.5rem] p-8 border border-border">
                <div className="text-center py-16 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-success/10 flex items-center justify-center mx-auto">
                    <Target className="w-10 h-10 text-success/40" />
                  </div>
                  <h3 className="text-xl font-black text-text-primary">Ready to Detect</h3>
                  <p className="text-sm text-text-muted max-w-xs mx-auto">
                    {emptyCopyByTask[selectedId] || 'Upload an image to run detection.'}
                  </p>
                </div>
              </div>
            )}

            {/* Model Info */}
            {selected.modelInfo && (
              <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-success">
                <h4 className="font-black text-text-primary mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-success" /> Model Specifications
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

            {/* Searchable animal class list */}
            {selected.modelKey && (
              <ClassListSearch modelKey={selected.modelKey} accentColor="success" />
            )}
          </div>
        </motion.div>
      ) : (
        /* Coming Soon: traffic-signs, general-objects */
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
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent" />
            <div className="relative z-10">
              <h3 className="text-xl font-black text-text-primary mb-6">Detection Preview</h3>
              <div className="border-2 border-dashed border-border rounded-3xl p-10 flex flex-col items-center justify-center gap-4 opacity-60">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-success/50" />
                </div>
                <p className="text-sm font-bold text-text-muted">Upload Image for Detection</p>
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
      <motion.div variants={fadeUp} className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-success">
        <h4 className="font-black text-text-primary mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-success" /> Model Status
        </h4>
        <p className="text-sm text-text-muted font-medium">
          {isLive
            ? (
                selectedId === 'animal-detection'
                  ? 'YOLOv8n trained on COCO 2017 — detects 10 animal classes (bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe). License: AGPL-3.0.'
                : selectedId === 'pose-estimation'
                  ? 'YOLOv8n-pose trained on COCO Keypoints 2017 — locates 17 body keypoints (eyes, ears, shoulders, elbows, wrists, hips, knees, ankles) per person. License: AGPL-3.0.'
                  : 'YOLOv8n trained on COCO 2017 — detects 80 everyday object categories (vehicles, furniture, electronics, kitchenware, food, etc.). License: AGPL-3.0.'
              )
            : (selected?.note || 'Object detection models are currently in training.')}
        </p>
      </motion.div>
    </motion.div>
  )
}
