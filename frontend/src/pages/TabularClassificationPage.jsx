import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Table2, Sparkles, ShieldCheck } from 'lucide-react'
import { TABULAR_PROBLEMS, fadeUp, stagger } from '../lib/problemConfigs'
import ProblemPicker from '../components/ProblemPicker'
import SEO from '../components/SEO'

export default function TabularClassificationPage() {
  const [selectedId, setSelectedId] = useState('titanic-survival')
  const selected = TABULAR_PROBLEMS.find((p) => p.id === selectedId)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8 pb-12"
    >
      <SEO
        path="/deep-learning/tabular"
        title="Tabular Classification — Coming Soon"
        description="Live-debounced tabular classifiers (Titanic survival, heart-disease risk, wine quality) with signed feature contributions — coming soon to the AI Model Hub."
      />
      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="glass-panel rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-warning/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-warning/20 p-3 rounded-2xl">
              <Table2 className="w-8 h-8 text-warning" />
            </div>
            <span className="badge-premium">Table Data Classification</span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-black tracking-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Table Data{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
              Classification
            </span>
          </h1>
          <p className="text-text-muted max-w-3xl text-lg font-medium leading-relaxed">
            Live tabular classifiers with signed feature contributions — coming soon to the AI Model Hub.
          </p>
        </div>
      </motion.div>

      {/* Problem Picker — all problems are coming-soon, picker shows badges + descriptions */}
      <ProblemPicker
        problems={TABULAR_PROBLEMS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        accentColor="warning"
      />

      {/* Coming Soon placeholder */}
      <motion.div variants={fadeUp} className="glass-card rounded-[2.5rem] p-8 border border-border">
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-warning/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-10 h-10 text-warning/40" />
          </div>
          <h3 className="text-xl font-black text-text-primary">{selected?.label}</h3>
          <p className="text-sm text-text-muted max-w-md mx-auto">{selected?.description}</p>
          <span className="badge-coming-soon inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Coming Soon
          </span>
        </div>
      </motion.div>

      {/* Info panel */}
      <motion.div
        variants={fadeUp}
        className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-warning"
      >
        <h4 className="font-black text-text-primary mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-warning" /> What's planned
        </h4>
        <p className="text-sm text-text-muted font-medium leading-relaxed">
          Live-debounced predictions across Titanic survival, heart-disease risk, and red-wine
          quality — each with signed feature contributions so you can see which inputs drive the
          result. Models will use scikit-learn classifiers fit on public datasets, with a LOCO
          approximation for tree-based contributions.
        </p>
      </motion.div>
    </motion.div>
  )
}
