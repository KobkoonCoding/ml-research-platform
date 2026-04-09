import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FileMinus, Copy, Maximize, Type, Tag, MoveDiagonal, Scale, Search, Trash2, 
  ArrowRight, Check, MonitorPlay, Save, Download, FileJson, FileCode, Printer, 
  Undo2, RefreshCw, AlertCircle, CheckCircle2, ChevronRight, Info
} from 'lucide-react'
import classNames from 'classnames'
import { API_BASE } from '../lib/constants'

const API = API_BASE

/* ─── Plotly helper ─── */
const Plot = ({ id, data, layout, style }) => {
  const ref = useRef()
  useEffect(() => {
    if (ref.current && window.Plotly) {
      const merged = {
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'rgba(0,0,0,0.15)',
        font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
        margin: { t: 30, r: 20, b: 40, l: 50 },
        xaxis: { gridcolor: 'rgba(255,255,255,0.06)' },
        yaxis: { gridcolor: 'rgba(255,255,255,0.06)' },
        ...layout,
      }
      window.Plotly.newPlot(ref.current, data, merged, { responsive: true, displayModeBar: false })
    }
    return () => { if (ref.current && window.Plotly) window.Plotly.purge(ref.current) }
  }, [data, layout])
  return <div ref={ref} id={id} className="w-full" style={style} />
}

/* ─── Tool definitions ─── */
const TOOLS = [
  { id: 'missing', label: 'Missing Values', icon: FileMinus, color: 'text-error' },
  { id: 'duplicates', label: 'Duplicates', icon: Copy, color: 'text-warning' },
  { id: 'outliers', label: 'Outliers', icon: Maximize, color: 'text-accent' },
  { id: 'type_cleaning', label: 'Type Cleaning', icon: Type, color: 'text-info' },
  { id: 'encoding', label: 'Encoding', icon: Tag, color: 'text-secondary' },
  { id: 'scaling', label: 'Scaling', icon: MoveDiagonal, color: 'text-primary' },
  { id: 'imbalance', label: 'Imbalanced Data', icon: Scale, color: 'text-success' },
  { id: 'feature_selection', label: 'Feature Selection', icon: Search, color: 'text-indigo-400' },
  { id: 'drop_columns', label: 'Drop Columns', icon: Trash2, color: 'text-error' },
]

export default function PreprocessingWorkspace({ analysis, onAnalysisUpdate, pipeline, setPipeline }) {
  const [activeTool, setActiveTool] = useState('missing')
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Tool-specific state
  const [missingStrategy, setMissingStrategy] = useState('mean')
  const [missingCols, setMissingCols] = useState([])
  const [dupKeep, setDupKeep] = useState('first')
  const [outlierMethod, setOutlierMethod] = useState('iqr')
  const [outlierTreatment, setOutlierTreatment] = useState('remove')
  const [outlierThreshold, setOutlierThreshold] = useState(1.5)
  const [outlierCols, setOutlierCols] = useState([])
  const [typeCol, setTypeCol] = useState('')
  const [typeAction, setTypeAction] = useState('trim')
  const [encodeCol, setEncodeCol] = useState('')
  const [encodeMethod, setEncodeMethod] = useState('label')
  const [encodeTargetCol, setEncodeTargetCol] = useState('')
  const [scaleCols, setScaleCols] = useState([])
  const [scaleMethod, setScaleMethod] = useState('standard')
  
  const [imbalanceTarget, setImbalanceTarget] = useState('')
  const [imbalanceMethod, setImbalanceMethod] = useState('smote')
  const [fsMethod, setFsMethod] = useState('variance')
  const [fsThreshold, setFsThreshold] = useState(0.0)
  const [fsTarget, setFsTarget] = useState('')
  const [fsK, setFsK] = useState(10)
  const [dropCols, setDropCols] = useState([])
  const [exportFilename, setExportFilename] = useState('cleaned_dataset')

  const a = analysis
  const numericCols = a?.column_types?.numeric || []
  const categoricalCols = a?.column_types?.categorical || []

  useEffect(() => {
    const defaultCol = categoricalCols.length > 0 ? categoricalCols[0] : (a.columns.length > 0 ? a.columns[0] : '')
    if (!encodeCol && defaultCol) setEncodeCol(defaultCol)
    if (!typeCol && defaultCol) setTypeCol(defaultCol)
    if (!imbalanceTarget && defaultCol) setImbalanceTarget(defaultCol)
  }, [categoricalCols, a.columns])

  const clearMessages = () => { setError(''); setSuccessMsg(''); setPreviewData(null) }

  const buildParams = () => {
    switch (activeTool) {
      case 'missing':
        return { action: 'missing', params: { strategy: missingStrategy, columns: missingCols.length > 0 ? missingCols : null } }
      case 'duplicates':
        return { action: 'duplicates', params: { keep: dupKeep } }
      case 'outliers':
        return { action: 'outliers', params: { method: outlierMethod, treatment: outlierTreatment, threshold: outlierThreshold, columns: outlierCols.length > 0 ? outlierCols : null } }
      case 'type_cleaning':
        return { action: 'type_cleaning', params: { column: typeCol, sub_action: typeAction } }
      case 'encoding':
        return { action: 'encoding', params: { column: encodeCol, method: encodeMethod, target_column: encodeMethod === 'target' ? encodeTargetCol : null } }
      case 'scaling':
        return { action: 'scaling', params: { columns: scaleCols.length > 0 ? scaleCols : null, method: scaleMethod } }
      case 'imbalance':
        return { action: 'imbalance', params: { target_column: imbalanceTarget, method: imbalanceMethod } }
      case 'feature_selection':
        return { action: 'feature_selection', params: { method: fsMethod, threshold: fsThreshold, target_column: fsTarget, k: fsK } }
      case 'drop_columns':
        return { action: 'drop_columns', params: { columns: dropCols } }
      default:
        return null
    }
  }

  const handlePreview = async () => {
    const body = buildParams()
    if (!body) return
    setPreviewLoading(true)
    clearMessages()
    try {
      const resp = await axios.post(`${API}/preprocess/preview`, body)
      setPreviewData(resp.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Preview failed.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleApply = async () => {
    const body = buildParams()
    if (!body) return
    setLoading(true)
    clearMessages()
    try {
      const resp = await axios.post(`${API}/preprocess`, body)
      onAnalysisUpdate(resp.data.analysis)
      setPipeline(resp.data.pipeline || [])
      setSuccessMsg(resp.data.message)
      setPreviewData(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Apply failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async (format) => {
    setLoading(true)
    clearMessages()
    try {
      const finalName = (exportFilename || 'cleaned_dataset').trim().replace(/\s+/g, '_')
      const extension = format === 'excel' ? 'xlsx' : 'csv'
      const mimeType = format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv'
      let fileHandle = null

      if ('showSaveFilePicker' in window) {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: `${finalName}.${extension}`,
            types: [{ description: format === 'excel' ? 'Excel File' : 'CSV File', accept: { [mimeType]: [`.${extension}`] } }],
          })
        } catch (err) {
          if (err.name === 'AbortError') { setLoading(false); return }
        }
      }

      const response = await axios.get(`${API}/export/dataset/${format}`, { responseType: 'blob' })

      if (fileHandle) {
         const writable = await fileHandle.createWritable()
         await writable.write(response.data)
         await writable.close()
         setSuccessMsg(`Dataset saved successfully.`)
      } else {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${finalName}.${extension}`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        setSuccessMsg(`Dataset exported as ${format.toUpperCase()} successfully.`)
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to export dataset.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportRecipe = async () => {
    try {
      const recipeJson = JSON.stringify(pipeline, null, 2)
      const finalName = (exportFilename || 'pipeline_recipe').trim().replace(/\s+/g, '_')
      let fileHandle = null

      if ('showSaveFilePicker' in window) {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: `${finalName}_recipe.json`,
            types: [{ description: 'JSON Recipe', accept: { 'application/json': ['.json'] } }],
          })
        } catch (err) {
          if (err.name === 'AbortError') return
        }
      }
      
      if (fileHandle) {
          const writable = await fileHandle.createWritable()
          await writable.write(recipeJson)
          await writable.close()
          setSuccessMsg('Pipeline recipe saved successfully.')
      } else {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(recipeJson)
        const downloadAnchorNode = document.createElement('a')
        downloadAnchorNode.setAttribute("href", dataStr)
        downloadAnchorNode.setAttribute("download", `${finalName}_recipe.json`)
        document.body.appendChild(downloadAnchorNode)
        downloadAnchorNode.click()
        downloadAnchorNode.remove()
        setSuccessMsg('Pipeline recipe exported as JSON successfully.')
      }
    } catch (err) {
      setError('Failed to export pipeline recipe.')
    }
  }

  const handleExportPython = async () => {
    setLoading(true)
    clearMessages()
    try {
      const finalName = (exportFilename || 'pipeline').trim().replace(/\s+/g, '_')
      let fileHandle = null
      
      if ('showSaveFilePicker' in window) {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: `${finalName}.py`,
            types: [{ description: 'Python Script', accept: { 'text/x-python': ['.py'] } }],
          })
        } catch (err) {
           if (err.name === 'AbortError') { setLoading(false); return }
        }
      }
      
      const response = await axios.get(`${API}/export/dataset/python`, { responseType: 'blob' })

      if (fileHandle) {
          const writable = await fileHandle.createWritable()
          await writable.write(response.data)
          await writable.close()
          setSuccessMsg('Python pipeline script saved successfully.')
      } else {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${finalName}.py`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        setSuccessMsg(`Python pipeline script exported successfully.`)
      }
    } catch (err) {
      setError('Failed to export Python script.')
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = async () => {
    setLoading(true)
    clearMessages()
    try {
      const resp = await axios.post(`${API}/undo`)
      onAnalysisUpdate(resp.data.analysis)
      setPipeline(resp.data.pipeline || [])
      setSuccessMsg(resp.data.message)
    } catch (err) {
      setError(err.response?.data?.detail || 'Undo failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setLoading(true)
    clearMessages()
    try {
      const resp = await axios.post(`${API}/reset`)
      onAnalysisUpdate(resp.data.analysis)
      setPipeline(resp.data.pipeline || [])
      setSuccessMsg(resp.data.message)
    } catch (err) {
      setError(err.response?.data?.detail || 'Reset failed.')
    } finally {
      setLoading(false)
    }
  }

  const toggleCol = (col, arr, setter) => {
    setter(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
  }

  const renderToolConfig = () => {
    switch (activeTool) {
      case 'missing':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><FileMinus className="w-6 h-6 text-error" /> Handle Missing Values</h3>
              <p className="text-text-muted text-sm mt-1">Fill or drop rows/columns with missing data to ensure your model receives valid inputs.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Imputation Strategy</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none transition-colors" value={missingStrategy} onChange={e => setMissingStrategy(e.target.value)}>
                  <option value="mean">Fill with Mean (Numeric)</option>
                  <option value="median">Fill with Median (Numeric - Robust to outliers)</option>
                  <option value="mode">Fill with Mode (Frequent value)</option>
                  <option value="constant">Fill with 0</option>
                  <option value="drop">Drop rows with missing values</option>
                  <option value="drop_cols">Drop columns with missing values</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Target Columns (leave empty = process all)</label>
                <p className="text-xs text-text-muted mb-2">Showing columns with missing values.</p>
                <div className="flex flex-wrap gap-2">
                  {a.columns.map(col => {
                    const count = a.missing_values[col] || 0
                    if (count === 0 && missingCols.length === 0) return null
                    return (
                      <button key={col} className={classNames("px-3 py-1.5 rounded-lg text-sm transition-colors border flex items-center gap-1.5", missingCols.includes(col) ? "bg-primary/20 border-primary text-primary" : "border-white/10 hover:border-white/30 text-text-muted")} onClick={() => toggleCol(col, missingCols, setMissingCols)}>
                        {col} {count > 0 && <span className="text-error text-xs">({count})</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 'drop_columns':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Trash2 className="w-6 h-6 text-error" /> Drop Columns</h3>
              <p className="text-text-muted text-sm mt-1">Remove unnecessary completely null columns, ID columns, or data leakage columns.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-3">Select Columns to Remove</label>
              <div className="flex flex-wrap gap-2">
                {a.columns.map(col => (
                  <button key={col} className={classNames("px-3 py-1.5 rounded-lg text-sm transition-colors border", dropCols.includes(col) ? "bg-error/20 border-error text-error" : "border-white/10 hover:border-white/30 text-text-muted")} onClick={() => toggleCol(col, dropCols, setDropCols)}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
            {dropCols.length > 0 && (
              <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-start gap-3 mt-4">
                <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                <div className="text-sm"><span className="font-semibold text-error">Warning:</span> Selected {dropCols.length} columns for permanent deletion.</div>
              </div>
            )}
          </motion.div>
        )

      case 'duplicates':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Copy className="w-6 h-6 text-warning" /> Handle Duplicates</h3>
              <p className="text-text-muted text-sm mt-1">Found <strong className={a.duplicate_count > 0 ? 'text-warning' : 'text-success'}>{a.duplicate_count}</strong> duplicate rows in the dataset.</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Keep Strategy</label>
              <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none transition-colors" value={dupKeep} onChange={e => setDupKeep(e.target.value)}>
                <option value="first">Keep First Occurrence</option>
                <option value="last">Keep Last Occurrence</option>
                <option value="false">Remove All Duplicates</option>
              </select>
            </div>
          </motion.div>
        )

      case 'outliers':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Maximize className="w-6 h-6 text-accent" /> Handle Outliers</h3>
              <p className="text-text-muted text-sm mt-1">Detect and treat statistical outliers in numeric columns to improve model robustness.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Detection Method</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={outlierMethod} onChange={e => { setOutlierMethod(e.target.value); setOutlierThreshold(e.target.value === 'iqr' ? 1.5 : 3.0) }}>
                  <option value="iqr">IQR (Interquartile Range - Robust)</option>
                  <option value="zscore">Z-Score (Standard Deviation)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Treatment</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={outlierTreatment} onChange={e => setOutlierTreatment(e.target.value)}>
                  <option value="remove">Remove Outlier Rows</option>
                  <option value="cap">Cap / Floor Values</option>
                  <option value="null">Replace with NaN (for Imputation)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">Threshold ({outlierMethod === 'iqr' ? 'IQR multiplier' : 'Z-score'})</label>
              <input className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" type="number" step="0.1" value={outlierThreshold} onChange={e => setOutlierThreshold(parseFloat(e.target.value))} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">Columns (leave empty = all numeric)</label>
              <div className="flex flex-wrap gap-2">
                {numericCols.map(col => (
                  <button key={col} className={classNames("px-3 py-1.5 rounded-lg text-sm transition-colors border", outlierCols.includes(col) ? "bg-accent/20 border-accent text-accent" : "border-white/10 hover:border-white/30 text-text-muted")} onClick={() => toggleCol(col, outlierCols, setOutlierCols)}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )

      case 'type_cleaning':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Type className="w-6 h-6 text-info" /> Type Cleaning</h3>
              <p className="text-text-muted text-sm mt-1">Normalize text strings, remove whitespace, or parse correct data types.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Column</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={typeCol} onChange={e => setTypeCol(e.target.value)}>
                  {a.columns.map(col => <option key={col} value={col}>{col} ({a.dtypes[col]})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Action</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={typeAction} onChange={e => setTypeAction(e.target.value)}>
                  <option value="trim">Trim Whitespace</option>
                  <option value="lowercase">Convert to Lowercase</option>
                  <option value="uppercase">Convert to Uppercase</option>
                  <option value="to_numeric">Convert to Numeric (Force)</option>
                  <option value="to_datetime">Parse as Datetime</option>
                  <option value="remove_special">Strip Special Characters</option>
                </select>
              </div>
            </div>
          </motion.div>
        )

      case 'encoding':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Tag className="w-6 h-6 text-secondary" /> Categorical Encoding</h3>
              <p className="text-text-muted text-sm mt-1">Convert text categories into numerical format required by ML models.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Target Column to Encode</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={encodeCol} onChange={e => setEncodeCol(e.target.value)}>
                  {a.columns.map(col => (
                    <option key={col} value={col}>{col} ({a.dtypes[col]}, {(a.distributions[col] || []).length} unique classes)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Encoding Method</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={encodeMethod} onChange={e => setEncodeMethod(e.target.value)}>
                  <option value="label">Label Encoding (Ordinal/Arbitrary mapping)</option>
                  <option value="onehot">One-Hot Encoding / Dummy Variables</option>
                  <option value="ordinal">Ordinal Encoding (Sorted alphabetically)</option>
                  <option value="frequency">Frequency Encoding</option>
                  <option value="target">Target Encoding (Mean of target)</option>
                </select>
              </div>
              
              {encodeMethod === 'target' && (
                <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}}>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Reference Target Variable Y</label>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={encodeTargetCol} onChange={e => setEncodeTargetCol(e.target.value)}>
                    <option value="">-- Select Target --</option>
                    {a.columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </motion.div>
              )}
              
              {encodeMethod === 'onehot' && (a.distributions[encodeCol] || []).length > 15 && (
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-semibold text-warning">High Cardinality Warning:</span> This column has many unique values. One-hot encoding will expand the dataset significantly and may lead to the curse of dimensionality.
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )

      case 'scaling':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><MoveDiagonal className="w-6 h-6 text-primary" /> Feature Scaling</h3>
              <p className="text-text-muted text-sm mt-1">Normalize absolute ranges of numeric columns to prevent magnitude bias in distance-based models (e.g. SVM, KNN, Neural Nets).</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Scaler / Transformer</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={scaleMethod} onChange={e => setScaleMethod(e.target.value)}>
                  <option value="standard">Standard Scaler (Zero Mean, Unit Variance)</option>
                  <option value="minmax">Min-Max Scaler (Range 0 to 1)</option>
                  <option value="robust">Robust Scaler (IQR - ignores outliers)</option>
                  <option value="log">Logarithmic Transform (Reduces Right Skew)</option>
                  <option value="sqrt">Square Root Transform (Stabilizes variance)</option>
                  <option value="boxcox">Box-Cox Transform</option>
                  <option value="yeojohnson">Yeo-Johnson Transform</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">Columns (leave empty = all numeric)</label>
                <div className="flex flex-wrap gap-2">
                  {numericCols.map(col => (
                    <button key={col} className={classNames("px-3 py-1.5 rounded-lg text-sm transition-colors border", scaleCols.includes(col) ? "bg-primary/20 border-primary text-primary" : "border-white/10 hover:border-white/30 text-text-muted")} onClick={() => toggleCol(col, scaleCols, setScaleCols)}>
                      {col}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )
        
      case 'imbalance':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Scale className="w-6 h-6 text-success" /> Handle Imbalanced Data</h3>
              <p className="text-text-muted text-sm mt-1">Generate synthetic samples or drop majority samples to equalize class distribution for modeling.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Target Classification Column</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={imbalanceTarget} onChange={e => setImbalanceTarget(e.target.value)}>
                  <option value="">-- Select Target --</option>
                  {a.columns.map(col => <option key={col} value={col}>{col} ({(a.distributions[col] || []).length} classes)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Resampling Method</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={imbalanceMethod} onChange={e => setImbalanceMethod(e.target.value)}>
                  <option value="random_over">Random Oversampling (Duplicates minority)</option>
                  <option value="random_under">Random Undersampling (Drops majority)</option>
                  <option value="smote">SMOTE (Synthetic Minority Over-sampling Technique)</option>
                  <option value="smote_enn">SMOTE-ENN (Combined strategy - High quality)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )

      case 'feature_selection':
        return (
          <motion.div initial={{opacity: 0, x: -10}} animate={{opacity: 1, x: 0}} className="space-y-5">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2"><Search className="w-6 h-6 text-indigo-400" /> Feature Selection</h3>
              <p className="text-text-muted text-sm mt-1">Drop redundant or non-informative features automatically using statistical techniques.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-1">Selection Algorithm</label>
                <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={fsMethod} onChange={e => setFsMethod(e.target.value)}>
                  <option value="variance">Variance Threshold (Drops low variance / constants)</option>
                  <option value="correlation">Correlation Filter (Drops highly collinear features)</option>
                  <option value="kbest">Select K-Best (ANOVA F-value)</option>
                  <option value="mutual_info">Mutual Information (Captures Non-linear relations)</option>
                </select>
              </div>
              
              {(fsMethod === 'variance' || fsMethod === 'correlation') && (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">Threshold Value</label>
                  <input className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" type="number" step="0.01" value={fsThreshold} onChange={e => setFsThreshold(parseFloat(e.target.value))} />
                </div>
              )}

              {(fsMethod === 'kbest' || fsMethod === 'mutual_info') && (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">K (Number of top features to keep)</label>
                  <input className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" type="number" step="1" value={fsK} onChange={e => setFsK(parseInt(e.target.value) || 10)} />
                </div>
              )}

              {(fsMethod === 'correlation' || fsMethod === 'kbest' || fsMethod === 'mutual_info') && (
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">
                    Target Column {fsMethod === 'correlation' ? 'to Protect (optional)' : '(Required)'}
                  </label>
                  <select className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-primary outline-none" value={fsTarget} onChange={e => setFsTarget(e.target.value)}>
                    <option value="">-- Select Target --</option>
                    {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                    {categoricalCols.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        )
        
      default:
        return null
    }
  }

  /* ─── Before / After Chart ─── */
  const renderPreviewComparison = () => {
    if (!previewData) return null
    const { before, after } = previewData

    const b = before.analysis
    const a2 = after.analysis

    const renderChartCompare = () => {
      if (activeTool === 'missing' || !activeTool) {
        const p1 = b.total_missing_pct
        const p2 = a2.total_missing_pct
        return (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-surface-card rounded-xl border border-white/5 p-4">
              <h4 className="text-center text-sm font-semibold mb-2">Before ({p1}% missing)</h4>
              <Plot 
                id="missing-before"
                data={[{ 
                   type: 'pie', 
                   labels: ['Missing', 'Present'], 
                   values: [b.total_missing, (b.shape[0] * b.shape[1]) - b.total_missing], 
                   marker: { colors: ['#ef4444', '#3b82f6'] }, 
                   textinfo: 'percent',
                   textfont: { color: 'white' },
                   hole: 0.5
                }]}
                layout={{ height: 220, margin:{t:10,b:10,l:10,r:10}, showlegend: false }}
              />
            </div>
            <div className="bg-surface-card rounded-xl border border-white/5 p-4">
              <h4 className="text-center text-sm font-semibold mb-2">After ({p2}% missing)</h4>
              <Plot 
                id="missing-after"
                data={[{ 
                   type: 'pie', 
                   labels: ['Missing', 'Present'], 
                   values: [a2.total_missing, (a2.shape[0] * a2.shape[1]) - a2.total_missing], 
                   marker: { colors: ['#10b981', '#3b82f6'] }, 
                   textinfo: 'percent',
                   textfont: { color: 'white' },
                   hole: 0.5 
                }]}
                layout={{ height: 220, margin:{t:10,b:10,l:10,r:10}, showlegend: false }}
              />
            </div>
          </div>
        )
      } else if (activeTool === 'outliers') {
        const col = outlierCols[0]
        return (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-surface-card rounded-xl border border-white/5 p-4">
              <h4 className="text-center text-sm font-semibold mb-2">{col} Before</h4>
              {b.boxplots?.[col] && <Plot id="bx-before" data={[{ type: 'box', y: b.boxplots[col].values, name: col, marker: { color: '#ef4444' }, boxpoints: 'outliers' }]} layout={{ height: 220, margin:{t:10,b:30,l:40,r:10} }} />}
            </div>
            <div className="bg-surface-card rounded-xl border border-white/5 p-4">
              <h4 className="text-center text-sm font-semibold mb-2">{col} After</h4>
              {a2.boxplots?.[col] && <Plot id="bx-after" data={[{ type: 'box', y: a2.boxplots[col].values, name: col, marker: { color: '#10b981' }, boxpoints: 'outliers' }]} layout={{ height: 220, margin:{t:10,b:30,l:40,r:10} }} />}
            </div>
          </div>
        )
      } else if (activeTool === 'imbalance' && imbalanceTarget) {
        const distB = b.distributions?.[imbalanceTarget] || []
        const distA = a2.distributions?.[imbalanceTarget] || []
        return (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-surface-card rounded-xl border border-white/5 p-4">
              <h4 className="text-center text-sm font-semibold mb-2">Class Dist Before</h4>
              <Plot id="imb-before" data={[{ type: 'bar', x: distB.map(d => String(d.name)), y: distB.map(d => d.count), marker: { color: '#3b82f6' } }]} layout={{ height: 220, margin:{t:10,b:30,l:40,r:10} }} />
            </div>
            <div className="bg-surface-card rounded-xl border border-white/5 p-4">
              <h4 className="text-center text-sm font-semibold mb-2">Class Dist After</h4>
              <Plot id="imb-after" data={[{ type: 'bar', x: distA.map(d => String(d.name)), y: distA.map(d => d.count), marker: { color: '#10b981' } }]} layout={{ height: 220, margin:{t:10,b:30,l:40,r:10} }} />
            </div>
          </div>
        )
      } else if (activeTool === 'scaling' && scaleCols.length > 0) {
        const col = scaleCols[0]
        return (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-surface-card rounded-xl border border-white/5 p-4">
              <h4 className="text-center text-sm font-semibold mb-2">{col} Before</h4>
              {b.histograms?.[col] && <Plot id="scl-before" data={[{ type: 'bar', x: b.histograms[col].bin_edges.slice(0,-1), y: b.histograms[col].counts, marker: { color: '#3b82f6' } }]} layout={{ height: 220, margin:{t:10,b:30,l:40,r:10} }} />}
            </div>
            <div className="bg-surface-card rounded-xl border border-white/5 p-4">
              <h4 className="text-center text-sm font-semibold mb-2">{col} After</h4>
              {a2.histograms?.[col] && <Plot id="scl-after" data={[{ type: 'bar', x: a2.histograms[col].bin_edges.slice(0,-1), y: a2.histograms[col].counts, marker: { color: '#10b981' } }]} layout={{ height: 220, margin:{t:10,b:30,l:40,r:10} }} />}
            </div>
          </div>
        )
      } else if (['encoding', 'feature_selection', 'type_cleaning', 'duplicates', 'drop_columns'].includes(activeTool)) {
        const added = a2.columns.filter(c => !b.columns.includes(c))
        const removed = b.columns.filter(c => !a2.columns.includes(c))
        return (
          <div className="flex gap-4 mt-6 flex-wrap">
            {added.length > 0 && (
              <div className="flex-1 bg-success/10 border border-success/30 rounded-xl p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                <div>
                  <div className="font-semibold text-success">Added Columns</div>
                  <div className="text-sm text-text-primary mt-1">{added.join(', ')}</div>
                </div>
              </div>
            )}
            {removed.length > 0 && (
              <div className="flex-1 bg-warning/10 border border-warning/30 rounded-xl p-4 flex gap-3">
                <Trash2 className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <div className="font-semibold text-warning">Removed Columns</div>
                  <div className="text-sm text-text-primary mt-1">{removed.join(', ')}</div>
                </div>
              </div>
            )}
            {added.length === 0 && removed.length === 0 && (
              <div className="flex-1 bg-info/10 border border-info/30 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-info flex-shrink-0" />
                <div>
                  <div className="font-semibold text-info">No Schema Changes</div>
                  <div className="text-sm text-text-primary mt-1">The column structure remained identical. Value transformations only.</div>
                </div>
              </div>
            )}
          </div>
        )
      }
      return null
    }

    return (
      <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="glass-panel p-6 rounded-2xl mt-6 border-l-4 border-l-primary">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
          <MonitorPlay className="w-5 h-5" /> Preview: Before vs After
        </h3>
        
        <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
          <div className="text-center px-4">
            <div className="text-text-muted text-xs uppercase font-semibold tracking-wider mb-2">Before</div>
            <div className="text-2xl font-bold">{before.rows.toLocaleString()}</div>
            <div className="text-xs text-text-muted">Rows</div>
            <div className="text-lg font-semibold mt-2">{before.cols}</div>
            <div className="text-xs text-text-muted">Columns</div>
            <div className="text-lg font-semibold mt-2 text-error">{before.missing.toLocaleString()}</div>
            <div className="text-xs text-text-muted">Missing Values</div>
          </div>
          
          <div className="text-text-muted px-4">
            <ArrowRight className="w-8 h-8 opacity-50" />
          </div>
          
          <div className="text-center px-4">
            <div className="text-text-muted text-xs uppercase font-semibold tracking-wider mb-2">After</div>
            <div className={classNames("text-2xl font-bold", after.rows !== before.rows && "text-warning")}>
              {after.rows.toLocaleString()}
            </div>
            <div className="text-xs text-text-muted">Rows</div>
            <div className={classNames("text-lg font-semibold mt-2", after.cols !== before.cols && "text-info")}>
              {after.cols}
            </div>
            <div className="text-xs text-text-muted">Columns</div>
            <div className={classNames("text-lg font-semibold mt-2", after.missing < before.missing ? "text-success" : "text-error")}>
              {after.missing.toLocaleString()}
            </div>
            <div className="text-xs text-text-muted">Missing Values</div>
          </div>
        </div>
        
        {renderChartCompare()}
      </motion.div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between bg-surface/50 border-b border-white/10 p-4 sticky top-0 z-20 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" /> Preprocessing Workspace
          </h2>
          <p className="text-text-muted text-xs mt-1">
            Current Space: <strong className="text-white">{a.shape[0].toLocaleString()}</strong> rows &times; <strong className="text-white">{a.shape[1]}</strong> cols
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-lg border border-white/10">
            <input 
              type="text" 
              className="bg-transparent border-none text-sm px-3 py-1.5 w-40 focus:outline-none text-text-primary focus:ring-1 focus:ring-primary rounded"
              placeholder="Export filename..."
              value={exportFilename}
              onChange={e => setExportFilename(e.target.value)}
            />
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded hover:bg-white/10 transition-colors" onClick={() => handleExportData('csv')} disabled={loading} title="Export Dataset to CSV">
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded hover:bg-white/10 transition-colors" onClick={() => handleExportData('excel')} disabled={loading} title="Export Dataset to Excel">
              <Download className="w-3.5 h-3.5 text-success" /> Excel
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded hover:bg-white/10 transition-colors" onClick={handleExportRecipe} disabled={loading} title="Export Pipeline JSON">
              <FileJson className="w-3.5 h-3.5 text-warning" /> JSON
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded hover:bg-white/10 transition-colors" onClick={handleExportPython} disabled={loading} title="Export Python Code">
              <FileCode className="w-3.5 h-3.5 text-info" /> Python
            </button>
          </div>
          
          <div className="h-6 w-px bg-white/20"></div>

          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors" onClick={handleUndo} disabled={loading || pipeline.length === 0}>
            <Undo2 className="w-4 h-4" /> Undo Step
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-error/10 hover:bg-error/20 text-error border border-error/20 transition-colors" onClick={handleReset} disabled={loading || pipeline.length === 0}>
            <Trash2 className="w-4 h-4" /> Reset All
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left Sidebar: Tool List ─── */}
        <div className="w-64 bg-surface-card border-r border-white/10 p-3 space-y-1 overflow-y-auto custom-scrollbar flex-shrink-0">
          <div className="text-xs font-bold uppercase text-text-muted tracking-wide px-3 py-2">Data Operations</div>
          {TOOLS.map(t => {
            const Icon = t.icon
            const isActive = activeTool === t.id
            return (
              <button
                key={t.id}
                className={classNames(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive ? "bg-primary/20 text-white" : "text-text-secondary hover:bg-white/5"
                )}
                onClick={() => { setActiveTool(t.id); clearMessages() }}
              >
                <Icon className={classNames("w-4 h-4", isActive ? t.color : "text-text-muted group-hover:text-text-primary")} />
                {t.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
              </button>
            )
          })}
        </div>

        {/* ─── Center: Config + Preview ─── */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-black/20">
          <div className="max-w-4xl mx-auto">
            <div className="glass-panel p-6 rounded-2xl relative shadow-lg shadow-black/20">
              {renderToolConfig()}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                <button 
                  className="flex-1 bg-surface-card hover:bg-white/10 border border-white/20 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all group"
                  onClick={handlePreview} disabled={previewLoading}
                >
                  {previewLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Generating Profile...</>
                  ) : (
                    <><MonitorPlay className="w-5 h-5 text-text-muted group-hover:text-white transition-colors" /> View Live Preview</>
                  )}
                </button>
                <button 
                  className="flex-1 bg-gradient-to-r from-primary to-primary-hover hover:shadow-lg hover:shadow-primary/30 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
                  onClick={handleApply} disabled={loading}
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Executing...</>
                  ) : (
                    <><Check className="w-5 h-5" /> Execute & Apply Step</>
                  )}
                </button>
              </div>
            </div>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="mt-4 bg-error/10 border border-error/30 p-4 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-error text-sm">Operation Failed</div>
                    <div className="text-sm text-text-muted mt-1">{error}</div>
                  </div>
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} className="mt-4 bg-success/10 border border-success/30 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-success text-sm">Success</div>
                    <div className="text-sm text-text-muted mt-1">{successMsg}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Before/After Preview Widget */}
            {renderPreviewComparison()}

            {/* Data Preview Table */}
            {(previewData?.after?.analysis?.preview_data || a.preview_data) && (
              <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y:0}} className="glass-panel p-6 rounded-2xl mt-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                       📋 {previewData ? 'Preview Result State' : 'Current Data State'}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">First {Math.min((previewData?.after?.analysis?.preview_data || a.preview_data).length, 20)} rows of the dataframe.</p>
                  </div>
                  {previewData && (
                    <button className="text-xs px-3 py-1.5 bg-black/30 hover:bg-black/50 rounded text-text-muted hover:text-white transition-colors border border-white/10" onClick={() => setPreviewData(null)}>
                      Close Preview
                    </button>
                  )}
                </div>
                
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto overflow-y-auto max-h-[400px] custom-scrollbar">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="text-xs text-text-muted uppercase bg-surface-card sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-center border-b border-white/10">#</th>
                          {(previewData?.after?.analysis?.columns || a.columns).map(col => (
                            <th key={col} className="px-4 py-3 border-b border-white/10">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {(previewData?.after?.analysis?.preview_data || a.preview_data).slice(0, 20).map((row, ri) => (
                          <tr key={ri} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-2 text-center text-text-muted text-xs bg-black/10">{ri + 1}</td>
                            {(previewData?.after?.analysis?.columns || a.columns).map(col => {
                              const v = row[col]
                              const isMissing = v === null || v === undefined || v === 'None' || v === 'nan'
                              return (
                                <td key={col} className={classNames("px-4 py-2", isMissing ? "text-error italic opacity-70" : "text-text-primary")}>
                                  {isMissing ? 'NaN' : String(v)}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ─── Right Panel: Pipeline History ─── */}
        <div className="w-80 bg-surface-card border-l border-white/10 p-5 overflow-y-auto custom-scrollbar flex-shrink-0 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-secondary mb-4 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-primary" /> Active Pipeline
          </h3>
          
          {pipeline.length === 0 ? (
            <div className="text-center py-10 px-4 border border-dashed border-white/10 rounded-xl">
              <MonitorPlay className="w-8 h-8 text-text-muted mx-auto mb-3 opacity-50" />
              <p className="text-sm text-text-muted">No preprocessing steps applied yet.</p>
              <p className="text-xs text-text-muted mt-2">Select a tool on the left, configure it, and click Apply.</p>
            </div>
          ) : (
            <div className="space-y-4 relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10"></div>
              {pipeline.map((step, idx) => {
                const ToolIcon = TOOLS.find(t => t.id === step.action)?.icon || CheckCircle2
                return (
                  <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay: idx*0.05}} key={idx} className="relative pl-10">
                    <div className="absolute left-[9px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-4 border-surface-card ring-1 ring-primary/30 z-10"></div>
                    <div className="bg-black/20 border border-white/5 rounded-xl p-3 hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <ToolIcon className="w-4 h-4 text-text-muted" />
                        <span className="font-semibold text-sm capitalize text-white">{step.action.replace('_', ' ')}</span>
                      </div>
                      <div className="text-xs text-text-muted mb-2">
                        {step.rows_before} → {step.rows_after} rows<br/>
                        {step.cols_before} → {step.cols_after} cols
                      </div>
                      <div className="text-[10px] text-primary/70 font-mono bg-primary/5 px-2 py-1.5 rounded border border-primary/10 overflow-hidden text-ellipsis">
                        {Object.entries(step.params || {}).filter(([k,v]) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)).map(([k,v]) => `${k}:${Array.isArray(v) ? `[${v.length} cols]` : v}`).join(' | ')}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
          
          {pipeline.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-xs text-text-muted text-center mb-4">You have {pipeline.length} active transformation steps.</div>
              <button className="w-full bg-surface hover:bg-white/10 border border-white/10 text-white text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors" onClick={handleExportRecipe}>
                <Save className="w-4 h-4" /> Save Recipe
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
