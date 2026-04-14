export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
export const SESSION_KEY = 'mlplatform_session'
export const SESSION_EXPIRY_MS = 60 * 60 * 1000 // 1 hour
export const THEME_KEY = 'mlplatform_theme_v2'

export const NAV_SECTIONS = [
  {
    title: 'MODULE 1: DATA FORENSIC',
    items: [
      { id: 'f-upload', label: 'Data Registry', path: '/forensic/upload', icon: 'Database', premium: true },
      { id: 'f-analysis', label: 'Forensic Analytics', path: '/forensic/analysis', icon: 'ShieldAlert', requiresData: true },
      { id: 'f-cleaning', label: 'Cleaning Lab', path: '/forensic/cleaning', icon: 'Wand2', requiresData: true },
      { id: 'f-verify', label: 'Verification Lab', path: '/forensic/verify', icon: 'CheckCircle2', requiresData: true },
    ]
  },
  {
    title: 'MODULE 2: ELM STUDIO',
    items: [
      { id: 'n-upload', label: 'Data Upload', path: '/elm-studio/upload', icon: 'Cpu', premium: true },
      { id: 'n-setup', label: 'Setup & Preview', path: '/elm-studio/setup', icon: 'Database', requiresData: true },
      { id: 'n-train', label: 'Train Model', path: '/elm-studio/train', icon: 'BrainCircuit', requiresData: true },
      { id: 'n-predict', label: 'Predict', path: '/elm-studio/predict', icon: 'Activity', requiresData: true },
    ]
  },
  {
    title: 'MODULE 3: AI MODEL HUB',
    items: [
      { id: 'r-hub', label: 'Model Hub', path: '/deep-learning', icon: 'BrainCircuit', premium: true },
      { id: 'r-imgcls', label: 'Image Classification', path: '/deep-learning/image-classification', icon: 'ScanEye' },
      { id: 'r-medical', label: 'Medical Imaging', path: '/deep-learning/medical-imaging', icon: 'Stethoscope' },
      { id: 'r-objdet', label: 'Object Detection', path: '/deep-learning/object-detection', icon: 'Target' },
      { id: 'r-tabular', label: 'Table Data', path: '/deep-learning/tabular', icon: 'Table2', comingSoon: true },
    ]
  },
  {
    title: 'RESOURCES',
    items: [
      { id: 'docs', label: 'Documentation', path: '/docs', icon: 'BookOpen' },
      { id: 'about', label: 'Platform Info', path: '/about', icon: 'Info' },
    ]
  }
]
