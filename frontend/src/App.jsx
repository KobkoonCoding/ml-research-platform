import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { ThemeProvider } from './context/ThemeContext'
import { AppProvider, useApp } from './context/AppContext'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'

// Pages
import LandingPage from './pages/LandingPage'
import DocsPage from './pages/DocsPage'
import AboutPage from './pages/AboutPage'
import ModelHubPage from './pages/ModelHubPage'
import ImageClassificationPage from './pages/ImageClassificationPage'
import MedicalImagingPage from './pages/MedicalImagingPage'
import ObjectDetectionPage from './pages/ObjectDetectionPage'
import TabularClassificationPage from './pages/TabularClassificationPage'
import PreprocessPage from './components/dashboard/PreprocessPage'

// Dashboard Pages
import UploadPage from './components/dashboard/UploadPage'
import EDAPage from './components/dashboard/EDAPage'
import VerificationLab from './components/dashboard/VerificationLab'

// ELM Studio Pages
import ELMSetupPage from './components/dashboard/ELMSetupPage'
import ELMTrainPage from './components/dashboard/ELMTrainPage'
import ELMPredictPage from './components/dashboard/ELMPredictPage'

const Placeholder = ({ title }) => (
  <div style={{ padding: '3rem', textAlign: 'center' }}>
    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>{title}</h1>
    <p style={{ color: 'var(--text-muted)' }}>This module is under development.</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* MODULE 1: DATA FORENSIC */}
            <Route path="/forensic" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/forensic/upload" replace />} />
              <Route path="upload" element={<UploadPage module="forensic" />} />
              <Route path="analysis" element={<EDAPage module="forensic" />} />
              <Route path="cleaning" element={<PreprocessPage module="forensic" />} />
              <Route path="verify" element={<ForensicVerifyWrapper />} />
            </Route>

            {/* MODULE 2: ELM STUDIO */}
            <Route path="/elm-studio" element={<DashboardLayout />}>
              <Route index element={<Navigate to="/elm-studio/upload" replace />} />
              <Route path="upload" element={<UploadPage module="neural" />} />
              <Route path="setup" element={<ELMSetupPage />} />
              <Route path="train" element={<ELMTrainPage />} />
              <Route path="predict" element={<ELMPredictPage />} />
            </Route>

            {/* MODULE 3: AI MODEL HUB */}
            <Route path="/deep-learning" element={<DashboardLayout />}>
              <Route index element={<ModelHubPage />} />
              <Route path="image-classification" element={<ImageClassificationPage />} />
              <Route path="medical-imaging" element={<MedicalImagingPage />} />
              <Route path="object-detection" element={<ObjectDetectionPage />} />
              <Route path="tabular" element={<TabularClassificationPage />} />
            </Route>

            {/* Legacy redirects for old paths */}
            <Route path="/neural-engine/*" element={<Navigate to="/elm-studio" replace />} />
            <Route path="/research-nexus/*" element={<Navigate to="/deep-learning" replace />} />
            <Route path="/deep-learning/vision" element={<Navigate to="/deep-learning/image-classification" replace />} />
            <Route path="/deep-learning/health" element={<Navigate to="/deep-learning/medical-imaging" replace />} />

            <Route path="/docs" element={<DashboardLayout />}>
              <Route index element={<DocsPage />} />
            </Route>

            <Route path="/about" element={<DashboardLayout />}>
              <Route index element={<AboutPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </ThemeProvider>
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  )
}

function ForensicVerifyWrapper() {
  const { forensic } = useApp()
  if (!forensic?.analysis) return <Navigate to="/forensic/upload" replace />
  return <VerificationLab module="forensic" analysis={forensic.analysis} pipeline={forensic.pipeline} />
}

export default App
