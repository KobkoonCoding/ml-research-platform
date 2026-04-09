import React, { useState } from 'react'
import axios from 'axios'
import { API_BASE } from '../lib/constants'

export default function Preprocessing({ analysis, onAnalysisUpdate }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [missingStrategy, setMissingStrategy] = useState('mean')
  const [outlierMethod, setOutlierMethod] = useState('zscore')
  const [targetColumn, setTargetColumn] = useState(analysis.columns[0])
  
  const handlePreprocess = async (action, params) => {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const resp = await axios.post(`${API_BASE}/preprocess`, {
        action, params
      })
      setSuccess(resp.data.message)
      onAnalysisUpdate(resp.data.analysis)
    } catch (err) {
      setError(err.response?.data?.detail || `Error applying ${action}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-panel">
      <h2>Preprocessing Hub</h2>
      <p className="subtitle mb-1">Clean and prepare your dataset before model training</p>

      {error && <p className="text-danger mb-1">{error}</p>}
      {success && <p className="text-success mb-1">{success}</p>}

      {/* Missing Values Section */}
      <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)', marginTop: '2rem' }}>
        <h3>1. Impute/Remove Missing Values</h3>
        <p className="subtitle">Current missing values: {analysis.total_missing}</p>
        <div className="flex-between mt-2">
          <div className="input-group" style={{ flex: 1, marginRight: '1rem' }}>
            <label className="input-label">Imputation Strategy</label>
            <select className="select-field" value={missingStrategy} onChange={e => setMissingStrategy(e.target.value)}>
              <option value="mean">Mean (numerical)</option>
              <option value="median">Median (numerical)</option>
              <option value="drop">Drop Rows</option>
            </select>
          </div>
          <button 
            className="btn btn-secondary" 
            disabled={loading || analysis.total_missing === 0}
            onClick={() => handlePreprocess('missing', { strategy: missingStrategy })}
          >
            Apply Fix
          </button>
        </div>
      </div>

      {/* Outliers Section */}
      <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)' }}>
        <h3>2. Handle Outliers</h3>
        <p className="subtitle">Removes extreme numerical variations.</p>
        <div className="flex-between mt-2">
          <div className="input-group" style={{ flex: 1, marginRight: '1rem' }}>
            <label className="input-label">Detection Method</label>
            <select className="select-field" value={outlierMethod} onChange={e => setOutlierMethod(e.target.value)}>
              <option value="zscore">Z-Score (Standard Deviation)</option>
              <option value="iqr">Interquartile Range (IQR)</option>
            </select>
          </div>
          <button 
            className="btn btn-secondary" 
            disabled={loading}
            onClick={() => handlePreprocess('outliers', { method: outlierMethod, threshold: 3.0 })}
          >
            Remove Outliers
          </button>
        </div>
      </div>

      {/* Class Imbalance (SMOTE) Section */}
      <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.1)' }}>
        <h3>3. Solve Class Imbalance (SMOTE)</h3>
        <p className="subtitle">Balance target classes to prevent prediction bias. Note: Missing values must be fixed first.</p>
        <div className="flex-between mt-2">
          <div className="input-group" style={{ flex: 1, marginRight: '1rem' }}>
            <label className="input-label">Target Class Column</label>
            <select className="select-field" value={targetColumn} onChange={e => setTargetColumn(e.target.value)}>
              {analysis.columns.map((col, idx) => (
                <option key={idx} value={col}>{col} ({analysis.dtypes[col]})</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-secondary" 
            disabled={loading || analysis.total_missing > 0}
            onClick={() => handlePreprocess('imbalance', { target_column: targetColumn })}
            title={analysis.total_missing > 0 ? "Fix missing values first" : ""}
          >
            Apply SMOTE
          </button>
        </div>
      </div>

    </div>
  )
}
