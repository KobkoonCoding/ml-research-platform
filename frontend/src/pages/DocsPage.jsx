import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, UploadCloud, BarChart2, Settings2, BrainCircuit, ChevronRight,
  Zap, ShieldCheck, FileCode, Download, ArrowRight, Sparkles, Lightbulb
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function DocsPage() {
  const steps = [
    {
      icon: UploadCloud,
      title: '1. Data Ingestion',
      description: 'Upload your raw tabular dataset (.csv, .xlsx). The platform instantly analyzes schema, data types, and structural integrity.',
      color: '#6366F1',
      tips: ['Supports CSV and Excel formats', 'Max file size: 100MB', 'Try demo datasets to explore features']
    },
    {
      icon: BarChart2,
      title: '2. Exploratory Data Analysis',
      description: 'Discover hidden patterns, correlation matrices, and distribution metrics. Essential for understanding feature relationships.',
      color: '#3B82F6',
      tips: ['Interactive histograms and box plots', 'Missing value heatmap analysis', 'Pair plots for multi-variable correlation']
    },
    {
      icon: Settings2,
      title: '3. Preprocessing Pipeline',
      description: 'Handle missing values, detect outliers, scale features, and encode categories with built-in data leakage protection.',
      color: '#06B6D4',
      tips: ['9+ preprocessing tools available', 'Preview changes before applying', 'Export pipeline as JSON or Python script']
    },
    {
      icon: BrainCircuit,
      title: '4. Model Training & Validation',
      description: 'Train Extreme Learning Machine models for classification or regression with Cross-Validation support.',
      color: '#8B5CF6',
      tips: ['K-Fold and Stratified K-Fold CV', 'Automatic data leakage prevention', 'Comprehensive metric reports and charts']
    }
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-primary">Documentation</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Getting <span className="text-gradient">Started</span>
          </h1>
          <p className="text-text-muted max-w-2xl text-lg">
            A step-by-step guide to using the ML Research Platform for your data analysis and machine learning projects.
          </p>
        </div>
      </motion.div>

      {/* Quick start */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8 border-l-4 border-l-success">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-2">Quick Start</h3>
            <p className="text-text-muted mb-4">
              Jump right in by loading a demo dataset. Go to Upload Dataset and click any demo button to instantly explore the platform.
            </p>
            <Link to="/dashboard/upload">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success/15 text-success font-semibold text-sm hover:bg-success/25 transition-colors">
                Go to Upload <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Workflow Steps */}
      <div className="space-y-6">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="glass-card rounded-2xl p-8 group"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform"
                     style={{ background: `${step.color}15` }}>
                  <step.icon className="w-8 h-8" style={{ color: step.color }} />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-text-muted mb-4 leading-relaxed">{step.description}</p>
                <div className="flex flex-wrap gap-3">
                  {step.tips.map((tip, j) => (
                    <span key={j} className="text-xs px-3 py-1.5 rounded-lg border border-white/5 text-text-secondary" style={{ background: `${step.color}08` }}>
                      {tip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Data Leakage Notice */}
      <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-8 border-l-4 border-l-warning">
        <div className="flex items-start gap-4">
          <ShieldCheck className="w-8 h-8 text-warning flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold mb-2">Data Leakage Protection</h3>
            <p className="text-text-muted leading-relaxed">
              This platform complies with strict ML best practices. All statistical transformations (Scaling, Encoding, Imputation)
              are pipeline-bound — learned on training folds and applied to validation folds during cross-validation.
              This guarantees zero data leakage in all experiments.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Export capabilities */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Download className="w-6 h-6 text-accent" />
          Export Capabilities
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: FileCode, label: 'Python Script', desc: 'Reproducible preprocessing pipeline' },
            { icon: Download, label: 'CSV / Excel', desc: 'Export cleaned datasets' },
            { icon: BookOpen, label: 'JSON Recipe', desc: 'Pipeline configuration file' },
          ].map((item, i) => (
            <div key={i} className="glass-panel rounded-xl p-5 flex items-start gap-3 group">
              <item.icon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm mb-1">{item.label}</div>
                <div className="text-xs text-text-muted">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
