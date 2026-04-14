import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadCloud, BarChart2, Settings2, BrainCircuit, Calculator, ScanEye,
  BookOpen, Info, ChevronLeft, ChevronRight, Zap, Sparkles,
  PanelLeftClose, PanelLeft, Moon, Sun, Menu, X,
  Database, ShieldAlert, Wand2, CheckCircle2, Cpu, Activity, HeartPulse, Home,
  Stethoscope, Target, Table2
} from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useApp } from '../../context/AppContext'
import { NAV_SECTIONS } from '../../lib/constants'
import classNames from 'classnames'

const ICONS = {
  UploadCloud, BarChart2, Settings2, BrainCircuit, Calculator, ScanEye, BookOpen, Info,
  Database, ShieldAlert, Wand2, CheckCircle2, Cpu, Activity, HeartPulse, Home,
  Stethoscope, Target, Table2
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { forensic, neural, research } = useApp()
  const location = useLocation()

  // Auto-close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const checkHasData = (item) => {
    if (!item.requiresData) return true
    if (item.path.startsWith('/forensic')) return !!forensic?.analysis
    if (item.path.startsWith('/elm-studio')) return !!neural?.analysis
    if (item.path.startsWith('/deep-learning')) return !!research?.visionAnalysis
    return false
  }

  // Shared nav content — reused by desktop sidebar and mobile drawer
  const renderNavContent = (isMobile = false) => {
    const isCollapsed = isMobile ? false : collapsed
    return (
      <>
        {/* Logo */}
        <NavLink
          to="/"
          className="px-4 py-5 flex items-center gap-3 border-b border-border min-h-[72px] no-underline"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <motion.div
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-lg"
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Zap className="w-5 h-5 text-white" />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 overflow-hidden flex-1"
              >
                <div className="text-sm font-bold text-gradient truncate">ML Platform</div>
                <div className="text-[11px] text-text-muted truncate">Research & Analysis</div>
              </motion.div>
            )}
          </AnimatePresence>
          {isMobile && (
            <button
              onClick={(e) => { e.preventDefault(); setMobileOpen(false) }}
              className="ml-auto p-2 rounded-lg hover:bg-border/30 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          )}
        </NavLink>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          {/* Home Link */}
          <NavLink
            to="/"
            className={({ isActive }) => `sidebar-link mb-6 group ${isActive ? 'active' : ''}`}
            title={isCollapsed ? "Exit to Platform Home" : undefined}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all">
              <Home className="w-[16px] h-[16px] flex-shrink-0 text-primary" />
            </div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate font-black tracking-[0.15em] uppercase text-[11px] ml-1"
              >
                Platform Home
              </motion.span>
            )}
          </NavLink>

          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mx-3 mb-6" />

          {NAV_SECTIONS.map((section) => {
            const sectionPaths = section.items.map(i => i.path.split('/')[1]).filter(Boolean)
            const currentRouteModule = location.pathname.split('/')[1]
            const isSectionActive = sectionPaths.includes(currentRouteModule) ||
                                    (section.title === 'RESOURCES' && (currentRouteModule === 'docs' || currentRouteModule === 'about'))

            // If collapsed (desktop), hide section entirely if not active
            if (isCollapsed && !isSectionActive) return null

            const isExpanded = isSectionActive || isCollapsed || isMobile

            return (
              <div key={section.title} className="mb-6">
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <NavLink
                        to={section.items[0]?.path ?? '#'}
                        className={`block text-[11px] font-black uppercase tracking-[0.3em] px-4 mb-3 transition-all ${
                          isSectionActive
                            ? 'text-primary'
                            : 'text-text-secondary hover:text-primary'
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
                      initial={isCollapsed ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      {section.items.map((item, idx) => {
                        const Icon = ICONS[item.icon] || Info
                        const hasCurrentData = checkHasData(item)
                        const isDisabled = item.requiresData && !hasCurrentData
                        const isActive = location.pathname === item.path

                        // If collapsed (desktop), only show ACTIVE item to reduce clutter
                        if (isCollapsed && !isActive) return null

                        const isModuleStep = item.requiresData !== undefined
                        const stepNum = idx + 1

                        return (
                          <NavLink
                            key={item.id}
                            to={isDisabled ? '#' : item.path}
                            onClick={e => isDisabled && e.preventDefault()}
                            className={[
                              "sidebar-link py-3",
                              isActive ? 'active shadow-lg bg-primary/5' : '',
                              isDisabled ? 'disabled opacity-30' : '',
                              !isSectionActive && !isCollapsed && !isMobile ? 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : ''
                            ].filter(Boolean).join(' ')}
                            title={isCollapsed ? item.label : undefined}
                          >
                            <div className="relative flex items-center gap-2.5">
                              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                              {isModuleStep && !isCollapsed && !isActive && (
                                <span className={classNames(
                                  "flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold flex-shrink-0",
                                  hasCurrentData
                                    ? "bg-success/20 text-success border border-success/30"
                                    : "bg-border/30 text-text-muted/60 border border-border"
                                )}>
                                  {stepNum}
                                </span>
                              )}
                            </div>

                            <AnimatePresence>
                              {!isCollapsed && (
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
                            {item.premium && !isCollapsed && (
                              <span className="badge-premium ml-auto flex-shrink-0 text-[8px] px-2">PRO</span>
                            )}
                            {item.comingSoon && !isCollapsed && (
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
        <div className="border-t border-border p-3 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="sidebar-link w-full justify-start"
            title={isCollapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          >
            {theme === 'dark' ? (
              <Sun className="w-[18px] h-[18px] flex-shrink-0 text-warning" />
            ) : (
              <Moon className="w-[18px] h-[18px] flex-shrink-0 text-primary" />
            )}
            <AnimatePresence>
              {!isCollapsed && (
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

          {/* Collapse Toggle — desktop only */}
          {!isMobile && (
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
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {/* ═══════════════════════════════════
          Mobile Top Header (< md)
          ═══════════════════════════════════ */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 px-4 flex items-center justify-between border-b border-border backdrop-blur-xl"
        style={{ background: 'var(--color-surface-glass)' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-border/30 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-text-primary" />
        </button>

        <NavLink
          to="/"
          className="flex items-center gap-2 no-underline"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-gradient">ML Platform</span>
        </NavLink>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-border/30 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-warning" />
          ) : (
            <Moon className="w-5 h-5 text-primary" />
          )}
        </button>
      </header>

      {/* ═══════════════════════════════════
          Desktop Sidebar (≥ md)
          ═══════════════════════════════════ */}
      <motion.aside
        className="sidebar hidden md:flex fixed left-0 top-0 h-full z-40 flex-col overflow-hidden border-r border-border"
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          willChange: 'width',
          background: 'var(--color-surface-glass)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {renderNavContent(false)}
      </motion.aside>

      {/* ═══════════════════════════════════
          Mobile Drawer (< md)
          ═══════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 z-40"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="md:hidden fixed left-0 top-0 h-full w-[280px] z-50 flex flex-col overflow-hidden border-r border-border"
              style={{
                background: 'var(--color-surface)',
                backdropFilter: 'blur(24px)',
              }}
            >
              {renderNavContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
