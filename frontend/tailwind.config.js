/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366F1', // Indigo-500
          hover: '#4F46E5',   // Indigo-600
        },
        secondary: {
          DEFAULT: '#8B5CF6', // Violet-500
        },
        accent: {
          DEFAULT: '#06B6D4', // Cyan-500
        },
        background: '#0F172A', // Slate-900
        surface: {
          DEFAULT: '#1E293B',  // Slate-800
          card: 'rgba(30, 41, 59, 0.6)',
        },
        text: {
          primary: '#F8FAFC',  // Slate-50
          muted: '#94A3B8',    // Slate-400
        },
        success: '#10B981',    // Emerald-500
        warning: '#F59E0B',    // Amber-500
        error: '#EF4444',      // Red-500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
