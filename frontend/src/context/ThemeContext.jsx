import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { THEME_KEY } from '../lib/constants'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY)
    return saved || 'dark'
  })

  // Skip the initial DOM sync — the blocking <script> in index.html already
  // applied the correct data-theme/class before first paint. This also lets
  // child routes (like LandingPage) override data-theme in their own effects
  // without being overwritten by this provider's effect running afterwards
  // (React runs parent effects AFTER child effects).
  const didMountRef = useRef(false)

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('light', theme === 'light')
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
