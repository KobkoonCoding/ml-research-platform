import React from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import PreprocessingWorkspace from './PreprocessingWorkspace'

export default function PreprocessPage({ module = 'forensic' }) {
  const { forensic, setForensicData } = useApp()
  const navigate = useNavigate()

  // Use modular slice based on path/prop
  const currentData = module === 'forensic' ? forensic : null;

  if (!currentData?.analysis) {
    return <Navigate to={`/${module}/upload`} replace />
  }

  return (
    <PreprocessingWorkspace
      module={module}
      analysis={currentData.analysis}
      onAnalysisUpdate={(a) => setForensicData({ analysis: a })}
      pipeline={currentData.pipeline}
      setPipeline={(p) => setForensicData({ pipeline: p })}
      onNavigateToVerify={() => navigate(`/${module}/verify`)}
    />
  )
}
