import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { Wand2 } from 'lucide-react'
import PageHeader from './elm/PageHeader'
import { CleaningSVG } from './elm/AnimatedSVGs'
import { API_BASE } from '../../lib/constants'

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
  return <div ref={ref} id={id} style={{ width: '100%', ...style }} />
}

/* ─── Tool definitions ─── */
const TOOLS = [
  { id: 'missing', label: 'Missing Values', icon: '🩹', color: '#f59e0b' },
  { id: 'duplicates', label: 'Duplicates', icon: '📑', color: '#3b82f6' },
  { id: 'outliers', label: 'Outliers', icon: '📐', color: '#8b5cf6' },
  { id: 'type_cleaning', label: 'Type Cleaning', icon: '🔤', color: '#06b6d4' },
  { id: 'encoding', label: 'Encoding', icon: '🏷️', color: '#ec4899' },
  { id: 'scaling', label: 'Scaling', icon: '📏', color: '#10b981' },
  { id: 'imbalance', label: 'Imbalanced Data', icon: '⚖️', color: '#f97316' },
  { id: 'feature_selection', label: 'Feature Selection', icon: '🔍', color: '#6366f1' },
  { id: 'drop_columns', label: 'Drop Columns', icon: '🗑️', color: '#ef4444' },
]

/* ─── Main Component ─── */
export default function PreprocessingWorkspace({ analysis, onAnalysisUpdate, pipeline, setPipeline, onNavigateToVerify, module }) {
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

  // Set defaults when analysis changes
  useEffect(() => {
    const defaultCol = categoricalCols.length > 0 ? categoricalCols[0] : (a.columns.length > 0 ? a.columns[0] : '')
    if (!encodeCol && defaultCol) setEncodeCol(defaultCol)
    if (!typeCol && defaultCol) setTypeCol(defaultCol)
    if (!imbalanceTarget && defaultCol) setImbalanceTarget(defaultCol)
  }, [categoricalCols, a.columns])

  const clearMessages = () => { setError(''); setSuccessMsg(''); setPreviewData(null) }

  /* ─── Build params for current tool ─── */
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

  /* ─── Preview ─── */
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

  /* ─── Apply ─── */
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
      const mimeType = format === 'excel' 
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        : 'text/csv'
        
      let fileHandle = null

      // Try "Save As" dialog (modern browsers)
      if ('showSaveFilePicker' in window) {
        try {
          // MUST BE CALLED SYNCHRONOUSLY BEFORE AWAITING ANYTHING ELSE
          fileHandle = await window.showSaveFilePicker({
            suggestedName: `${finalName}.${extension}`,
            types: [{
              description: format === 'excel' ? 'Excel File' : 'CSV File',
              accept: { [mimeType]: [`.${extension}`] },
            }],
          })
        } catch (err) {
          if (err.name === 'AbortError') {
             setLoading(false)
             return // User cancelled
          }
          console.warn('Save Picker failed, falling back to auto-download', err)
        }
      }

      const response = await axios.get(`${API}/export/dataset/${format}`, {
        responseType: 'blob'
      })

      if (fileHandle) {
         const writable = await fileHandle.createWritable()
         await writable.write(response.data)
         await writable.close()
         setSuccessMsg(`Dataset saved successfully.`)
      } else {
        // Fallback: Auto-download to default folder
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

      // Try "Save As" dialog
      if ('showSaveFilePicker' in window) {
        try {
          fileHandle = await window.showSaveFilePicker({
            suggestedName: `${finalName}_recipe.json`,
            types: [{
              description: 'JSON Recipe',
              accept: { 'application/json': ['.json'] },
            }],
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
        downloadAnchorNode.setAttribute("href",     dataStr)
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
            types: [{
              description: 'Python Script',
              accept: { 'text/x-python': ['.py'] },
            }],
          })
        } catch (err) {
           if (err.name === 'AbortError') {
             setLoading(false)
             return
           }
        }
      }
      
      const response = await axios.get(`${API}/export/dataset/python`, {
        responseType: 'blob'
      })

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

  /* ─── Undo ─── */
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

  /* ─── Reset ─── */
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

  /* ─── Multi-select toggle helper ─── */
  const toggleCol = (col, arr, setter) => {
    setter(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])
  }

  /* ─── Tool config panels ─── */
  const renderToolConfig = () => {
    switch (activeTool) {
      case 'missing':
        return (
          <div>
            <h3>🩹 Handle Missing Values</h3>
            <p className="text-muted mb-05">Fill or drop rows/columns with missing data</p>
            <div className="input-group">
              <label className="input-label">Strategy</label>
              <select className="select-field" value={missingStrategy} onChange={e => setMissingStrategy(e.target.value)}>
                <option value="mean">Fill with Mean</option>
                <option value="median">Fill with Median</option>
                <option value="mode">Fill with Mode</option>
                <option value="constant">Fill with 0</option>
                <option value="drop">Drop rows with missing</option>
                <option value="drop_cols">Drop columns with missing</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Target Columns (leave empty = all)</label>
              <p className="text-muted mb-05" style={{fontSize: '0.8rem'}}>Showing columns with missing values. If your column isn't here, it might be recognized as valid data.</p>
              <div className="chip-group">
                {a.columns.map(col => {
                  const count = a.missing_values[col] || 0
                  if (count === 0 && missingCols.length === 0) {
                     // Optionally hide columns with 0 missing if none selected, 
                     // but user said they can't see them. Let's show all for now or at least a wider selection.
                  }
                  return (
                    <button key={col} className={`chip ${missingCols.includes(col) ? 'active' : ''} ${count > 0 ? 'warning' : ''}`}
                      onClick={() => toggleCol(col, missingCols, setMissingCols)}>
                      {col} {count > 0 && <span className="text-danger" style={{fontSize:'0.75rem'}}>({count})</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'drop_columns':
        return (
          <div>
            <h3>🗑️ Drop Columns</h3>
            <p className="text-muted mb-05">Remove unnecessary columns from the dataset permanentely.</p>
            <div className="input-group">
              <label className="input-label">Select Columns to Remove</label>
              <div className="chip-group">
                {a.columns.map(col => (
                  <button key={col} className={`chip ${dropCols.includes(col) ? 'active danger' : ''}`}
                    onClick={() => toggleCol(col, dropCols, setDropCols)}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
            {dropCols.length > 0 && (
              <div className="insight-item danger mt-1">
                <span className="insight-icon">⚠️</span>
                <div className="insight-content">
                   Selected {dropCols.length} columns for deletion.
                </div>
              </div>
            )}
          </div>
        )

      case 'duplicates':
        return (
          <div>
            <h3>📑 Handle Duplicates</h3>
            <p className="text-muted mb-05">Remove duplicate rows ({a.duplicate_count} found)</p>
            <div className="input-group">
              <label className="input-label">Keep</label>
              <select className="select-field" value={dupKeep} onChange={e => setDupKeep(e.target.value)}>
                <option value="first">Keep First Occurrence</option>
                <option value="last">Keep Last Occurrence</option>
                <option value="false">Remove All Duplicates</option>
              </select>
            </div>
          </div>
        )

      case 'outliers':
        return (
          <div>
            <h3>📐 Handle Outliers</h3>
            <p className="text-muted mb-05">Detect and treat outliers in numeric columns</p>
            <div className="input-group">
              <label className="input-label">Detection Method</label>
              <select className="select-field" value={outlierMethod}
                onChange={e => { setOutlierMethod(e.target.value); setOutlierThreshold(e.target.value === 'iqr' ? 1.5 : 3.0) }}>
                <option value="iqr">IQR (Interquartile Range)</option>
                <option value="zscore">Z-Score</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Treatment</label>
              <select className="select-field" value={outlierTreatment} onChange={e => setOutlierTreatment(e.target.value)}>
                <option value="remove">Remove outlier rows</option>
                <option value="cap">Cap / Floor values</option>
                <option value="null">Replace with NaN</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Threshold ({outlierMethod === 'iqr' ? 'IQR multiplier' : 'Z-score'})</label>
              <input className="input-field" type="number" step="0.1" value={outlierThreshold}
                onChange={e => setOutlierThreshold(parseFloat(e.target.value))} />
            </div>
            <div className="input-group">
              <label className="input-label">Columns (leave empty = all numeric)</label>
              <div className="chip-group">
                {numericCols.map(col => (
                  <button key={col} className={`chip ${outlierCols.includes(col) ? 'active' : ''}`}
                    onClick={() => toggleCol(col, outlierCols, setOutlierCols)}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'type_cleaning':
        return (
          <div>
            <h3>🔤 Type Cleaning</h3>
            <p className="text-muted mb-05">Normalize text, convert types, trim whitespace</p>
            <div className="input-group">
              <label className="input-label">Column</label>
              <select className="select-field" value={typeCol} onChange={e => setTypeCol(e.target.value)}>
                {a.columns.map(col => <option key={col} value={col}>{col} ({a.dtypes[col]})</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Action</label>
              <select className="select-field" value={typeAction} onChange={e => setTypeAction(e.target.value)}>
                <option value="trim">Trim Whitespace</option>
                <option value="lowercase">To Lowercase</option>
                <option value="uppercase">To Uppercase</option>
                <option value="to_numeric">Convert to Numeric</option>
                <option value="to_datetime">Parse as Datetime</option>
                <option value="remove_special">Remove Special Characters</option>
              </select>
            </div>
          </div>
        )

      case 'encoding':
        return (
          <div>
            <h3>🏷️ Categorical Encoding</h3>
            <p className="text-muted mb-05">Convert categorical columns to numeric representation</p>
            <div className="input-group">
              <label className="input-label">Column</label>
              <select className="select-field" value={encodeCol} onChange={e => setEncodeCol(e.target.value)}>
                {a.columns.map(col => (
                  <option key={col} value={col}>{col} ({a.dtypes[col]}, {(a.distributions[col] || []).length} unique)</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Method</label>
              <select className="select-field" value={encodeMethod} onChange={e => setEncodeMethod(e.target.value)}>
                <option value="label">Label Encoding</option>
                <option value="onehot">One-Hot Encoding</option>
                <option value="ordinal">Ordinal Encoding</option>
                <option value="frequency">Frequency Encoding (V2)</option>
                <option value="target">Target Encoding (V2)</option>
              </select>
            </div>
            {encodeMethod === 'target' && (
              <div className="input-group">
                <label className="input-label">Target Column for Target Encoding</label>
                <select className="select-field" value={encodeTargetCol} onChange={e => setEncodeTargetCol(e.target.value)}>
                  <option value="">-- Select Target --</option>
                  {a.columns.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            )}
            {encodeMethod === 'onehot' && (a.distributions[encodeCol] || []).length > 15 && (
              <div className="insight-item warning" style={{marginTop: '0.5rem'}}>
                <span className="insight-icon">⚠️</span>
                <div className="insight-content">
                  <div className="insight-title">High Cardinality Warning</div>
                  <div className="insight-detail">This column has many unique values. One-hot encoding will create many new columns.</div>
                </div>
              </div>
            )}
          </div>
        )

      case 'scaling':
        return (
          <div>
            <h3>📏 Feature Scaling</h3>
            <p className="text-muted mb-05">Normalize or transform numeric column distributions</p>
            <div className="input-group">
              <label className="input-label">Method</label>
              <select className="select-field" value={scaleMethod} onChange={e => setScaleMethod(e.target.value)}>
                <option value="standard">Standard Scaler (z-score)</option>
                <option value="minmax">Min-Max Scaler (0–1)</option>
                <option value="robust">Robust Scaler (IQR)</option>
                <option value="log">Log Transform</option>
                <option value="sqrt">Square Root Transform</option>
                <option value="boxcox">Box-Cox Transform (V2)</option>
                <option value="yeojohnson">Yeo-Johnson Transform (V2)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Columns (leave empty = all numeric)</label>
              <div className="chip-group">
                {numericCols.map(col => (
                  <button key={col} className={`chip ${scaleCols.includes(col) ? 'active' : ''}`}
                    onClick={() => toggleCol(col, scaleCols, setScaleCols)}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
        
      case 'imbalance':
        return (
          <div>
            <h3>⚖️ Imbalanced Data Handling</h3>
            <p className="text-muted mb-05">Balance class distribution for a classification target</p>
            <div className="input-group">
              <label className="input-label">Target Column</label>
              <select className="select-field" value={imbalanceTarget} onChange={e => setImbalanceTarget(e.target.value)}>
                <option value="">-- Select Target --</option>
                {a.columns.map(col => <option key={col} value={col}>{col} ({(a.distributions[col] || []).length} classes)</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Method</label>
              <select className="select-field" value={imbalanceMethod} onChange={e => setImbalanceMethod(e.target.value)}>
                <option value="random_over">Random Oversampling</option>
                <option value="random_under">Random Undersampling</option>
                <option value="smote">SMOTE</option>
                <option value="smote_enn">SMOTE-ENN</option>
              </select>
            </div>
          </div>
        )

      case 'feature_selection':
        return (
          <div>
            <h3>🔍 Feature Selection</h3>
            <p className="text-muted mb-05">Remove uninformative or redundant numeric columns</p>
            <div className="input-group">
              <label className="input-label">Method</label>
              <select className="select-field" value={fsMethod} onChange={e => setFsMethod(e.target.value)}>
                <option value="variance">Variance Threshold (drop low variance)</option>
                <option value="correlation">Correlation-based (drop highly correlated)</option>
                <option value="kbest">Select K-Best (V2)</option>
                <option value="mutual_info">Mutual Information (V2)</option>
              </select>
            </div>
            
            {(fsMethod === 'variance' || fsMethod === 'correlation') && (
              <div className="input-group">
                <label className="input-label">Threshold</label>
                <input className="input-field" type="number" step="0.01" value={fsThreshold} onChange={e => setFsThreshold(parseFloat(e.target.value))} />
              </div>
            )}

            {(fsMethod === 'kbest' || fsMethod === 'mutual_info') && (
              <div className="input-group">
                <label className="input-label">K Features to keep</label>
                <input className="input-field" type="number" step="1" value={fsK} onChange={e => setFsK(parseInt(e.target.value) || 10)} />
              </div>
            )}

            {(fsMethod === 'correlation' || fsMethod === 'kbest' || fsMethod === 'mutual_info') && (
              <div className="input-group">
                <label className="input-label">
                  Target Column {fsMethod === 'correlation' ? 'to Protect (optional)' : '(Required)'}
                </label>
                <select className="select-field" value={fsTarget} onChange={e => setFsTarget(e.target.value)}>
                  <option value="">-- Select Target --</option>
                  {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                  {categoricalCols.map(col => <option key={col} value={col}>{col}</option>)}
                </select>
              </div>
            )}
          </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div className="glass-panel" style={{padding: '1rem'}}>
              <h4 style={{textAlign:'center', marginBottom: '0.5rem'}}>Before ({p1}% missing)</h4>
              <Plot 
                id="missing-before"
                data={[{ 
                   type: 'pie', 
                   labels: ['Missing', 'Present'], 
                   values: [b.total_missing, (b.shape[0] * b.shape[1]) - b.total_missing], 
                   marker: { colors: ['#ef4444', '#3b82f6'] }, 
                   textinfo: 'label+percent',
                   hole: 0.4
                }]}
                layout={{ height: 250, margin:{t:10,b:10,l:10,r:10}, showlegend: false }}
              />
            </div>
            <div className="glass-panel" style={{padding: '1rem'}}>
              <h4 style={{textAlign:'center', marginBottom: '0.5rem'}}>After ({p2}% missing)</h4>
              <Plot 
                id="missing-after"
                data={[{ 
                   type: 'pie', 
                   labels: ['Missing', 'Present'], 
                   values: [a2.total_missing, (a2.shape[0] * a2.shape[1]) - a2.total_missing], 
                   marker: { colors: ['#10b981', '#3b82f6'] }, 
                   textinfo: 'label+percent',
                   hole: 0.4 
                }]}
                layout={{ height: 250, margin:{t:10,b:10,l:10,r:10}, showlegend: false }}
              />
            </div>
          </div>
        )
      } else if (activeTool === 'outliers') {
        const col = outlierCols[0] // show first col comparison
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <h4 style={{textAlign:'center', marginBottom: '0.5rem'}}>{col} Before</h4>
              {b.boxplots?.[col] && <Plot id="bx-before" data={[{ type: 'box', y: b.boxplots[col].values, name: col, marker: { color: '#ef4444' }, boxpoints: 'outliers' }]} layout={{ height: 250, margin:{t:10,b:30,l:40,r:10} }} />}
            </div>
            <div>
              <h4 style={{textAlign:'center', marginBottom: '0.5rem'}}>{col} After</h4>
              {a2.boxplots?.[col] && <Plot id="bx-after" data={[{ type: 'box', y: a2.boxplots[col].values, name: col, marker: { color: '#10b981' }, boxpoints: 'outliers' }]} layout={{ height: 250, margin:{t:10,b:30,l:40,r:10} }} />}
            </div>
          </div>
        )
      } else if (activeTool === 'imbalance' && imbalanceTarget) {
        const distB = b.distributions?.[imbalanceTarget] || []
        const distA = a2.distributions?.[imbalanceTarget] || []
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <h4 style={{textAlign:'center', marginBottom: '0.5rem'}}>Class Dist Before</h4>
              <Plot id="imb-before" data={[{ type: 'bar', x: distB.map(d => String(d.name)), y: distB.map(d => d.count), marker: { color: '#3b82f6' } }]} layout={{ height: 250, margin:{t:10,b:30,l:40,r:10} }} />
            </div>
            <div>
              <h4 style={{textAlign:'center', marginBottom: '0.5rem'}}>Class Dist After</h4>
              <Plot id="imb-after" data={[{ type: 'bar', x: distA.map(d => String(d.name)), y: distA.map(d => d.count), marker: { color: '#10b981' } }]} layout={{ height: 250, margin:{t:10,b:30,l:40,r:10} }} />
            </div>
          </div>
        )
      } else if (activeTool === 'scaling' && scaleCols.length > 0) {
        const col = scaleCols[0]
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <h4 style={{textAlign:'center', marginBottom: '0.5rem'}}>{col} Before</h4>
              {b.histograms?.[col] && <Plot id="scl-before" data={[{ type: 'bar', x: b.histograms[col].bin_edges.slice(0,-1), y: b.histograms[col].counts, marker: { color: '#3b82f6' } }]} layout={{ height: 250, margin:{t:10,b:30,l:40,r:10} }} />}
            </div>
            <div>
              <h4 style={{textAlign:'center', marginBottom: '0.5rem'}}>{col} After</h4>
              {a2.histograms?.[col] && <Plot id="scl-after" data={[{ type: 'bar', x: a2.histograms[col].bin_edges.slice(0,-1), y: a2.histograms[col].counts, marker: { color: '#10b981' } }]} layout={{ height: 250, margin:{t:10,b:30,l:40,r:10} }} />}
            </div>
          </div>
        )
      } else if (['encoding', 'feature_selection', 'type_cleaning', 'duplicates'].includes(activeTool)) {
        const added = a2.columns.filter(c => !b.columns.includes(c))
        const removed = b.columns.filter(c => !a2.columns.includes(c))
        return (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {added.length > 0 && <div className="insight-item success" style={{flex:1}}>
              <span className="insight-icon">➕</span>
              <div className="insight-content">
                <div className="insight-title">Added Columns</div>
                <div className="insight-detail">{added.join(', ')}</div>
              </div>
            </div>}
            {removed.length > 0 && <div className="insight-item warning" style={{flex:1}}>
              <span className="insight-icon">➖</span>
              <div className="insight-content">
                <div className="insight-title">Removed Columns</div>
                <div className="insight-detail">{removed.join(', ')}</div>
              </div>
            </div>}
            {added.length === 0 && removed.length === 0 && (
              <div className="insight-item" style={{flex:1, borderLeftColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)'}}>
                <span className="insight-icon">ℹ️</span>
                <div className="insight-content">
                  <div className="insight-title">No Schema Changes</div>
                  <div className="insight-detail">The column structure remained identical.</div>
                </div>
              </div>
            )}
          </div>
        )
      }
      return null
    }

    return (
      <div className="comparison-panel">
        <h3 style={{ marginBottom: '0.75rem' }}>📊 Preview: Before vs After</h3>
        <div className="comparison-grid">
          <div className="comparison-card">
            <div className="comparison-label">Before</div>
            <div className="comparison-stat"><strong>{before.rows.toLocaleString()}</strong> rows</div>
            <div className="comparison-stat"><strong>{before.cols}</strong> cols</div>
            <div className="comparison-stat"><strong>{before.missing.toLocaleString()}</strong> missing</div>
          </div>
          <div className="comparison-arrow">→</div>
          <div className="comparison-card">
            <div className="comparison-label">After</div>
            <div className="comparison-stat">
              <strong className={after.rows !== before.rows ? 'text-warning' : ''}>{after.rows.toLocaleString()}</strong> rows
              {after.rows !== before.rows && <span className="text-muted" style={{fontSize:'0.75rem'}}> ({after.rows - before.rows})</span>}
            </div>
            <div className="comparison-stat">
              <strong className={after.cols !== before.cols ? 'text-warning' : ''}>{after.cols}</strong> cols
              {after.cols !== before.cols && <span className="text-muted" style={{fontSize:'0.75rem'}}> ({after.cols - before.cols})</span>}
            </div>
            <div className="comparison-stat">
              <strong className={after.missing !== before.missing ? 'text-success' : ''}>{after.missing.toLocaleString()}</strong> missing
              {after.missing !== before.missing && <span className="text-muted" style={{fontSize:'0.75rem'}}> ({after.missing - before.missing})</span>}
            </div>
          </div>
        </div>
        {renderChartCompare()}
      </div>
    )
  }

  /* ─── Render ─── */
  return (
    <div className="workspace-layout">
      {/* ─── Top Bar ─── */}
      <div className="workspace-topbar" style={{ padding: '0.75rem 1rem' }}>
        <PageHeader
          title="Data Preprocessing"
          subtitle="Clean, transform, and prepare your data for model training"
          accentColor="#10B981"
          icon={<Wand2 size={22} />}
          illustration={<CleaningSVG size={100} />}
          action={
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', marginRight: '0.25rem', color: 'var(--text-secondary)' }}>
                {a.shape[0].toLocaleString()} rows x {a.shape[1]} cols
                {pipeline.length > 0 && (
                  <span style={{ marginLeft: '0.5rem', color: 'var(--success)', fontWeight: 600 }}>
                    ({pipeline.length} step{pipeline.length > 1 ? 's' : ''} applied)
                  </span>
                )}
              </span>
              <button className="btn btn-secondary" onClick={handleUndo} disabled={loading || pipeline.length === 0} style={{ height: '36px', fontSize: '0.82rem' }}>
                ↩ Undo
              </button>
              <button className="btn btn-secondary" onClick={handleReset} disabled={loading || pipeline.length === 0}
                style={{ height: '36px', fontSize: '0.82rem', borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                Reset
              </button>
              {onNavigateToVerify && (
                <button
                  className="btn-glow"
                  onClick={onNavigateToVerify}
                  style={{
                    height: '36px', padding: '0 1.25rem',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: '#fff', border: 'none', borderRadius: 8,
                    fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Next: Verify & Train →
                </button>
              )}
            </div>
          }
        />
        {/* Row 2: Export Tools */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Export:</span>
          <input
            type="text"
            className="input-field"
            style={{ width: '150px', margin: 0, height: '30px', fontSize: '0.8rem' }}
            placeholder="Filename..."
            value={exportFilename}
            onChange={e => setExportFilename(e.target.value)}
          />
          {[
            { label: 'CSV', handler: () => handleExportData('csv') },
            { label: 'Excel', handler: () => handleExportData('excel') },
            { label: 'JSON', handler: handleExportRecipe },
            { label: 'Python', handler: handleExportPython },
            { label: 'PDF', handler: () => window.print() },
          ].map(exp => (
            <button key={exp.label} className="btn btn-secondary" onClick={exp.handler} disabled={loading}
              style={{ height: '30px', fontSize: '0.78rem', padding: '0 0.6rem' }}>
              {exp.label}
            </button>
          ))}
        </div>
      </div>

      <div className="workspace-main">
        {/* ─── Left Sidebar: Tool List ─── */}
        <div className="workspace-sidebar">
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`sidebar-tool ${activeTool === t.id ? 'active' : ''}`}
              onClick={() => { setActiveTool(t.id); clearMessages() }}
              style={activeTool === t.id ? { borderLeftColor: t.color, background: `${t.color}15` } : undefined}
            >
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Center: Config + Preview ─── */}
        <div className="workspace-center">
          <div className="glass-panel" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
            {renderToolConfig()}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-secondary" onClick={handlePreview} disabled={previewLoading}>
                {previewLoading ? <><span className="spinner"></span> Previewing...</> : '👁️ Preview'}
              </button>
              <button className="btn" onClick={handleApply} disabled={loading}>
                {loading ? <><span className="spinner"></span> Applying...</> : '✅ Apply'}
              </button>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="insight-item danger" style={{ marginBottom: '1rem' }}>
              <span className="insight-icon">❌</span>
              <div className="insight-content">
                <div className="insight-title">Error</div>
                <div className="insight-detail">{error}</div>
              </div>
            </div>
          )}
          {successMsg && (
            <div className="insight-item success" style={{ marginBottom: '1rem' }}>
              <span className="insight-icon">✅</span>
              <div className="insight-content">
                <div className="insight-title">Success</div>
                <div className="insight-detail">{successMsg}</div>
              </div>
            </div>
          )}

          {/* Before/After Preview */}
          {renderPreviewComparison()}

          {/* Data Preview Table */}
          {(previewData?.after?.analysis?.preview_data || a.preview_data) && (
            <div className="glass-panel" style={{ marginTop: '1rem' }}>
              <div className="flex-between">
                <div>
                  <h3>📋 {previewData ? 'Preview Result' : 'Current Data'} Preview</h3>
                  <p className="text-muted mb-05">First {Math.min((previewData?.after?.analysis?.preview_data || a.preview_data).length, 20)} rows of data</p>
                </div>
                {previewData && <button className="btn btn-secondary" onClick={() => setPreviewData(null)}>Reset Preview</button>}
              </div>
              <div className="table-wrapper">
                <div className="table-scroll" style={{ maxHeight: 300 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        {(previewData?.after?.analysis?.columns || a.columns).map(col => <th key={col}>{col}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {(previewData?.after?.analysis?.preview_data || a.preview_data).slice(0, 20).map((row, ri) => (
                        <tr key={ri}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{ri + 1}</td>
                          {(previewData?.after?.analysis?.columns || a.columns).map(col => {
                            const v = row[col]
                            const isMissing = v === null || v === undefined || v === 'None' || v === 'nan'
                            return <td key={col} className={isMissing ? 'cell-missing' : ''}>{isMissing ? 'NaN' : String(v)}</td>
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── Right Panel: Pipeline History ─── */}
        <div className="workspace-right">
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>📜 Pipeline History</h3>
            {pipeline.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>No steps applied yet. Configure a tool and click Apply.</p>
            ) : (
              <div className="pipeline-list">
                {pipeline.map((step, idx) => {
                  const toolDef = TOOLS.find(t => t.id === step.action) || {}
                  return (
                    <div key={idx} className="pipeline-step" style={{ borderLeftColor: toolDef.color || 'var(--border)' }}>
                      <div className="pipeline-step-num" style={{ background: toolDef.color || 'var(--primary)', color: '#fff' }}>
                        {step.step}
                      </div>
                      <div className="pipeline-step-info">
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {toolDef.icon || ''} {step.action}
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.72rem', padding: '1px 6px', borderRadius: 99,
                            background: 'rgba(59,130,246,0.15)', color: '#60a5fa',
                          }}>
                            {step.rows_before} → {step.rows_after} rows
                          </span>
                          <span style={{
                            fontSize: '0.72rem', padding: '1px 6px', borderRadius: 99,
                            background: 'rgba(139,92,246,0.15)', color: '#a78bfa',
                          }}>
                            {step.cols_before} → {step.cols_after} cols
                          </span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {Object.entries(step.params || {}).filter(([k, v]) => v !== null).map(([k,v]) => `${k}: ${JSON.stringify(v)}`).join(', ')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
