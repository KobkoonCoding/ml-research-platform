import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, BrainCircuit, Cpu, ScanEye, Terminal, Activity, 
  Settings, ChevronRight, AlertCircle, RefreshCw, Layers,
  Table as TableIcon, Send, Sparkles, Database, CheckCircle2,
  Image as ImageIcon, Stethoscope, PawPrint, FileText
} from 'lucide-react'
import classNames from 'classnames'
import { useApp } from '../context/AppContext'
import { API_BASE } from '../lib/constants'

const API = API_BASE

export default function PredictPage({ module = 'neural' }) {
  const { neural, setNeuralData } = useApp()
  const { inferenceModel, analysis } = neural
  
  const [inputs, setInputs] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeMode, setActiveMode] = useState('tabular') // 'tabular' or 'vision'

  // Initialize input form from model features
  useEffect(() => {
    if (inferenceModel && Object.keys(inputs).length === 0) {
      const init = {}
      inferenceModel.features.forEach(f => {
        init[f] = analysis?.summary_statistics?.[f]?.mean || 0
      })
      setInputs(init)
    }
  }, [inferenceModel, analysis])

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resp = await axios.post(`${API}/predict`, { data: inputs })
      setResult(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Inference failed.')
    } finally {
      setLoading(false)
    }
  }

  const renderTabularInference = () => {
    if (!inferenceModel) {
      return (
        <div className="glass-panel p-16 flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-24 h-24 rounded-full bg-neural/10 flex items-center justify-center mb-4">
              <BrainCircuit className="w-12 h-12 text-neural opacity-20" />
           </div>
           <h3 className="text-2xl font-black text-white">No Active Model Synapse</h3>
           <p className="text-text-muted max-w-md">
             The Neural Engine requires a finalized model for inference. 
             Please train and finalize a model in the Training Hub first.
           </p>
           <button 
             className="px-8 py-3 rounded-xl bg-neural hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-neural/30"
             onClick={() => window.location.href = '/neural-engine/train'}
           >
             GO TO TRAINING HUB
           </button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Input Form */}
         <div className="lg:col-span-8 glass-panel p-10 space-y-10">
            <div className="flex items-center justify-between">
               <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                  <Terminal className="text-neural" /> Synaptic stimulation
               </h3>
               <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                  {inferenceModel.features.length} Features Loaded
               </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-6 custom-scrollbar">
               {inferenceModel.features.map(feat => (
                 <div key={feat} className="space-y-3 p-5 rounded-3xl bg-black/20 border border-white/5 hover:border-neural/20 transition-all group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-neural transition-colors flex justify-between">
                       {feat}
                       <span className="opacity-0 group-hover:opacity-60 font-normal italic lowercase">Input Variable</span>
                    </label>
                    <input 
                      type="number" 
                      className="w-full bg-transparent border-none text-2xl font-black outline-none -mt-2 text-white"
                      value={inputs[feat] || ''}
                      onChange={e => setInputs({...inputs, [feat]: e.target.value})}
                    />
                 </div>
               ))}
            </div>

            <button 
               onClick={handlePredict}
               disabled={loading}
               className="w-full py-6 rounded-[2.5rem] bg-gradient-to-r from-neural to-orange-500 text-white font-black uppercase tracking-[0.4em] text-sm shadow-2xl shadow-neural/30 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-98 transition-all"
            >
               {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
               {loading ? "COMPUTING SINAPSES..." : "RUN INFERENCE"}
            </button>
         </div>

         {/* Result Panel */}
         <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="flex-1 glass-panel p-10 rounded-[4rem] bg-gradient-to-br from-neural/20 to-transparent border-t-4 border-t-neural shadow-[0_40px_100px_-20px_rgba(245,158,11,0.4)] flex flex-col items-center justify-center text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                  <Activity size={240} />
               </div>
               
               <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.8, opacity:0}} className="space-y-6">
                       <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neural mb-6 block">Classification State</span>
                       <div className="text-9xl font-black text-white tracking-tighter drop-shadow-2xl mb-4">
                          {result.prediction}
                       </div>
                       <div className="bg-black/40 backdrop-blur-2xl px-10 py-5 rounded-[2rem] border border-white/10 shadow-huge">
                          <div className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Confidence Profile</div>
                          <div className="text-xl font-bold text-neural">Structural High</div>
                       </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-6 opacity-30">
                       <Cpu className="w-20 h-20 mx-auto mb-6" />
                       <div className="text-sm font-black uppercase tracking-[0.3em]">Awaiting Stimulation</div>
                       <p className="text-[10px] max-w-[200px] mx-auto leading-relaxed">Adjust input tensors and trigger the inference engine to begin.</p>
                    </div>
                  )}
               </AnimatePresence>
            </div>

            <div className="glass-panel p-8 space-y-4">
               <h4 className="text-xs font-black uppercase text-text-muted tracking-widest">Explainable AI (XAI)</h4>
               <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 group hover:bg-white/10 transition-colors">
                  <div className="p-3 rounded-xl bg-orange-500/20 group-hover:bg-orange-500/30">
                     <FileText className="w-5 h-5 text-neural" />
                   </div>
                  <div className="text-left">
                     <div className="text-xs font-bold text-white">Generate SHAP Report</div>
                     <p className="text-[10px] text-text-muted mt-0.5">Global feature importance analysis.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    )
  }

  const renderVisionInference = () => (
    <div className="space-y-10 pb-20">
       <div className="glass-panel p-16 flex flex-col items-center justify-center text-center space-y-8 bg-gradient-to-br from-neural/10 to-transparent">
          <div className="w-24 h-24 rounded-[2rem] bg-neural/20 flex items-center justify-center border border-neural/30 shadow-2xl shadow-neural/20">
             <ScanEye className="w-12 h-12 text-neural" />
          </div>
          <div className="max-w-2xl">
             <h3 className="text-3xl font-black text-white tracking-tighter mb-4">Neural Vision Pipeline</h3>
             <p className="text-text-muted text-lg font-medium">
                Advanced Computer Vision kernels for medical diagnostics, pattern recognition, and specialized object detection.
             </p>
          </div>
          
          <div className="w-full max-w-3xl h-64 border-2 border-dashed border-neural/30 rounded-[3rem] bg-black/20 flex flex-col items-center justify-center cursor-pointer group hover:border-neural hover:bg-black/40 transition-all">
             <ImageIcon className="w-12 h-12 text-neural/50 group-hover:text-neural mb-4 group-hover:scale-110 transition-transform" />
             <span className="text-xs font-black uppercase tracking-[0.3em] text-text-muted group-hover:text-white transition-colors">Drag Image to Stimulate Synapses</span>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Stethoscope, label: 'Medical Core', desc: 'X-Ray & MRI Synthesis', color: 'text-error' },
            { icon: PawPrint, label: 'Bio Analysis', desc: 'Species Recognition', color: 'text-success' },
            { icon: Layers, label: 'Satellite Flow', desc: 'Terraform Monitoring', color: 'text-info' },
            { icon: BrainCircuit, label: 'Cognitive Flow', desc: 'Neurological Mapping', color: 'text-accent' }
          ].map((m, i) => (
            <div key={i} className="glass-panel p-8 group hover:-translate-y-2 transition-all">
               <div className={classNames("w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6", m.color)}>
                  <m.icon className="w-6 h-6" />
               </div>
               <h4 className="font-bold mb-1 text-white">{m.label}</h4>
               <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{m.desc}</p>
            </div>
          ))}
       </div>
    </div>
  )

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="glass-panel p-12 relative overflow-hidden bg-gradient-to-br from-neural/5 to-transparent">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 pointer-events-none">
           <Zap size={300} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="bg-neural p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-white fill-current" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-neural">Live Deploy</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-neural to-orange-400">
                Inference Hub
              </h1>
              <p className="text-text-muted max-w-2xl text-lg font-medium leading-relaxed">
                 Serve production-grade Neural ELM models. Real-time inference stimulation for structured data and visual telemetry.
              </p>
           </div>

           <div className="flex bg-black/40 p-2 rounded-[2rem] border border-white/5 shadow-huge backdrop-blur-xl shrink-0">
               <button 
                 className={classNames("px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all", activeMode === 'tabular' ? "bg-white/10 text-neural shadow-inner" : "text-text-muted hover:text-white")}
                 onClick={() => setActiveMode('tabular')}
               >
                 Tabular Stream
               </button>
               <button 
                 className={classNames("px-8 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest transition-all", activeMode === 'vision' ? "bg-white/10 text-neural shadow-inner" : "text-text-muted hover:text-white")}
                 onClick={() => setActiveMode('vision')}
               >
                 Neural Vision
               </button>
           </div>
        </div>
      </section>

      {/* Main Mode Swapper */}
      <AnimatePresence mode="wait">
         <motion.div 
           key={activeMode}
           initial={{opacity:0, scale:0.98}}
           animate={{opacity:1, scale:1}}
           exit={{opacity:0, scale:0.98}}
           transition={{duration:0.3}}
         >
            {activeMode === 'tabular' ? renderTabularInference() : renderVisionInference()}
         </motion.div>
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}} className="p-6 rounded-3xl bg-error/10 border border-error/20 flex items-center gap-4 text-error shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-error" />
            <AlertCircle className="w-6 h-6" />
            <div>
               <h4 className="text-[10px] font-black uppercase tracking-widest">Inference Conflict</h4>
               <p className="text-sm font-bold">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
