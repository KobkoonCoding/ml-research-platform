import React, { useState, useRef, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export const METRIC_EXPLANATIONS = {
  'Top-1 Accuracy': 'Percentage of images where the single top prediction matches the correct class. Higher is better.',
  'Top-5 Accuracy': 'Percentage of images where the correct class appears in the top 5 predictions. Always higher than Top-1.',
  'AUC': 'Area Under the ROC Curve. Measures how well the model separates classes — 1.0 is perfect, 0.5 is random. Above 0.8 is considered good in medical diagnostics.',
  'Pneumonia AUC': 'AUC specifically for pneumonia vs. normal. 0.86 means a random pneumonia case is ranked higher than a random normal case 86% of the time.',
  'Mean AUC (18 path.)': 'Average AUC across all 18 chest pathologies the model detects (pneumonia, atelectasis, cardiomegaly, etc.).',
  'Clinical grade': 'This model is for research and education only. It has not been FDA/CE-cleared for clinical diagnostic use. Always consult a qualified radiologist.',
  'F1 Score': 'Harmonic mean of precision and recall (0 to 1). Balances false positives and false negatives — best for imbalanced datasets.',
  'Precision': 'Of all predictions the model says are positive, how many actually are. High precision = few false alarms.',
  'Recall': 'Of all actual positive cases, how many the model catches. High recall = few missed cases.',
  'mAP 50-95': 'Mean Average Precision for object detection, averaged across IoU thresholds 0.5 to 0.95. Standard COCO benchmark metric.',
  'mAP 50': 'Mean Average Precision with IoU threshold 0.5 (a detection counts as correct if it overlaps the ground truth by 50%+).',
  'architecture': 'The neural network backbone — e.g. EfficientNet, ViT, DenseNet. Affects speed and accuracy.',
  'framework': 'The ML library used to run the model (PyTorch, HuggingFace Transformers, etc.).',
  'parameters': 'Number of trainable weights. More parameters usually means more accurate but slower.',
  'dataset': 'The dataset used to train the model. Model accuracy is measured on a held-out test split.',
  'license': 'The software license that governs commercial use of the model weights.',
}

export default function MetricHelpTooltip({ metric, children }) {
  const explanation = METRIC_EXPLANATIONS[metric]
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  if (!explanation) {
    return <>{children}</>
  }

  return (
    <span className="relative inline-flex items-center gap-1" ref={ref}>
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="inline-flex items-center justify-center text-text-muted hover:text-primary transition-colors"
        aria-label={`Explain ${metric}`}
      >
        <HelpCircle className="w-3 h-3" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 top-full mt-1.5 w-64 p-3 rounded-xl border border-border glass-panel shadow-xl"
            role="tooltip"
          >
            <div className="text-[11px] font-black text-text-primary mb-1 uppercase tracking-widest">{metric}</div>
            <div className="text-xs text-text-secondary font-medium leading-relaxed normal-case">{explanation}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
