import React from 'react'

export default function DatasetPreview({ analysis }) {
  if (!analysis) return null

  // Function to render a simple bar chart without using external libraries
  const renderBarChart = (colName, distData) => {
    if (!distData || distData.length === 0) return null;
    
    // Find highest count to calculate percentage for bars
    const maxCount = Math.max(...distData.map(d => d.count));
    
    return (
      <div key={colName} className="chart-container" style={{ flex: '1 1 300px' }}>
        <div className="chart-title">{colName} Distribution</div>
        {distData.map((item, idx) => (
          <div key={idx} className="bar-row">
            <div className="bar-label" title={item.name}>
              {item.name === 'nan' || item.name === 'None' || item.name === 'null' ? 'Missing/NaN' : item.name}
            </div>
            <div className="bar-wrapper">
              <div 
                className="bar-fill" 
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              ></div>
              <span className="bar-value">{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="glass-panel">
      <h2>Dataset Analysis</h2>
      
      <div className="metrics-grid mb-1">
        <div className="metric-card">
          <div className="metric-value">{analysis.shape[0]}</div>
          <div className="metric-label">Total Rows</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analysis.shape[1]}</div>
          <div className="metric-label">Total Columns</div>
        </div>
        <div className="metric-card">
          <div className={`metric-value ${analysis.total_missing > 0 ? 'text-danger' : 'text-success'}`}>
            {analysis.total_missing}
          </div>
          <div className="metric-label">Missing Values</div>
        </div>
      </div>
      
      {/* Data Visualization Section */}
      {analysis.distributions && Object.keys(analysis.distributions).length > 0 && (
        <>
          <h3 className="mt-2 mb-1">Data Visualization (Class Imbalance)</h3>
          <p className="subtitle mb-1">Distributions for categorical or discrete columns.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {Object.entries(analysis.distributions).map(([colName, distData]) => 
              renderBarChart(colName, distData)
            )}
          </div>
        </>
      )}
      
      {/* Data Table Section */}
      <h3 className="mt-2 mb-1">Dataset Preview Showcase (RapidMiner Style)</h3>
      <p className="subtitle mb-1">Scroll horizontally to view all columns. Showing first 200 rows.</p>
      
      <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ minWidth: '100%', whiteSpace: 'nowrap' }}>
          <thead style={{ position: 'sticky', top: 0, background: 'rgba(30, 41, 59, 1)', zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            <tr>
              {analysis.columns.map((col, idx) => (
                <th key={idx} style={{ textAlign: 'center', minWidth: '120px' }}>
                  <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{col}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'normal', margin: '4px 0' }}>
                    Type: {analysis.dtypes[col]}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'normal', color: analysis.missing_values[col] > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    Missing: {analysis.missing_values[col]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysis.preview_data && analysis.preview_data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {analysis.columns.map((col, colIndex) => {
                  const val = row[col];
                  return (
                    <td key={colIndex} style={{ textAlign: 'center' }}>
                      {val === null ? <span className="text-danger">NaN</span> : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {(!analysis.preview_data || analysis.preview_data.length === 0) && (
              <tr>
                <td colSpan={analysis.columns.length} style={{ textAlign: 'center', padding: '2rem' }}>
                  No preview data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
