import React, { Suspense, lazy, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform, useMotionTemplate, useMotionValue, AnimatePresence } from 'framer-motion'
import {
  Zap, ArrowRight, BrainCircuit, Database, Cpu,
  MonitorPlay, Activity, FileCheck2, Beaker, GraduationCap, ShieldCheck, X, Globe
} from 'lucide-react'

const Spline = lazy(() => import('@splinetool/react-spline'))

/* ═══════════════════════════════════════════════════════════════
   MODULE DATA
   ══════════════════════════════════════════════════════════════ */

const modules = [
  {
    id: 'forensic',
    icon: Database,
    title: 'Data Forensic & Cleaning',
    subtitle: 'Step 01',
    tagline: 'Clean, explore, and transform your data',
    description: 'A dedicated laboratory for automated dataset cleansing, finding anomalies, and treating missing values before any machine learning takes place.',
    features: ['Auto-detect data quality issues', 'Handle missing values & outliers', 'Encode categories & scale features', 'Visual EDA with interactive charts'],
    bestFor: 'Researchers preparing messy real-world datasets',
    color: '#6366F1',
    colorRgb: '99, 102, 241',
    path: '/forensic',
    illustration: 'chart',
  },
  {
    id: 'elm-studio',
    icon: Cpu,
    title: 'ELM Studio',
    subtitle: 'Step 02',
    tagline: 'Train blazing-fast neural models',
    description: 'Extreme Learning Machine training suite. Configure hidden nodes and train blazing fast classification models instantly.',
    features: ['Extreme Learning Machine with cross-validation', 'Configurable hidden nodes & activation', 'Automatic Min-Max scaling', 'Real-time prediction with probability'],
    bestFor: 'Quick prototyping of classification & regression models',
    color: '#f59e0b',
    colorRgb: '245, 158, 11',
    path: '/elm-studio',
    illustration: 'network',
  },
  {
    id: 'deep-learning',
    icon: BrainCircuit,
    title: 'Deep Learning / Vision',
    subtitle: 'Step 03',
    tagline: 'Advanced AI for image recognition',
    description: 'Leverage powerful CNN architectures like EfficientNetV2 to classify images with high confidence probabilities.',
    features: ['EfficientNetV2 CNN architecture', 'Upload & classify images instantly', 'Confidence scores with top-k predictions'],
    bestFor: 'Computer vision researchers and image classification tasks',
    color: '#F472B6',
    colorRgb: '244, 114, 182',
    path: '/deep-learning',
    illustration: 'vision',
  }
]

const steps = [
  {
    icon: FileCheck2,
    title: '1. Prepare Your Data',
    desc: 'Upload CSV/Excel files. Our forensic lab auto-detects data issues: missing values, outliers, duplicates. Preview your data with interactive charts.'
  },
  {
    icon: Activity,
    title: '2. Train the Model',
    desc: 'Configure your model with intuitive controls. ELM trains in milliseconds with cross-validation. See accuracy, confusion matrices, and ROC curves instantly.'
  },
  {
    icon: MonitorPlay,
    title: '3. Run Predictions',
    desc: 'Enter new data points and get real-time predictions with confidence scores. Export results for your research paper.'
  }
]

/* ═══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ══════════════════════════════════════════════════════════════ */

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { type: 'spring', stiffness: 60, damping: 15 } 
  }
}

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  show: { 
    opacity: 1, 
    x: 0, 
    transition: { type: 'spring', stiffness: 60, damping: 20 } 
  }
}

/* ═══════════════════════════════════════════════════════════════
   MODULE ILLUSTRATION COMPONENT
   ══════════════════════════════════════════════════════════════ */

function ModuleIllustration({ type }) {
  if (type === 'chart') {
    return (
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        <style>{`
          @keyframes barGrow0 { 0%,10% { height:0; y:75; } 30% { height:35; y:40; } 100% { height:35; y:40; } }
          @keyframes barGrow1 { 0%,15% { height:0; y:75; } 35% { height:55; y:20; } 100% { height:55; y:20; } }
          @keyframes barGrow2 { 0%,20% { height:0; y:75; } 40% { height:25; y:50; } 100% { height:25; y:50; } }
          @keyframes barGrow3 { 0%,25% { height:0; y:75; } 45% { height:45; y:30; } 100% { height:45; y:30; } }
          @keyframes barGrow4 { 0%,30% { height:0; y:75; } 50% { height:60; y:15; } 100% { height:60; y:15; } }
          @keyframes barPulse { 0%,100% { opacity:0.85; } 50% { opacity:1; } }
          .bar { animation: barPulse 3s ease-in-out infinite; }
          .bar0 { animation: barGrow0 2s ease-out forwards, barPulse 3s ease-in-out 2s infinite; }
          .bar1 { animation: barGrow1 2s ease-out forwards, barPulse 3s ease-in-out 2.15s infinite; }
          .bar2 { animation: barGrow2 2s ease-out forwards, barPulse 3s ease-in-out 2.3s infinite; }
          .bar3 { animation: barGrow3 2s ease-out forwards, barPulse 3s ease-in-out 2.45s infinite; }
          .bar4 { animation: barGrow4 2s ease-out forwards, barPulse 3s ease-in-out 2.6s infinite; }
        `}</style>
        <line x1="10" y1="75" x2="115" y2="75" stroke="#6366F133" strokeWidth="1" />
        <rect className="bar0" x="14" y="75" width="14" rx="3" height="0" fill="url(#barGrad)" />
        <rect className="bar1" x="34" y="75" width="14" rx="3" height="0" fill="url(#barGrad)" />
        <rect className="bar2" x="54" y="75" width="14" rx="3" height="0" fill="url(#barGrad)" />
        <rect className="bar3" x="74" y="75" width="14" rx="3" height="0" fill="url(#barGrad)" />
        <rect className="bar4" x="94" y="75" width="14" rx="3" height="0" fill="url(#barGrad)" />
      </svg>
    )
  }

  if (type === 'network') {
    return (
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="netGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <style>{`
          @keyframes nodeIn { 0% { opacity:0; r:0; } 100% { opacity:1; r:5; } }
          @keyframes lineIn { 0% { opacity:0; } 100% { opacity:0.3; } }
          @keyframes pulse { 0%,100% { opacity:0.3; } 50% { opacity:0.7; } }
          .node { animation: nodeIn 0.5s ease-out forwards; }
          .n0 { animation-delay:0s; } .n1 { animation-delay:0.1s; } .n2 { animation-delay:0.2s; }
          .n3 { animation-delay:0.3s; } .n4 { animation-delay:0.35s; } .n5 { animation-delay:0.4s; } .n6 { animation-delay:0.45s; }
          .n7 { animation-delay:0.6s; }
          .link { opacity:0; animation: lineIn 0.4s ease-out forwards, pulse 3s ease-in-out 1s infinite; }
          .l0 { animation-delay:0.5s,1.5s; } .l1 { animation-delay:0.55s,1.55s; } .l2 { animation-delay:0.6s,1.6s; }
          .l3 { animation-delay:0.65s,1.65s; } .l4 { animation-delay:0.7s,1.7s; } .l5 { animation-delay:0.75s,1.75s; }
          .l6 { animation-delay:0.8s,1.8s; } .l7 { animation-delay:0.85s,1.85s; } .l8 { animation-delay:0.9s,1.9s; }
          .l9 { animation-delay:0.95s,1.95s; } .l10 { animation-delay:1s,2s; } .l11 { animation-delay:1.05s,2.05s; }
        `}</style>
        {/* Links: input->hidden */}
        <line className="link l0" x1="15" y1="15" x2="50" y2="12" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l1" x1="15" y1="15" x2="50" y2="30" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l2" x1="15" y1="40" x2="50" y2="30" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l3" x1="15" y1="40" x2="50" y2="50" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l4" x1="15" y1="65" x2="50" y2="50" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l5" x1="15" y1="65" x2="50" y2="68" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l6" x1="15" y1="15" x2="50" y2="50" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l7" x1="15" y1="65" x2="50" y2="12" stroke="#FBBF24" strokeWidth="1" />
        {/* Links: hidden->output */}
        <line className="link l8" x1="50" y1="12" x2="100" y2="40" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l9" x1="50" y1="30" x2="100" y2="40" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l10" x1="50" y1="50" x2="100" y2="40" stroke="#FBBF24" strokeWidth="1" />
        <line className="link l11" x1="50" y1="68" x2="100" y2="40" stroke="#FBBF24" strokeWidth="1" />
        {/* Input nodes */}
        <circle className="node n0" cx="15" cy="15" r="0" fill="url(#netGrad)" opacity="0" />
        <circle className="node n1" cx="15" cy="40" r="0" fill="url(#netGrad)" opacity="0" />
        <circle className="node n2" cx="15" cy="65" r="0" fill="url(#netGrad)" opacity="0" />
        {/* Hidden nodes */}
        <circle className="node n3" cx="50" cy="12" r="0" fill="url(#netGrad)" opacity="0" />
        <circle className="node n4" cx="50" cy="30" r="0" fill="url(#netGrad)" opacity="0" />
        <circle className="node n5" cx="50" cy="50" r="0" fill="url(#netGrad)" opacity="0" />
        <circle className="node n6" cx="50" cy="68" r="0" fill="url(#netGrad)" opacity="0" />
        {/* Output node */}
        <circle className="node n7" cx="100" cy="40" r="0" fill="url(#netGrad)" opacity="0" />
      </svg>
    )
  }

  if (type === 'vision') {
    return (
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="eyeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        <style>{`
          @keyframes scanLine { 0% { transform:translateX(-50px); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform:translateX(50px); opacity:0; } }
          @keyframes blink { 0%,38%,42%,100% { transform:scaleY(1); } 40% { transform:scaleY(0.1); } }
          .scan { animation: scanLine 3s ease-in-out infinite; }
          .eyeGroup { animation: blink 5s ease-in-out infinite; transform-origin: 60px 40px; }
        `}</style>
        <g className="eyeGroup">
          {/* Eye outline */}
          <path d="M15 40 Q60 5 105 40 Q60 75 15 40Z" stroke="url(#eyeGrad)" strokeWidth="2" fill="none" opacity="0.6" />
          {/* Iris */}
          <circle cx="60" cy="40" r="14" stroke="url(#eyeGrad)" strokeWidth="1.5" fill="none" opacity="0.5" />
          {/* Pupil */}
          <circle cx="60" cy="40" r="6" fill="url(#eyeGrad)" opacity="0.7" />
          {/* Scan line */}
          <rect className="scan" x="35" y="20" width="2" height="40" rx="1" fill="#F472B6" opacity="0.8" />
        </g>
      </svg>
    )
  }

  return null
}

/* ═══════════════════════════════════════════════════════════════
   MODULE CARD COMPONENT
   ══════════════════════════════════════════════════════════════ */

function InteractiveModuleCard({ module, index }) {
  const ref = useRef()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  const bgGradient = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, rgba(${module.colorRgb}, 0.18), transparent 80%)`
  const Icon = module.icon

  return (
    <motion.div variants={fadeUp} className="w-full">
      <Link to={module.path} className="block outline-none">
        <motion.div
          onMouseMove={handleMouseMove}
          whileHover={{ x: 6, scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="group relative rounded-[1.5rem] overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-shadow duration-300"
        >
          <div className="absolute inset-0 rounded-[1.5rem] border border-white/10 pointer-events-none z-20 transition-colors duration-300 group-hover:border-white/30" />
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: bgGradient, willChange: 'opacity' }}
          />
          <div
            className="relative z-30 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 backdrop-blur-sm"
            style={{ background: 'rgba(14, 14, 14, 0.7)' }}
          >
            <motion.div
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border border-white/10"
              style={{ background: `${module.color}18` }}
            >
              <Icon className="w-7 h-7" style={{ color: module.color }} />
            </motion.div>
            <div className="flex-1">
              <span className="text-xs font-black tracking-[0.2em] uppercase mb-1 block" style={{ color: module.color }}>
                {module.subtitle}
              </span>
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-1 text-white relative transition-all duration-300" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="opacity-100 group-hover:opacity-0 transition-opacity duration-300">{module.title}</span>
                <span className="absolute left-0 top-0 text-transparent bg-clip-text opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ backgroundImage: `linear-gradient(to right, #fff, ${module.color})` }}>
                  {module.title}
                </span>
              </h3>
              <p className="text-white/70 text-sm italic mb-2">{module.tagline}</p>
              <p className="text-white/75 text-sm leading-relaxed mb-2">{module.features.join(' \u00b7 ')}</p>
              <p className="text-xs text-white/60 uppercase tracking-wider">Best for: <span className="text-white/75">{module.bestFor}</span></p>
            </div>
            <div className="hidden md:flex items-center shrink-0">
              <ModuleIllustration type={module.illustration} />
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <span className="text-sm font-bold text-white/70 group-hover:text-white transition-colors hidden md:block">Access</span>
              <div
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:border-white transition-all duration-200"
                style={{ background: `${module.color}25` }}
              >
                <ArrowRight className="w-4 h-4 text-white group-hover:text-black transition-colors" />
              </div>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const navigate = useNavigate()
  const [showModuleModal, setShowModuleModal] = useState(false)

  // Force dark theme on landing page, restore previous theme on unmount
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', 'dark')
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev)
    }
  }, [])

  // Custom Parallax Scroll hooks
  const { scrollY } = useScroll()
  const heroTextY = useTransform(scrollY, [0, 1000], [0, 300])
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0])
  const robotOpacity = useTransform(scrollY, [300, 700, 1500, 2000], [0, 1, 1, 0])
  const robotY = useTransform(scrollY, [300, 700], [100, 0])

  // Lazy-load Robot Spline only when section is near viewport
  const robotRef = useRef(null)
  const robotInView = useInView(robotRef, { once: true, margin: '200px' })

  return (
    <div className="relative font-sans bg-[#050505] text-white selection:bg-primary/30" data-theme="dark">

      {/* Ambient gradient blobs (CSS only) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-primary/15 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full bg-secondary/10 blur-[100px] animate-[pulse_12s_ease-in-out_infinite_2s]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full px-6 lg:px-12 py-6 flex justify-between items-center z-50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 font-black text-lg tracking-tight text-white"
        >
          <Zap className="w-5 h-5 text-primary" />
          NEXUS
        </motion.div>
      </nav>

      <main className="relative z-10 overflow-hidden">

        {/* Global background removed — was a full Spline 3D scene running 24/7 causing GPU overheat */}

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — HERO
            ══════════════════════════════════════════════════════ */}
        <section className="relative z-10 h-[100svh] overflow-hidden bg-[#050505]">

          {/* Spline — absolute full-screen background */}
          <div className="absolute inset-0 pointer-events-auto">
            <Suspense fallback={null}>
              <Spline scene="https://prod.spline.design/pNfy02-sBsWBu8R3/scene.splinecode" />
            </Suspense>
          </div>

          {/* Dark overlay so text is readable over the wave */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 pointer-events-none z-10" />

          {/* Text — overlays on top, upper-center, with parallax */}
          <motion.div 
            style={{ y: heroTextY, opacity: heroOpacity }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 lg:px-12 pb-24"
          >
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="mb-8 inline-flex"
              >
                <span className="px-5 py-2 rounded-full border border-white/15 bg-black/40 backdrop-blur-md text-xs font-black uppercase tracking-[0.25em] text-white/80 flex items-center gap-3 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#6366F1]" />
                  Advanced ML Research Platform
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, type: "spring", damping: 20 }}
                className="text-[3.5rem] md:text-[5.5rem] lg:text-[7.5rem] xl:text-[8.5rem] font-black tracking-tighter leading-[0.85] text-white mb-6"
                style={{ fontFamily: 'var(--font-display)', textShadow: '0 10px 50px rgba(0,0,0,0.8)' }}
              >
                Algorithmic<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-pink-400">
                  Brilliance.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
                style={{ textShadow: '0 4px 20px rgba(0,0,0,1)' }}
              >
                An interactive environment fusing structural data preparation and extreme learning machine models for unparalleled research speed.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex items-center justify-center gap-5 flex-wrap"
              >
                <button
                  onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                  className="group px-8 py-4 rounded-full bg-white text-black font-bold text-sm hover:scale-[1.05] transition-transform flex items-center gap-2 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]"
                >
                  Explore Platform
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <Link to="/docs" className="px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all font-medium">
                  Documentation →
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Bottom gradient fade into next section */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[rgba(2,2,2,0.35)] via-[#050505] to-transparent pointer-events-none z-30" />
        </section>

        {/* ═══════════════════════════════════════════════════════
            LOWER PAGE WRAPPER (Seamless GlassPane)
            ══════════════════════════════════════════════════════ */}
        <div className="relative z-10 backdrop-blur-[2px] pointer-events-none" style={{ background: 'rgba(2,2,2,0.25)' }}>
          {/* Smooth fade from opaque hero section downward */}
          <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#050505] via-[#050505]/70 to-transparent pointer-events-none z-0" />

          {/* ═══════════════════════════════════════════════════════
              SECTION 2 — ABOUT PLATFORM + ROBOT
              ══════════════════════════════════════════════════════ */}
          <section className="relative z-10 px-6 lg:px-12 pt-32 pb-40">
            {/* Re-enable pointer events for inner content container so buttons/cards work */}
            <div className="max-w-[1400px] mx-auto pointer-events-auto">

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, type: 'spring' }}
              className="text-center mb-20"
            >
              <h2
                className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                About the Platform
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full mb-6" />
              <p className="mt-4 text-white/80 text-xl max-w-2xl mx-auto font-light">
                A research-grade toolkit for end-to-end machine learning — from messy spreadsheets to deployable models.
              </p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">

              {/* LEFT: About content with staggered animation */}
              <motion.div 
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="w-full lg:w-[55%] flex flex-col gap-8"
              >
                {/* About block 1 */}
                <motion.div variants={fadeUp} className="group p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/15 transition-colors duration-500 hover:shadow-2xl hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <Beaker className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black tracking-wide">What Is This?</h3>
                  </div>
                  <p className="text-white/80 text-lg leading-relaxed font-light">
                    Intelligence Nexus is a full-stack ML research platform built with <strong className="text-white font-medium">React</strong> and <strong className="text-white font-medium">FastAPI</strong>.
                    It provides three independent modules that cover the complete machine learning lifecycle:
                    data forensic analysis, ELM-based model training, and deep convolutional neural network inference.
                  </p>
                </motion.div>

                {/* About block 2 */}
                <motion.div variants={fadeUp} className="group p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/15 transition-colors duration-500 hover:shadow-2xl hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                      <GraduationCap className="w-7 h-7 text-secondary" />
                    </div>
                    <h3 className="text-2xl font-black tracking-wide">Who Is It For?</h3>
                  </div>
                  <p className="text-white/80 text-lg leading-relaxed font-light">
                    Designed for <strong className="text-white font-medium">researchers</strong>, <strong className="text-white font-medium">graduate students</strong>, and <strong className="text-white font-medium">data scientists</strong> who
                    need a streamlined environment to prototype classification models quickly.
                    Upload your dataset, clean it with automated pipelines, train an Extreme Learning Machine in milliseconds,
                    and evaluate predictions — all without writing a single line of code.
                  </p>
                </motion.div>

                {/* About block 3 */}
                <motion.div variants={fadeUp} className="group p-8 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent hover:border-white/15 transition-colors duration-500 hover:shadow-2xl hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent-warm/10 border border-accent-warm/20 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                      <ShieldCheck className="w-7 h-7 text-accent-warm" />
                    </div>
                    <h3 className="text-2xl font-black tracking-wide">Key Capabilities</h3>
                  </div>
                  <ul className="text-white/80 text-[1.05rem] leading-relaxed space-y-4 font-light">
                    <li className="flex items-start gap-4">
                      <span className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0 shadow-[0_0_8px_#6366F1]" />
                      <span><strong className="text-white font-medium">Automated Data Cleaning</strong> — Fill missing values using mean, median, mode, or KNN imputation. Detect outliers via IQR thresholds.</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-2 h-2 rounded-full bg-secondary mt-2.5 shrink-0 shadow-[0_0_8px_#06B6D4]" />
                      <span><strong className="text-white font-medium">ELM Training Engine</strong> — Train feedforward networks with Moore-Penrose pseudo-inverse in under 200ms. No backpropagation needed.</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-2 h-2 rounded-full bg-accent-warm mt-2.5 shrink-0 shadow-[0_0_8px_#F472B6]" />
                      <span><strong className="text-white font-medium">Image Classification</strong> — Classify images against 1,000 ImageNet categories using EfficientNetV2-S.</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <span className="w-2 h-2 rounded-full bg-pink-400 mt-2.5 shrink-0 shadow-[0_0_8px_#E879F9]" />
                      <span><strong className="text-white font-medium">Real-time Inference</strong> — Input feature vectors and receive instant class predictions with probabilities.</span>
                    </li>
                  </ul>
                </motion.div>

                {/* Tech stack pills */}
                <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mt-4">
                  {['React 19', 'FastAPI', 'Tailwind CSS', 'Framer Motion', 'Plotly.js', 'scikit-learn', 'PyTorch', 'EfficientNetV2'].map((tech, i) => (
                    <motion.span 
                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      key={tech} 
                      className="px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] text-sm font-medium text-white/85 cursor-default transition-colors"
                    >
                      {tech}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>

              {/* RIGHT: Robot Spline (sticky, sliding vertically + fade) — lazy loaded */}
              <motion.div
                ref={robotRef}
                style={{ opacity: robotOpacity, y: robotY, willChange: 'opacity, transform' }}
                className="w-full lg:w-[45%] h-[500px] lg:h-auto lg:sticky lg:top-24 rounded-[3rem] border border-white/5 overflow-hidden pointer-events-auto relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-black" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '24px 24px' }} />

                <div className="absolute inset-0 z-10">
                  {robotInView && (
                    <Suspense fallback={null}>
                      <Spline scene="https://prod.spline.design/aTL6-pdugzBTCP3t/scene.splinecode" />
                    </Suspense>
                  )}
                </div>
                {/* Sleek edge lighting on container */}
                <div className="absolute inset-0 rounded-[3rem] border border-white/5 pointer-events-none z-20" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050505] to-transparent pointer-events-none z-20" />
              </motion.div>
            </div>
          </div>
        </section>

          {/* ═══════════════════════════════════════════════════════
              SECTION 3 — MODULES
              ══════════════════════════════════════════════════════ */}
          <section className="relative z-10 px-6 lg:px-12 pt-32 pb-32 border-t border-white/5">
            <div className="max-w-[1400px] mx-auto pointer-events-auto">

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="text-center mb-24"
            >
              <h2
                className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                System Architecture
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-secondary to-transparent mx-auto rounded-full mt-6 mb-6" />
              <p className="text-white/80 text-xl max-w-xl mx-auto font-light">
                Three independent modules — from raw data to AI predictions.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-50px' }}
              className="max-w-4xl mx-auto flex flex-col gap-6"
            >
              {modules.map((m, i) => (
                <InteractiveModuleCard key={m.id} module={m} index={i} />
              ))}
            </motion.div>
          </div>
        </section>

          {/* ═══════════════════════════════════════════════════════
              SECTION 4 — HOW TO USE
              ══════════════════════════════════════════════════════ */}
          <section className="relative z-10 py-32 px-6 lg:px-12 border-t border-white/5">
            <div className="max-w-6xl mx-auto pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, type: 'spring' }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                Operational Flow
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-accent-warm to-transparent mx-auto rounded-full mb-6" />
              <p className="text-white/80 text-xl font-light">From raw data to predictions in three sequential steps.</p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              {steps.map((step, i) => {
                const StepIcon = step.icon
                return (
                  <motion.div
                    key={i}
                    variants={fadeUp}
                    whileHover={{ y: -10 }}
                    className="p-10 rounded-[2rem] border border-white/5 bg-gradient-to-br from-white/[0.04] to-transparent hover:border-white/15 transition-all duration-300 group shadow-lg hover:shadow-2xl"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                      <StepIcon className="w-6 h-6 text-white/80 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-5xl font-black text-white/8 mb-4 group-hover:text-white/15 transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                      0{i+1}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                    <p className="text-white/80 text-base leading-relaxed font-light">{step.desc}</p>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </section>

          {/* ═══════════════════════════════════════════════════════
              SECTION 5 — DEVELOPER
              ══════════════════════════════════════════════════════ */}
          <section className="relative z-10 py-32 px-6 lg:px-12 border-t border-white/5">
            <div className="max-w-3xl mx-auto pointer-events-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, type: 'spring' }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                  Meet the Developer
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-primary to-transparent mx-auto rounded-full" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, type: 'spring' }}
                className="p-8 md:p-12 rounded-[2rem] border border-white/10 backdrop-blur-md text-center"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #06B6D4)' }}
                >
                  KJ
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-2xl font-black text-white mb-1"
                >
                  Dr. Kobkoon Janngam
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-white/80 text-sm mb-1"
                >
                  Proactive Researcher
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-white/70 text-sm mb-6"
                >
                  Chiang Mai University
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-white/80 text-base leading-relaxed max-w-lg mx-auto mb-8 font-light"
                >
                  Bridging mathematics and machine learning to create accessible research tools for the academic community.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="flex items-center justify-center gap-4"
                >
                  {[
                    { label: 'FB', href: 'https://facebook.com' },
                    { label: 'IG', href: 'https://instagram.com' },
                  ].map((s) => (
                    <motion.a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.15, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-11 h-11 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs font-bold text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
                    >
                      {s.label}
                    </motion.a>
                  ))}
                  <motion.a
                    href="https://personal-portfolio-pi-murex-30.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 hover:bg-white/10 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                  </motion.a>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════
              SECTION 6 — CTA
              ══════════════════════════════════════════════════════ */}
          <section className="relative z-10 py-32 px-6 border-t border-white/5 text-center overflow-hidden pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, rgba(3,3,3,0.8))' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-3xl rounded-full bg-primary/20 blur-[150px] opacity-30 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, type: 'spring' }}
            className="relative z-10 pointer-events-auto"
          >
            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-10" style={{ fontFamily: 'var(--font-display)' }}>
              Ready to <em className="not-italic font-light text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Compile?</em>
            </h2>
            <motion.button
              onClick={() => setShowModuleModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-5 rounded-full bg-white text-black font-black text-lg shadow-[0_0_50px_-15px_rgba(255,255,255,0.8)] hover:shadow-[0_0_80px_-10px_rgba(255,255,255,1)] transition-shadow flex justify-center items-center gap-3 mx-auto group"
            >
              Initialize System
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </motion.div>
          </section>

          {/* Footer */}
          <footer className="relative z-10 py-8 px-6 text-center border-t border-white/5 pointer-events-auto" style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(8px)' }}>
            <p className="text-white/60 text-xs tracking-wide">
              &copy; 2026 ML Research Platform &middot; Built by Dr. Kobkoon Janngam &middot; Chiang Mai University
            </p>
          </footer>

        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════
          MODULE SELECTION MODAL
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModuleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModuleModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl rounded-[2rem] border border-white/10 p-8 md:p-10"
              style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(20px)' }}
            >
              <button
                onClick={() => setShowModuleModal(false)}
                className="absolute top-5 right-5 w-9 h-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-2xl font-black text-white mb-2 text-center" style={{ fontFamily: 'var(--font-display)' }}>
                Select a Module
              </h3>
              <p className="text-white/70 text-sm text-center mb-8">Choose where to begin your research workflow.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {modules.map((m) => {
                  const Icon = m.icon
                  return (
                    <motion.button
                      key={m.id}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setShowModuleModal(false); navigate(m.path) }}
                      className="text-left p-6 rounded-2xl border border-white/10 hover:border-white/25 transition-all duration-200 group"
                      style={{ background: `rgba(${m.colorRgb}, 0.06)` }}
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-white/10" style={{ background: `${m.color}18` }}>
                        <Icon className="w-6 h-6" style={{ color: m.color }} />
                      </div>
                      <span className="text-[9px] font-black tracking-[0.2em] uppercase block mb-1" style={{ color: m.color }}>{m.subtitle}</span>
                      <h4 className="text-base font-bold text-white mb-1">{m.title}</h4>
                      <p className="text-white/70 text-xs italic mb-2">{m.tagline}</p>
                      <p className="text-white/60 text-[11px] leading-relaxed mb-2">{m.features.join(' \u00b7 ')}</p>
                      <p className="text-xs text-white/55 uppercase tracking-wider">Best for: <span className="text-white/70">{m.bestFor}</span></p>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
