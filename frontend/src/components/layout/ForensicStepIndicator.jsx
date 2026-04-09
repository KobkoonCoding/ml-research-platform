import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Upload, BarChart2, Wand2, ShieldCheck, ChevronRight, Check, Cpu, Database, BrainCircuit, Activity } from 'lucide-react'
import { useApp } from '../../context/AppContext'

const FORENSIC_STEPS = [
  { id: 1, label: 'Upload', sublabel: 'Choose Data', path: '/forensic/upload', icon: Upload, requiresData: false },
  { id: 2, label: 'Explore', sublabel: 'Analyze Data', path: '/forensic/analysis', icon: BarChart2, requiresData: true },
  { id: 3, label: 'Clean', sublabel: 'Preprocess', path: '/forensic/cleaning', icon: Wand2, requiresData: true },
  { id: 4, label: 'Verify', sublabel: 'Run Test', path: '/forensic/verify', icon: ShieldCheck, requiresData: true },
]

const ELM_STEPS = [
  { id: 1, label: 'Upload', sublabel: 'Import Data', path: '/elm-studio/upload', icon: Cpu, requiresData: false },
  { id: 2, label: 'Setup', sublabel: 'Configure', path: '/elm-studio/setup', icon: Database, requiresData: true },
  { id: 3, label: 'Train', sublabel: 'Build Model', path: '/elm-studio/train', icon: BrainCircuit, requiresData: true },
  { id: 4, label: 'Predict', sublabel: 'Inference', path: '/elm-studio/predict', icon: Activity, requiresData: true },
]

const MODULE_CONFIG = {
  forensic: { steps: FORENSIC_STEPS, color: 'var(--color-forensic, #10b981)', label: 'Module 1 · Data Forensic', stateKey: 'forensic' },
  elm: { steps: ELM_STEPS, color: 'var(--color-neural, #f59e0b)', label: 'Module 2 · ELM Studio', stateKey: 'neural' },
}

export default function ForensicStepIndicator({ module = 'forensic' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const appState = useApp()

  const config = MODULE_CONFIG[module] || MODULE_CONFIG.forensic
  const steps = config.steps
  const stateData = appState[config.stateKey]
  const hasData = !!stateData?.analysis

  const currentIdx = steps.findIndex(s => location.pathname.startsWith(s.path))

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6"
    >
      {/* Module Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: config.color, boxShadow: `0 0 8px ${config.color}99` }}
        />
        <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>

      {/* Step Track */}
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-px" style={{ background: 'var(--border-subtle)' }} />
        <motion.div
          className="absolute top-5 left-0 h-px"
          style={{ background: `linear-gradient(90deg, ${config.color}, ${config.color}4D)` }}
          initial={{ width: '0%' }}
          animate={{ width: currentIdx >= 0 ? `${(currentIdx / (steps.length - 1)) * 100}%` : '0%' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isActive = location.pathname.startsWith(step.path)
            const isCompleted = idx < currentIdx
            const isDisabled = step.requiresData && !hasData
            const canNavigate = !isDisabled || idx === 0

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => canNavigate && navigate(step.path)}
                  disabled={!canNavigate}
                  className="flex flex-col items-center gap-2 group"
                  style={{ cursor: canNavigate ? 'pointer' : 'not-allowed' }}
                >
                  {/* Icon Circle */}
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="relative w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300"
                    style={{
                      background: isCompleted
                        ? config.color
                        : isActive
                        ? `linear-gradient(135deg, ${config.color}, #34d399)`
                        : 'var(--bg-card-subtle)',
                      border: isActive
                        ? `2px solid ${config.color}`
                        : isCompleted
                        ? `2px solid ${config.color}`
                        : '2px solid var(--border-medium)',
                      boxShadow: isActive
                        ? `0 0 20px ${config.color}66, 0 0 40px ${config.color}1A`
                        : isCompleted
                        ? `0 0 12px ${config.color}33`
                        : 'none',
                      opacity: isDisabled && !isActive ? 0.4 : 1,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Icon
                        className="w-4 h-4 transition-colors"
                        style={{ color: isActive ? 'white' : isDisabled ? 'var(--color-text-muted)' : 'var(--color-text-secondary)' }}
                      />
                    )}

                    {/* Active pulse ring */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${config.color}` }}
                        animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                  </motion.div>

                  {/* Labels */}
                  <div className="flex flex-col items-center">
                    <span
                      className="text-xs font-semibold transition-colors"
                      style={{
                        color: isActive
                          ? config.color
                          : isCompleted
                          ? 'var(--color-text-primary)'
                          : 'var(--color-text-muted)',
                        opacity: isDisabled && !isActive ? 0.5 : 1,
                      }}
                    >
                      {step.label}
                    </span>
                    <span className="text-[11px] hidden sm:block" style={{ color: 'var(--color-text-muted)' }}>
                      {step.sublabel}
                    </span>
                  </div>
                </button>

                {/* Chevron between steps */}
                {idx < steps.length - 1 && (
                  <div className="flex items-start pt-2.5 opacity-20">
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
