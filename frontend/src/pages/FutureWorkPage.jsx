import React, { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { API_BASE } from '../lib/constants'
import {
  BrainCircuit, Image as ImageIcon, Activity, Sparkles,
  Upload, CheckCircle2, AlertCircle, Trash2, Camera,
  Stethoscope, BarChart, Heart, MousePointer2
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } }
}

export default function FutureWorkPage() {
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setPreview(URL.createObjectURL(file))
      setResult(null)
      setError(null)
    }
  }

  const runImagePredict = async () => {
    if (!image) return
    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', image)

    try {
      const resp = await axios.post(`${API_BASE}/category3/predict-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Image classification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="glass-panel rounded-[2.5rem] p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-accent-warm/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-accent-warm/20 p-3 rounded-2xl">
              <BrainCircuit className="w-8 h-8 text-accent-warm" />
            </div>
            <span className="badge-premium">Category 3: Advanced Research</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
             Deep <span className="text-gradient-warm">Research Nexus</span>
          </h1>
          <p className="text-text-muted max-w-3xl text-xl font-medium leading-relaxed">
            The future of AI-driven research. Real-time image classification using EfficientNetV2 and upcoming medical health trend analysis for hypertension prediction.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* IMAGE CLASSIFICATION MODULE */}
        <motion.div variants={fadeUp} className="glass-card rounded-[2.5rem] p-8 border-2 border-primary/10">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black flex items-center gap-3">
              <ImageIcon className="w-7 h-7 text-primary" /> Visual Recognition
            </h3>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">EfficientNetV2-S</span>
          </div>

          {!preview ? (
            <label className="border-2 border-dashed border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-primary/50 transition-all hover:bg-primary/5 group">
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-text-muted" />
              </div>
              <div className="text-center">
                <p className="font-bold text-white mb-1">Upload Laboratory Image</p>
                <p className="text-xs text-text-muted">Supports JPG, PNG, WEBP (Max 10MB)</p>
              </div>
            </label>
          ) : (
            <div className="space-y-6">
              <div className="relative rounded-3xl overflow-hidden aspect-video border border-white/10 shadow-2xl group">
                <img src={preview} alt="Upload" className="w-full h-full object-cover" />
                <button 
                  onClick={() => {setPreview(null); setImage(null); setResult(null);}}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-black/50 backdrop-blur-md text-white hover:bg-error transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {!result && (
                <button 
                  onClick={runImagePredict}
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-primary text-white font-black text-lg flex items-center justify-center gap-3 shadow-lg shadow-primary/30"
                >
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing Scene...</>
                  ) : (
                    <><Camera className="w-5 h-5" /> Run Neural Inference</>
                  )}
                </button>
              )}

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-3xl bg-surface border border-white/10 space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Top Prediction</div>
                      <div className="text-3xl font-black text-white capitalize">{result.prediction.replace(/_/g, ' ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">Confidence</div>
                      <div className="text-3xl font-black text-success">{(result.confidence * 100).toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(result.all_scores).map(([cls, score]) => (
                      <div key={cls} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="capitalize">{cls.replace(/_/g, ' ')}</span>
                          <span>{(score * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${score * 100}%` }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-error/10 border border-error/20 flex items-center gap-3 text-error text-sm font-bold">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          )}
        </motion.div>

        {/* HEALTH TRENDS PLACEHOLDER */}
        <motion.div variants={fadeUp} className="space-y-8">
           <div className="glass-card rounded-[2.5rem] p-8 border-2 border-secondary/10 relative overflow-hidden group">
             <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-[60px]" />
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-2xl font-black flex items-center gap-3">
                 <Heart className="w-7 h-7 text-secondary" /> Medical Health Analytics
               </h3>
               <span className="badge-coming-soon flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Coming Soon
               </span>
             </div>
             
             <p className="text-text-muted font-medium mb-8">
               Dedicated environment for Hypertension (High Blood Pressure) prediction and physiological trend analysis.
             </p>

             <div className="grid grid-cols-2 gap-4">
               {[
                 { icon: Stethoscope, label: 'Hypertension', color: '#F87171' },
                 { icon: Activity, label: 'BP Trends', color: '#60A5FA' },
                 { icon: BarChart, label: 'Risk Factor', color: '#34D399' },
                 { icon: BrainCircuit, label: 'Predictive RX', color: '#A78BFA' }
               ].map((item, i) => (
                 <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-all text-center">
                    <item.icon className="w-8 h-8 mx-auto mb-3" style={{ color: item.color }} />
                    <span className="text-sm font-bold text-white">{item.label}</span>
                 </div>
               ))}
             </div>

             <div className="mt-10 p-6 rounded-3xl bg-black/20 border border-white/5 text-center">
               <MousePointer2 className="w-6 h-6 mx-auto mb-3 text-text-muted opacity-50" />
               <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Module under rigorous medical validation</p>
             </div>
           </div>

           <div className="glass-panel p-6 rounded-[2rem] border-l-4 border-l-accent-warm">
              <h4 className="font-black text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-warm" /> Pipeline Compliance
              </h4>
              <p className="text-sm text-text-muted font-medium">
                Our image processing pipeline utilizes zero-leakage transforms and ImageNet-standard normalization for maximum reliability in scientific publication.
              </p>
           </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
