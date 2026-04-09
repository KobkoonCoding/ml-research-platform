import React from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import EDADashboard from './EDADashboard'

export default function EDAPage({ module = 'forensic' }) {
  const { forensic, setForensicData } = useApp()
  const navigate = useNavigate()

  // Use modular slice based on path/prop
  const currentData = module === 'forensic' ? forensic : null;

  if (!currentData?.analysis) {
    return <Navigate to={`/${module}/upload`} replace />
  }

  return (
    <EDADashboard
      module={module}
      analysis={currentData.analysis}
      targetColumn={currentData.targetColumn}
      onTargetChange={(col) => setForensicData({ targetColumn: col })}
      onStartPreprocessing={() => navigate(`/${module}/cleaning`)}
    />
  )
}
