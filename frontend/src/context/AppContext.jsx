import React, { createContext, useContext, useState, useEffect } from 'react'
import { SESSION_KEY, SESSION_EXPIRY_MS } from '../lib/constants'

const AppContext = createContext()

export function AppProvider({ children }) {
  // Category 1: Forensic State
  const [forensic, setForensic] = useState({
    analysis: null,
    originalAnalysis: null,
    pipeline: [],
    targetColumn: '',
    verificationResults: null
  })

  // Category 2: Neural Engine State
  const [neural, setNeural] = useState({
    analysis: null,
    originalAnalysis: null,
    targetColumn: '',
    selectedFeatures: [],   // features to use for training (excluding dropped cols)
    droppedColumns: [],     // columns user chose to drop
    trainingConfig: {
      problemType: 'classification',
      splitStrategy: 'kfold',
      numFolds: 5,
      testSize: 0.2,
      shuffle: true,
      randomSeed: 42,
      hiddenNodes: 100,
      activation: 'sigmoid',
      repeats: 1
    },
    trainingResults: null,
    inferenceModel: null // For persistent weights
  })

  // Category 3: Research Nexus State
  const [research, setResearch] = useState({
    visionAnalysis: null,
    healthPulseResults: null
  })

  const [isLoaded, setIsLoaded] = useState(false)

  // Load session on mount
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        if (Date.now() - data.timestamp < SESSION_EXPIRY_MS) {
          if (data.forensic) setForensic(data.forensic)
          if (data.neural) setNeural(data.neural)
          if (data.research) setResearch(data.research)
        } else {
          localStorage.removeItem(SESSION_KEY)
        }
      } catch (e) {
        console.error('Failed to restore session', e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save session on state change
  useEffect(() => {
    if (isLoaded) {
      const data = {
        forensic,
        neural,
        research,
        timestamp: Date.now()
      }
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(data))
      } catch (e) {
        console.error('Failed to save session', e)
      }
    }
  }, [forensic, neural, research, isLoaded])

  const setForensicData = (data) => setForensic(prev => ({ ...prev, ...data }))
  const setNeuralData = (data) => setNeural(prev => ({ ...prev, ...data }))
  const setResearchData = (data) => setResearch(prev => ({ ...prev, ...data }))
  return (
    <AppContext.Provider value={{
      forensic, setForensic, setForensicData,
      neural, setNeural, setNeuralData,
      research, setResearch, setResearchData,
      isLoaded
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
