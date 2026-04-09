import React, { useState, useRef } from 'react'
import axios from 'axios'
import { API_BASE } from '../lib/constants'
import { motion } from 'framer-motion'
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Database, TrendingUp, Flower2 } from 'lucide-react'
import classNames from 'classnames'

export default function UploadDataset({ onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef()

  const MAX_SIZE_MB = 100

  const validateFile = (f) => {
    if (!f) return 'No file selected'
    if (!f.name.match(/\.(csv|xlsx?)$/i))
      return 'Unsupported file format. Please upload a .csv or .xlsx file.'
    if (f.size > MAX_SIZE_MB * 1024 * 1024)
      return `File too large (max ${MAX_SIZE_MB} MB).`
    if (f.size === 0)
      return 'The file is empty.'
    return null
  }

  const handleFileSelect = (f) => {
    const err = validateFile(f)
    if (err) { setError(err); setFile(null); return }
    setFile(f)
    setError('')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const resp = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      })
      onUploadSuccess(resp.data.analysis)
    } catch (err) {
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError('An error occurred during upload. Please check file format and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLoad = async (datasetName) => {
    setLoading(true)
    setError('')
    try {
      const resp = await axios.get(`${API_BASE}/demo/${datasetName}`)
      onUploadSuccess(resp.data.analysis)
    } catch (err) {
      setError(`Failed to load demo dataset: ${datasetName}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel max-w-3xl mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent inline-block">Upload Dataset</h2>
        <p className="text-text-muted mt-2 text-sm leading-relaxed">
          Upload your tabular data (CSV or Excel) to automatically generate quality diagnostics, 
          detect outliers, and prepare your data for machine learning models.
        </p>
      </div>

      <div
        className={classNames(
          "relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group",
          {
            "border-primary bg-primary/10": dragActive,
            "border-white/20 bg-black/20 hover:border-primary/50 hover:bg-white/5": !dragActive
          }
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <motion.div 
          animate={{ y: dragActive ? -10 : 0 }} 
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-surface border border-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:shadow-primary/20 transition-all">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <p className="text-lg text-text-primary text-center font-medium mb-2">
            Drag & drop your file here, or <span className="text-primary font-bold">click to browse</span>
          </p>
          <p className="text-text-muted text-sm">
            Supported: .csv, .xlsx &nbsp;|&nbsp; Max size: {MAX_SIZE_MB} MB
          </p>
        </motion.div>
        
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      </div>

      {file && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-center gap-4 bg-success/10 border border-success/30 p-4 rounded-xl"
        >
          <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="text-success w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-text-primary truncate">{file.name}</div>
            <div className="text-text-muted text-xs">{(file.size / 1024).toFixed(1)} KB</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-success" />
        </motion.div>
      )}

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-start gap-3 bg-error/10 border border-error/30 p-4 rounded-xl"
        >
          <AlertCircle className="text-error w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-error mb-1">Upload Error</div>
            <div className="text-error/80 text-sm">{error}</div>
          </div>
        </motion.div>
      )}

      <div className="mt-8 flex justify-end">
        <button 
          className={classNames(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all duration-300",
            {
              "bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5": file && !loading,
              "bg-surface-card text-text-muted cursor-not-allowed opacity-50": !file || loading
            }
          )}
          onClick={handleUpload} 
          disabled={!file || loading}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Dataset...</>
          ) : (
            <>Upload & Analyze Data <TrendingUp className="w-5 h-5" /></>
          )}
        </button>
      </div>

      <div className="mt-12 pt-8 border-t border-white/10">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-text-primary">
          <Database className="w-5 h-5 text-accent" />
          Explore Demo Datasets
        </h3>
        <p className="text-text-muted text-sm mb-6">
          Not sure where to start? Load a sample dataset to see the analysis and preprocessing capabilities in action.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            className="group flex flex-col items-start p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-surface hover:border-primary/50 transition-all text-left"
            onClick={() => handleDemoLoad('titanic')}
            disabled={loading}
          >
            <span className="flex items-center gap-2 font-medium text-text-primary mb-1 group-hover:text-primary transition-colors">
              🚢 Titanic
            </span>
            <span className="text-xs text-text-muted">Classification</span>
          </button>

          <button 
            className="group flex flex-col items-start p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-surface hover:border-primary/50 transition-all text-left"
            onClick={() => handleDemoLoad('house_prices')}
            disabled={loading}
          >
            <span className="flex items-center gap-2 font-medium text-text-primary mb-1 group-hover:text-primary transition-colors">
              🏠 House Prices
            </span>
            <span className="text-xs text-text-muted">Regression</span>
          </button>

          <button 
            className="group flex flex-col items-start p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-surface hover:border-primary/50 transition-all text-left"
            onClick={() => handleDemoLoad('iris')}
            disabled={loading}
          >
            <span className="flex items-center gap-2 font-medium text-text-primary mb-1 group-hover:text-primary transition-colors">
              <Flower2 className="w-4 h-4" /> Iris dataset
            </span>
            <span className="text-xs text-text-muted">Multiclass</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
