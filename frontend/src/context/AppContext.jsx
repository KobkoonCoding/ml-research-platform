import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { SESSION_KEY, SESSION_EXPIRY_MS } from '../lib/constants'
import api from '../lib/api'

const AppContext = createContext()

const SESSION_ID_KEY = 'ml_session_id'

/**
 * Generate (or retrieve) a per-tab session id and install it as the default
 * X-Session-Id header on every axios request — so the FastAPI backend can
 * isolate dataset / pipeline / trained-model state between concurrent demos.
 *
 * Uses sessionStorage so each browser tab gets its own session (closed tab
 * = session abandoned). Falls back to a Math.random id when crypto.randomUUID
 * is unavailable (very old browsers).
 */
function ensureSessionId() {
  if (typeof window === 'undefined') return 'default'
  try {
    let id = window.sessionStorage.getItem(SESSION_ID_KEY)
    if (!id) {
      id = (window.crypto?.randomUUID?.()) ||
        `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      window.sessionStorage.setItem(SESSION_ID_KEY, id)
    }
    return id
  } catch {
    return 'default'
  }
}

const sessionId = ensureSessionId()
axios.defaults.headers.common['X-Session-Id'] = sessionId
api.defaults.headers.common['X-Session-Id'] = sessionId

export function AppProvider({ children }) {
  // Category 1: Forensic State
  const [forensic, setForensic] = useState({
    analysis: null,
    originalAnalysis: null,
    pipeline: [],
    targetColumn: '',
    verificationResults: null,
    // Recent verification runs (capped at 10) — used for the "Compare Runs"
    // table in VerificationLab. Persisted via the localStorage save effect below.
    verificationRunHistory: []
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
    // Recent ELM Studio runs — same shape as forensic.verificationRunHistory.
    trainingRunHistory: [],
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
