import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Table2, Sparkles, ShieldCheck, Database } from 'lucide-react'
import { TABULAR_PROBLEMS, fadeUp, stagger } from '../lib/problemConfigs'
import { API_BASE } from '../lib/constants'
import ProblemPicker from '../components/ProblemPicker'
import { getSchema } from '../lib/tabularSchemas'
import TabularInputForm from '../components/tabular/TabularInputForm'
import TabularResultsPanel from '../components/tabular/TabularResultsPanel'
import { useDebounce } from '../hooks/useDebounce'

export default function TabularClassificationPage() {
  const [selectedId, setSelectedId] = useState('titanic-survival')
  const selected = TABULAR_PROBLEMS.find((p) => p.id === selectedId)
  const schema = useMemo(() => getSchema(selectedId), [selectedId])
  const [values, setValues] = useState(schema?.defaults || {})
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset form when switching problem
  useEffect(() => {
    const s = getSchema(selectedId)
    if (s) setValues(s.defaults)
    setResult(null)
    setError(null)
  }, [selectedId])

  // Warm up bundle on mount / change
  useEffect(() => {
    if (!selected?.modelKey) return
    fetch(`${API_BASE}/models/warmup?model=${selected.modelKey}`).catch(() => {})
  }, [selected?.modelKey])

  // Live-debounced predictions
  const debouncedValues = useDebounce(values, 250)
  useEffect(() => {
    if (!selected?.endpoint) return
    let cancelled = false
    setIsLoading(true)
    axios
      .post(`${API_BASE}${selected.endpoint}`, debouncedValues, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      })
      .then((resp) => {
        if (cancelled) return
        setResult(resp.data)
        setError(null)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err?.response?.data?.detail || err.message || 'Request failed')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selected?.endpoint, debouncedValues])

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8 pb-12"
    >
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
            Adjust the sliders and dropdowns — predictions update live, with signed
            feature contributions telling you which inputs drove the result.
          </p>
        </div>
      </motion.div>

      {/* Problem Picker */}
      <ProblemPicker
        problems={TABULAR_PROBLEMS}
        selectedId={selectedId}
        onSelect={setSelectedId}
        accentColor="warning"
      />

      {/* Workspace */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6"
      >
        {/* Left: Input */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-black text-text-primary">
              Inputs — {selected?.label}
            </h3>
            {isLoading && (
              <span className="text-[11px] text-muted-foreground">updating…</span>
            )}
          </div>

          {/* Presets */}
          {schema?.presets?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground self-center">
                Try sample:
              </span>
              {schema.presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setValues(p.values)}
                  className="px-3 py-1.5 text-xs rounded-full border border-border bg-surface/60 hover:bg-primary/10 hover:border-primary transition"
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setValues(schema.defaults)}
                className="px-3 py-1.5 text-xs rounded-full border border-border/60 text-muted-foreground hover:bg-border/20 transition"
              >
                Reset
              </button>
            </div>
          )}

          <div className="glass-card rounded-2xl p-4 border border-border">
            <TabularInputForm schema={schema} values={values} onChange={setValues} />
          </div>

          {/* Model card */}
          {selected?.modelInfo && (
            <div className="glass-card rounded-2xl p-4 border border-border text-xs">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-warning" />
                <h4 className="font-black uppercase tracking-wider text-text-muted">
                  Model Specifications
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selected.modelInfo).map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {k}
                    </span>
                    <span className="text-text-primary font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div>
          <TabularResultsPanel
            schema={schema}
            result={result}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </motion.div>

      {/* Info panel */}
      <motion.div
        variants={fadeUp}
        className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-warning"
      >
        <h4 className="font-black text-text-primary mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-warning" /> How this works
        </h4>
        <p className="text-sm text-text-muted font-medium leading-relaxed">
          Each task trains a fresh scikit-learn model from a public dataset at backend startup.
          The live-debounced slider sends your feature vector to the backend, which returns a
          softmax distribution plus signed contributions per feature — using LogReg coefficients
          for Titanic and a LOCO approximation for the gradient-boosted Heart / Wine models.
        </p>
      </motion.div>
    </motion.div>
  )
}
