import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud, BarChart2, Settings2, BrainCircuit, Calculator, ScanEye,
  BookOpen, Info, ChevronLeft, ChevronRight, Zap, Sparkles,
  PanelLeftClose, PanelLeft, Moon, Sun,
  Database, ShieldAlert, Wand2, CheckCircle2, Cpu, Activity, HeartPulse, Home
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useApp } from '../../context/AppContext'
import { NAV_SECTIONS } from '../../lib/constants'
import classNames from 'classnames'

const ICONS = {
  UploadCloud, BarChart2, Settings2, BrainCircuit, Calculator, ScanEye, BookOpen, Info,
  Database, ShieldAlert, Wand2, CheckCircle2, Cpu, Activity, HeartPulse, Home
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { forensic, neural, research } = useApp()
  const location = useLocation()

  const checkHasData = (item) => {
    if (!item.requiresData) return true
    if (item.path.startsWith('/forensic')) return !!forensic?.analysis
    if (item.path.startsWith('/elm-studio')) return !!neural?.analysis
    if (item.path.startsWith('/deep-learning')) return !!research?.visionAnalysis
    return false
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className="sidebar fixed left-0 top-0 h-full z-40 flex flex-col overflow-hidden"
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{ willChange: 'width' }}
      >
        {/* Logo */}
        <NavLink to="/" className="px-4 py-5 flex items-center gap-3 border-b border-white/5 min-h-[72px] no-underline" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg"
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Zap className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 overflow-hidden"
              >
                <div className="text-sm font-bold text-gradient truncate">ML Platform</div>
                <div className="text-[11px] text-text-muted truncate">Research & Analysis</div>
              </motion.div>
            )}
          </AnimatePresence>
        </NavLink>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          {/* Home Link */}
          <NavLink
            to="/"
            className={({ isActive }) =>
              `sidebar-link mb-6 group ${isActive ? 'active' : ''}`
            }
            title={collapsed ? "Exit to Platform Home" : undefined}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all">
              <Home className="w-[16px] h-[16px] flex-shrink-0 text-primary" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate font-black tracking-[0.15em] uppercase text-[11px] ml-1"
              >
                Platform Home
              </motion.span>
            )}
          </NavLink>

          <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mx-3 mb-6" />

          {NAV_SECTIONS.map((section) => {
            const sectionPaths = section.items.map(i => i.path.split('/')[1]).filter(Boolean)
            const currentRouteModule = location.pathname.split('/')[1]
            const isSectionActive = sectionPaths.includes(currentRouteModule) || 
                                    (section.title === 'RESOURCES' && (currentRouteModule === 'docs' || currentRouteModule === 'about'))
            
            // If collapsed, hide the section entirely if it's not active
            if (collapsed && !isSectionActive) return null

            const isExpanded = isSectionActive || collapsed

            return (
              <div key={section.title} className="mb-6">
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <NavLink
                        to={section.items[0]?.path ?? '#'}
                        className={`block text-[11px] font-black uppercase tracking-[0.3em] px-4 mb-3 transition-all hover:opacity-100 ${
                          isSectionActive ? 'text-primary' : 'text-text-muted opacity-40 hover:text-primary/70'
                        }`}
                        style={{ textDecoration: 'none' }}
                      >
                        {section.title}
                      </NavLink>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={collapsed ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      {section.items.map((item, idx) => {
                        const Icon = ICONS[item.icon] || Info
                        const hasCurrentData = checkHasData(item)
                        const isDisabled = item.requiresData && !hasCurrentData
                        const isActive = location.pathname === item.path

                        // If collapsed, only show the ACTIVE item to reduce clutter
                        if (collapsed && !isActive) return null

                        const isModuleStep = item.requiresData !== undefined
                        const stepNum = idx + 1

                        return (
                          <NavLink
                            key={item.id}
                            to={isDisabled ? '#' : item.path}
                            onClick={e => isDisabled && e.preventDefault()}
                            className={[
                              "sidebar-link py-3", 
                              isActive ? 'active shadow-lg bg-white/5' : '', 
                              isDisabled ? 'disabled opacity-30' : '',
                              !isSectionActive && !collapsed ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : ''
                            ].filter(Boolean).join(' ')}
                            title={collapsed ? item.label : undefined}
                          >
                            <div className="relative flex items-center gap-2.5">
                              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                              {isModuleStep && !collapsed && !isActive && (
                                <span className={classNames(
                                  "flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold flex-shrink-0",
                                  hasCurrentData
                                    ? "bg-success/20 text-success border border-success/30"
                                    : "bg-white/5 text-text-muted/60 border border-white/10"
                                )}>
                                  {stepNum}
                                </span>
                              )}
                            </div>
                            
                            <AnimatePresence>
                              {!collapsed && (
                                <motion.span
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  className="truncate whitespace-nowrap text-[11px] font-bold tracking-tight"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                            {item.premium && !collapsed && (
                              <span className="badge-premium ml-auto flex-shrink-0 text-[8px] px-2">PRO</span>
                            )}
                            {item.comingSoon && !collapsed && (
                              <span className="badge-coming-soon ml-auto flex-shrink-0">Soon</span>
                            )}
                          </NavLink>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-white/5 p-3 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="sidebar-link w-full justify-start"
            title={collapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px] flex-shrink-0 text-warning" />
            ) : (
              <Moon className="w-[18px] h-[18px] flex-shrink-0 text-primary" />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="sidebar-link w-full justify-start"
          >
            {collapsed ? (
              <PanelLeft className="w-[18px] h-[18px] flex-shrink-0" />
            ) : (
              <PanelLeftClose className="w-[18px] h-[18px] flex-shrink-0" />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="truncate"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t border-white/10 px-2 py-2"
           style={{ background: theme === 'dark' ? 'rgba(5,10,24,0.9)' : 'rgba(255,255,255,0.9)' }}>
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {[
            { icon: Database, label: 'Forensic', path: '/forensic/upload' },
            { icon: Cpu, label: 'ELM Studio', path: '/elm-studio/upload' },
            { icon: ScanEye, label: 'Deep Learn', path: '/deep-learning/vision' },
            { icon: BookOpen, label: 'Docs', path: '/docs' },
          ].map(item => {
            const isActive = location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/'))
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all text-[11px] font-medium
                  ${isActive ? 'text-primary' : 'text-text-muted'}`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            )
          })}
          <button
            onClick={toggleTheme}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[11px] font-medium text-text-muted"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5 text-primary" />}
            Theme
          </button>
        </div>
      </nav>
    </>
  )
}
