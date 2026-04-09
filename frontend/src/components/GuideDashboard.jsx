import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, UploadCloud, BarChart2, Settings2, BrainCircuit, ChevronRight, Zap } from 'lucide-react'

export default function GuideDashboard({ onGetStarted }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  }

  const steps = [
    {
      icon: <UploadCloud className="w-8 h-8 text-primary" />,
      title: "1. Data Ingestion",
      description: "Upload your raw tabular dataset (.csv, .xlsx). The platform instantly analyzes the schema, data types, and structural integrity.",
      color: "from-primary/20 to-primary/5",
      borderColor: "border-primary/20"
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-info" />,
      title: "2. Exploratory Data Analysis",
      description: "Discover hidden patterns, correlation matrices, and distribution metrics. Essential for understanding feature relationships.",
      color: "from-info/20 to-info/5",
      borderColor: "border-info/20"
    },
    {
      icon: <Settings2 className="w-8 h-8 text-accent" />,
      title: "3. Preprocessing Engineering",
      description: "Handle missing values, detect outliers, scale features, and encode categories with built-in data leakage protection.",
      color: "from-accent/20 to-accent/5",
      borderColor: "border-accent/20"
    },
    {
      icon: <BrainCircuit className="w-8 h-8 text-secondary" />,
      title: "4. Extreme Learning Machine",
      description: "Train a high-performance ELM model instantly. Optimize hyperparameters and validate robustness using K-Fold CV.",
      color: "from-secondary/20 to-secondary/5",
      borderColor: "border-secondary/20"
    }
  ]

  return (
    <motion.div 
      className="max-w-5xl mx-auto space-y-12 pb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="relative glass-panel rounded-3xl p-10 md:p-14 overflow-hidden text-center border-t border-white/20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50 mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 opacity-50 mix-blend-screen pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30 mb-8"
          >
            <Zap className="w-10 h-10 text-white fill-white/20" />
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6 tracking-tight">
            Machine Learning <br className="hidden md:block"/> Research Platform
          </h2>
          
          <p className="text-lg md:text-xl text-text-muted mb-10 leading-relaxed font-light max-w-2xl">
            A professional, end-to-end environment for data scientists. From raw data ingestion to advanced neural network validation in seconds.
          </p>

          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(99, 102, 241, 0.4), 0 8px 10px -6px rgba(99, 102, 241, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="group relative overflow-hidden bg-primary text-white font-bold text-lg px-10 py-4 rounded-full flex items-center gap-3 transition-all"
          >
            <span className="relative z-10 flex items-center gap-2">
              Initialize Project <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-hover to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>
          </motion.button>
        </div>
      </motion.div>

      {/* Guide Steps */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-6 h-6 text-text-primary" />
          <h3 className="text-2xl font-bold text-white">Pipeline Workflow</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`relative overflow-hidden glass-card p-8 rounded-2xl border ${step.borderColor} transition-all duration-300 group`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${step.color} rounded-bl-full opacity-20 group-hover:opacity-40 transition-opacity`}></div>
              
              <div className="relative z-10">
                <div className="bg-black/30 w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 mb-6 group-hover:scale-110 transition-transform shadow-lg">
                  {step.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                <p className="text-text-muted leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Professional Notice */}
      <motion.div variants={itemVariants} className="mt-12 glass-panel border-l-4 border-l-primary p-6 rounded-xl flex items-start gap-4">
        <BrainCircuit className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
        <div>
          <h4 className="text-white font-bold text-lg mb-1">Professional Standard</h4>
          <p className="text-text-muted text-sm leading-relaxed">
            This workspace complies with strict Machine Learning best practices. All statistical preprocessing transformations (Scaling, Encoding, Imputation) 
            are strictly pipeline-bound. They are learned safely during the cross-validation logic specifically on the training fold and applied dynamically to the validation fold, guaranteeing zero data leakage.
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
