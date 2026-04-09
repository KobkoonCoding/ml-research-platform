import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Globe, Heart, Code2, Cpu, Database, Layers } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } }
}

export default function AboutPage() {
  const techStack = [
    { icon: Code2, name: 'React 19', desc: 'UI Framework', color: '#61DAFB' },
    { icon: Zap, name: 'Vite 7', desc: 'Build Tool', color: '#646CFF' },
    { icon: Layers, name: 'Three.js', desc: '3D Graphics', color: '#049EF4' },
    { icon: Cpu, name: 'FastAPI', desc: 'Backend API', color: '#009688' },
    { icon: Database, name: 'Pandas', desc: 'Data Processing', color: '#150458' },
    { icon: Globe, name: 'Plotly.js', desc: 'Charts', color: '#3F4F75' },
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="glass-panel rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/15 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/15 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30"
          >
            <Zap className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            ML Research <span className="text-gradient">Platform</span>
          </h1>
          <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
            A professional web application for tabular data exploration, preprocessing,
            and machine learning model training. Built for researchers and data scientists.
          </p>
        </div>
      </motion.div>

      {/* Mission */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Heart className="w-6 h-6 text-accent-warm" /> Our Mission
        </h2>
        <p className="text-text-muted leading-relaxed text-lg">
          To democratize machine learning by providing an intuitive, professional-grade platform
          that handles the complexity of data preprocessing, model training, and validation.
          Our platform ensures strict adherence to ML best practices, including zero data leakage
          across all preprocessing pipelines and cross-validation strategies.
        </p>
      </motion.div>

      {/* Tech Stack */}
      <motion.div variants={fadeUp} className="glass-card rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {techStack.map((tech, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ scale: 1.05 }}
              className="glass-panel rounded-xl p-5 flex items-center gap-4 group cursor-default"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform"
                   style={{ background: `${tech.color}15` }}>
                <tech.icon className="w-6 h-6" style={{ color: tech.color }} />
              </div>
              <div>
                <div className="font-bold text-sm">{tech.name}</div>
                <div className="text-xs text-text-muted">{tech.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Footer credit */}
      <motion.div variants={fadeUp} className="text-center py-8">
        <p className="text-text-muted text-sm">
          Created for Advanced ML Research & Data Engineering
        </p>
        <p className="text-text-muted/50 text-xs mt-2">
          &copy; {new Date().getFullYear()} ML Research Platform
        </p>
      </motion.div>
    </motion.div>
  )
}
