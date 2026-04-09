import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import ForensicStepIndicator from './ForensicStepIndicator'
import ParticleField from '../three/ParticleField'
import { useApp } from '../../context/AppContext'
import { useTheme } from '../../context/ThemeContext'

export default function DashboardLayout() {
  const { isLoaded } = useApp()
  const { theme } = useTheme()
  const location = useLocation()
  const isForensic = location.pathname.startsWith('/forensic')
  const isELM = location.pathname.startsWith('/elm-studio')

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* 3D Background (subtle on dashboard pages) */}
      <ParticleField intensity="subtle" isDark={theme === 'dark'} />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-[260px] min-h-screen relative z-10 transition-all duration-300">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6 md:py-8 pb-24 md:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Step Indicators */}
            {isForensic && <ForensicStepIndicator />}
            {isELM && <ForensicStepIndicator module="elm" />}
            <Outlet />
          </motion.div>
        </div>
      </main>
    </div>
  )
}
