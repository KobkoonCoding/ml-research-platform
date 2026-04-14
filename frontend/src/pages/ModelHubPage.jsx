import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BrainCircuit, ScanEye, Stethoscope, Target, Table2,
  ArrowRight, Sparkles, Zap, CheckCircle2, CircleDot
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } }
}

const CATEGORIES = [
  {
    id: 'image-classification',
    title: 'Image Classification',
    description: 'General image recognition powered by EfficientNetV2-S (83.9% accuracy) — identify objects across 1,000 ImageNet classes.',
    icon: ScanEye,
    color: '#6366F1',
    colorClass: 'primary',
    status: 'live',
    liveModels: 3,
    totalModels: 3,
    modelCount: '3 models available',
    path: '/deep-learning/image-classification',
  },
  {
    id: 'medical-imaging',
    title: 'Medical Imaging',
    description: 'Chest X-ray (18 pathologies + heatmap), skin-lesion classifier (7 ISIC classes), and brain-tumor MRI (4 classes) — each with attention overlays. Research only.',
    icon: Stethoscope,
    color: '#EF4444',
    colorClass: 'error',
    status: 'live',
    liveModels: 3,
    totalModels: 3,
    modelCount: '3 models available',
    path: '/deep-learning/medical-imaging',
  },
  {
    id: 'object-detection',
    title: 'Object Detection',
    description: 'Bounding-box detection across animal recognition, 17-keypoint pose estimation, and 80-class general object detection — all on YOLOv8.',
    icon: Target,
    color: '#10B981',
    colorClass: 'success',
    status: 'live',
    liveModels: 3,
    totalModels: 3,
    modelCount: '3 models available',
    path: '/deep-learning/object-detection',
  },
  {
    id: 'tabular',
    title: 'Table Data Classification',
    description: 'Live-debounced predictions for Titanic survival (LogReg), heart-disease risk (UCI Cleveland), and red-wine quality tier — with signed feature contributions.',
    icon: Table2,
    color: '#F59E0B',
    colorClass: 'warning',
    status: 'coming-soon',
    liveModels: 0,
    totalModels: 3,
    modelCount: '3 models coming soon',
    path: '/deep-learning/tabular',
  },
]

function CategoryCard({ category }) {
  const navigate = useNavigate()
  const Icon = category.icon
  const { status } = category

  return (
    <motion.div
      variants={fadeUp}
      onClick={() => navigate(category.path)}
      className="glass-card rounded-[2rem] p-8 border border-border cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
    >
      {/* Background glow */}
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-500"
        style={{ background: category.color }}
      />

      <div className="relative z-10">
        {/* Icon + Badge */}
        <div className="flex items-center justify-between mb-6">
          <div
            className="p-4 rounded-2xl"
            style={{ background: `${category.color}20` }}
          >
            <Icon className="w-8 h-8" style={{ color: category.color }} />
          </div>
          {status === 'live' ? (
            <span className="px-3 py-1.5 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> Live
            </span>
          ) : status === 'partial' ? (
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <CircleDot className="w-3 h-3" /> Partial
            </span>
          ) : (
            <span className="badge-coming-soon flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Coming Soon
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-black text-text-primary mb-3">{category.title}</h3>

        {/* Description */}
        <p className="text-text-muted text-sm font-medium leading-relaxed mb-6">
          {category.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted">{category.modelCount}</span>
          <div
            className="flex items-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: category.color }}
          >
            Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const PILL_LABELS = {
  'image-classification': 'Image',
  'medical-imaging': 'Medical',
  'object-detection': 'Detection',
  'tabular': 'Tabular',
}

function StatusPill({ category }) {
  const { liveModels, totalModels, id } = category
  const ratio = totalModels > 0 ? liveModels / totalModels : 0
  const isComplete = ratio === 1
  const color = isComplete ? '#10B981' : ratio > 0 ? '#6366F1' : '#64748B'
  const label = PILL_LABELS[id] || id

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold tracking-wide transition-colors"
      style={{ borderColor: `${color}40`, background: `${color}0A`, color }}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.7 }}>{liveModels}/{totalModels}</span>
      {isComplete && <CheckCircle2 className="w-3.5 h-3.5" />}
    </div>
  )
}

export default function ModelHubPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-primary/20 p-3 rounded-2xl">
              <BrainCircuit className="w-8 h-8 text-primary" />
            </div>
            <span className="badge-premium">Module 3: AI Model Hub</span>
          </div>
          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            AI Model <span className="text-gradient-warm">Hub</span>
          </h1>
          <p className="text-text-secondary max-w-3xl text-lg md:text-xl font-medium leading-relaxed">
            A curated collection of pre-trained AI models — enhanced by{' '}
            <strong className="text-primary">mathematical optimization</strong> for greater stability and reliability. We combine deep learning's pattern-matching power with proven optimization theory, so you get predictions that are both accurate and consistent.
          </p>
        </div>
      </motion.div>

      {/* Status Pills Bar */}
      <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-4 flex items-center justify-center gap-3 md:gap-4 flex-wrap">
        {CATEGORIES.map(cat => (
          <StatusPill key={cat.id} category={cat} />
        ))}
      </motion.div>

      {/* Category Cards Grid */}
      <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CATEGORIES.map(category => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </motion.div>
    </motion.div>
  )
}
